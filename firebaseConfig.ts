// @ts-nocheck
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyANLnR0N_cfJcJkK-cskrnRyL3yP1AOYAI",
  authDomain: "database-tfw.firebaseapp.com",
  projectId: "database-tfw",
  storageBucket: "database-tfw.firebasestorage.app",
  messagingSenderId: "157085523272",
  appId: "1:157085523272:web:c9995bdfb6fe09b596a77d",
  measurementId: "G-731QG6C0S1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


rojectId !== "YOUR_PROJECT_ID";


// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const database = firebase.database();