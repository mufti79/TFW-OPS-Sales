
// IMPORTANT:
// To get this app working, you need to create your own Firebase project and
// replace the configuration object below with your project's credentials.

// Explicitly define firebase on window to satisfy TypeScript
declare global {
  interface Window {
    firebase: any;
  }
}

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
  if (typeof window !== 'undefined' && window.firebase) {
    if (!window.firebase.apps.length) {
      try {
        window.firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully");
      } catch (e) {
        console.error("Error initializing Firebase:", e);
      }
    }
    // Initialize Realtime Database
    try {
      dbInstance = window.firebase.database();
      // Optional: Explicitly request to go online to trigger connection attempts immediately
      dbInstance.goOnline();
    } catch (e) {
      console.error("Error getting Firebase Database instance. Ensure firebase-database script is loaded.", e);
    }
  } else {
    // Only log error if in browser environment
    if (typeof window !== 'undefined') {
        console.error("Firebase SDK not found on window object. Check index.html script tags.");
    }
  }
}

// Export the database instance.
export const database = dbInstance;
