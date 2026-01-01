# Database Connection Troubleshooting Guide

**Last Updated:** January 1, 2026  
**Purpose:** Help diagnose and fix Firebase Realtime Database connection issues

---

## 🔍 Quick Diagnosis

If you see:
- ✅ Firebase Configured: **YES**
- ❌ Database Connected: **NO**
- ❌ Connection Status: **DISCONNECTED**

This means your Firebase configuration is correct, but the app cannot connect to the database.

---

## 🎯 Most Common Causes & Solutions

### 1. Database Doesn't Exist Yet (80% of cases)

**Symptoms:**
- Firebase is configured
- Connection stays disconnected
- Project ID and Database URL look correct
- No error messages in console

**Why This Happens:**
Firebase projects don't automatically create a Realtime Database. You need to explicitly create it.

**Solution:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `tfw-ops-salesgit-4001335-4685c`
3. Click **"Realtime Database"** in the left sidebar
4. Look for a **"Create Database"** button
   - ✅ If you see it → Click it and follow the steps below
   - ❌ If database already exists → Skip to Solution #2

5. When creating the database:
   - **Choose a location** close to your users (e.g., `us-central1` for USA)
   - **Security rules:** Select **"Start in test mode"**
     - This allows read/write access for testing
     - ⚠️ You'll secure it later
   - Click **"Enable"**

6. Wait 30-60 seconds for the database to be fully created

7. Refresh your app and check the connection status again

**Expected Result:**
- ✅ Database Connected: **YES**
- ✅ Connection Status: **CONNECTED**

---

### 2. Security Rules Blocking Access (15% of cases)

**Symptoms:**
- Firebase is configured
- Database exists
- Connection shows disconnected
- Console shows `PERMISSION_DENIED` errors

**Why This Happens:**
Firebase security rules may be set to deny all read/write access by default.

**Solution:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `tfw-ops-salesgit-4001335-4685c`
3. Navigate to **"Realtime Database"** → **"Rules"** tab
4. Check your current rules. If they look like this:
   ```json
   {
     "rules": {
       ".read": false,
       ".write": false
     }
   }
   ```
   They're blocking all access! ❌

5. **For Testing:** Replace with open rules:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

6. Click **"Publish"** button

7. Wait 30 seconds for rules to propagate globally

8. Refresh your app and test again

⚠️ **IMPORTANT SECURITY NOTE:**
- These open rules allow **anyone** to read/write your database
- **Only use for testing!**
- Before production, update to secure rules (see section below)

**Expected Result:**
- ✅ Database Connected: **YES**
- ✅ Connection Status: **CONNECTED**
- No `PERMISSION_DENIED` errors in console

---

### 3. Internet/Network Issues (3% of cases)

**Symptoms:**
- Firebase is configured
- Database exists
- Other websites work
- App shows disconnected

**Why This Happens:**
- Firewall blocking Firebase domains
- Corporate network restrictions
- VPN interfering with Firebase

**Solution:**

1. **Check if Firebase is reachable:**
   - Open this URL in your browser: `https://[YOUR-PROJECT]-default-rtdb.firebaseio.com/.json`
   - Replace `[YOUR-PROJECT]` with your project ID
   - For you: `https://tfw-ops-salesgit-4001335-4685c-default-rtdb.firebaseio.com/.json`

2. **What you should see:**
   - ✅ JSON data or permission error → Firebase is reachable
   - ❌ "Could not connect" or timeout → Network issue

3. **If blocked, try:**
   - Temporarily disable VPN
   - Try a different network (mobile hotspot)
   - Check firewall allows: `*.firebaseio.com` and `*.googleapis.com`
   - Contact your IT department if on corporate network

---

### 4. Wrong Database URL (1% of cases)

**Symptoms:**
- Everything configured
- Connection fails immediately
- Browser console shows connection errors

**Why This Happens:**
The database URL in `firebaseConfig.ts` doesn't match your actual Firebase database.

**Solution:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Realtime Database**
4. Copy the database URL shown at the top (looks like: `https://YOUR-PROJECT-default-rtdb.firebaseio.com`)

5. Open `firebaseConfig.ts` in your code editor

6. Find this line:
   ```typescript
   databaseURL: "https://tfw-ops-salesgit-4001335-4685c-default-rtdb.firebaseio.com",
   ```

7. Verify it **exactly matches** the URL from Firebase Console

8. If different, update it and save

9. Restart your development server

