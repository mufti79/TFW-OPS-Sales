# 🚀 Quick Start - Firebase Setup

The previous Firebase connection has been replaced. Follow these steps to get your app working:

## ⚡ 5-Minute Setup

### 1. Create Firebase Project (2 minutes)
1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name it: `tfw-ops-sales-new` (or any name you prefer)
4. Click through the wizard (disable Google Analytics if you want to speed up)

### 2. Enable Realtime Database (1 minute)
1. In your new project, find **"Realtime Database"** in the left menu
2. Click **"Create Database"**
3. Choose location: **United States** (or closest to you)
4. Security rules: Select **"Start in test mode"** for now
5. Click **"Enable"**

### 3. Get Your Credentials (1 minute)
1. Click the **⚙️ gear icon** → **Project settings**
2. Scroll down to **"Your apps"**
3. Click the **`</>`** (web) icon
4. Give it a nickname: `TFW OPS Sales App`
5. **DON'T** check "Also set up Firebase Hosting"
6. Click **"Register app"**
7. **Copy the firebaseConfig object** (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 4. Update Your Code (1 minute)
1. Open `firebaseConfig.ts` in your code editor
2. Find the `firebaseConfig` object (around line 30)
3. **Replace ONLY the values** (keep the property names):
   ```typescript
   const firebaseConfig = {
     apiKey: "PASTE_YOUR_API_KEY_HERE",
     authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
     databaseURL: "PASTE_YOUR_DATABASE_URL_HERE",
     projectId: "PASTE_YOUR_PROJECT_ID_HERE",
     storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE",
     messagingSenderId: "PASTE_YOUR_SENDER_ID_HERE",
     appId: "PASTE_YOUR_APP_ID_HERE"
   };
   ```
4. **Remove the warning comments** (the lines with ⚠️) if you want
5. **Save the file**

### 5. Test It (30 seconds)
```bash
npm run dev
```

Open http://localhost:5173 and check the console. You should see:
```
✓ Firebase Realtime Database initialized successfully
  📋 Project ID: your-project-id
  🔗 Database URL: https://your-project-default-rtdb.firebaseio.com
  ✅ Ready for real-time data synchronization
```

## ✅ Done!

Your app is now connected to your own Firebase project and ready to use!

## 🔒 Important: Update Security Rules (Do this after testing!)

The test mode rules allow anyone to read/write your database. For production:

1. Go to **Realtime Database** → **Rules** tab
2. Replace with:
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```
3. Click **"Publish"**

## 💡 Tips

- **Same Config for Multiple Apps**: If you have TFW-NEW app, use the same Firebase config in both apps for synchronization
- **Backup**: Keep a copy of your Firebase credentials in a safe place
- **Environment Variables**: For advanced users, consider using `.env` files for credentials

## ❓ Issues?

- **"Firebase not configured"**: You didn't replace the placeholder values
- **"Permission denied"**: Check your security rules in Firebase Console
- **"Database not found"**: Make sure you created the Realtime Database (not Firestore)

For detailed help, see: **FIREBASE_NEW_PROJECT_SETUP.md**
