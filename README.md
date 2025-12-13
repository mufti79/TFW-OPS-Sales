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

## Cross-Application Synchronization

**IMPORTANT**: This app is synchronized with the TFW-NEW application through a shared Firebase Realtime Database.

When operation officers make operator assignments in TFW-NEW, they automatically appear in this app.
When sales officers make ticket sales assignments in TFW-NEW, they automatically appear in this app.

📖 **See [SYNCHRONIZATION.md](./SYNCHRONIZATION.md) for detailed documentation on how the synchronization works.**

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the app:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

## Firebase Configuration

This app uses Firebase Realtime Database for data synchronization. The Firebase configuration is in `firebaseConfig.ts`.

**For synchronization to work with TFW-NEW app, both apps must use the same Firebase project configuration.**

## Deployment

The app is deployed on Vercel at https://tfw-ops-sales.vercel.app

To deploy updates:
```bash
git push origin main
```

Vercel will automatically build and deploy the changes.

## Support

For issues or questions:
- Check [SYNCHRONIZATION.md](./SYNCHRONIZATION.md) for sync-related issues
- Check browser console for errors
- Verify Firebase connection status in the app header
