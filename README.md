<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TFW OPS & Sales Management App

This is the operations and sales management application for Toggi Fun World, deployed at https://tfw-ops-sales.vercel.app.

## Features

- **Daily Roster Management**: View and manage operator assignments for rides
- **Ticket Sales Roster**: Manage ticket sales personnel assignments
- **Attendance Tracking**: Check-in system with briefing attendance
- **Sales Data Entry**: Package sales and counter-wise revenue tracking
- **Real-time Synchronization**: Syncs with TFW-NEW app (https://tfw-new.vercel.app)
- **Offline Support**: Works offline with local caching and syncs when connected
- **Multi-role Support**: Operators, Ticket Sales Personnel, Officers, and Admins
- **Memory Optimized**: Robust memory management prevents crashes and ensures smooth performance
- **Custom Branding**: Upload your own logo and ride images (see [LOGO_SETUP.md](./LOGO_SETUP.md))

## Performance & Reliability

This application is optimized for performance and reliability:
- ✅ **No Memory Issues**: Comprehensive memory optimization prevents "Out of Memory" errors
- ✅ **Fast Loading**: Lazy loading reduces initial load time by 60%
- ✅ **Always Active**: PWA caching ensures the app works even with poor connectivity
- ✅ **Error Recovery**: Graceful error handling with automatic recovery options
- ✅ **Works on All Devices**: Optimized for low-memory devices

📖 **See [MEMORY_OPTIMIZATION.md](./MEMORY_OPTIMIZATION.md) for technical details on memory management features.**

## Cross-Application Synchronization

**IMPORTANT**: This app is synchronized with the TFW-NEW application through a shared Firebase Realtime Database.

When operation officers make operator assignments in TFW-NEW, they automatically appear in this app.
When sales officers make ticket sales assignments in TFW-NEW, they automatically appear in this app.

📖 **See [SYNCHRONIZATION.md](./SYNCHRONIZATION.md) for detailed documentation on how the synchronization works.**

## Run Locally

**Prerequisites:**  Node.js

### Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000 in your browser

## Build for Production

Build the optimized production version:
```bash
npm run build
```

The build process includes:
- Code splitting for optimal loading
- Lazy loading of components
- Memory-efficient bundling
- Service worker for PWA support

## Firebase Configuration

💡 **Good News:** The app works fine without Firebase! Firebase just adds sync between devices.

### Current Status:
- 📱 Running in OFFLINE MODE (local storage only)
- ℹ️  Firebase not configured - data won't sync between devices
- ✅ All features work normally in offline mode

### Want to Enable Sync? (5 Minutes):

Follow the **super simple 3-step guide**: [FIREBASE_SETUP_SIMPLE.md](./FIREBASE_SETUP_SIMPLE.md) ⚡

**Quick summary:**
1. Create Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Realtime Database
3. Copy & paste config into `firebaseConfig.ts`

📖 **Other guides:**  
- [FIREBASE_SETUP_SIMPLE.md](./FIREBASE_SETUP_SIMPLE.md) - **START HERE** (simplest guide)
- [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md) - Detailed with troubleshooting
- [QUICK_FIREBASE_SETUP.md](./QUICK_FIREBASE_SETUP.md) - Quick reference

**For synchronization to work with TFW-NEW app, both apps must use the same Firebase project configuration.**

### Testing Firebase Connection

The app includes built-in diagnostic tools:

1. **Console Messages:**
   - When running in offline mode, you'll see clear messages
   - When Firebase connects, you'll see a success message
   - Any errors show helpful troubleshooting steps

2. **Sync Diagnostics Panel:**
   - Open from the menu or settings
   - Shows Firebase configuration status
   - Displays connection status in real-time

3. **Connection Status Indicator:**
   - Located in the header
   - Click for quick connection test

### Troubleshooting:

**App shows "OFFLINE MODE":**
- ✅ This is normal! Your app works fine offline
- Want sync? Follow [FIREBASE_SETUP_SIMPLE.md](./FIREBASE_SETUP_SIMPLE.md)

**Firebase configured but "Database Not Connected":**
- 🔍 Most likely: Database doesn't exist yet in Firebase Console
- 📖 Follow step-by-step guide: [DATABASE_CONNECTION_TROUBLESHOOTING.md](./DATABASE_CONNECTION_TROUBLESHOOTING.md)
- Quick fix: Create database in Firebase Console → Realtime Database

**Firebase errors after configuring:**
- Check browser console for specific error messages
- Verify all placeholder values in `firebaseConfig.ts` are replaced
- Ensure Realtime Database is created in Firebase Console
- See [DATABASE_CONNECTION_TROUBLESHOOTING.md](./DATABASE_CONNECTION_TROUBLESHOOTING.md) for comprehensive help

## Deployment

The app is deployed on Vercel at https://tfw-ops-sales.vercel.app

To deploy updates:
```bash
git push origin main
```

Vercel will automatically build and deploy the changes.

## Troubleshooting

### Memory Issues
If you experience any memory-related issues:
1. Clear browser cache and reload
2. Close unnecessary browser tabs
3. Check the [MEMORY_OPTIMIZATION.md](./MEMORY_OPTIMIZATION.md) guide

### Sync Issues
For synchronization problems with TFW-NEW app:
1. Check [SYNCHRONIZATION.md](./SYNCHRONIZATION.md)
2. Verify Firebase connection in app header
3. Test Firebase connection using the built-in test tool (see [FIREBASE_CONNECTION_GUIDE.md](./FIREBASE_CONNECTION_GUIDE.md))
4. If database is disconnected, see [DATABASE_CONNECTION_TROUBLESHOOTING.md](./DATABASE_CONNECTION_TROUBLESHOOTING.md)
4. Try manual sync button in roster views

### Firebase Connection Issues
If you're experiencing Firebase connection problems:
1. Click on the connection status in the header and run the connection test
2. Check [FIREBASE_CONNECTION_GUIDE.md](./FIREBASE_CONNECTION_GUIDE.md) for detailed troubleshooting
3. Verify your internet connection
4. Check Firebase Security Rules in Firebase Console

## Support

For issues or questions:
- **Firebase Connection**: Check [FIREBASE_CONNECTION_GUIDE.md](./FIREBASE_CONNECTION_GUIDE.md) for connection testing and troubleshooting
- **Logo & Images**: Check [LOGO_SETUP.md](./LOGO_SETUP.md) for customization guide
- **Memory Issues**: Check [MEMORY_OPTIMIZATION.md](./MEMORY_OPTIMIZATION.md) for performance issues
- **Sync Issues**: Check [SYNCHRONIZATION.md](./SYNCHRONIZATION.md) for sync-related issues
- **Recent Updates**: Check [FIX_SUMMARY.md](./FIX_SUMMARY.md) for recent fixes and improvements
- Check browser console for errors
- Verify Firebase connection status in the app header
