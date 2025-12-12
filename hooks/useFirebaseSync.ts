
import { useState, useEffect, Dispatch, SetStateAction, useCallback, useRef } from 'react';
import { database, isFirebaseConfigured } from '../firebaseConfig';
import { ref, onValue, set, off } from 'firebase/database';

function useFirebaseSync<T>(
  path: string,
  initialValue: T
): { data: T; setData: Dispatch<SetStateAction<T>>; isLoading: boolean } {
  const localKey = `tfw_data_${path.replace(/\//g, '_')}`;

  // Initialize state from localStorage if available, otherwise use initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(localKey);
        return item ? JSON.parse(item) : initialValue;
      }
    } catch (error) {
      console.warn(`Error reading localStorage for key "${localKey}":`, error);
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
        } catch (e) {
            console.warn("Failed to update localStorage from Firebase sync", e);
        }
      } else {
        // IMPORTANT: If snapshot doesn't exist (e.g. data was deleted/reset on server),
        // we must revert to initialValue to ensure clients sync the deletion.
        setStoredValue(initialValue);
        try {
            window.localStorage.removeItem(localKey);
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
  }, [path, localKey, loading, initialValue]);

  const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
    setStoredValue((prev) => {
        // Resolve the new value
        const valueToStore = value instanceof Function ? value(prev) : value;

        // 1. Save to Local Storage (Offline Persistence)
        try {
            window.localStorage.setItem(localKey, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error saving to localStorage for key "${localKey}":`, error);
        }

        // 2. Save to Firebase (Online Sync)
        if (isFirebaseConfigured && database) {
            // We use set() which handles queuing if the network is temporarily flaky,
            // but assumes the app stays open long enough to reconnect.
            const dbRef = ref(database, path);
            set(dbRef, valueToStore).catch(error => {
                console.error(`Firebase write error at path "${path}":`, error);
            });
        }
        
        return valueToStore;
    });
  }, [path, localKey]);

  return { data: storedValue, setData: setValue, isLoading: loading };
}

export default useFirebaseSync;
