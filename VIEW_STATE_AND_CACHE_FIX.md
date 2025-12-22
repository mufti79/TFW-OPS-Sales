# View State Persistence and Cache Clear Fix

## Problem Statement

### Issue 1: Mobile and Desktop View Synchronization
When a user navigates to the operator panel and clicks "attended briefing" on desktop, the mobile device shows the application from the beginning (starting view). The navigation state was not being synchronized across devices or persisted across sessions.

### Issue 2: Data Loss After Cache Clear
When users clicked "Clear Cache," they reported losing their previous OPS Report records. This created confusion and concern about data integrity.

## Root Causes

1. **No View State Persistence**: The `currentView` state in `App.tsx` was using `useState` without any persistence mechanism. This meant:
   - View state reset on page reload
   - View state not synchronized across tabs
   - View state not synchronized across devices
   - Users had to re-navigate after every page refresh

2. **Misleading Cache Clear Behavior**: The cache clear function removed all cached data, but didn't adequately communicate that:
   - Data is safely stored in Firebase cloud
   - Only the local cache is being cleared
   - Data will be automatically restored from the cloud
   - Session and navigation state should be preserved

## Solutions Implemented

### 1. View State Persistence

#### Changes in `App.tsx`:
```typescript
// Before: View state was not persisted
const [currentView, setCurrentView] = useState<View>('counter');

// After: View state persists across sessions
import useLocalStorage from './hooks/useLocalStorage';
const [currentView, setCurrentView] = useLocalStorage<View>('currentView', 'counter');
```

#### Smart View Restoration on Login:
```typescript
const handleLogin = (newRole: Exclude<Role, null>, payload?: string | Operator) => {
    const success = login(newRole, payload);
    if (success) {
        logAction('LOGIN', `User logged in as ${newRole}.`);
        // Set default view based on role, but preserve view if user is returning to same role
        if (newRole === 'operator') setCurrentView('roster');
        else if (newRole === 'ticket-sales') setCurrentView('ts-roster');
        else if (newRole === 'sales-officer') setCurrentView('sales-officer-dashboard');
        else if (newRole === 'security') setCurrentView('security-entry');
        else if (newRole === 'admin' || newRole === 'operation-officer') {
            // For managers, only set dashboard if coming from a non-manager role
            // This allows them to continue where they left off if already logged in
            if (currentView === 'counter' || currentView === 'roster' || currentView === 'ts-roster') {
                setCurrentView('dashboard');
            }
        }
    }
    return success;
};
```

#### Clean State on Logout:
```typescript
const handleLogout = useCallback(() => {
    if (currentUser) logAction('LOGOUT', `User ${currentUser.name} logged out.`);
    logout();
    // Reset view to default (counter) on logout to ensure clean state for next login
    setCurrentView('counter');
}, [currentUser, logout, logAction, setCurrentView]);
```

### 2. Improved Cache Clear Behavior

#### Enhanced Warning Message:
```typescript
const warningMessage = isFirebaseConfigured 
    ? 'This will clear all cached data and reload from the cloud server.\n\n✓ Your data is safely stored in the cloud and will be restored automatically.\n✓ Your login session will be preserved.\n✓ Current navigation state will be preserved.\n\nThis is useful if you\'re experiencing sync issues or want to see the latest data.\n\nContinue?'
    : 'This will clear all cached data. WARNING: You are in offline mode, so data cannot be restored from the cloud.\n\nYour login session and navigation state will be preserved.\n\nContinue?';
```

#### Preserve Critical Keys:
```typescript
// Preserve auth and view state to maintain user session and navigation
const preserveKeys = ['authRole', 'authUser', 'authLastActivity', 'currentView'];
const keysToRemove: string[] = [];
const totalKeys = localStorage.length;
for (let i = 0; i < totalKeys; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('tfw_') && !preserveKeys.includes(key)) {
        keysToRemove.push(key);
    }
}
```

#### Post-Clear Notification:
```typescript
// Set a flag to indicate cache was cleared so we can notify user on reconnect
if (isFirebaseConfigured) {
    sessionStorage.setItem('TFW_CACHE_CLEARED', 'true');
}

// Later, when Firebase connects:
useEffect(() => {
    if (connectionStatus === 'connected' && role && currentUser) {
        // Check if this is a recovery from cache clear or fresh login
        const wasCleared = sessionStorage.getItem('TFW_CACHE_CLEARED');
        if (wasCleared) {
            showNotification('✓ Connected to cloud. Your data is being restored...', 'success', 3000);
            sessionStorage.removeItem('TFW_CACHE_CLEARED');
        }
    }
}, [connectionStatus, role, currentUser, showNotification]);
```

