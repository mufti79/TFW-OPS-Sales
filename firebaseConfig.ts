
// IMPORTANT:
// To get this app working, you need to create your own Firebase project and
// replace the configuration object below with your project's credentials.

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

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
      console.log("Firebase initialized successfully");
      
      // Initialize Realtime Database with proper error handling
      dbInstance = getDatabase(app);
      console.log("Firebase Database instance ready");
      console.log("Database URL:", firebaseConfig.databaseURL);
      
      // Log successful initialization
      console.log("✓ Firebase Realtime Database initialized and ready for connections");
      console.log("");
      console.log("📝 Note: If you see connection errors, it may mean:");
      console.log("   - The Realtime Database hasn't been created in Firebase Console");
      console.log("   - The database URL is incorrect");
      console.log("   - Security rules are blocking access");
      console.log("   - Network/firewall is blocking Firebase");
      console.log("");
      console.log("💡 Run diagnostics in browser console: firebaseDiagnostics.printReport()");
    } catch (e) {
      console.error("❌ Error initializing Firebase:", e);
      console.error("");
      console.error("Common causes:");
      console.error("1. Invalid API key or project ID");
      console.error("2. Firebase project doesn't exist or was deleted");
      console.error("3. Network connection issues");
      console.error("4. Realtime Database not enabled in Firebase Console");
      console.error("");
      console.error("🔧 Please verify:");
      console.error("   - Firebase project exists: https://console.firebase.google.com/project/" + firebaseConfig.projectId);
      console.error("   - Realtime Database is created");
      console.error("   - API key is valid");
      console.error("   - Network connection is working");
    }
  }
}

// Export the database instance.
export const database = dbInstance;
