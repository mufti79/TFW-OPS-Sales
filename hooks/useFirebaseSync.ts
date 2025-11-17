import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { database } from '../firebaseConfig';

function useFirebaseSync<T>(path: string, initialValue: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dbRef = database.ref(path);

    // Set a timeout to prevent getting stuck on the loading screen
    const timeoutId = setTimeout(() => {
        if (loading) { // Check if still loading
            console.warn(`Firebase listener for path "${path}" timed out after 8 seconds. Proceeding with initial/stale data.`);
            setLoading(false);
        }
    }, 8000); // 8-second timeout

    const listener = dbRef.on('value', (snapshot) => {
      clearTimeout(timeoutId); // We got a response, clear the timeout
      if (snapshot.exists()) {
        setStoredValue(snapshot.val());
      } else {
        // If no value exists, initialize it in Firebase.
        // This is useful for populating initial data like the list of rides/operators.
        dbRef.set(initialValue).catch(error => console.error(`Firebase initial set error at path "${path}":`, error));
        setStoredValue(initialValue);
      }
      setLoading(false);
    }, (error) => {
        clearTimeout(timeoutId); // An error is also a response, clear the timeout
        console.error(`Firebase read error at path "${path}":`, error);
        setLoading(false);
    });

    // Detach the listener and clear timeout when the component unmounts
    return () => {
      clearTimeout(timeoutId);
      dbRef.off('value', listener);
    };
  // We only want to run this effect once to set up the listener.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        // Update local state immediately for a responsive UI
        setStoredValue(valueToStore);
        // Push the change to Firebase
        database.ref(path).set(valueToStore).catch(error => {
            console.error(`Firebase write error at path "${path}":`, error);
        });
    } catch (error) {
        console.error(`Error setting value for Firebase path "${path}":`, error);
    }
  };

  return [storedValue, setValue, loading];
}

export default useFirebaseSync;
