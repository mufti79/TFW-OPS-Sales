# Firebase New Project Setup Guide

**Date:** December 29, 2024  
**Status:** 🔄 Configuration Update Required

---

## Overview

The Firebase connection has been replaced with a new Firebase project configuration. This guide will help you complete the setup.

## What Changed

### Old Firebase Project (Not Working)
- **Project ID:** `tfw-ops-salesgit-4001335-4685c`
- **Database URL:** `https://tfw-ops-salesgit-4001335-4685c-default-rtdb.firebaseio.com`
- **Status:** ❌ Not working / Deprecated

### New Firebase Project (Active)
- **Project ID:** `tfw-ops-sales-new`
- **Database URL:** `https://tfw-ops-sales-new-default-rtdb.firebaseio.com`
- **Status:** ✅ Ready for configuration

---

## Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `tfw-ops-sales-new` (or your preferred name)
4. Follow the setup wizard:
   - Google Analytics: Optional (can be disabled)
   - Accept terms and click **"Create project"**

### Step 2: Enable Realtime Database

1. In your Firebase project, click **"Realtime Database"** in the left sidebar
2. Click **"Create Database"**
3. Select database location:
   - Choose a region close to your users (e.g., `us-central1`)
4. Security rules:
   - Start in **"Test mode"** for initial setup (allows read/write access)
   - You can update security rules later for production

### Step 3: Get Your Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **"Your apps"** section
3. Click the **Web icon** (`</>`) to add a web app
4. Register your app:
   - App nickname: `TFW OPS Sales`
   - Firebase Hosting: Not needed (uncheck)
5. Copy the Firebase configuration object that appears

### Step 4: Update firebaseConfig.ts

Replace the configuration in `firebaseConfig.ts` with your actual Firebase credentials:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Important:** The current configuration contains placeholder values. You MUST replace them with your actual Firebase project credentials.

### Step 5: Update Security Rules (Important!)

For production use, update your Firebase Realtime Database security rules:

1. Go to **Realtime Database** > **Rules** tab in Firebase Console
2. Replace the rules with:

```json
{
  "rules": {
    ".read": "auth != null || true",
    ".write": "auth != null || true"
  }
}
```

**Note:** The rules above allow public read/write access. For better security, implement proper authentication and update rules accordingly.

### Step 6: Test the Connection

After updating the configuration, test the connection:

```bash
# Run the verification script
node verify-firebase-connection.js

# Or start the dev server
npm run dev
```

Expected output:
```
✓ Firebase Realtime Database initialized successfully
  📋 Project ID: your-project-id
  🔗 Database URL: https://your-project-id-default-rtdb.firebaseio.com
  🔥 Firebase SDK version: 12.6.0
  ✅ Ready for real-time data synchronization
```

---

## Files Updated

The following files have been updated with the new Firebase configuration:

1. ✅ **firebaseConfig.ts** - Main Firebase configuration
2. ✅ **verify-firebase-connection.js** - Connection verification script

---

## Database Structure

Your new Firebase Realtime Database should have the following structure:

```
/
├── attendance/
│   └── {date}/
│       └── {operatorId}/
├── packageSales/
│   └── {date}/
│       └── {counterId}/
├── operators/
│   └── {operatorId}/
├── assignments/
│   └── {date}/
│       └── {rideId}/
├── ticketSales/
│   └── {date}/
├── system/
│   └── connectionVerification/
```

The structure will be automatically created as data is added through the application.

---

## Troubleshooting

### Error: "Firebase not configured"
- Make sure you've replaced the placeholder values in `firebaseConfig.ts` with your actual credentials

### Error: "Permission denied"
- Check your Firebase Security Rules
- Ensure the database URL is correct
- Verify your project has Realtime Database enabled

### Connection timeout
- Check your internet connection
- Verify the database URL format: `https://PROJECT-ID-default-rtdb.firebaseio.com`
- Ensure the Realtime Database is created in Firebase Console

### "Invalid API key"
- Double-check that you copied the correct API key from Firebase Console
- The API key should start with "AIza"

---

## Important Notes

1. **Placeholder Configuration:** The current configuration uses placeholder values. Replace them with real credentials from your Firebase project.

2. **Security:** The initial setup uses permissive security rules for testing. Update them for production.

3. **Data Migration:** If you have data in the old Firebase project, you'll need to migrate it manually:
   - Export data from old project (JSON format)
   - Import data to new project using Firebase Console

4. **Synchronization:** If this app syncs with other apps (e.g., TFW-NEW), ensure they all use the same Firebase project configuration.

5. **Environment Variables:** Consider using environment variables for sensitive credentials in production.

---

## Next Steps

- [ ] Create new Firebase project
- [ ] Enable Realtime Database
- [ ] Copy configuration credentials
- [ ] Update firebaseConfig.ts with real credentials
- [ ] Test connection using verify-firebase-connection.js
- [ ] Update security rules for production
- [ ] Migrate data from old project (if needed)
- [ ] Deploy and verify production environment

---

## Support

For issues or questions:
1. Check [Firebase Documentation](https://firebase.google.com/docs/database)
2. Review [FIREBASE_CONNECTION_GUIDE.md](./FIREBASE_CONNECTION_GUIDE.md)
3. Test connection using the built-in diagnostics tool in the app

---

**Last Updated:** December 29, 2024
