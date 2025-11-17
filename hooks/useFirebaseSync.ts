import { useState, useEffect, Dispatch, SetStateAction, useCallback, useRef } from 'react';
import { database } from '../firebaseConfig';

function useFirebaseSync<T>(path: string, initialValue: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    const dbRef = database.ref(path);

    const timeoutId = setTimeout(() => {
        if (loading) {
            console.warn(`Firebase listener for path "${path}" timed out after 8 seconds. Proceeding with initial/stale data.`);
            setLoading(false);
        }
    }, 8000);

    const listener = dbRef.on('value', (snapshot) => {
      clearTimeout(timeoutId);
      if (snapshot.exists()) {
        setStoredValue(snapshot.val());
      } else {
        dbRef.set(initialValueRef.current).catch(error => console.error(`Firebase initial set error at path "${path}":`, error));
        setStoredValue(initialValueRef.current);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
    try {
        const dbRef = database.ref(path);
        if (value instanceof Function) {
            // Use a transaction for function-based updates to ensure atomicity and avoid race conditions.
            dbRef.transaction((currentData) => {
                // If there's no data in Firebase, the transaction callback receives `null`.
                // We should use the initial value as the base in that case.
                const baseData = currentData === null ? initialValueRef.current : currentData;
                return value(baseData);
            }).catch(error => {
                console.error(`Firebase transaction error at path "${path}":`, error);
            });
        } else {
            // For direct value sets, just use `set`. This overwrites all data at the location.
            dbRef.set(value).catch(error => {
                console.error(`Firebase write error at path "${path}":`, error);
            });
        }
    } catch (error) {
        console.error(`Error setting value for Firebase path "${path}":`, error);
    }
  }, [path]);

  return [storedValue, setValue, loading];
}

export default useFirebaseSync;