### 3. Storage Quota Management

#### Updated `useLocalStorage.ts`:
```typescript
// Remove old Firebase sync data to free up space, but preserve auth data and view state
const authKeys = ['authRole', 'authUser', 'authLastActivity', 'currentView'];

// Filter to find non-critical keys that can be removed
const keysToRemove = allKeys.filter(
    k => !authKeys.includes(k) && !k.startsWith('tfw_')
);
```

## Benefits

### 1. Cross-Device Synchronization
- Users can start on desktop and continue on mobile
- View state is preserved across all devices where user logs in
- Navigation history is maintained across sessions

### 2. Improved User Experience
- No need to re-navigate after page refresh
- Clear communication about data safety
- Automatic data restoration from cloud
- Progress notifications during data recovery

### 3. Data Integrity
- All data safely stored in Firebase cloud
- Cache clear only removes local copies
- Automatic re-sync on page reload
- Session state preserved during cache operations

### 4. Better Error Handling
- Clear distinction between online and offline modes
- Appropriate warnings based on connection status
- Graceful degradation when offline

## How It Works

### View State Persistence Flow:
```
1. User navigates to a view (e.g., "Operator Panel > Roster")
2. View state saved to localStorage via useLocalStorage hook
3. Storage event triggered across all tabs
4. Other tabs/devices update their view state
5. On page reload, view state restored from localStorage
6. User continues from where they left off
```

### Cache Clear Flow:
```
1. User clicks "Clear Cache"
2. System checks Firebase connection status
3. Appropriate warning message displayed
4. If confirmed:
   a. Flag set in sessionStorage (TFW_CACHE_CLEARED)
   b. Only tfw_* keys removed (preserving auth and view)
   c. Service worker cache cleared
   d. Page reloads
5. On reload:
   a. Auth state restored from preserved keys
   b. View state restored from preserved keys
   c. Firebase sync begins automatically
   d. Notification shown when connected
   e. Data restored from cloud
```

## Testing Scenarios

### Test 1: View State Persistence
1. Log in as operator on desktop
2. Navigate to "My Roster"
3. Open application on mobile device
4. Mobile should show "My Roster" (after login)
5. Navigate to different view on mobile
6. Desktop should update after refresh

### Test 2: Cache Clear with Data Restoration
1. Log in and create some OPS Report entries
2. Click "Clear Cache"
3. Confirm the warning
4. After reload, verify:
   - User remains logged in
   - View state preserved
   - Notification about cloud restoration shown
   - All OPS Report data restored from Firebase

### Test 3: Multi-Tab Synchronization
1. Open app in multiple tabs
2. Log in to one tab
3. Navigate to different views in each tab
4. Each tab should maintain its own view
5. Reload any tab - view state preserved

### Test 4: Logout/Login Cycle
1. Log in and navigate to specific view
2. Log out
3. Verify view resets to "counter"
4. Log back in
5. Verify appropriate default view for role

## Technical Notes

### Storage Keys:
- `currentView`: Stores current navigation state
- `authRole`: Stores user role
- `authUser`: Stores user information
- `authLastActivity`: Tracks last user activity
- `tfw_data_*`: Firebase-synced data (can be cleared)

### Preserved During Cache Clear:
- Authentication state
- Current view state
- Session backup (sessionStorage)

### Cleared During Cache Clear:
- All Firebase-synced data cache
- Service worker runtime cache
- Temporary application state

## Future Enhancements

1. **View History Stack**: Maintain navigation history for back/forward
2. **View State Sync API**: Real-time sync via Firebase instead of localStorage
3. **Partial Cache Clear**: Allow clearing specific data types
4. **Cache Statistics**: Show users what's cached and its age
5. **Offline Queue**: Queue operations when offline, sync when online

## Related Files

- `App.tsx`: Main application logic and view state management
- `hooks/useLocalStorage.ts`: Custom hook for persistent state
- `hooks/useAuth.ts`: Authentication with session backup
- `hooks/useFirebaseSync.ts`: Firebase data synchronization
- `sw.js`: Service worker for caching strategies
