
import { useState, useEffect, Dispatch, SetStateAction, useCallback, useRef } from 'react';
import { database, isFirebaseConfigured } from '../firebaseConfig';
import { ref, onValue, set, off } from 'firebase/database';

// Cache expiration time: 1 hour
// This ensures users see fresh data more quickly while still maintaining
// good offline support. Cached data older than 1 hour is refreshed from Firebase.
const CACHE_EXPIRATION_MS = 1 * 60 * 60 * 1000;

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
    
    // Only use cached data if it's less than CACHE_EXPIRATION_MS old
    if (now - timestamp < CACHE_EXPIRATION_MS) {
      try {
        const parsedData = JSON.parse(item);
        const ageMinutes = Math.floor((now - timestamp) / (60 * 1000));
        console.log(`✓ Using cached data for ${path} (age: ${ageMinutes} minutes)`);
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
      console.warn(`Cache expired for ${path} (age: ${ageHours} hours), will refresh from Firebase`);
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

  useEffect(() => {
    // Safety check: if firebase is not configured OR if database failed to initialize
    if (!isFirebaseConfigured || !database) {
        setLoading(false);
        return;
    }
    
    const dbRef = ref(database, path);

    // Reduced timeout to 2.5s to let offline users start working faster
    const timeoutId = setTimeout(() => {
        if (loading) {
            console.log(`Firebase load timed out for ${path}, using local data.`);
            setLoading(false);
        }
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
    };
  }, [path, localKey, localKeyTimestamp, loading, initialValue]);

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
            console.error(`Error saving to localStorage for key "${localKey}":`, error);
        }

        // 2. Save to Firebase (Online Sync)
        if (isFirebaseConfigured && database) {
            // We use set() which handles queuing if the network is temporarily flaky,
            // but assumes the app stays open long enough to reconnect.
            const dbRef = ref(database, path);
            set(dbRef, valueToStore)
                .then(() => {
                    console.log(`✓ Data synced to Firebase for ${path}`);
                })
                .catch(error => {
                    console.error(`Firebase write error at path "${path}":`, error);
                });
        }
        
        return valueToStore;
    });
  }, [path, localKey, localKeyTimestamp]);

  return { data: storedValue, setData: setValue, isLoading: loading };
}

export default useFirebaseSync;
