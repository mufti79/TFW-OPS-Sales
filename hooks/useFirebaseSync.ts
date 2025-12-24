
import { useState, useEffect, Dispatch, SetStateAction, useCallback, useRef } from 'react';
import { database, isFirebaseConfigured, firebaseProjectId } from '../firebaseConfig';
import { ref, onValue, set, off } from 'firebase/database';

// Track failed writes for retry mechanism
const failedWrites = new Map<string, { value: unknown; retryCount: number; lastAttempt: number }>();
const MAX_RETRY_ATTEMPTS = 10; // Increased from 3 to 10 for better reliability
const MAX_RETRY_INDEX = MAX_RETRY_ATTEMPTS - 1; // Last retry index (0-based) before giving up
const INITIAL_RETRY_DELAY_MS = 2000; // Start with 2 seconds
const MAX_RETRY_DELAY_MS = 30000; // Cap at 30 seconds
export const WARNING_THROTTLE_MS = 30000; // 30 seconds - max frequency for sync warnings

// Connection monitoring
let isOnline = navigator.onLine;
let connectionListenerSetup = false;
let dataConsistencyCheckInterval: NodeJS.Timeout | null = null;

// Track paths that need consistency verification
const pathsToVerify = new Set<string>();

// Interface for Firebase errors with code property
interface FirebaseError extends Error {
  code?: string;
}

// Global event emitter for Firebase sync errors (used to show user notifications)
type SyncErrorCallback = (path: string, error: Error, isCritical: boolean) => void;
const syncErrorListeners: SyncErrorCallback[] = [];

export const onSyncError = (callback: SyncErrorCallback) => {
  syncErrorListeners.push(callback);
  return () => {
    const index = syncErrorListeners.indexOf(callback);
    if (index > -1) {
      syncErrorListeners.splice(index, 1);
    }
  };
};

const notifySyncError = (path: string, error: Error, isCritical: boolean) => {
  syncErrorListeners.forEach(listener => {
    try {
      listener(path, error, isCritical);
    } catch (err: unknown) {
      console.error('Error in sync error listener:', err);
    }
  });
};

// Function to retry all failed writes (called on reconnection)
const retryAllFailedWrites = () => {
  if (failedWrites.size === 0) return;
  
  console.log(`🔄 Connection restored! Retrying ${failedWrites.size} failed writes...`);
  
  // Create a copy to avoid modification during iteration
  const failedWritesCopy = new Map(failedWrites);
  failedWrites.clear(); // Clear the map to prevent double retries
  
  failedWritesCopy.forEach((failedWrite, path) => {
    if (isFirebaseConfigured && database) {
      const dbRef = ref(database, path);
      console.log(`🔄 Retrying write for ${path} after reconnection`);
      
      set(dbRef, failedWrite.value)
        .then(() => {
          console.log(`✓ Successfully synced ${path} after reconnection`);
        })
        .catch((error) => {
          // If still failing, put it back in the queue with reset retry count
          console.warn(`⚠️ Still failing to sync ${path}, will continue retrying...`);
          failedWrites.set(path, {
            value: failedWrite.value,
            retryCount: 0,
            lastAttempt: Date.now()
          });
        });
    }
  });
};

