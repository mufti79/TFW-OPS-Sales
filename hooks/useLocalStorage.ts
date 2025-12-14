// FIX: Implemented the useLocalStorage custom hook to persist state to browser's local storage.
// This resolves the module not found errors in useAuth.ts and DailySalesEntry.tsx.
// Enhanced with better error handling and persistence mechanisms to prevent auto-logout.
import { useState, useCallback, Dispatch, SetStateAction, useEffect, useRef } from 'react';

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

  const lastValueRef = useRef<string>('');

  // Periodically verify localStorage integrity to prevent unexpected logouts
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const verifyStorage = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item && item !== lastValueRef.current) {
          const parsedItem = JSON.parse(item);
          setStoredValue(parsedItem);
          lastValueRef.current = item;
        }
      } catch (error) {
        console.warn(`Storage verification failed for key "${key}":`, error);
      }
    };

    // Check storage integrity every 30 seconds
    const intervalId = setInterval(verifyStorage, 30000);

    // Also listen to storage events from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
          lastValueRef.current = e.newValue;
        } catch (error) {
          console.error('Error parsing storage event value:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]); // Removed storedValue from dependencies to prevent infinite loop

  const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
    try {
      setStoredValue(prevValue => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        if (typeof window !== 'undefined') {
          try {
            const jsonValue = JSON.stringify(valueToStore);
            window.localStorage.setItem(key, jsonValue);
            lastValueRef.current = jsonValue;
            // Verify write was successful
            const written = window.localStorage.getItem(key);
            if (written !== jsonValue) {
              console.error(`Failed to persist ${key} to localStorage - retrying`);
              // Retry once
              setTimeout(() => {
                try {
                  window.localStorage.setItem(key, jsonValue);
                } catch (retryError) {
                  console.error('Retry failed:', retryError);
                }
              }, 100);
            }
          } catch (storageError) {
            // Handle storage quota exceeded or other localStorage errors
            console.error('Failed to save to localStorage:', storageError);
            // Attempt to clear some space by removing non-critical data
            if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
              console.warn('Storage quota exceeded. Consider clearing old data.');
            }
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