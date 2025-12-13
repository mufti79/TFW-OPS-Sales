# Cross-Application Synchronization

## Overview

This application (**TFW-OPS-Sales**: https://tfw-ops-sales.vercel.app) is synchronized with the **TFW-NEW** application (https://tfw-new.vercel.app) through a shared Firebase Realtime Database.

## How It Works

Both applications connect to the same Firebase project (`toggifunworld-app`), enabling real-time bidirectional synchronization of roster assignments and other operational data.

### Key Features:
- **Real-time Updates**: Changes made in one app are instantly reflected in the other
- **Offline Support**: Both apps cache data locally and sync when connection is restored
- **Bi-directional Sync**: Either app can update data, and both will stay in sync

## Synchronized Data

### 1. Operator Assignments (`data/dailyAssignments` and `data/opsAssignments`)
- **Updated by**: Operation Officers in TFW-NEW app
- **Consumed by**: 
  - Operation Officers in TFW-OPS-Sales app (view/edit)
  - Operators in TFW-OPS-Sales app (view their daily roster)
- **Firebase Paths**: 
  - `data/dailyAssignments` - Primary path used by TFW-OPS-Sales
  - `data/opsAssignments` - Path used by TFW-NEW app
  - **Note**: TFW-OPS-Sales automatically reads from both paths and merges the data for full compatibility
- **Structure**: 
  ```json
  {
    "YYYY-MM-DD": {
      "rideId": [operatorId1, operatorId2, ...]
    }
  }
  ```

### 2. Ticket Sales Assignments (`data/tsAssignments`)
- **Updated by**: Sales Officers in TFW-NEW app
- **Consumed by**: 
  - Sales Officers in TFW-OPS-Sales app (view/edit)
  - Ticket Sales Personnel in TFW-OPS-Sales app (view their daily assignments)
- **Structure**: 
  ```json
  {
    "YYYY-MM-DD": {
      "counterId": [personnelId1, personnelId2, ...]
    }
  }
  ```

### 3. Other Synchronized Data
- **Attendance Records** (`data/attendance`): Check-in status and briefing attendance
- **Configuration** (`config/`): Rides, operators, ticket sales personnel, counters
- **Daily Counts** (`data/dailyCounts`): Ride usage statistics
- **Package Sales** (`data/packageSales`): Sales data from ticket counters

## Firebase Configuration

Both applications must use the same Firebase project configuration for synchronization to work.

The Firebase configuration is stored in `firebaseConfig.ts` in each application. This includes:
- API Key
- Auth Domain
- Database URL
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID

**IMPORTANT**: For synchronization to work, both apps must point to the same Firebase project. The configuration is already set up in both repositories.

**Note**: Firebase API keys are designed to be used in client-side code and are not secret. Access control is enforced through Firebase Security Rules, not by keeping the API key private.

## User Workflow

### For Operation Officers:
1. Log into TFW-NEW app (https://tfw-new.vercel.app)
2. Make operator assignments for rides
3. Changes are automatically synced to TFW-OPS-Sales app
4. Operators can view their roster in TFW-OPS-Sales app immediately

### For Sales Officers:
1. Log into TFW-NEW app (https://tfw-new.vercel.app)
2. Make ticket sales personnel assignments for counters
3. Changes are automatically synced to TFW-OPS-Sales app
4. Ticket sales personnel can view their assignments in TFW-OPS-Sales app immediately

### For Operators/Ticket Sales Personnel:
1. Log into TFW-OPS-Sales app (https://tfw-ops-sales.vercel.app)
2. View their daily roster/assignments
3. Check in for the day
4. Update ride counts or sales data
5. All updates sync back to TFW-NEW app for management visibility

## Connection Status

Both apps display a connection status indicator:
- 🟢 **Connected**: Real-time sync is active
- 🟡 **Connecting**: Attempting to establish connection
- 🔴 **Disconnected**: Offline mode (using cached data)

## Troubleshooting

### Synchronization Not Working?

1. **Check Firebase Configuration**: Ensure both apps use the same Firebase project configuration
2. **Check Internet Connection**: Both apps require internet for real-time sync
3. **Check Browser Console**: Look for Firebase connection errors
4. **Clear Cache**: Try clearing browser cache and refreshing both apps
5. **Check Firebase Console**: Verify data is being written to the database at: https://console.firebase.google.com/project/toggifunworld-app/database

### Common Issues:

- **Delayed Updates**: May occur during poor network conditions. Data will sync when connection improves.
- **Conflicting Changes**: Last write wins. If two officers update the same assignment simultaneously, the most recent change will be preserved.
- **Missing Data**: Ensure both apps are deployed with the latest code and same Firebase configuration.
- **Assignments not appearing from TFW-NEW**: TFW-OPS-Sales now reads from both `data/dailyAssignments` and `data/opsAssignments` paths to ensure compatibility. This allows assignments created in TFW-NEW (which uses `data/opsAssignments`) to appear automatically in TFW-OPS-Sales.

## Development Notes

### Adding New Synchronized Data:

1. Use the `useFirebaseSync` hook in both applications:
   ```typescript
   const { data, setData } = useFirebaseSync<DataType>('data/yourPath', defaultValue);
   ```

2. Ensure the same path and data structure in both apps

3. Test synchronization in both directions

### Testing Synchronization:

1. Open both apps in different browser windows/tabs
2. Make changes in one app
3. Verify changes appear in the other app within 1-2 seconds
4. Test offline scenarios by disabling network in one browser

## Security

- Firebase Security Rules control read/write access to different data paths
- Both apps rely on the same security rules configured in Firebase Console
- Sensitive operations should be logged in the history records for audit trails

## Support

For issues related to synchronization between apps, check:
1. Firebase Console for database activity
2. Browser developer tools for network/console errors
3. Application history logs for recent changes
4. Connection status indicator in both apps
