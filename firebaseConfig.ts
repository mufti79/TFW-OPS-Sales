
// IMPORTANT:
// To get this app working, you need to create your own Firebase project and
// replace the configuration object below with your project's credentials.

import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator, goOffline, goOnline } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA9kTKrhiXLVnri6rczHb26Ghl7l4uxJhE",
  authDomain: "tfw-ops-salesgit-4001335-4685c.firebaseapp.com",
  databaseURL: "https://tfw-ops-salesgit-4001335-4685c-default-rtdb.firebaseio.com",
  projectId: "tfw-ops-salesgit-4001335-4685c",
  storageBucket: "tfw-ops-salesgit-4001335-4685c.firebasestorage.app",
  messagingSenderId: "890191705352",
  appId: "1:890191705352:web:9251f92d340a3a977ce8bd"
};

// Validate database URL format
function validateDatabaseURL(url: string | undefined): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: 'Database URL is missing' };
  }
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Check for valid Firebase Realtime Database domains
    if (!hostname.endsWith('.firebaseio.com') && !hostname.endsWith('.firebasedatabase.app')) {
      return { 
        valid: false, 
        error: `Invalid Firebase database domain: ${hostname}. Must end with .firebaseio.com or .firebasedatabase.app` 
      };
    }
    
    // Check if URL uses HTTPS
    if (urlObj.protocol !== 'https:') {
      return { 
        valid: false, 
        error: 'Database URL must use HTTPS protocol' 
      };
    }
    
    return { valid: true };
  } catch (e) {
    return { valid: false, error: `Malformed database URL: ${url}` };
  }
}

// Check if the config has been filled out.
export const isFirebaseConfigured = firebaseConfig.projectId !== "YOUR_PROJECT_ID" && firebaseConfig.apiKey !== "YOUR_API_KEY";

// Export project ID for use in error messages and diagnostics
export const firebaseProjectId = firebaseConfig.projectId;

let dbInstance = null;

if (isFirebaseConfigured) {
  // Validate database URL before initializing
  const urlValidation = validateDatabaseURL(firebaseConfig.databaseURL);
  
  if (!urlValidation.valid) {
    console.error("❌ Firebase database URL validation failed:", urlValidation.error);
    console.error("Current database URL:", firebaseConfig.databaseURL);
    console.error("");
    console.error("🔧 How to fix:");
    console.error("1. Go to Firebase Console: https://console.firebase.google.com");
    console.error("2. Select your project:", firebaseConfig.projectId);
    console.error("3. Navigate to 'Realtime Database' in the left menu");
    console.error("4. If you see 'Create Database', click it to create a new Realtime Database");
    console.error("5. Once created, copy the database URL (it should be in format: https://PROJECT-ID-default-rtdb.firebaseio.com)");
    console.error("6. Update the databaseURL in firebaseConfig.ts with the correct URL");
    console.error("");
  } else {
    try {
      // Initialize Firebase only once
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      
      // Initialize Realtime Database with proper error handling
      dbInstance = getDatabase(app);
      console.log("✓ Firebase initialized");
    } catch (e) {
      console.error("❌ Error initializing Firebase:", e);
      console.error("Please verify Firebase project exists and credentials are correct");
    }
  }
}

// Export the database instance.
export const database = dbInstance;

// Timing constants for force reconnection
const OFFLINE_WAIT_MS = 1000;  // Time to wait after going offline
const ONLINE_WAIT_MS = 2000;   // Time to wait after going online

/**
 * Force reconnection to Firebase Realtime Database
 * This can help when the connection gets stuck or fails to establish
 * @returns Promise that resolves when reconnection is attempted
 */
export const forceReconnect = async (): Promise<{ success: boolean; message: string }> => {
  if (!database || !isFirebaseConfigured) {
    return { 
      success: false, 
      message: 'Firebase is not configured or database instance is not available' 
    };
  }

  try {
    console.log('🔄 Forcing Firebase reconnection...');
    
    // First, go offline to close existing connections
    goOffline(database);
    console.log('📴 Disconnected from Firebase');
    
    // Wait a moment for the disconnection to complete
    await new Promise(resolve => setTimeout(resolve, OFFLINE_WAIT_MS));
    
    // Then go back online to force a fresh connection
    goOnline(database);
    console.log('📶 Reconnecting to Firebase...');
    
    // Wait a moment for the connection to establish
    await new Promise(resolve => setTimeout(resolve, ONLINE_WAIT_MS));
    
    return { 
      success: true, 
      message: 'Reconnection attempt completed. Check connection status in a moment.' 
    };
  } catch (error: any) {
    console.error('❌ Error during forced reconnection:', error);
    return { 
      success: false, 
      message: `Reconnection failed: ${error.message}` 
    };
  }
};