---

## 📋 Step-by-Step Verification Checklist

Follow these steps in order:

### Step 1: Verify Firebase Configuration ✅

- [x] Firebase Configured shows: **✅**
- [x] Project ID is shown: `tfw-ops-salesgit-4001335-4685c`
- [x] Database URL is shown: `https://tfw-ops-salesgit-4001335-4685c-default-rtdb.firebaseio.com`

**Status:** ✅ Configuration is correct!

### Step 2: Check Database Exists

- [ ] Go to Firebase Console
- [ ] Click on Realtime Database in sidebar
- [ ] Do you see data or an empty database? → Database exists ✅
- [ ] Do you see "Create Database" button? → Database doesn't exist ❌ → Create it!

### Step 3: Check Security Rules

- [ ] In Firebase Console, go to Realtime Database → Rules tab
- [ ] Are rules set to `.read: true` and `.write: true`? → Good for testing ✅
- [ ] Are rules set to `.read: false` and `.write: false`? → Blocking access ❌ → Update rules!

### Step 4: Check Network Connection

- [ ] Open: `https://tfw-ops-salesgit-4001335-4685c-default-rtdb.firebaseio.com/.json`
- [ ] Do you see JSON or permission error? → Network is fine ✅
- [ ] Do you see connection timeout? → Network issue ❌ → Check firewall/VPN

### Step 5: Test Connection

- [ ] Open the app
- [ ] Check Sync Diagnostics (in menu)
- [ ] Database Connected shows: **✅**
- [ ] Connection Status shows: **CONNECTED**

---

## 🔐 Securing Your Database (After Testing)

Once your app is working, **immediately** update security rules:

### Option 1: Public Read, Controlled Write
```json
{
  "rules": {
    ".read": true,
    "data": {
      ".write": true
    },
    "config": {
      ".write": true
    },
    "system": {
      ".write": true
    }
  }
}
```
- Anyone can read data
- Only specific paths allow writes
- Good for internal apps

### Option 2: Fully Authenticated (Recommended)
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```
- Requires Firebase Authentication
- Most secure option
- Requires adding auth to your app

---

## 🛠️ Advanced Troubleshooting

### Check Browser Console for Errors

1. Press **F12** in your browser
2. Click **"Console"** tab
3. Look for Firebase-related errors:
   - `PERMISSION_DENIED` → Fix security rules
   - `NETWORK_ERROR` → Check internet connection
   - `Database not found` → Database doesn't exist
   - `Invalid database URL` → Check database URL in config

### Test Connection Programmatically

Open browser console (F12) and run:
```javascript
// Test if Firebase is loaded
console.log('Firebase configured:', window.firebase ? 'Yes' : 'No');

// Test database connection (if using the app's testing tools)
// This should be available in the app's diagnostics
```

### Force Reconnect

If the app is stuck in "connecting" state:

1. Open the app menu
2. Click **"Firebase Connection Status"** or **"Sync Diagnostics"**
3. Click **"Force Reconnect"** button
4. Wait 5-10 seconds
5. Check if connection status changes

---

## 📞 Still Having Issues?

If you've tried everything above and still can't connect:

### Gather Diagnostic Information

1. Open **Sync Diagnostics** in the app
2. Click **"Copy Report"** button
3. Share this report when asking for help

### Common Issues We Can Help With

- Database rules configuration
- Network/firewall issues
- Configuration errors
- Connection state problems

### What to Include When Asking for Help

1. System Status from Sync Diagnostics:
   - Firebase Configured: ?
   - Database Connected: ?
   - Connection Status: ?

2. What you've tried:
   - Created database? Yes/No
   - Updated security rules? Yes/No
   - Tested network connection? Yes/No

3. Any error messages from browser console

---

## ✅ Success Indicators

You've successfully fixed the issue when you see:

- ✅ **Database Connected:** YES
- ✅ **Connection Status:** CONNECTED
- ✅ **No errors** in browser console
- ✅ **Data syncs** between devices/browsers
- ✅ **Changes persist** after refresh

---

## 📚 Related Documentation

- `FIREBASE_SETUP_GUIDE.md` - Full Firebase setup instructions
- `CROSS_BROWSER_SYNC_FIX.md` - Sync troubleshooting
- `FIREBASE_CONNECTION_GUIDE.md` - Connection details
- Firebase Official Docs: https://firebase.google.com/docs/database

---

*Last updated: January 1, 2026*
