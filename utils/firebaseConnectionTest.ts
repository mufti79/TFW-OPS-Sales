/**
 * Firebase Connection Test Utility
 * 
 * This utility provides functions to test and verify Firebase Realtime Database connectivity.
 * Use this to ensure your Firebase configuration is working correctly.
 */

import { database, isFirebaseConfigured, firebaseProjectId } from '../firebaseConfig';
import { ref, get, set, onValue, off, DatabaseReference } from 'firebase/database';

// Connection test timeout in milliseconds
const CONNECTION_TEST_TIMEOUT_MS = 5000;

export interface ConnectionTestResult {
  configured: boolean;
  connected: boolean;
  canRead: boolean;
  canWrite: boolean;
  projectId: string;
  databaseURL: string;
  errors: string[];
  timestamp: string;
}

/**
 * Tests Firebase Realtime Database connectivity
 * Performs comprehensive checks including configuration, connection, read, and write operations
 */
export const testFirebaseConnection = async (): Promise<ConnectionTestResult> => {
  const result: ConnectionTestResult = {
    configured: isFirebaseConfigured,
    connected: false,
    canRead: false,
    canWrite: false,
    projectId: firebaseProjectId,
    databaseURL: '',
    errors: [],
    timestamp: new Date().toISOString()
  };

  // Check if Firebase is configured
  if (!isFirebaseConfigured) {
    result.errors.push('Firebase is not configured. Please update firebaseConfig.ts with your project credentials.');
    return result;
  }

  if (!database) {
    result.errors.push('Firebase database instance is not initialized.');
    return result;
  }

  try {
    // Get database URL
    result.databaseURL = database.app.options.databaseURL || '';

    // Test connection status
    const connectedRef = ref(database, '.info/connected');
    const connectedSnap = await get(connectedRef);
    result.connected = connectedSnap.val() === true;

    if (!result.connected) {
      result.errors.push('Not connected to Firebase. Check your internet connection.');
      return result;
    }

    // Test read operation
    try {
      const testReadRef = ref(database, 'config/appName');
      await get(testReadRef);
      result.canRead = true;
    } catch (readError: any) {
      result.errors.push(`Read test failed: ${readError.message || 'Unknown error'}`);
      result.canRead = false;
    }

    // Test write operation (to a test path)
    try {
      const testWriteRef = ref(database, 'system/connectionTest');
      await set(testWriteRef, {
        timestamp: new Date().toISOString(),
        test: true
      });
      result.canWrite = true;
    } catch (writeError: any) {
      result.errors.push(`Write test failed: ${writeError.message || 'Unknown error'}. Check Firebase Security Rules.`);
      result.canWrite = false;
    }

  } catch (error: any) {
    result.errors.push(`Connection test failed: ${error.message || 'Unknown error'}`);
  }

  return result;
};

/**
 * Monitors Firebase connection status in real-time
 * Returns an unsubscribe function to stop monitoring
 */
export const monitorConnectionStatus = (
  onStatusChange: (connected: boolean) => void
): (() => void) => {
  if (!database) {
    console.error('Firebase database is not initialized');
    return () => {};
  }

  const connectedRef = ref(database, '.info/connected');
  
  const listener = (snapshot: any) => {
    const connected = snapshot.val() === true;
    onStatusChange(connected);
  };
  
  onValue(connectedRef, listener);

  return () => off(connectedRef, listener);
};

/**
 * Verifies that the Firebase database URL is reachable
 */
export const verifyDatabaseURL = async (): Promise<{
  valid: boolean;
  url: string;
  error?: string;
  canConnect?: boolean;
}> => {
  if (!database) {
    return {
      valid: false,
      url: '',
      error: 'Database not initialized',
      canConnect: false
    };
  }

  const url = database.app.options.databaseURL || '';
  
  if (!url) {
    return {
      valid: false,
      url: '',
      error: 'Database URL is not configured',
      canConnect: false
    };
  }

  // More secure URL validation - check for exact domain match
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    if (!hostname.endsWith('.firebaseio.com') && !hostname.endsWith('.firebasedatabase.app')) {
      return {
        valid: false,
        url,
        error: 'Invalid Firebase database URL format',
        canConnect: false
      };
    }
    
    // Try to check connectivity by attempting to read .info/connected
    try {
      const connectedRef = ref(database, '.info/connected');
      const snapshot = await Promise.race([
        get(connectedRef),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TEST_TIMEOUT_MS))
      ]);
      
      return {
        valid: true,
        url,
        canConnect: true
      };
    } catch (connError: any) {
      // Connection attempt failed - might be DNS, network, or database doesn't exist
      let errorMsg = 'Cannot connect to database';
      if (connError.message?.includes('timeout')) {
        errorMsg = 'Connection timeout - database may not exist or network issue';
      } else if (connError.code === 'NETWORK_ERROR') {
        errorMsg = 'Network error - check internet connection or database URL';
      }
      
      return {
        valid: true, // URL format is valid
        url,
        error: errorMsg,
        canConnect: false
      };
    }
  } catch (e) {
    return {
      valid: false,
      url,
      error: 'Malformed database URL',
      canConnect: false
    };
  }
};

/**
 * Prints a detailed Firebase connection report to the console
 */
export const printConnectionReport = async (): Promise<void> => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔥 Firebase Connection Test Report');
  console.log('═══════════════════════════════════════════════════════');
  
  const result = await testFirebaseConnection();
  
  console.log(`📋 Configuration Status: ${result.configured ? '✓ Configured' : '✗ Not Configured'}`);
  console.log(`🌐 Connection Status: ${result.connected ? '✓ Connected' : '✗ Disconnected'}`);
  console.log(`📖 Read Permission: ${result.canRead ? '✓ Allowed' : '✗ Denied'}`);
  console.log(`✏️  Write Permission: ${result.canWrite ? '✓ Allowed' : '✗ Denied'}`);
  console.log(`🏷️  Project ID: ${result.projectId}`);
  console.log(`🔗 Database URL: ${result.databaseURL}`);
  console.log(`⏰ Test Time: ${new Date(result.timestamp).toLocaleString()}`);
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  } else {
    console.log('\n✓ All tests passed successfully!');
  }
  
  console.log('═══════════════════════════════════════════════════════');
};
