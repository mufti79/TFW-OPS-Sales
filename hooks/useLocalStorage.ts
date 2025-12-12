// FIX: Implemented the useLocalStorage custom hook to persist state to browser's local storage.
// This resolves the module not found errors in useAuth.ts and DailySalesEntry.tsx.
import { useState, useCallback, Dispatch, SetStateAction } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
    try {
      setStoredValue(prevValue => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          } catch (storageError) {
            // Handle storage quota exceeded or other localStorage errors
            console.error('Failed to save to localStorage:', storageError);
          }
        }
        return valueToStore;
      });
    } catch (error) {
      console.error('Error in setValue:', error);
    }
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;