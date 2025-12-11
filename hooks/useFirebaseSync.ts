
import { useState, useEffect, Dispatch, SetStateAction, useCallback, useRef } from 'react';
import { database, isFirebaseConfigured } from '../firebaseConfig';

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
    // Safety check: if firebase is not configured OR if database failed to initialize (e.g. script load error)
    if (!isFirebaseConfigured || !database) {
        setLoading(false);
        return;
    }
    
    const dbRef = database.ref(path);

    const timeoutId = setTimeout(() => {
        if (loading) {
            // If Firebase times out, we assume offline/slow connection and let the app use local data
            setLoading(false);
        }
    }, 5000);

    const listener = dbRef.on('value', (snapshot) => {
      clearTimeout(timeoutId);
      if (snapshot.exists()) {
        const val = snapshot.val();
        setStoredValue(val);
        // Sync valid data from server to local storage
        try {
            window.localStorage.setItem(localKey, JSON.stringify(val));
        } catch (e) {
            console.warn("Failed to update localStorage from Firebase sync", e);
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
      dbRef.off('value', listener);
    };
  }, [path, localKey, loading]);

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
            const dbRef = database.ref(path);
            dbRef.set(valueToStore).catch(error => {
                console.error(`Firebase write error at path "${path}":`, error);
            });
        }
        
        return valueToStore;
    });
  }, [path, localKey]);

  return { data: storedValue, setData: setValue, isLoading: loading };
}

export default useFirebaseSync;
