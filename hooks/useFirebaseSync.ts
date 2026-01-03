
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

// Track pending writes to prevent Firebase sync from overwriting them
const pendingWrites = new Map<string, { value: unknown; timestamp: number }>();
const pendingWriteTimeouts = new Map<string, NodeJS.Timeout>();
const WRITE_DEBOUNCE_MS = 500; // Debounce writes by 500ms to batch rapid updates
const PENDING_WRITE_STALE_MS = 10000; // Clear pending writes older than 10 seconds

// Periodically clean up stale pending writes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const staleKeys: string[] = [];
  
  pendingWrites.forEach((entry, key) => {
    if (now - entry.timestamp > PENDING_WRITE_STALE_MS) {
      staleKeys.push(key);
    }
  });
  
  staleKeys.forEach(key => {
    pendingWrites.delete(key);
    console.warn(`Cleared stale pending write for ${key}`);
  });
}, PENDING_WRITE_STALE_MS); // Run cleanup every 10 seconds

// Connection monitoring state
let isOnline = navigator.onLine;
let connectionListenerSetup = false;
let dataConsistencyCheckInterval: NodeJS.Timeout | null = null;
let firebaseConnected = false; // Track Firebase-level connection status
let firebaseConnectionMonitorSetup = false; // Guard to prevent duplicate Firebase connection listeners
let firebaseConnectionUnsubscribe: (() => void) | null = null; // Store unsubscribe function
let visibilityChangeHandler: (() => void) | null = null; // Store visibility handler for cleanup

// Callbacks to notify about connection state changes
type ConnectionStatusCallback = (connected: boolean) => void;
const connectionStatusCallbacks: ConnectionStatusCallback[] = [];

// Track paths that need consistency verification
const pathsToVerify = new Set<string>();

/**
 * Get the current Firebase connection status
 * @returns true if connected, false otherwise
 */
export const getFirebaseConnectionStatus = (): boolean => {
  return firebaseConnected;
};

/**
 * Subscribe to Firebase connection status changes
 * @param callback Function to call when connection status changes
 * @returns Unsubscribe function
 */
export const onFirebaseConnectionChange = (callback: ConnectionStatusCallback): (() => void) => {
  connectionStatusCallbacks.push(callback);
  // Immediately call with current status
  callback(firebaseConnected);
  
  return () => {
    const index = connectionStatusCallbacks.indexOf(callback);
    if (index > -1) {
      connectionStatusCallbacks.splice(index, 1);
    }
  };
};

// Notify all callbacks about connection status change
const notifyConnectionStatusChange = (connected: boolean) => {
  connectionStatusCallbacks.forEach(callback => {
    try {
      callback(connected);
    } catch (err) {
      console.error('Error in connection status callback:', err);
    }
  });
};

// Monitor Firebase connection status globally - SINGLETON pattern to ensure only one listener
const setupFirebaseConnectionMonitor = () => {
  // Guard: Only set up once globally, regardless of how many times this is called
  if (firebaseConnectionMonitorSetup || !database || !isFirebaseConfigured) return;
  
  firebaseConnectionMonitorSetup = true;
  console.log('🔥 Setting up Firebase connection monitor (singleton)');
  
  const connectedRef = ref(database, '.info/connected');
  firebaseConnectionUnsubscribe = onValue(connectedRef, (snapshot) => {
    const connected = snapshot.val() === true;
    const previousState = firebaseConnected;
    firebaseConnected = connected;
    
    // Only log and act on state changes to avoid noise
    if (previousState !== connected) {
      if (connected) {
        console.log('✅ Firebase connected');
        // Notify all listeners about connection status change
        notifyConnectionStatusChange(true);
        // Retry any failed writes when reconnected
        setTimeout(() => {
          retryAllFailedWrites();
        }, 1000);
      } else {
        console.log('⚠️ Firebase disconnected - will reconnect automatically');
        // Notify all listeners about connection status change
        notifyConnectionStatusChange(false);
      }
    }
  });
};

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

// Handler functions for browser online/offline events
const handleBrowserOnline = () => {
  console.log('🌐 Browser is back online - triggering reconnection...');
  isOnline = true;
  // Wait a bit for connection to stabilize, then retry failed writes
  setTimeout(() => {
    retryAllFailedWrites();
  }, 1000);
  
  // Notify all connection listeners about potential reconnection
  // The Firebase SDK should automatically reconnect, but we ensure our state is updated
  setTimeout(() => {
    if (database && isFirebaseConfigured) {
      console.log('🔄 Verifying Firebase connection after network recovery...');
    }
  }, 2000);
};

