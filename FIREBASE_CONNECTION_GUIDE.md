# Firebase Connection Guide

This guide explains how to verify and test your Firebase Realtime Database connection in the TFW OPS & Sales Management App.

## Overview

The application uses Firebase Realtime Database for data synchronization between devices and with the TFW-NEW app. This guide will help you verify that your Firebase connection is properly configured and working.

## Quick Connection Test

### From the Application

1. **Log into the app** with any role
2. **Look at the header** - you'll see a connection status indicator (green = connected, yellow = connecting, orange = offline)
3. **Hover over the connection status** to see more details
4. **Click "Test Firebase Connection"** button in the tooltip to run a comprehensive test

### Connection Status Indicators

- 🟢 **Green (Online: Synced)**: Connected and syncing in real-time
- 🟡 **Yellow (Connecting...)**: Attempting to establish connection
- 🟠 **Orange (Offline: Saved Locally)**: Working offline, data saved locally
- 🔴 **Red (Error: Database Blocked)**: Cannot connect, check browser settings

## Firebase Connection Test Modal

The Firebase Connection Test modal provides detailed diagnostics:

### What It Tests

1. **Configuration Status**: Verifies Firebase is configured in `firebaseConfig.ts`
2. **Connection Status**: Checks if connected to Firebase servers
3. **Read Permission**: Tests if the app can read from the database
4. **Write Permission**: Tests if the app can write to the database

### How to Access

1. Hover over the connection status indicator in the header
2. Click the "🔍 Test Firebase Connection" button
3. Or access it directly from the admin menu

### Understanding Test Results

#### ✓ All Tests Passed
If all tests pass, you'll see:
- Configuration: ✓ Configured
- Connection: ✓ Connected
- Read Permission: ✓ Allowed
- Write Permission: ✓ Allowed

This means your Firebase setup is working correctly!

#### ⚠️ Test Failures

**Configuration Failed**
- **Issue**: Firebase credentials are not configured
- **Solution**: Update `firebaseConfig.ts` with your Firebase project credentials

**Connection Failed**
- **Issue**: Cannot reach Firebase servers
- **Solution**: Check your internet connection

**Read Permission Denied**
- **Issue**: Firebase Security Rules don't allow reading
- **Solution**: Update Firebase Security Rules in Firebase Console

**Write Permission Denied**
- **Issue**: Firebase Security Rules don't allow writing
- **Solution**: Update Firebase Security Rules in Firebase Console

## Firebase Configuration

### Current Configuration

The app is configured to use the following Firebase project:
- **Project ID**: `tfw-ops-salesgit-4001335-4685c`
- **Database URL**: `https://tfw-ops-salesgit-4001335-4685c-default-rtdb.firebaseio.com`

### Verifying Configuration

1. Open `firebaseConfig.ts` in the project root
2. Verify these fields are filled in:
   - `apiKey`
   - `authDomain`
   - `databaseURL`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### For Synchronization with TFW-NEW

Both apps (TFW-OPS-Sales and TFW-NEW) **must use the same Firebase project** for synchronization to work. The configuration is already set up correctly in both repositories.

## Troubleshooting

### Cannot Connect to Firebase

1. **Check Internet Connection**: Ensure you have a stable internet connection
2. **Check Browser Console**: Press F12 and look for Firebase-related errors
3. **Run Connection Test**: Use the Firebase Connection Test modal
4. **Clear Cache**: Try clearing browser cache and reloading

### Read/Write Permissions Denied

1. **Check Firebase Security Rules**:
   - Go to Firebase Console: https://console.firebase.google.com
   - Select your project
   - Navigate to "Realtime Database" → "Rules"
   - Ensure rules allow read/write for your use case

2. **Example Security Rules** (for testing):
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
   
   **Note**: These open rules are for testing only. Use proper authentication-based rules in production.

### Connection Status Shows Offline

1. **Refresh the page** - Sometimes the connection indicator needs a refresh
2. **Check Firebase Console** - Verify your Firebase project is active
3. **Run Connection Test** - Use the test modal to get detailed diagnostics
4. **Check Browser Settings** - Some browser extensions may block Firebase

## Monitoring Real-Time Connection

The connection status indicator in the header provides real-time monitoring:

- The indicator updates automatically when connection status changes
- Green pulsing dot = actively syncing
- Hover over it anytime to see more details
- Click "Test Firebase Connection" for comprehensive diagnostics

## Best Practices

1. **Regular Testing**: Run the connection test if you experience sync issues
2. **Monitor Status**: Keep an eye on the connection indicator
3. **Check After Updates**: Test connection after app updates or configuration changes
4. **Network Issues**: If working on poor network, expect occasional disconnections

## Support

If you continue to experience connection issues after following this guide:

1. Run the Firebase Connection Test and note any errors
2. Check the browser console (F12) for detailed error messages
3. Verify your Firebase project configuration
4. Ensure both TFW-OPS-Sales and TFW-NEW apps use the same Firebase project
5. Check Firebase Console for any service disruptions

## Related Documentation

- [SYNCHRONIZATION.md](./SYNCHRONIZATION.md) - Cross-app synchronization details
- [README.md](./README.md) - General application documentation
- [Firebase Documentation](https://firebase.google.com/docs/database) - Official Firebase Realtime Database docs
