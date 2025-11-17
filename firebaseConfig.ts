// @ts-nocheck

// IMPORTANT:
// 1. Create a Firebase project at https://console.firebase.google.com/
// 2. In your project, go to Project Settings > General, scroll down to "Your apps", and create a new Web App.
// 3. Copy the `firebaseConfig` object provided during setup and paste it here.
// 4. In your Firebase project, go to Build > Realtime Database. Create a database.
// 5. In the Realtime Database, go to the "Rules" tab and set them for development access:
// {
//   "rules": {
//     ".read": "true",
//     ".write": "true"
//   }
// }
// WARNING: These rules are for development only and make your database publicly accessible. For a production app, you would need to set up proper security rules.

const firebaseConfig = {
  apiKey: "AIzaSyANLnR0N_cfJcJkK-cskrnRyL3yP1AOYAI",
  authDomain: "database-tfw.firebaseapp.com",
  databaseURL: "https://database-tfw-default-rtdb.firebaseio.com",
  projectId: "database-tfw",
  storageBucket: "database-tfw.appspot.com",
  messagingSenderId: "157085523272",
  appId: "1:157085523272:web:54d88130a207861096a77d",
  measurementId: "G-RN6VW2TT53"
};

// Check if the configuration has been filled out
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";


// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const database = firebase.database();