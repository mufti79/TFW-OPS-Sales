// @ts-nocheck
// This comment is to suppress TypeScript errors in a file that uses a global `firebase` object.

// IMPORTANT:
// To get this app working, you need to create your own Firebase project and
// replace the configuration object below with your project's credentials.
// 1. Go to https://console.firebase.google.com/ and create a new project.
// 2. In your project, create a new Web App.
// 3. Copy the firebaseConfig object provided by Firebase.
// 4. Paste it here, replacing the placeholder object.
// 5. In your Firebase project, go to "Realtime Database" and create one.
//    - Make sure to set the security rules to allow read/write for development:
//      {
//        "rules": {
//          ".read": "true",
//          ".write": "true"
//        }
//      }

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAqOf6utAgmO-NXqbPTnBO3BdD7yCUBbW8",
  authDomain: "toggifunworld-app.firebaseapp.com",
  projectId: "toggifunworld-app",
  storageBucket: "toggifunworld-app.firebasestorage.app",
  messagingSenderId: "718439883778",
  appId: "1:718439883778:web:6f3ad4977156ab37e7f31b",
  // Realtime Database URL (ensure it matches your Firebase console value)
  databaseURL: "https://toggifunworld-app-default-rtdb.firebaseio.com"
};

// Check if the config has been filled out. This logic is used in App.tsx
// to show a configuration help screen.
export const isFirebaseConfigured =
  !!firebaseConfig.projectId &&
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.databaseURL;

// Initialize Firebase only if it's configured and not already initialized.
// It uses the global `firebase` object from the script tags in index.html.
// Use a try-catch to handle cases where the firebase global might not be loaded yet
let database: any = null;

try {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded yet. This may cause initialization issues.');
  } else if (isFirebaseConfigured) {
    if (!firebase.apps.length) {
      console.log('Initializing Firebase...');
      firebase.initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    } else {
      console.log('Firebase already initialized');
    }
    database = firebase.database();
  } else {
    console.warn('Firebase not configured - running in offline mode');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  database = null;
}

export { database };
