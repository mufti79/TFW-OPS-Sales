/**
 * Firebase Realtime Database Connection Verification Script
 * 
 * This script verifies that Firebase Realtime Database is properly configured
 * and can establish a connection.
 * 
 * Usage: node verify-firebase-connection.js
 */

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9kTKrhiXLVnri6rczHb26Ghl7l4uxJhE",
  authDomain: "tfw-ops-salesgit-4001335-4685c.firebaseapp.com",
  databaseURL: "https://tfw-ops-salesgit-4001335-4685c-default-rtdb.firebaseio.com",
  projectId: "tfw-ops-salesgit-4001335-4685c",
  storageBucket: "tfw-ops-salesgit-4001335-4685c.firebasestorage.app",
  messagingSenderId: "890191705352",
  appId: "1:890191705352:web:9251f92d340a3a977ce8bd"
};

console.log('═══════════════════════════════════════════════════════');
console.log('🔥 Firebase Realtime Database Connection Verification');
console.log('═══════════════════════════════════════════════════════\n');

async function verifyConnection() {
  try {
    // Step 1: Initialize Firebase
    console.log('Step 1: Initializing Firebase...');
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    console.log('  ✅ Firebase app initialized');
    console.log('  📋 Project ID:', firebaseConfig.projectId);
    console.log('  🔗 Database URL:', firebaseConfig.databaseURL);
    console.log();

    // Step 2: Get database instance
    console.log('Step 2: Getting database instance...');
    const database = getDatabase(app);
    console.log('  ✅ Database instance obtained');
    console.log();

    // Step 3: Monitor connection status
    console.log('Step 3: Monitoring connection status...');
    const connectedRef = ref(database, '.info/connected');
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('  ⚠️  Connection timeout (10 seconds) - Firebase may be unreachable');
        console.log();
        resolve(false);
      }, 10000);

      onValue(connectedRef, (snapshot) => {
        clearTimeout(timeout);
        const connected = snapshot.val() === true;
        
        if (connected) {
          console.log('  ✅ Connected to Firebase Realtime Database!');
          console.log();
          
          // Step 4: Test write operation
          console.log('Step 4: Testing write operation...');
          const testRef = ref(database, 'system/connectionVerification');
          set(testRef, {
            timestamp: new Date().toISOString(),
            test: 'Connection verification successful',
            status: 'ok'
          }).then(() => {
            console.log('  ✅ Write test successful');
            console.log();
            console.log('═══════════════════════════════════════════════════════');
            console.log('✅ ALL CHECKS PASSED');
            console.log('Firebase Realtime Database is properly configured!');
            console.log('═══════════════════════════════════════════════════════');
            resolve(true);
          }).catch((error) => {
            console.log('  ❌ Write test failed:', error.message);
            console.log('  💡 Check Firebase Security Rules');
            console.log();
            console.log('═══════════════════════════════════════════════════════');
            console.log('⚠️  CONNECTION VERIFIED BUT WRITE ACCESS DENIED');
            console.log('Database is reachable but security rules may need updating');
            console.log('═══════════════════════════════════════════════════════');
            resolve(false);
          });
        } else {
          console.log('  ❌ Not connected to Firebase');
          console.log('  💡 Check internet connection and database URL');
          console.log();
          console.log('═══════════════════════════════════════════════════════');
          console.log('❌ CONNECTION FAILED');
          console.log('═══════════════════════════════════════════════════════');
          resolve(false);
        }
      });
    });

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    console.log();
    console.log('═══════════════════════════════════════════════════════');
    console.log('❌ VERIFICATION FAILED');
    console.log('Error:', error.message);
    console.log('═══════════════════════════════════════════════════════');
    return false;
  }
}

// Run verification and exit with appropriate code
verifyConnection().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
