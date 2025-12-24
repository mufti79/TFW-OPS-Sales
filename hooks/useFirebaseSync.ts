
import { useState, useEffect, Dispatch, SetStateAction, useCallback, useRef } from 'react';
import { database, isFirebaseConfigured } from '../firebaseConfig';
import { ref, onValue, set, off } from 'firebase/database';

// Track failed writes for retry mechanism
const failedWrites = new Map<string, { value: any; retryCount: number; lastAttempt: number }>();
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds between retries
export const WARNING_THROTTLE_MS = 30000; // 30 seconds - max frequency for sync warnings

// Global event emitter for Firebase sync errors (used to show user notifications)
type SyncErrorCallback = (path: string, error: any, isCritical: boolean) => void;
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

const notifySyncError = (path: string, error: any, isCritical: boolean) => {
  syncErrorListeners.forEach(listener => {
    try {
      listener(path, error, isCritical);
    } catch (err) {
      console.error('Error in sync error listener:', err);
    }
  });
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
    
    // Use shorter cache for config paths (logo, rides, etc.) to ensure changes appear quickly
    // All config data uses 30-second cache for near real-time updates while preserving during cache clear
    const isConfigPath = path.startsWith('config/');
    const expirationTime = isConfigPath ? CONFIG_CACHE_EXPIRATION_MS : CACHE_EXPIRATION_MS;
    
    // Only use cached data if it's less than expiration time old
    if (now - timestamp < expirationTime) {
      try {
        const parsedData = JSON.parse(item);
        const ageSeconds = Math.floor((now - timestamp) / 1000);
        const cacheType = isConfigPath ? 'config' : 'data';
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
                    .catch(error => {
                        console.error(`❌ Firebase write error at path "${path}" (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS}):`, error);
                        console.error(`   Error details:`, error.code, error.message);
                        
                        // Track failed write for retry
                        if (retryCount < MAX_RETRY_ATTEMPTS - 1) {
                            const nextRetryCount = retryCount + 1;
                            failedWrites.set(path, {
                                value: valueToStore,
                                retryCount: nextRetryCount,
                                lastAttempt: Date.now()
                            });
                            
                            // Notify listeners about non-critical sync error (will retry)
                            notifySyncError(path, error, false);
                            
                            // Schedule retry
                            console.warn(`⏳ Will retry Firebase write for ${path} in ${RETRY_DELAY_MS/1000} seconds...`);
                            setTimeout(() => {
                                const failedWrite = failedWrites.get(path);
                                // Only retry if this is still the current failed write attempt
                                if (failedWrite && failedWrite.retryCount === nextRetryCount) {
                                    console.log(`🔄 Retrying Firebase write for ${path} (attempt ${nextRetryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
                                    attemptWrite(nextRetryCount);
                                }
                            }, RETRY_DELAY_MS);
                        } else {
                            console.error(`❌ CRITICAL: Firebase write failed after ${MAX_RETRY_ATTEMPTS} attempts for ${path}`);
                            console.error(`   Data is ONLY saved locally and will NOT sync to other devices!`);
                            console.error(`   Possible causes: Database rules, network issues, or permissions`);
                            
                            // Notify listeners about critical sync error (all retries failed)
                            notifySyncError(path, error, true);
                            
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
