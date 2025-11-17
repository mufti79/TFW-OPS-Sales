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
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const database = firebase.database();
