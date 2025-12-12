
// IMPORTANT:
// To get this app working, you need to create your own Firebase project and
// replace the configuration object below with your project's credentials.

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqOf6utAgmO-NXqbPTnBO3BdD7yCUBbW8",
  authDomain: "toggifunworld-app.firebaseapp.com",
  databaseURL: "https://toggifunworld-app-default-rtdb.firebaseio.com",
  projectId: "toggifunworld-app",
  storageBucket: "toggifunworld-app.firebasestorage.app",
  messagingSenderId: "718439883778",
  appId: "1:718439883778:web:6f3ad4977156ab37e7f31b"
};

// Check if the config has been filled out.
export const isFirebaseConfigured = firebaseConfig.projectId !== "YOUR_PROJECT_ID" && firebaseConfig.apiKey !== "YOUR_API_KEY";

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
