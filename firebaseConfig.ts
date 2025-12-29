
// ═══════════════════════════════════════════════════════════════════════════
// 🔥 FIREBASE CONFIGURATION - NEW PROJECT SETUP REQUIRED
// ═══════════════════════════════════════════════════════════════════════════
//
// ⚠️  IMPORTANT: The Firebase project has been replaced with a new configuration.
//
// The previous Firebase project (tfw-ops-salesgit-4001335-4685c) was not working
// properly and has been replaced with a new project configuration.
//
// 📋 ACTION REQUIRED:
// 1. Create a new Firebase project in Firebase Console
// 2. Enable Realtime Database in your project
// 3. Copy your project's configuration credentials
// 4. Replace the placeholder values below with your actual credentials
//
// 📖 For detailed setup instructions, see: FIREBASE_NEW_PROJECT_SETUP.md
//
// ═══════════════════════════════════════════════════════════════════════════

import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator, goOffline, goOnline } from 'firebase/database';

// Your web app's Firebase configuration
// NEW Firebase Project Configuration (Updated: December 29, 2024)
// 
// ⚠️  PLACEHOLDER VALUES - REPLACE WITH YOUR ACTUAL FIREBASE CREDENTIALS
// Get these from: Firebase Console > Project Settings > Your apps
//

// Placeholder values that need to be replaced
const PLACEHOLDER_PROJECT_ID = "tfw-ops-sales-new";
const PLACEHOLDER_API_KEY = "AIzaSyDQT8vR5mX3KnH9wL2pJ4fY6tE8qN1xU7s";

const firebaseConfig = {
  apiKey: PLACEHOLDER_API_KEY,           // ⚠️  Replace with your API key
  authDomain: "tfw-ops-sales-new.firebaseapp.com",              // ⚠️  Replace with your auth domain
  databaseURL: "https://tfw-ops-sales-new-default-rtdb.firebaseio.com",  // ⚠️  Replace with your database URL
  projectId: PLACEHOLDER_PROJECT_ID,                               // ⚠️  Replace with your project ID
  storageBucket: "tfw-ops-sales-new.firebasestorage.app",      // ⚠️  Replace with your storage bucket
  messagingSenderId: "123456789012",                            // ⚠️  Replace with your messaging sender ID
  appId: "1:123456789012:web:abc123def456ghi789"               // ⚠️  Replace with your app ID
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
// NOTE: Updated validation for new Firebase project setup
export const isFirebaseConfigured = 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID" && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" &&
  firebaseConfig.projectId !== PLACEHOLDER_PROJECT_ID &&  // Placeholder project ID
  firebaseConfig.apiKey !== PLACEHOLDER_API_KEY;  // Placeholder API key

// Export project ID for use in error messages and diagnostics
export const firebaseProjectId = firebaseConfig.projectId;

let dbInstance = null;

if (!isFirebaseConfigured) {
  // Firebase is not configured - show helpful setup message
  console.error("╔═══════════════════════════════════════════════════════════════════════════╗");
  console.error("║                                                                           ║");
  console.error("║  ⚠️  FIREBASE CONFIGURATION REQUIRED                                      ║");
  console.error("║                                                                           ║");
  console.error("║  The Firebase project has been replaced with a new configuration.        ║");
  console.error("║  Please complete the setup to enable data synchronization.               ║");
  console.error("║                                                                           ║");
  console.error("╚═══════════════════════════════════════════════════════════════════════════╝");
  console.error("");
  console.error("📋 SETUP INSTRUCTIONS:");
  console.error("");
  console.error("1️⃣  Create a new Firebase project:");
  console.error("    → Go to: https://console.firebase.google.com");
  console.error("    → Click 'Add project' or 'Create a project'");
  console.error("");
  console.error("2️⃣  Enable Realtime Database:");
  console.error("    → In your project, click 'Realtime Database'");
  console.error("    → Click 'Create Database'");
  console.error("    → Choose a location and security rules");
  console.error("");
  console.error("3️⃣  Get your configuration:");
  console.error("    → Go to Project Settings (gear icon)");
  console.error("    → Scroll to 'Your apps' and click the web icon");
  console.error("    → Copy the Firebase configuration object");
  console.error("");
  console.error("4️⃣  Update firebaseConfig.ts:");
  console.error("    → Replace the placeholder values with your actual credentials");
  console.error("");
  console.error("📖 For detailed instructions, see: FIREBASE_NEW_PROJECT_SETUP.md");
  console.error("");
  console.error("Current configuration status:");
  console.error("  Project ID:", firebaseConfig.projectId);
  console.error("  Status: ❌ Using placeholder values");
  console.error("");
} else if (isFirebaseConfigured) {
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
      
      // Initialize Realtime Database with explicit database URL option
      // This ensures the database URL from firebaseConfig is used
      if (firebaseConfig.databaseURL) {
        dbInstance = getDatabase(app, firebaseConfig.databaseURL);
      } else {
        dbInstance = getDatabase(app);
      }
      
      // Log successful initialization with details
      console.log("✓ Firebase Realtime Database initialized successfully");
      console.log("  📋 Project ID:", firebaseConfig.projectId);
      console.log("  🔗 Database URL:", firebaseConfig.databaseURL);
      console.log("  🔥 Firebase SDK version: 12.6.0");
      console.log("  ✅ Ready for real-time data synchronization");
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