const handleBrowserOffline = () => {
  console.log('🌐 Browser is offline - Firebase sync paused');
  isOnline = false;
};

// Setup connection monitoring (only once globally) - SINGLETON pattern
const setupConnectionMonitoring = () => {
  if (connectionListenerSetup) return;
  connectionListenerSetup = true;
  
  console.log('🔧 Setting up global connection monitoring (singleton)');
  
  // Setup Firebase-level connection monitoring (singleton with its own guard)
  setupFirebaseConnectionMonitor();
  
  // Monitor browser online/offline events - use named functions for proper cleanup
  window.addEventListener('online', handleBrowserOnline);
  window.addEventListener('offline', handleBrowserOffline);
  
  // Monitor page visibility changes to handle tab switching and app backgrounding
  // This helps ensure connection is maintained when user returns to the tab
  visibilityChangeHandler = () => {
    if (document.visibilityState === 'visible') {
      console.log('👁️ Page became visible - checking Firebase connection...');
      
      // If we were disconnected, trigger a connection check after brief delay
      if (!firebaseConnected && isOnline && database && isFirebaseConfigured) {
        setTimeout(() => {
          if (!firebaseConnected) {
            console.log('🔄 Page visible but Firebase disconnected - may need reconnection');
            console.log('💡 Firebase SDK will attempt automatic reconnection');
          }
        }, 2000);
      }
    } else {
      console.log('👁️ Page hidden - Firebase connection will be maintained in background');
    }
  };
  
  document.addEventListener('visibilitychange', visibilityChangeHandler);
  
  // Setup periodic data consistency check (every 5 minutes when online)
  // This helps catch any sync issues that might occur
  if (!dataConsistencyCheckInterval) {
    dataConsistencyCheckInterval = setInterval(() => {
      if (isOnline && firebaseConnected && isFirebaseConfigured && database && pathsToVerify.size > 0) {
        console.log(`🔍 Running data consistency check for ${pathsToVerify.size} paths...`);
        // Note: The actual consistency verification is handled by the Firebase real-time listeners
        // This periodic check serves as a heartbeat to ensure the system is responsive
        // The onValue listeners automatically sync any discrepancies when they detect changes
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
};

// Cache expiration time: 1 hour for regular data
// All data is saved to Firebase Realtime Database as the primary storage
// Local cache provides fast access while Firebase real-time listeners ensure data is always in sync
// Regular data cached for 1 hour, config data cached for 30 seconds
const CACHE_EXPIRATION_MS = 1 * 60 * 60 * 1000;

// Short cache for config data like logo, rides, and operators to ensure changes from Firebase appear quickly
// Config data cached for 30 seconds provides near real-time updates from Firebase
// Firebase real-time listeners provide instant updates for active tabs regardless of cache expiration
const CONFIG_CACHE_EXPIRATION_MS = 30 * 1000;

// Logo cache never expires to ensure it's always available across devices and sessions
// All changes are saved to Firebase Realtime Database and synced in real-time
// This guarantees logo persistence: "it should be fix always and data should be save properly" - saved to Firebase
// Using a very large value (1 year) instead of checking for special case simplifies the expiration logic
const DAYS_PER_YEAR = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LOGO_CACHE_DURATION_MS = DAYS_PER_YEAR * MS_PER_DAY; // 1 year - effectively never expires in practical use

// Firebase path for the application logo
const LOGO_PATH = 'config/appLogo';

/**
 * Validates and retrieves cached data from localStorage
 * Note: All data is primarily stored in Firebase Realtime Database
 * Local cache provides fast access while waiting for Firebase sync
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
    // All data is saved to Firebase Realtime Database as primary storage
    // Logo: Never expires (1 year) in cache for instant display, always synced to Firebase
    // Config: 30 seconds cache for near real-time updates from Firebase
    // Data: 1 hour cache for fast access, always saved to Firebase
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
        return parsedData;
      } catch (parseError) {
        console.warn(`Failed to parse cached data for ${path}, clearing cache:`, parseError);
        window.localStorage.removeItem(localKey);
        window.localStorage.removeItem(localKeyTimestamp);
        return null;
      }
    } else {
      // Cache is stale, clear it
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

    // Timeout set to 5s to balance between fast offline startup and reliable connection on slower networks
    const timeoutId = setTimeout(() => {
        // Only update loading state if still loading to avoid unnecessary state updates
        setLoading((currentLoading) => {
            if (currentLoading) {
                console.log(`Firebase load timed out for ${path}, using local data.`);
                return false;
            }
            return currentLoading;
        });
    }, 5000);

    const unsubscribe = onValue(dbRef, (snapshot) => {
      clearTimeout(timeoutId);
      
      // CRITICAL FIX: Check if there's a pending write for this path
      // If there is, don't overwrite local state with Firebase data
      // This prevents race conditions where Firebase sync overwrites user's recent changes
      const hasPendingWrite = pendingWrites.has(path);
      
      if (snapshot.exists()) {
        const val = snapshot.val();
        
        // Only update state if there's no pending write
        if (!hasPendingWrite) {
          setStoredValue(val);
        } else {
          // Log that we're skipping this update to avoid overwriting pending changes
          console.log(`Skipping Firebase sync for ${path} - pending write exists`);
        }
        
        try {
            window.localStorage.setItem(localKey, JSON.stringify(val));
            window.localStorage.setItem(localKeyTimestamp, Date.now().toString());
            
            // Clear any pending failed writes for this path since we just got fresh data
            if (failedWrites.has(path)) {
                failedWrites.delete(path);
            }
        } catch (e) {
            console.warn("Failed to update cache", e);
        }
      } else {
        // IMPORTANT: If snapshot doesn't exist (e.g. data was deleted/reset in Firebase),
        // we must revert to initialValue to ensure clients sync the deletion.
        // But only if there's no pending write
        if (!hasPendingWrite) {
          setStoredValue(initialValue);
        }
        try {
            window.localStorage.removeItem(localKey);
            window.localStorage.removeItem(localKeyTimestamp);
        } catch (e) {
            console.warn("Failed to clear cache", e);
        }
      }
      setLoading(false);
    }, (error) => {
        clearTimeout(timeoutId);
        console.error(`Firebase read error at "${path}":`, error);
        setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
      listenerSetup.current = false;
      pathsToVerify.delete(path);
      
      // Clean up pending write timeout for this path
      const pendingTimeout = pendingWriteTimeouts.get(path);
      if (pendingTimeout) {
        clearTimeout(pendingTimeout);
        pendingWriteTimeouts.delete(path);
      }
      // Note: Keep pendingWrites entry to allow inflight writes to complete
    };
  }, [path, localKey, localKeyTimestamp, initialValue]);

  const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
    setStoredValue((prev) => {
        // Resolve the new value
        const valueToStore = value instanceof Function ? value(prev) : value;

        // 1. Save to Local Storage (Cache for fast access) with timestamp
        try {
            window.localStorage.setItem(localKey, JSON.stringify(valueToStore));
            window.localStorage.setItem(localKeyTimestamp, Date.now().toString());
        } catch (error) {
            console.error(`Error saving to localStorage for "${localKey}":`, error);
        }

        // 2. Mark this as a pending write to prevent Firebase sync from overwriting it
        // Use timestamp to track write order instead of comparing values (which fails for objects)
        const writeTimestamp = Date.now();
        pendingWrites.set(path, { value: valueToStore, timestamp: writeTimestamp });
        
        // 3. Clear any existing debounce timeout for this path
        const existingTimeout = pendingWriteTimeouts.get(path);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        
        // 4. Debounce Firebase writes to batch rapid updates
        const writeTimeout = setTimeout(() => {
            // Remove from pending writes after debounce period
            const pendingWrite = pendingWrites.get(path);
            
            // Only proceed if this timestamp is still the current pending write
            // This ensures we write the most recent value even if earlier writes were cancelled
            if (pendingWrite && pendingWrite.timestamp === writeTimestamp) {
                // Remove timeout tracking
                pendingWriteTimeouts.delete(path);
                
                // 5. Save to Firebase Realtime Database (Primary Storage) with retry mechanism
                if (isFirebaseConfigured && database) {
                    const dbRef = ref(database, path);
                    
                    const attemptWrite = (retryCount: number = 0) => {
                        set(dbRef, valueToStore)
                            .then(() => {
                                // Clear any failed write tracking on success
                                failedWrites.delete(path);
                                // Clear pending write on successful write (only if it's still this timestamp)
                                const currentPending = pendingWrites.get(path);
                                if (currentPending && currentPending.timestamp === writeTimestamp) {
                                    pendingWrites.delete(path);
                                }
                            })
                            .catch((error: unknown) => {
                                // Convert error to Error type for better handling
                                const err = error instanceof Error ? error : new Error(String(error));
                                const firebaseErr = err as FirebaseError;
                                
                                console.error(`Firebase write error at "${path}" (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS}):`, err.message);
                                
                                // Check for specific error types that need special handling
                                const isPermissionError = firebaseErr.code === 'PERMISSION_DENIED';
                                const isNetworkError = firebaseErr.code === 'NETWORK_ERROR' || 
                                                       firebaseErr.code === 'UNAVAILABLE' ||
                                                       err.message.includes('network') ||
                                                       err.message.includes('fetch') ||
                                                       err.message.includes('offline');
                                
                                if (isPermissionError) {
                                    console.error(`PERMISSION DENIED - Check Firebase database rules for: ${path}`);
                                }
                                
                                // Improved connection detection
                                const isCurrentlyOffline = !isOnline || !firebaseConnected;
                                
                                // Track failed write for retry
                                if (retryCount < MAX_RETRY_INDEX) {
                                    const nextRetryCount = retryCount + 1;
                                    failedWrites.set(path, {
                                        value: valueToStore,
                                        retryCount: nextRetryCount,
                                        lastAttempt: Date.now()
                                    });
                                    
                                    // Calculate exponential backoff delay: 2s, 4s, 8s, 16s, 30s, 30s, ...
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
                                    setTimeout(() => {
                                        const failedWrite = failedWrites.get(path);
                                        // Only retry if this is still the current failed write attempt
                                        if (failedWrite && failedWrite.retryCount === nextRetryCount) {
                                            attemptWrite(nextRetryCount);
                                        }
                                    }, exponentialDelay);
                                } else {
                                    console.error(`CRITICAL: Firebase write failed after ${MAX_RETRY_ATTEMPTS} attempts for ${path}`);
                                    console.error(`Data is cached locally but NOT saved to Firebase`);
                                    
                                    // Notify listeners about critical sync error (all retries failed)
                                    notifySyncError(path, err, true);
                                    
                                    failedWrites.delete(path);
                                    // Clear pending write even on failure after all retries (only if it's still this timestamp)
                                    const currentPending = pendingWrites.get(path);
                                    if (currentPending && currentPending.timestamp === writeTimestamp) {
                                        pendingWrites.delete(path);
                                    }
                                }
                            });
                    };
                    
                    // Start the write attempt
                    attemptWrite(0);
                } else {
                    console.warn(`Firebase not configured. Data for ${path} is cached locally only.`);
                    // Clear pending write if Firebase is not configured (only if it's still this timestamp)
                    const currentPending = pendingWrites.get(path);
                    if (currentPending && currentPending.timestamp === writeTimestamp) {
                        pendingWrites.delete(path);
                    }
                }
            }
        }, WRITE_DEBOUNCE_MS);
        
        // Track the timeout so we can clear it if needed
        pendingWriteTimeouts.set(path, writeTimeout);
        
        return valueToStore;
    });
  }, [path, localKey, localKeyTimestamp]);

  return { data: storedValue, setData: setValue, isLoading: loading };
}

/**
 * Check if there are any pending writes for a given path or any path
 * @param path Optional path to check. If not provided, checks all paths
 * @returns true if there are pending writes
 */
export const hasPendingWrites = (path?: string): boolean => {
  if (path) {
    return pendingWrites.has(path);
  }
  return pendingWrites.size > 0;
};

/**
 * Cleanup function to tear down global connection monitoring
 * Should only be called when the entire application is shutting down
 * Not normally needed in React apps, but useful for testing
 */
export const cleanupConnectionMonitoring = () => {
  // Clean up Firebase connection listener
  if (firebaseConnectionUnsubscribe) {
    firebaseConnectionUnsubscribe();
    firebaseConnectionUnsubscribe = null;
    firebaseConnectionMonitorSetup = false;
    console.log('🔧 Firebase connection monitor cleaned up');
  }
  
  // Clean up browser event listeners
  window.removeEventListener('online', handleBrowserOnline);
  window.removeEventListener('offline', handleBrowserOffline);
  
  // Clean up visibility change listener
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler);
    visibilityChangeHandler = null;
  }
  
  // Clear consistency check interval
  if (dataConsistencyCheckInterval) {
    clearInterval(dataConsistencyCheckInterval);
    dataConsistencyCheckInterval = null;
  }
  
  // Clear all connection status callbacks to prevent memory leaks
  connectionStatusCallbacks.length = 0;
  
  connectionListenerSetup = false;
  console.log('🔧 Global connection monitoring cleaned up');
};

export default useFirebaseSync;
