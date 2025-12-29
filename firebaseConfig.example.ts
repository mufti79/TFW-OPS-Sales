// ═══════════════════════════════════════════════════════════════════════════
// 🔥 FIREBASE CONFIGURATION EXAMPLE
// ═══════════════════════════════════════════════════════════════════════════
//
// This is an EXAMPLE configuration file showing the structure of a real
// Firebase configuration. DO NOT use these values directly.
//
// 📋 TO SET UP FIREBASE:
//
// 1. Create a Firebase project at https://console.firebase.google.com
// 2. Enable Realtime Database in your project
// 3. Get your configuration from Project Settings > Your apps
// 4. Update firebaseConfig.ts with your actual credentials
//
// ═══════════════════════════════════════════════════════════════════════════

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Example Firebase configuration structure
// Replace these values with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefghijklmnopqrstuvw",           // Your actual API key
  authDomain: "your-project-id.firebaseapp.com",                // Your auth domain
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",  // Your database URL
  projectId: "your-project-id",                                 // Your project ID
  storageBucket: "your-project-id.appspot.com",                // Your storage bucket
  messagingSenderId: "123456789012",                            // Your messaging sender ID
  appId: "1:123456789012:web:abc123def456ghi789"               // Your app ID
};

// Check if configuration has been updated from placeholder values
export const isFirebaseConfigured = 
  firebaseConfig.projectId !== "your-project-id" && 
  firebaseConfig.apiKey !== "AIzaSyC1234567890abcdefghijklmnopqrstuvw";

// Export project ID for diagnostics
export const firebaseProjectId = firebaseConfig.projectId;

// Initialize Firebase
let dbInstance = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    // Initialize Realtime Database with explicit database URL option
    if (firebaseConfig.databaseURL) {
      dbInstance = getDatabase(app, firebaseConfig.databaseURL);
    } else {
      dbInstance = getDatabase(app);
    }
    
    console.log("✓ Firebase Realtime Database initialized successfully");
  } catch (e) {
    console.error("❌ Error initializing Firebase:", e);
  }
}

export const database = dbInstance;
