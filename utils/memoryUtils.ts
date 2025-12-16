/**
 * Memory Management Utilities
 * 
 * This module provides utilities for monitoring and managing memory usage
 * to prevent "Out of Memory" errors in the application.
 */

/**
 * Gets current memory usage statistics (Chrome only)
 * @returns Memory stats object or null if not supported
 */
export const getMemoryStats = (): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
} | null => {
  if ('performance' in window && 'memory' in (performance as any)) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
};

/**
 * Checks if memory usage is above the warning threshold
 * @param threshold - Percentage threshold (default: 70)
 * @returns true if memory usage is above threshold
 */
export const isMemoryPressureHigh = (threshold: number = 70): boolean => {
  const stats = getMemoryStats();
  if (!stats) return false;
  return stats.usagePercentage >= threshold;
};

/**
 * Clears browser cache via Service Worker
 */
export const clearServiceWorkerCache = (): void => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    console.log('Service Worker cache clear requested');
  }
};

/**
 * Clears localStorage while preserving authentication data
 */
export const clearLocalStorageExceptAuth = (): void => {
  try {
    const authRole = localStorage.getItem('authRole');
    const authUser = localStorage.getItem('authUser');
    
    localStorage.clear();
    
    if (authRole) localStorage.setItem('authRole', authRole);
    if (authUser) localStorage.setItem('authUser', authUser);
    
    console.log('localStorage cleared (auth preserved)');
  } catch (e) {
    console.error('Failed to clear localStorage:', e);
  }
};

/**
 * Performs a full memory cleanup
 * - Clears Service Worker cache
 * - Clears localStorage (except auth)
 * - Triggers garbage collection (if available)
 */
export const performMemoryCleanup = (): void => {
  console.log('Performing memory cleanup...');
  
  clearServiceWorkerCache();
  clearLocalStorageExceptAuth();
  
  // Trigger garbage collection in development (Chrome only)
  if (import.meta.env.DEV && 'gc' in window) {
    try {
      (window as any).gc();
      console.log('Garbage collection triggered');
    } catch (e) {
      console.warn('Could not trigger garbage collection:', e);
    }
  }
  
  console.log('Memory cleanup completed');
};

/**
 * Sets up automatic memory monitoring
 * @param threshold - Memory usage percentage to trigger cleanup (default: 80)
 * @param interval - Check interval in milliseconds (default: 60000)
 * @returns Cleanup function to stop monitoring
 */
export const setupMemoryMonitoring = (
  threshold: number = 80,
  interval: number = 60000
): (() => void) => {
  const intervalId = setInterval(() => {
    const stats = getMemoryStats();
    if (stats) {
      console.log(`Memory usage: ${stats.usagePercentage.toFixed(1)}%`);
      
      if (stats.usagePercentage >= threshold) {
        console.warn(`⚠️ High memory usage detected: ${stats.usagePercentage.toFixed(1)}%`);
        clearServiceWorkerCache();
      }
    }
  }, interval);
  
  return () => clearInterval(intervalId);
};

/**
 * Formats bytes to human-readable format
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Estimates the size of a JavaScript object in memory
 * @param obj - Object to measure
 * @returns Estimated size in bytes
 */
export const estimateObjectSize = (obj: any): number => {
  try {
    return new Blob([JSON.stringify(obj)]).size;
  } catch (e) {
    console.error('Failed to estimate object size:', e);
    return 0;
  }
};

/**
 * Logs memory statistics to console (development only)
 */
export const logMemoryStats = (): void => {
  if (import.meta.env.DEV) {
    const stats = getMemoryStats();
    if (stats) {
      console.group('💾 Memory Statistics');
      console.log('Used:', formatBytes(stats.usedJSHeapSize));
      console.log('Total:', formatBytes(stats.totalJSHeapSize));
      console.log('Limit:', formatBytes(stats.jsHeapSizeLimit));
      console.log('Usage:', `${stats.usagePercentage.toFixed(2)}%`);
      console.groupEnd();
    } else {
      console.log('Memory API not available in this browser');
    }
  }
};

/**
 * React hook for monitoring memory usage
 * @param threshold - Warning threshold percentage
 * @param onHighMemory - Callback when memory usage is high
 */
export const useMemoryMonitor = (
  threshold: number = 80,
  onHighMemory?: () => void
) => {
  if (typeof window === 'undefined') return;
  
  const checkMemory = () => {
    if (isMemoryPressureHigh(threshold)) {
      console.warn('High memory pressure detected');
      onHighMemory?.();
    }
  };
  
  // Check immediately
  checkMemory();
  
  // Set up periodic checking
  const intervalId = setInterval(checkMemory, 60000);
  
  return () => clearInterval(intervalId);
};

export default {
  getMemoryStats,
  isMemoryPressureHigh,
  clearServiceWorkerCache,
  clearLocalStorageExceptAuth,
  performMemoryCleanup,
  setupMemoryMonitoring,
  formatBytes,
  estimateObjectSize,
  logMemoryStats,
  useMemoryMonitor,
};
