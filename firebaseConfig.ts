
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

// Check if the config has been filled out.
export const isFirebaseConfigured = firebaseConfig.projectId !== "YOUR_PROJECT_ID" && firebaseConfig.apiKey !== "YOUR_API_KEY";

// Export project ID for use in error messages and diagnostics
export const firebaseProjectId = firebaseConfig.projectId;

let dbInstance = null;

if (isFirebaseConfigured) {
  try {
    // Initialize Firebase only once
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    console.log("Firebase initialized successfully");
    
    // Initialize Realtime Database
    dbInstance = getDatabase(app);
    console.log("Firebase Database instance ready");
  } catch (e) {
    console.error("Error initializing Firebase:", e);
  }
}

// Export the database instance.
export const database = dbInstance;
