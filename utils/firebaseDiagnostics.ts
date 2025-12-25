/**
 * Firebase Diagnostics Utility
 * 
 * This utility provides comprehensive diagnostics for Firebase Realtime Database
 * connection issues. It helps identify and fix common problems.
 */

import { database, isFirebaseConfigured, firebaseProjectId } from '../firebaseConfig';
import { ref, get, set, onValue, off } from 'firebase/database';

export interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: string;
  timestamp: string;
}

export interface CompleteDiagnostics {
  configuration: DiagnosticResult;
  databaseInstance: DiagnosticResult;
  connectionStatus: DiagnosticResult;
  readTest: DiagnosticResult;
  writeTest: DiagnosticResult;
  listenerTest: DiagnosticResult;
  overallStatus: 'pass' | 'fail' | 'warning';
  recommendations: string[];
}

/**
 * Run comprehensive Firebase diagnostics
 */
export const runFirebaseDiagnostics = async (): Promise<CompleteDiagnostics> => {
  const results: CompleteDiagnostics = {
    configuration: { success: false, message: '', timestamp: new Date().toISOString() },
    databaseInstance: { success: false, message: '', timestamp: new Date().toISOString() },
    connectionStatus: { success: false, message: '', timestamp: new Date().toISOString() },
    readTest: { success: false, message: '', timestamp: new Date().toISOString() },
    writeTest: { success: false, message: '', timestamp: new Date().toISOString() },
    listenerTest: { success: false, message: '', timestamp: new Date().toISOString() },
    overallStatus: 'fail',
    recommendations: []
  };

  // Test 1: Check Configuration
  if (!isFirebaseConfigured) {
    results.configuration = {
      success: false,
      message: 'Firebase is not configured',
      details: 'Please update firebaseConfig.ts with your project credentials',
      timestamp: new Date().toISOString()
    };
    results.recommendations.push('Update firebaseConfig.ts with valid Firebase project credentials');
    return results;
  }
  
  results.configuration = {
    success: true,
    message: 'Firebase configuration is valid',
    details: `Project ID: ${firebaseProjectId}`,
    timestamp: new Date().toISOString()
  };

  // Test 2: Check Database Instance
  if (!database) {
    results.databaseInstance = {
      success: false,
      message: 'Firebase database instance is null',
      details: 'Database failed to initialize - check console for errors',
      timestamp: new Date().toISOString()
    };
    results.recommendations.push('Check browser console for Firebase initialization errors');
    results.recommendations.push('Verify internet connection');
    return results;
  }

  results.databaseInstance = {
    success: true,
    message: 'Firebase database instance initialized',
    details: database.app.options.databaseURL || 'URL not available',
    timestamp: new Date().toISOString()
  };

  // Test 3: Check Connection Status
  try {
    const connectedRef = ref(database, '.info/connected');
    const connectedSnap = await get(connectedRef);
    const isConnected = connectedSnap.val() === true;

    if (isConnected) {
      results.connectionStatus = {
        success: true,
        message: 'Connected to Firebase Realtime Database',
        timestamp: new Date().toISOString()
      };
    } else {
      results.connectionStatus = {
        success: false,
        message: 'Not connected to Firebase',
        details: 'Connection status shows disconnected',
        timestamp: new Date().toISOString()
      };
      results.recommendations.push('Check internet connection');
      results.recommendations.push('Try refreshing the page');
    }
  } catch (error: any) {
    results.connectionStatus = {
      success: false,
      message: 'Failed to check connection status',
      details: error.message,
      timestamp: new Date().toISOString()
    };
    results.recommendations.push('Check network connectivity');
  }

  // Test 4: Read Test
  try {
    const testReadRef = ref(database, 'config/appName');
    await get(testReadRef);
    results.readTest = {
      success: true,
      message: 'Successfully read from Firebase',
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    results.readTest = {
      success: false,
      message: 'Failed to read from Firebase',
      details: error.message,
      timestamp: new Date().toISOString()
    };
    
    if (error.code === 'PERMISSION_DENIED') {
      results.recommendations.push('Check Firebase Security Rules - read permission may be denied');
      results.recommendations.push(`Visit: https://console.firebase.google.com/project/${firebaseProjectId}/database/rules`);
    }
  }

  // Test 5: Write Test
  try {
    const testWriteRef = ref(database, 'system/diagnosticsTest');
    await set(testWriteRef, {
      timestamp: new Date().toISOString(),
      test: 'Firebase diagnostics write test'
    });
    results.writeTest = {
      success: true,
      message: 'Successfully wrote to Firebase',
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    results.writeTest = {
      success: false,
      message: 'Failed to write to Firebase',
      details: error.message,
      timestamp: new Date().toISOString()
    };
    
    if (error.code === 'PERMISSION_DENIED') {
      results.recommendations.push('Check Firebase Security Rules - write permission may be denied');
      results.recommendations.push(`Visit: https://console.firebase.google.com/project/${firebaseProjectId}/database/rules`);
    }
  }

  // Test 6: Real-time Listener Test
  try {
    const testListenerRef = ref(database, 'system/diagnosticsTest');
    let listenerTriggered = false;

    const listenerPromise = new Promise<boolean>((resolve) => {
      const unsubscribe = onValue(testListenerRef, (snapshot) => {
        listenerTriggered = true;
        unsubscribe();
        resolve(true);
      }, (error) => {
        unsubscribe();
        resolve(false);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        unsubscribe();
        resolve(listenerTriggered);
      }, 5000);
    });

    const success = await listenerPromise;
    
    if (success) {
      results.listenerTest = {
        success: true,
        message: 'Real-time listener is working',
        timestamp: new Date().toISOString()
      };
    } else {
      results.listenerTest = {
        success: false,
        message: 'Real-time listener did not trigger',
        details: 'Listener may not be receiving updates',
        timestamp: new Date().toISOString()
      };
      results.recommendations.push('Real-time sync may not work - check Firebase connection');
    }
  } catch (error: any) {
    results.listenerTest = {
      success: false,
      message: 'Failed to set up real-time listener',
      details: error.message,
      timestamp: new Date().toISOString()
    };
  }

  // Determine Overall Status
  const allPassed = results.configuration.success &&
                    results.databaseInstance.success &&
                    results.connectionStatus.success &&
                    results.readTest.success &&
                    results.writeTest.success &&
                    results.listenerTest.success;

  const somePassed = results.configuration.success ||
                     results.databaseInstance.success ||
                     results.connectionStatus.success ||
                     results.readTest.success;

  if (allPassed) {
    results.overallStatus = 'pass';
  } else if (somePassed) {
    results.overallStatus = 'warning';
  } else {
    results.overallStatus = 'fail';
  }

  // Add general recommendations if needed
  if (results.overallStatus !== 'pass') {
    if (results.recommendations.length === 0) {
      results.recommendations.push('Try refreshing the page');
      results.recommendations.push('Check your internet connection');
      results.recommendations.push('Clear browser cache and try again');
    }
  }

  return results;
};

/**
 * Print diagnostics report to console
 */
export const printDiagnosticsReport = async (): Promise<void> => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔥 Firebase Realtime Database Diagnostics');
  console.log('═══════════════════════════════════════════════════════');
  
  const results = await runFirebaseDiagnostics();
  
  console.log(`\n📋 Configuration: ${results.configuration.success ? '✓' : '✗'} ${results.configuration.message}`);
  if (results.configuration.details) console.log(`   ${results.configuration.details}`);
  
  console.log(`\n💾 Database Instance: ${results.databaseInstance.success ? '✓' : '✗'} ${results.databaseInstance.message}`);
  if (results.databaseInstance.details) console.log(`   ${results.databaseInstance.details}`);
  
  console.log(`\n🌐 Connection Status: ${results.connectionStatus.success ? '✓' : '✗'} ${results.connectionStatus.message}`);
  if (results.connectionStatus.details) console.log(`   ${results.connectionStatus.details}`);
  
  console.log(`\n📖 Read Test: ${results.readTest.success ? '✓' : '✗'} ${results.readTest.message}`);
  if (results.readTest.details) console.log(`   ${results.readTest.details}`);
  
  console.log(`\n✏️  Write Test: ${results.writeTest.success ? '✓' : '✗'} ${results.writeTest.message}`);
  if (results.writeTest.details) console.log(`   ${results.writeTest.details}`);
  
  console.log(`\n🔄 Listener Test: ${results.listenerTest.success ? '✓' : '✗'} ${results.listenerTest.message}`);
  if (results.listenerTest.details) console.log(`   ${results.listenerTest.details}`);
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Overall Status: ${results.overallStatus === 'pass' ? '✅ PASS' : results.overallStatus === 'warning' ? '⚠️ WARNING' : '❌ FAIL'}`);
  
  if (results.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    results.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
};

/**
 * Quick connection check
 */
export const quickConnectionCheck = async (): Promise<boolean> => {
  if (!isFirebaseConfigured || !database) {
    return false;
  }

  try {
    const connectedRef = ref(database, '.info/connected');
    const snap = await get(connectedRef);
    return snap.val() === true;
  } catch {
    return false;
  }
};
