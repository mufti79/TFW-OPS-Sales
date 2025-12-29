// ═══════════════════════════════════════════════════════════════════════════
// 🔥 FIREBASE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════
//
// 📋 SIMPLE SETUP (3 steps):
// 1. Go to https://console.firebase.google.com
// 2. Create a project → Enable Realtime Database → Get your config
// 3. Paste your config values below (replace the placeholders)
//
// 💡 TIP: The app works offline without Firebase - Firebase adds sync between devices
//
// ═══════════════════════════════════════════════════════════════════════════

import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator, goOffline, goOnline } from 'firebase/database';

// ═══════════════════════════════════════════════════════════════════════════
// 👇 PASTE YOUR FIREBASE CONFIG HERE
// ═══════════════════════════════════════════════════════════════════════════
// Get this from: Firebase Console → Project Settings → Your apps → Web app config
//
// Replace ONLY the values below (keep the property names as is):

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",                    // Example: "AIzaSyC1234567890abcdefg..."
  authDomain: "YOUR_PROJECT.firebaseapp.com",     // Example: "my-project.firebaseapp.com"
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",  // Example: "https://my-project-default-rtdb.firebaseio.com"
  projectId: "YOUR_PROJECT_ID",                   // Example: "my-project-abc123"
  storageBucket: "YOUR_PROJECT.firebasestorage.app",  // Example: "my-project.firebasestorage.app"
  messagingSenderId: "123456789012",              // Example: "987654321098"
  appId: "1:123456789012:web:abc123def456"       // Example: "1:987654321098:web:a1b2c3d4e5f6"
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION & DETECTION
// ═══════════════════════════════════════════════════════════════════════════

// Check if Firebase has been configured with real values
export const isFirebaseConfigured = (() => {
  // Check for placeholder values
  if (firebaseConfig.projectId === "YOUR_PROJECT_ID" || 
      firebaseConfig.apiKey === "YOUR_API_KEY_HERE" ||
      firebaseConfig.apiKey.includes("YOUR_") ||
      firebaseConfig.projectId.includes("YOUR_")) {
    return false;
  }
  
  // Validate database URL has correct domain suffix
  try {
    const url = new URL(firebaseConfig.databaseURL);
    const hostname = url.hostname;
    // Use endsWith to ensure the domain is a valid Firebase domain
    return hostname.endsWith('.firebaseio.com') || hostname.endsWith('.firebasedatabase.app');
  } catch {
    return false;
  }
})();

// Export project ID and database URL for diagnostics
export const firebaseProjectId = firebaseConfig.projectId;
export const firebaseDatabaseURL = firebaseConfig.databaseURL;

// Validate database URL format
function validateDatabaseURL(url: string | undefined): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: 'Database URL is missing' };
  }
  
  if (url.includes("YOUR_")) {
    return { valid: false, error: 'Database URL contains placeholder text - replace with your actual Firebase database URL' };
  }
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Check for valid Firebase Realtime Database domains
    if (!hostname.endsWith('.firebaseio.com') && !hostname.endsWith('.firebasedatabase.app')) {
      return { 
        valid: false, 
        error: `Invalid domain: ${hostname}. Must end with .firebaseio.com or .firebasedatabase.app` 
      };
    }
    
    // Check if URL uses HTTPS
    if (urlObj.protocol !== 'https:') {
      return { 
        valid: false, 
        error: 'Database URL must use HTTPS' 
      };
    }
    
    return { valid: true };
  } catch (e) {
    return { valid: false, error: `Invalid URL format: ${url}` };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION & ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════

let dbInstance = null;

if (!isFirebaseConfigured) {
  // ═══════════════════════════════════════════════════════════════════════════
  // 📱 OFFLINE MODE - Your app works fine without Firebase!
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📱 Running in OFFLINE MODE");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("✅ Your app is working and will save data locally");
  console.log("ℹ️  Firebase is not configured - data won't sync between devices");
  console.log("");
  console.log("🔧 Want to enable sync? Follow these 3 steps:");
  console.log("");
  console.log("  1. Go to: https://console.firebase.google.com");
  console.log("  2. Create project → Enable Realtime Database → Copy config");
  console.log("  3. Paste your config in firebaseConfig.ts (replace placeholders)");
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
} else {
  // Validate database URL before initializing
  const urlValidation = validateDatabaseURL(firebaseConfig.databaseURL);
  
  if (!urlValidation.valid) {
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ Firebase Configuration Error");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("");
    console.error("Problem:", urlValidation.error);
    console.error("Current database URL:", firebaseConfig.databaseURL);
    console.error("");
    console.error("🔧 How to fix:");
    console.error("");
    console.error("  1. Go to: https://console.firebase.google.com");
    console.error("  2. Select your project:", firebaseConfig.projectId);
    console.error("  3. Click 'Realtime Database' in the left menu");
    console.error("  4. If it says 'Create Database', click it to create one");
    console.error("  5. Copy the database URL (looks like: https://YOUR-PROJECT-default-rtdb.firebaseio.com)");
    console.error("  6. Paste it in firebaseConfig.ts");
    console.error("");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("");
  } else {
    try {
      // Initialize Firebase
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      
      // Initialize Realtime Database with explicit database URL
      if (firebaseConfig.databaseURL) {
        dbInstance = getDatabase(app, firebaseConfig.databaseURL);
      } else {
        dbInstance = getDatabase(app);
      }
      
      // Success!
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🔥 Firebase Connected Successfully!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("");
      console.log("✓ Project:", firebaseConfig.projectId);
      console.log("✓ Database:", firebaseConfig.databaseURL);
      console.log("✓ Real-time sync: ENABLED");
      console.log("");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("");
    } catch (e: any) {
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("❌ Firebase Initialization Failed");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("");
      console.error("Error:", e.message || e);
      console.error("");
      console.error("Common causes:");
      console.error("  • Invalid API key or project ID");
      console.error("  • Firebase project doesn't exist");
      console.error("  • Realtime Database not enabled in Firebase Console");
      console.error("  • Network connection issues");
      console.error("");
      console.error("🔧 How to fix:");
      console.error("");
      console.error("  1. Verify your Firebase project exists: https://console.firebase.google.com");
      console.error("  2. Check that Realtime Database is enabled");
      console.error("  3. Get fresh config from: Project Settings → Your apps → Web");
      console.error("  4. Update firebaseConfig.ts with the new config");
      console.error("");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("");
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

/**
 * Get Firebase Realtime Database connection information
 * @returns Object containing connection status and configuration details
 */
export const getConnectionInfo = (): {
  configured: boolean;
  databaseInitialized: boolean;
  projectId: string;
  databaseURL: string;
} => {
  return {
    configured: isFirebaseConfigured,
    databaseInitialized: database !== null,
    projectId: firebaseProjectId,
    databaseURL: database?.app.options.databaseURL || firebaseConfig.databaseURL || 'Not available'
  };
};