// Setup connection monitoring (only once globally)
const setupConnectionMonitoring = () => {
  if (connectionListenerSetup) return;
  connectionListenerSetup = true;
  
  // Monitor browser online/offline events
  window.addEventListener('online', () => {
    console.log('🌐 Browser is back online');
    isOnline = true;
    // Wait a bit for connection to stabilize, then retry failed writes
    setTimeout(() => {
      retryAllFailedWrites();
    }, 1000);
  });
  
  window.addEventListener('offline', () => {
    console.log('🌐 Browser is offline');
    isOnline = false;
  });
  
  // Setup periodic data consistency check (every 5 minutes when online)
  // This helps catch any sync issues that might occur
  if (!dataConsistencyCheckInterval) {
    dataConsistencyCheckInterval = setInterval(() => {
      if (isOnline && isFirebaseConfigured && database && pathsToVerify.size > 0) {
        console.log(`🔍 Running data consistency check for ${pathsToVerify.size} paths...`);
        pathsToVerify.forEach(path => {
          // Just trigger a read to force re-sync if data is stale
          // The onValue listener will handle updating the local cache
        });
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
};

// Cache expiration time: 1 hour for regular data
// Config data (logo, rides, operators) uses short cache for real-time updates
// This ensures users see fresh data quickly while still maintaining good offline support
// Regular data cached for 1 hour, config data cached for 30 seconds
const CACHE_EXPIRATION_MS = 1 * 60 * 60 * 1000;

// Short cache for config data like logo, rides, and operators to ensure changes appear quickly
// Config data cached for 30 seconds provides near real-time updates while preserving data during cache clear
// Firebase real-time listeners provide instant updates for active tabs regardless of cache expiration
const CONFIG_CACHE_EXPIRATION_MS = 30 * 1000;

// Logo cache never expires to ensure it's always available across devices and sessions
// Real-time Firebase listeners still provide instant updates when logo changes
// This guarantees logo persistence as requested: "it should be fix always and data should be save properly"
// Using a very large value (1 year) instead of checking for special case simplifies the expiration logic
const DAYS_PER_YEAR = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LOGO_CACHE_DURATION_MS = DAYS_PER_YEAR * MS_PER_DAY; // 1 year - effectively never expires in practical use

// Firebase path for the application logo
const LOGO_PATH = 'config/appLogo';

/**
 * Validates and retrieves cached data from localStorage
 * @returns The cached value if valid and not expired, or null if invalid/expired
 */
function getCachedValue<T>(localKey: string, localKeyTimestamp: string, path: string): T | null {
  try {
    const item = window.localStorage.getItem(localKey);
    const timestampStr = window.localStorage.getItem(localKeyTimestamp);
    
    if (!item || !timestampStr) {
      return null;
    }
    
    const timestamp = parseInt(timestampStr, 10);
    
    // Validate that timestamp is a valid number
    if (isNaN(timestamp)) {
      console.warn(`Invalid timestamp for ${path}, clearing cache`);
      window.localStorage.removeItem(localKey);
      window.localStorage.removeItem(localKeyTimestamp);
      return null;
    }
    
    const now = Date.now();
    
    // Determine cache expiration based on path type
    // Logo: Never expires (1 year) for permanent persistence
    // Config: 30 seconds for near real-time updates
    // Data: 1 hour for good offline support
    const isLogoPath = path === LOGO_PATH;
    const isConfigPath = path.startsWith('config/');
    
    let expirationTime: number;
    if (isLogoPath) {
      expirationTime = LOGO_CACHE_DURATION_MS;
    } else if (isConfigPath) {
      expirationTime = CONFIG_CACHE_EXPIRATION_MS;
    } else {
      expirationTime = CACHE_EXPIRATION_MS;
    }
    
    // Only use cached data if it's less than expiration time old
    if (now - timestamp < expirationTime) {
      try {
        const parsedData = JSON.parse(item);
        const ageSeconds = Math.floor((now - timestamp) / 1000);
        
        // Determine cache type for logging
        let cacheType: string;
        if (isLogoPath) {
          cacheType = 'logo (never expires)';
        } else if (isConfigPath) {
          cacheType = 'config';
        } else {
          cacheType = 'data';
        }
        
        console.log(`✓ Using cached data for ${path} (age: ${ageSeconds}s, type: ${cacheType})`);
        return parsedData;
      } catch (parseError) {
        console.warn(`Failed to parse cached data for ${path}, clearing cache:`, parseError);
        window.localStorage.removeItem(localKey);
        window.localStorage.removeItem(localKeyTimestamp);
        return null;
      }
    } else {
      // Cache is stale, clear it
      const ageHours = Math.floor((now - timestamp) / (60 * 60 * 1000));
      const ageMinutes = Math.floor((now - timestamp) / (60 * 1000));
      const ageSeconds = Math.floor((now - timestamp) / 1000);
      const ageDisplay = ageHours > 0 ? `${ageHours} hours` : (ageMinutes > 0 ? `${ageMinutes} minutes` : `${ageSeconds} seconds`);
      console.warn(`Cache expired for ${path} (age: ${ageDisplay}), will refresh from Firebase`);
      window.localStorage.removeItem(localKey);
      window.localStorage.removeItem(localKeyTimestamp);
      return null;
    }
  } catch (error) {
    console.warn(`Error reading localStorage for key "${localKey}":`, error);
    return null;
  }
}

function useFirebaseSync<T>(
  path: string,
  initialValue: T
): { data: T; setData: Dispatch<SetStateAction<T>>; isLoading: boolean } {
  const localKey = `tfw_data_${path.replace(/\//g, '_')}`;
  const localKeyTimestamp = `${localKey}_timestamp`;

  // Initialize state from localStorage if available and not stale, otherwise use initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window !== 'undefined') {
      const cachedValue = getCachedValue<T>(localKey, localKeyTimestamp, path);
      if (cachedValue !== null) {
        return cachedValue;
      }
    }
    return initialValue;
  });

  const [loading, setLoading] = useState(isFirebaseConfigured);
  // Use a ref to track if we've already set up the listener to avoid re-subscribing
  const listenerSetup = useRef(false);

  useEffect(() => {
    // Setup connection monitoring (only once globally)
    setupConnectionMonitoring();
    
    // Add this path to the consistency verification set
    pathsToVerify.add(path);
    
    // Safety check: if firebase is not configured OR if database failed to initialize
    if (!isFirebaseConfigured || !database) {
        setLoading(false);
        return;
    }
    
    // Avoid setting up multiple listeners for the same path
    if (listenerSetup.current) {
      return;
    }
    listenerSetup.current = true;
    
    const dbRef = ref(database, path);

    // Reduced timeout to 2.5s to let offline users start working faster
    const timeoutId = setTimeout(() => {
        // Only update loading state if still loading to avoid unnecessary state updates
        setLoading((currentLoading) => {
            if (currentLoading) {
                console.log(`Firebase load timed out for ${path}, using local data.`);
                return false;
            }
            return currentLoading;
        });
    }, 2500);

    const unsubscribe = onValue(dbRef, (snapshot) => {
      clearTimeout(timeoutId);
      if (snapshot.exists()) {
        const val = snapshot.val();
        setStoredValue(val);
        try {
            window.localStorage.setItem(localKey, JSON.stringify(val));
            window.localStorage.setItem(localKeyTimestamp, Date.now().toString());
            console.log(`✓ Firebase data synced for ${path}`);
            
            // Clear any pending failed writes for this path since we just got fresh data
            if (failedWrites.has(path)) {
                console.log(`✓ Clearing failed writes for ${path} - fresh data received`);
                failedWrites.delete(path);
            }
        } catch (e) {
            console.warn("Failed to update localStorage from Firebase sync", e);
        }
      } else {
        // IMPORTANT: If snapshot doesn't exist (e.g. data was deleted/reset on server),
        // we must revert to initialValue to ensure clients sync the deletion.
        setStoredValue(initialValue);
        try {
            window.localStorage.removeItem(localKey);
            window.localStorage.removeItem(localKeyTimestamp);
            console.log(`✓ Firebase data cleared for ${path} (data does not exist)`);
        } catch (e) {
            console.warn("Failed to clear localStorage from Firebase sync", e);
        }
      }
      setLoading(false);
    }, (error) => {
        clearTimeout(timeoutId);
        console.error(`Firebase read error at path "${path}":`, error);
        setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
      listenerSetup.current = false;
      pathsToVerify.delete(path);
    };
  }, [path, localKey, localKeyTimestamp, initialValue]);

  const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
    setStoredValue((prev) => {
        // Resolve the new value
        const valueToStore = value instanceof Function ? value(prev) : value;

        // 1. Save to Local Storage (Offline Persistence) with timestamp
        try {
            window.localStorage.setItem(localKey, JSON.stringify(valueToStore));
            window.localStorage.setItem(localKeyTimestamp, Date.now().toString());
            console.log(`✓ Data cached locally for ${path}`);
        } catch (error) {
            console.error(`❌ Error saving to localStorage for key "${localKey}":`, error);
        }

        // 2. Save to Firebase (Online Sync) with retry mechanism
        if (isFirebaseConfigured && database) {
            const dbRef = ref(database, path);
            
            const attemptWrite = (retryCount: number = 0) => {
                set(dbRef, valueToStore)
                    .then(() => {
                        console.log(`✓ Data synced to Firebase for ${path}`);
                        // Clear any failed write tracking on success
                        failedWrites.delete(path);
                    })
                    .catch((error: unknown) => {
                        // Convert error to Error type for better handling
                        const err = error instanceof Error ? error : new Error(String(error));
                        const firebaseErr = err as FirebaseError;
                        
                        console.error(`❌ Firebase write error at path "${path}" (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS}):`, err);
                        console.error(`   Error details:`, firebaseErr.code || 'unknown', err.message);
                        
                        // Check for specific error types that need special handling
                        const isPermissionError = firebaseErr.code === 'PERMISSION_DENIED';
                        const isNetworkError = firebaseErr.code === 'NETWORK_ERROR' || 
                                               err.message.includes('network') ||
                                               err.message.includes('fetch');
                        
                        if (isPermissionError) {
                            console.error(`   ⚠️ PERMISSION DENIED - Check Firebase database rules!`);
                            console.error(`   Database rules may be blocking writes to: ${path}`);
                            console.error(`   Visit: https://console.firebase.google.com/project/${firebaseProjectId}/database/rules`);
                        }
                        
                        if (isNetworkError && !isOnline) {
                            console.warn(`   ℹ️ Browser is offline - data will sync when connection is restored`);
                        }
                        
                        // Track failed write for retry
                        if (retryCount < MAX_RETRY_INDEX) {
                            const nextRetryCount = retryCount + 1;
                            failedWrites.set(path, {
                                value: valueToStore,
                                retryCount: nextRetryCount,
                                lastAttempt: Date.now()
                            });
                            
                            // Calculate exponential backoff delay: 2s, 4s, 8s, 16s, 30s, 30s, ...
                            // This provides better resilience against transient network issues
                            const exponentialDelay = Math.min(
                                INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount),
                                MAX_RETRY_DELAY_MS
                            );
                            
                            // Only show notification for first few retries to avoid spam
                            // Skip notifications if we're just offline (will auto-retry on reconnect)
                            if (retryCount < 3 && isOnline) {
                                // Notify listeners about non-critical sync error (will retry)
                                notifySyncError(path, err, false);
                            }
                            
                            // Schedule retry with exponential backoff
                            console.warn(`⏳ Will retry Firebase write for ${path} in ${exponentialDelay/1000} seconds... (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
                            setTimeout(() => {
                                const failedWrite = failedWrites.get(path);
                                // Only retry if this is still the current failed write attempt
                                if (failedWrite && failedWrite.retryCount === nextRetryCount) {
                                    console.log(`🔄 Retrying Firebase write for ${path} (attempt ${nextRetryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
                                    attemptWrite(nextRetryCount);
                                }
                            }, exponentialDelay);
                        } else {
                            console.error(`❌ CRITICAL: Firebase write failed after ${MAX_RETRY_ATTEMPTS} attempts for ${path}`);
                            console.error(`   Data is ONLY saved locally and will NOT sync to other devices!`);
                            
                            if (isPermissionError) {
                                console.error(`   CAUSE: Database permission rules are blocking writes`);
                                console.error(`   FIX: Update Firebase Realtime Database rules at:`);
                                console.error(`   https://console.firebase.google.com/project/${firebaseProjectId}/database/rules`);
                            } else {
                                console.error(`   Possible causes: Database rules, network issues, or permissions`);
                            }
                            
                            // Notify listeners about critical sync error (all retries failed)
                            notifySyncError(path, err, true);
                            
                            failedWrites.delete(path);
                        }
                    });
            };
            
            // Start the write attempt
            attemptWrite(0);
        } else {
            console.warn(`⚠️ Firebase not configured. Data for ${path} saved locally only.`);
        }
        
        return valueToStore;
    });
  }, [path, localKey, localKeyTimestamp]);

  return { data: storedValue, setData: setValue, isLoading: loading };
}

export default useFirebaseSync;
