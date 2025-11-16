import { useState, useEffect, Dispatch, SetStateAction, useCallback } from 'react';

// T is the type of the state
function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  // Wrap the original setter to persist the value to localStorage.
  // useCallback is used to ensure the setter function's identity is stable,
  // which can be an optimization for child components.
  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      try {
        // We allow value to be a function, just like the normal setState.
        // We pass a function to the original setStoredValue to ensure we always
        // get the latest state value and avoid stale closures.
        setStoredValue((currentValue) => {
          const valueToStore = value instanceof Function ? value(currentValue) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key] // The setter function now only depends on the key.
  );

  // The effect for syncing across tabs.
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
           console.error(`Error parsing storage change for key “${key}”:`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
