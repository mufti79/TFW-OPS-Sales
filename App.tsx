
import React, { useState, useMemo, useCallback, useEffect, ReactNode, useRef, lazy, Suspense } from 'react';
import { RIDES, FLOORS, OPERATORS, TICKET_SALES_PERSONNEL, COUNTERS, RIDES_ARRAY, OPERATORS_ARRAY, TICKET_SALES_PERSONNEL_ARRAY, COUNTERS_ARRAY } from './constants';
import { RideWithCount, Ride, Operator, AttendanceRecord, Counter, HistoryRecord, PackageSalesRecord, AttendanceData, PackageSalesData } from './types';
import { useAuth, Role } from './hooks/useAuth';
import useFirebaseSync from './hooks/useFirebaseSync';
import { isFirebaseConfigured, database } from './firebaseConfig';
import { ref, onValue, get } from 'firebase/database';
import { NotificationContext, useNotification, NotificationType } from './imageStore';
import NotificationComponent from './components/AttendanceCheckin';



import Login from './components/Login';
import Header from './components/Header';
import RideCard from './components/RideCard';
import Footer from './components/Footer';
import ConfigErrorScreen from './components/ConfigErrorScreen';
import KioskModeWrapper from './components/KioskModeWrapper';

// Lazy load heavy components to reduce initial memory footprint
const Reports = lazy(() => import('./components/Reports'));
const EditImageModal = lazy(() => import('./components/EditImageModal'));
const CodeAssistant = lazy(() => import('./components/CodeAssistant'));
const OperatorManager = lazy(() => import('./components/OperatorManager'));
const AssignmentView = lazy(() => import('./components/AssignmentView'));
const ExpertiseReport = lazy(() => import('./components/ExpertiseReport'));
const DailyRoster = lazy(() => import('./components/DailyRoster'));
const BackupManager = lazy(() => import('./components/BackupManager'));
const TicketSalesAssignmentView = lazy(() => import('./components/TicketSalesAssignmentView'));
const TicketSalesRoster = lazy(() => import('./components/TicketSalesRoster'));
const TicketSalesExpertiseReport = lazy(() => import('./components/TicketSalesExpertiseReport'));
const HistoryLog = lazy(() => import('./components/HistoryLog'));
const DailySalesEntry = lazy(() => import('./components/DailySalesEntry'));
const SalesOfficerDashboard = lazy(() => import('./components/SalesOfficerDashboard'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const SecurityView = lazy(() => import('./components/SecurityView'));
const ManagementView = lazy(() => import('./components/ManagementView'));
const ManagementHub = lazy(() => import('./components/ManagementHub'));

// Loading component for lazy-loaded modules
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
      <p className="text-gray-400">Loading...</p>
    </div>
  </div>
);

// Notification System Implementation
interface NotificationState {
  message: string;
  type: NotificationType;
  visible: boolean;
}

const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationState>({ message: '', type: 'info', visible: false });

  const showNotification = useCallback((message: string, type: NotificationType = 'info', duration: number = 4000) => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, duration);
  }, []);

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <NotificationComponent
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={hideNotification}
      />
    </NotificationContext.Provider>
  );
};


type View = 'counter' | 'reports' | 'assignments' | 'expertise' | 'roster' | 'ticket-sales-dashboard' | 'ts-assignments' | 'ts-roster' | 'ts-expertise' | 'history' | 'my-sales' | 'sales-officer-dashboard' | 'dashboard' | 'management-hub' | 'floor-counts' | 'security-entry';
type Modal = 'edit-image' | 'ai-assistant' | 'operators' | 'backup' | null;

// Constants for session management and date checking
const DATE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const VISIBILITY_CHECK_THROTTLE = 30 * 1000; // 30 seconds

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Normalizes assignment values to arrays for consistent processing.
 * Legacy data may store single assignments as a number, while new data uses arrays.
 * This ensures all assignment values are treated as arrays.
 * @param value - Assignment value that could be a single number or array of numbers
 * @returns Array of operator/personnel IDs
 */
const normalizeAssignmentToArray = (value: number | number[]): number[] => {
    return Array.isArray(value) ? value : [value];
};

/**
 * Merges two assignment objects from different Firebase paths.
 * Used to combine assignments from TFW-NEW app (opsAssignments/salesAssignments) 
 * with TFW-OPS-Sales app (dailyAssignments/tsAssignments).
 * 
 * Merge behavior:
 * - Assignments are organized by date, then by ride/counter ID
 * - When both sources have assignments for the same item, operator/personnel IDs are combined
 * - Duplicate IDs are removed (assumes IDs are primitive numbers for Set deduplication)
 * - If only one source has an assignment, it's used as-is
 * 
 * @param baseData - Base assignment data (e.g., dailyAssignments or tsAssignments)
 * @param incomingData - Incoming assignment data (e.g., opsAssignments or salesAssignments)
 * @returns Merged assignment object with deduplicated operator/personnel IDs
 */
const mergeAssignments = (
    baseData: Record<string, Record<string, number[] | number>>,
    incomingData: Record<string, Record<string, number[] | number>>
): Record<string, Record<string, number[] | number>> => {
    const merged: Record<string, Record<string, number[] | number>> = { ...baseData };
    
    Object.keys(incomingData).forEach(date => {
        if (merged[date]) {
            // Merge assignments for the same date
            Object.keys(incomingData[date]).forEach(itemId => {
                if (!merged[date][itemId]) {
                    merged[date][itemId] = incomingData[date][itemId];
                } else {
                    // Combine arrays if both exist and deduplicate IDs
                    // Note: Assumes operator/personnel IDs are primitive numbers for Set deduplication
                    const existing = normalizeAssignmentToArray(merged[date][itemId]);
                    const incoming = normalizeAssignmentToArray(incomingData[date][itemId]);
                    merged[date][itemId] = Array.from(new Set([...existing, ...incoming]));
                }
            });
        } else {
            merged[date] = { ...incomingData[date] };
        }
    });
    
    return merged;
};

// This is the main application component with all the logic.
const AppComponent: React.FC = () => {
    const { role, currentUser, login, logout } = useAuth();
    const { showNotification } = useNotification();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFloor, setSelectedFloor] = useState('');
    const [selectedRideForEdit, setSelectedRideForEdit] = useState<Ride | null>(null);
    const [currentView, setCurrentView] = useState<View>('counter');
    const [currentModal, setCurrentModal] = useState<Modal>(null);

    // Use ref to persist lastVisibilityCheck across renders
    const lastVisibilityCheckRef = useRef(Date.now());

    const [today, setToday] = useState(toLocalDateString(new Date()));
    const [selectedDate, setSelectedDate] = useState(today);
    
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const [mySalesStartDate, setMySalesStartDate] = useState(today);
    const [mySalesEndDate, setMySalesEndDate] = useState(today);
    
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'sdk-error'>('connecting');
    const [initialLoading, setInitialLoading] = useState(true);

    const { data: dailyCounts, setData: setDailyCounts } = useFirebaseSync<Record<string, Record<string, number>>>('data/dailyCounts', {});
    const { data: dailyRideDetails, setData: setDailyRideDetails } = useFirebaseSync<Record<string, Record<string, { tickets: number; packages: number }>>>('data/dailyRideDetails', {});
    const { data: rides, setData: setRides } = useFirebaseSync<Record<number, Omit<Ride, 'id'>>>('config/rides', RIDES);
    const { data: operators, setData: setOperators } = useFirebaseSync<Record<number, Omit<Operator, 'id'>>>('config/operators', OPERATORS);
    const { data: attendanceData, setData: setAttendanceData } = useFirebaseSync<AttendanceData>('data/attendance', {});
    const { data: tsAssignments, setData: setTSAssignments } = useFirebaseSync<Record<string, Record<string, number[] | number>>>('data/tsAssignments', {});
    const { data: salesAssignments } = useFirebaseSync<Record<string, Record<string, number[] | number>>>('data/salesAssignments', {});
    const { data: history, setData: setHistory } = useFirebaseSync<HistoryRecord[]>('data/history', []);
    const { data: packageSalesData, setData: setPackageSalesData } = useFirebaseSync<PackageSalesData>('data/packageSales', {});
    const { data: appLogo, setData: setAppLogo } = useFirebaseSync<string | null>('config/appLogo', null);
    const { data: otherSalesCategories, setData: setOtherSalesCategories } = useFirebaseSync<string[]>('config/otherSalesCategories', []);
    const { data: dailyAssignments, setData: setDailyAssignments } = useFirebaseSync<Record<string, Record<string, number[] | number>>>('data/dailyAssignments', {});
    const { data: opsAssignments } = useFirebaseSync<Record<string, Record<string, number[] | number>>>('data/opsAssignments', {});
    const { data: floorGuestCounts, setData: setFloorGuestCounts } = useFirebaseSync<Record<string, Record<string, Record<string, number>>>>('data/floorGuestCounts', {});
    
    // Merge assignments from both paths for compatibility with TFW-NEW app
    const mergedAssignments = useMemo(() => {
        return mergeAssignments(dailyAssignments, opsAssignments);
    }, [dailyAssignments, opsAssignments]);
    
    // Merge ticket sales assignments from both paths for compatibility with TFW-NEW app
    const mergedTSAssignments = useMemo(() => {
        return mergeAssignments(tsAssignments, salesAssignments);
    }, [tsAssignments, salesAssignments]);
    
    // Debug logging for assignment sync (development only)
    // Only log once on mount to avoid performance issues from continuous re-renders
    useEffect(() => {
        if (import.meta.env.DEV) {
            console.log('📊 Assignment Data Loaded:', {
                opsAssignments: Object.keys(opsAssignments).length > 0 ? `${Object.keys(opsAssignments).length} dates` : 'empty',
                dailyAssignments: Object.keys(dailyAssignments).length > 0 ? `${Object.keys(dailyAssignments).length} dates` : 'empty',
                salesAssignments: Object.keys(salesAssignments).length > 0 ? `${Object.keys(salesAssignments).length} dates` : 'empty',
                tsAssignments: Object.keys(tsAssignments).length > 0 ? `${Object.keys(tsAssignments).length} dates` : 'empty'
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount
    
    useEffect(() => {
        if (isFirebaseConfigured && database) {
            const connectedRef = ref(database, '.info/connected');
            const unsubscribe = onValue(connectedRef, (snap) => {
                setConnectionStatus(snap.val() ? 'connected' : 'disconnected');
            });
            
            // Check if user is returning (has auth data in localStorage) to reduce wait time
            let hasStoredAuth = false;
            try {
                if (typeof window !== 'undefined') {
                    hasStoredAuth = localStorage.getItem('authRole') !== null && localStorage.getItem('authUser') !== null;
                }
            } catch (error) {
                console.warn('Unable to access localStorage:', error);
            }
            
            const initialDataPaths = ['config/appLogo', 'config/rides', 'config/operators'];
            const promises = initialDataPaths.map(path => get(ref(database, path)));
            const timeoutDuration = hasStoredAuth ? 1000 : 4000; // 1s for returning users, 4s for new users
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Initial data load timed out")), timeoutDuration));

            Promise.race([Promise.all(promises), timeoutPromise])
                .then(() => setInitialLoading(false))
                .catch(error => {
                    console.warn("Firebase load issue:", error.message);
                    setInitialLoading(false);
                });

            return () => unsubscribe();
        } else {
            // Offline mode / Not configured / SDK Error
            setInitialLoading(false);
            if (!database && typeof window !== 'undefined') {
                setConnectionStatus('sdk-error');
            } else {
                setConnectionStatus('disconnected');
            }
        }
    }, []);
    
    // Monitor for unexpected session loss and log diagnostic information
    useEffect(() => {
        if (!role && !currentUser) return;
        
        const checkSessionIntegrity = () => {
            try {
                const authRole = localStorage.getItem('authRole');
                const authUser = localStorage.getItem('authUser');
                
                // If we have role/currentUser in state but not in localStorage, something cleared it
                if (role && currentUser && (!authRole || !authUser)) {
                    console.error('⚠️ Session data missing from localStorage!', {
                        stateRole: role,
                        storageRole: authRole,
                        stateUser: currentUser?.name,
                        storageSize: JSON.stringify(localStorage).length,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error('Session integrity check failed:', error);
            }
        };
        
        // Check every 30 seconds
        const integrityInterval = setInterval(checkSessionIntegrity, 30000);
        
        return () => clearInterval(integrityInterval);
    }, [role, currentUser]);
    
    useEffect(() => {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link && appLogo) {
          link.href = appLogo;
      } else if (link) {
          link.href = '';
      }
    }, [appLogo]);

    useEffect(() => {
        const checkDate = () => {
            const newToday = toLocalDateString(new Date());
            if (newToday !== today) {
                console.log('Day changed detected:', { oldDay: today, newDay: newToday });
                // Only set flag and reload if user is logged in
                if (role && currentUser) {
                    localStorage.setItem('TFW_APP_NEW_DAY_FLAG', 'true');
                    window.location.reload();
                } else {
                    // Just update the date if no user is logged in
                    setToday(newToday);
                    setSelectedDate(newToday);
                }
            }
        };
        
        // Check date periodically to reduce overhead
        const intervalId = setInterval(checkDate, DATE_CHECK_INTERVAL);
        
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Only check date if enough time has passed since last check
                const now = Date.now();
                if (now - lastVisibilityCheckRef.current > VISIBILITY_CHECK_THROTTLE) {
                    lastVisibilityCheckRef.current = now;
                    checkDate();
                }
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [today, role, currentUser]);
    
    useEffect(() => {
        const newDayFlag = localStorage.getItem('TFW_APP_NEW_DAY_FLAG');
        if (newDayFlag && role && currentUser) {
            console.log('Processing new day flag - logging out user');
            localStorage.removeItem('TFW_APP_NEW_DAY_FLAG');
            logout();
            showNotification("A new day has started. Please log in for your daily check-in.", "info");
            const newToday = toLocalDateString(new Date());
            setToday(newToday);
            setSelectedDate(newToday);
        } else if (newDayFlag && !role) {
            // Clear flag if no user is logged in
            localStorage.removeItem('TFW_APP_NEW_DAY_FLAG');
        }
    }, [logout, showNotification, role, currentUser]);

    const logAction = useCallback((action: string, details: string) => {
      const user = currentUser?.name || 'System';
      const newRecord: HistoryRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        user,
        action,
        details,
      };
      setHistory(prev => [newRecord, ...prev]);
    }, [currentUser, setHistory]);

    const handleLogin = (newRole: Exclude<Role, null>, payload?: string | Operator) => {
        const success = login(newRole, payload);
        if (success) {
            logAction('LOGIN', `User logged in as ${newRole}.`);
            if (newRole === 'operator') setCurrentView('roster');
            else if (newRole === 'ticket-sales') setCurrentView('ts-roster');
            else if (newRole === 'sales-officer') setCurrentView('sales-officer-dashboard');
            else if (newRole === 'security') setCurrentView('security-entry');
            else setCurrentView('dashboard');
        }
        return success;
    };

    const handleLogout = useCallback(() => {
        if (currentUser) logAction('LOGOUT', `User ${currentUser.name} logged out.`);
        logout();
    }, [currentUser, logout, logAction]);
    
    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        logAction('DATE_CHANGE', `Viewing data for date: ${date}`);
    };

    const handleNavigate = (view: View) => setCurrentView(view);

    // Manual sync function to force refresh assignments from Firebase
    const handleSyncAssignments = useCallback(async () => {
        if (!isFirebaseConfigured || !database) {
            showNotification('Cannot sync: Firebase is not configured', 'error');
            return;
        }

        try {
            showNotification('Syncing assignments from TFW-NEW app...', 'info', 2000);
            
            // Manually fetch the latest data from both assignment paths
            const [opsSnapshot, dailySnapshot, salesSnapshot, tsSnapshot] = await Promise.all([
                get(ref(database, 'data/opsAssignments')),
                get(ref(database, 'data/dailyAssignments')),
                get(ref(database, 'data/salesAssignments')),
                get(ref(database, 'data/tsAssignments'))
            ]);

            // Merge operator assignments from TFW-NEW (opsAssignments) into dailyAssignments
            const opsData = opsSnapshot.exists() ? opsSnapshot.val() : {};
            const dailyData = dailySnapshot.exists() ? dailySnapshot.val() : {};
            
            // Log what was fetched for debugging (development only)
            if (import.meta.env.DEV) {
                console.log('🔄 Sync - Fetched from data/opsAssignments:', opsData);
                console.log('📋 Sync - Fetched from data/dailyAssignments:', dailyData);
            }
            
            const mergedDailyAssignments = mergeAssignments(dailyData, opsData);
            
            if (import.meta.env.DEV) {
                console.log('✅ Sync - Merged operator assignments:', mergedDailyAssignments);
            }
            
            // Save merged operator assignments to local state
            setDailyAssignments(mergedDailyAssignments);

            // Merge ticket sales assignments from TFW-NEW (salesAssignments) into tsAssignments
            const salesData = salesSnapshot.exists() ? salesSnapshot.val() : {};
            const tsData = tsSnapshot.exists() ? tsSnapshot.val() : {};
            
            // Log what was fetched for debugging (development only)
            if (import.meta.env.DEV) {
                console.log('🎫 Sync - Fetched from data/salesAssignments:', salesData);
                console.log('📋 Sync - Fetched from data/tsAssignments:', tsData);
            }
            
            const mergedTSAssignments = mergeAssignments(tsData, salesData);
            
            if (import.meta.env.DEV) {
                console.log('✅ Sync - Merged ticket sales assignments:', mergedTSAssignments);
            }
            
            // Save merged ticket sales assignments to local state
            setTSAssignments(mergedTSAssignments);

            // Provide detailed feedback about sync results
            const totalDates = Object.keys(mergedDailyAssignments).length;
            const totalTSDates = Object.keys(mergedTSAssignments).length;
            
            if (totalDates === 0 && totalTSDates === 0) {
                showNotification('Sync complete. No assignments found in TFW-NEW app. Create assignments in TFW-NEW or use "Edit Assignments" here.', 'warning', 6000);
            } else if (totalDates > 0 && totalTSDates > 0) {
                showNotification(`✓ Synced ${totalDates} operator and ${totalTSDates} ticket sales assignment dates from TFW-NEW!`, 'success', 5000);
            } else if (totalDates > 0) {
                showNotification(`✓ Synced ${totalDates} operator assignment date(s) from TFW-NEW!`, 'success', 5000);
            } else {
                showNotification(`✓ Synced ${totalTSDates} ticket sales assignment date(s) from TFW-NEW!`, 'success', 5000);
            }
            
            logAction('SYNC_ASSIGNMENTS', `Manually synced assignments from TFW-NEW app (${totalDates} operator dates, ${totalTSDates} TS dates)`);
        } catch (error) {
            console.error('Error syncing assignments:', error);
            showNotification('Failed to sync assignments. Check your connection.', 'error');
        }
    }, [setDailyAssignments, setTSAssignments, showNotification, logAction]);

    const handleSaveCount = useCallback((rideId: number, newCount: number, details?: { tickets: number, packages: number }) => {
        const rideName = RIDES_ARRAY.find(r => r.id === rideId)?.name || 'Unknown Ride';
        // Null checks added for safety
        const oldCounts = (dailyCounts && dailyCounts[selectedDate]) || {};
        const oldCount = oldCounts[rideId] || 0;
        
        setDailyCounts(prev => ({ ...prev, [selectedDate]: { ...(prev?.[selectedDate] || {}), [rideId]: newCount } }));
        if (details) {
            setDailyRideDetails(prev => ({ ...prev, [selectedDate]: { ...(prev?.[selectedDate] || {}), [rideId]: details } }));
        }
        
        logAction('UPDATE_COUNT', `Updated count for ${rideName} to ${newCount} (Tickets: ${details?.tickets || 'N/A'}, Packages: ${details?.packages || 'N/A'})`);
    }, [selectedDate, setDailyCounts, setDailyRideDetails, logAction, dailyCounts]);

    const handleSaveAssignments = (date: string, newAssignments: Record<string, number[]>) => {
        // Note: We write assignments only to the primary path (data/dailyAssignments) to maintain
        // a single source of truth for TFW-OPS-Sales edits. The app reads from both paths
        // (dailyAssignments and opsAssignments) for full compatibility with TFW-NEW.
        setDailyAssignments(prev => ({ ...prev, [date]: newAssignments }));
        logAction('SAVE_ASSIGNMENTS', `Operator assignments updated for ${date}.`);
        showNotification(`Assignments for ${date} saved successfully!`, 'success');
    };

    const handleSaveTSAssignments = (date: string, newAssignments: Record<string, number[]>) => {
        // Note: We write ticket sales assignments only to the primary path (data/tsAssignments) to maintain
        // a single source of truth for TFW-OPS-Sales edits. The app reads from both paths
        // (tsAssignments and salesAssignments) for full compatibility with TFW-NEW.
        setTSAssignments(prev => ({ ...prev, [date]: newAssignments }));
        logAction('SAVE_TS_ASSIGNMENTS', `Ticket Sales assignments updated for ${date}.`);
        showNotification(`Ticket Sales assignments for ${date} saved successfully!`, 'success');
    };
    
    const handleClockIn = useCallback((attendedBriefing: boolean, briefingTime: string | null) => {
        if (!currentUser) return;
        setAttendanceData(prev => ({ ...prev, [today]: { ...(prev?.[today] || {}), [currentUser.id]: { attendedBriefing, briefingTime } } }));
        logAction('CLOCK_IN', `${currentUser.name} checked in. Attended briefing: ${attendedBriefing}.`);
        showNotification('Check-in successful! You can now view your roster and assignments.', 'success', 3000);
        // Keep user logged in for the entire day - no automatic logout after check-in
    }, [currentUser, setAttendanceData, today, logAction, showNotification]);

    const handleSavePackageSales = (data: Omit<PackageSalesRecord, 'date' | 'personnelId'>) => {
        if (!currentUser) return;
        const newCats = data.otherSales.map(s => s.category).filter(c => c && !otherSalesCategories.includes(c));
        if (newCats.length > 0) setOtherSalesCategories(prev => [...new Set([...prev, ...newCats])]);
        setPackageSalesData(prev => ({ ...prev, [selectedDate]: { ...(prev?.[selectedDate] || {}), [currentUser.id]: data } }));
        showNotification('Your sales have been saved!', 'success');
        logAction('SAVE_SALES', `Saved sales data for ${selectedDate}.`);
    };

     const handleEditPackageSales = (date: string, personnelId: number, data: Omit<PackageSalesRecord, 'date' | 'personnelId'>) => {
        const newCats = data.otherSales.map(s => s.category).filter(c => c && !otherSalesCategories.includes(c));
        if (newCats.length > 0) setOtherSalesCategories(prev => [...new Set([...prev, ...newCats])]);
        setPackageSalesData(prev => ({ ...prev, [date]: { ...(prev?.[date] || {}), [personnelId]: data } }));
        showNotification(`Sales for ${date} corrected successfully.`, 'success');
        logAction('EDIT_SALES', `Corrected sales data for personnel ID ${personnelId} on ${date}.`);
    };

    const handleRenameOtherSalesCategory = (oldName: string, newName: string) => {
      setOtherSalesCategories(prev => Array.from(new Set(prev.map(c => c === oldName ? newName : c))));
      setPackageSalesData(prev => {
        const next = { ...prev };
        for (const date in next) for (const pId in next[date]) {
          const record = next[date][pId];
          if (record.otherSales) record.otherSales = record.otherSales.map(sale => sale.category === oldName ? { ...sale, category: newName } : sale);
        }
        return next;
      });
      showNotification(`Category "${oldName}" renamed to "${newName}" and all records updated.`, 'success');
      logAction('RENAME_CATEGORY', `Renamed category "${oldName}" to "${newName}".`);
    };

    const handleDeleteOtherSalesCategory = (name: string) => {
      setOtherSalesCategories(prev => prev.filter(cat => cat !== name));
      showNotification(`Category "${name}" removed from suggestions.`, 'info');
      logAction('DELETE_CATEGORY', `Removed category "${name}" from suggestions.`);
    };

    const handleSaveFloorCounts = (date: string, floor: string, counts: Record<string, number>) => {
        setFloorGuestCounts(prev => ({
            ...prev,
            [date]: {
                ...(prev?.[date] || {}),
                [floor]: counts
            }
        }));
        showNotification('Floor guest counts saved successfully!', 'success');
        logAction('SAVE_FLOOR_COUNTS', `Saved floor guest counts for ${floor} on ${date}.`);
    };

    const handleRemoveObsoleteRides = () => {
        const ridesFromCode = new Set(RIDES_ARRAY.map(r => r.id.toString()));
        const ridesInDb = Object.keys(rides || {});
        const obsoleteIds = ridesInDb.filter(id => !ridesFromCode.has(id));
      
        if (obsoleteIds.length > 0 && window.confirm(`Are you sure you want to delete ${obsoleteIds.length} obsolete ride(s) from the database? This cannot be undone.`)) {
          setRides(prev => {
            const next = {...prev};
            obsoleteIds.forEach(id => delete next[Number(id)]);
            return next;
          });
          showNotification('Obsolete rides removed from the database.', 'success');
          logAction('DB_CLEANUP', `Removed obsolete rides: ${obsoleteIds.join(', ')}.`);
        }
    };

    const handleResetDay = (date: string) => {
        if (window.confirm(`Are you sure you want to RESET all data for ${date}? This includes counts, assignments, sales, and attendance. This cannot be undone.`)) {
             setDailyCounts(prev => { const n = {...prev}; delete n[date]; return n; });
             setDailyRideDetails(prev => { const n = {...prev}; delete n[date]; return n; });
             setAttendanceData(prev => { const n = {...prev}; delete n[date]; return n; });
             setDailyAssignments(prev => { const n = {...prev}; delete n[date]; return n; });
             setTSAssignments(prev => { const n = {...prev}; delete n[date]; return n; });
             setPackageSalesData(prev => { const n = {...prev}; delete n[date]; return n; });
             
             logAction('RESET_DAY', `Reset all data for ${date}.`);
             showNotification(`Data for ${date} has been reset.`, 'success');
        }
    };

    const handleAddOperator = useCallback((name: string) => {
        // Use timestamp-based ID to avoid conflicts with existing 8-digit IDs (like 21700110)
        // Format: 9XXXXXXXXXXXXX (timestamp in milliseconds, prefixed with 9 for distinction)
        // To stay within MAX_SAFE_INTEGER, we use just timestamp without extra suffix
        // The timestamp already provides millisecond precision which is sufficient for our use case
        const newId = Number('9' + Date.now().toString());
        
        setOperators(prev => ({
            ...prev,
            [newId]: { name }
        }));
        
        logAction('ADD_OPERATOR', `Added new operator: ${name} (ID: ${newId})`);
        showNotification(`Operator "${name}" added successfully!`, 'success');
    }, [setOperators, logAction, showNotification]);

    const handleDeleteOperators = useCallback((ids: number[]) => {
        // Get operator names before deletion for accurate logging
        const operatorNames = ids.map(id => operators?.[id]?.name || `ID ${id}`).join(', ');
        
        setOperators(prev => {
            const next = { ...prev };
            ids.forEach(id => delete next[id]);
            return next;
        });
        
        logAction('DELETE_OPERATORS', `Deleted operator(s): ${operatorNames}`);
        showNotification(`${ids.length} operator(s) deleted successfully!`, 'success');
    }, [operators, setOperators, logAction, showNotification]);

    const handleImportOperators = useCallback((newOperators: Operator[], strategy: 'merge' | 'replace') => {
        if (strategy === 'replace') {
            // Replace: clear all existing operators and add new ones with timestamp-based IDs
            const newOperatorsObj: Record<number, Omit<Operator, 'id'>> = {};
            const baseTime = Date.now();
            newOperators.forEach((op, index) => {
                // Generate unique timestamp-based IDs by incrementing baseTime
                // This ensures uniqueness even for bulk imports
                const newId = Number('9' + (baseTime + index).toString());
                newOperatorsObj[newId] = { name: op.name };
            });
            setOperators(newOperatorsObj);
            logAction('IMPORT_OPERATORS', `Replaced all operators with ${newOperators.length} imported operator(s)`);
        } else {
            // Merge: keep existing operators and add new ones with unique IDs
            let addedCount = 0;
            const baseTime = Date.now();
            setOperators(prev => {
                const next = { ...prev };
                const existingNames = new Set(Object.values(prev || {}).map(op => op.name.toLowerCase()));
                let idCounter = 0;
                
                newOperators.forEach((op) => {
                    // Skip duplicates based on name
                    if (!existingNames.has(op.name.toLowerCase())) {
                        // Generate unique IDs by incrementing from baseTime
                        const newId = Number('9' + (baseTime + idCounter).toString());
                        next[newId] = { name: op.name };
                        existingNames.add(op.name.toLowerCase());
                        addedCount++;
                        idCounter++;
                    }
                });
                
                return next;
            });
            
            const skippedCount = newOperators.length - addedCount;
            const logMessage = skippedCount > 0 
                ? `Merged ${addedCount} operator(s) into existing list (${skippedCount} duplicate(s) skipped)`
                : `Merged ${addedCount} operator(s) into existing list`;
            logAction('IMPORT_OPERATORS', logMessage);
        }
        showNotification('Operators imported successfully!', 'success');
    }, [setOperators, logAction, showNotification]);
    
    const ridesWithCounts = useMemo<RideWithCount[]>(() => {
        // Robust null checks to prevent crashes if data hasn't synced or is corrupt
        const counts = dailyCounts || {};
        const details = dailyRideDetails || {};
        
        // Fallback to RIDES constant if rides state is empty or null.
        // This ensures the ride list populates immediately even if Firebase/LocalStorage has no config yet.
        const configRides = (rides && Object.keys(rides).length > 0) ? rides : RIDES;

        const countsForDay = counts[selectedDate] || {};
        const detailsForDay = details[selectedDate] || {};
        
        const ridesFromConfig = Object.entries(configRides).map(([id, rideData]) => ({ id: Number(id), ...rideData }));
        
        return ridesFromConfig.map(ride => {
            const count = countsForDay[ride.id] || 0;
            // Default to tickets=count if details missing, for backward compatibility
            const detailsForRide = detailsForDay[ride.id] || { tickets: count, packages: 0 };
            return { 
                ...ride, 
                count,
                details: detailsForRide
            };
        });
    }, [dailyCounts, dailyRideDetails, selectedDate, rides]);

    // Compute operators array from Firebase-synced data, with fallback to static constants
    const operatorsArray = useMemo<Operator[]>(() => {
        // Fallback to OPERATORS constant if operators state is empty or null.
        // This ensures the operator list populates immediately even if Firebase/LocalStorage has no config yet.
        const configOperators = (operators && Object.keys(operators).length > 0) ? operators : OPERATORS;
        
        return Object.entries(configOperators).map(([id, operatorData]) => ({ id: Number(id), ...operatorData }));
    }, [operators]);

    const filteredRides = useMemo(() => {
        let filtered = ridesWithCounts || [];
        if (selectedFloor) filtered = filtered.filter(ride => ride.floor === selectedFloor);
        if (searchTerm) filtered = filtered.filter(ride => ride.name && ride.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return filtered.sort((a,b) => (a.name || '').localeCompare(b.name || ''));
    }, [ridesWithCounts, selectedFloor, searchTerm]);
    
    // Safety check for attendance data
    const attendanceArray = useMemo<AttendanceRecord[]>(() => {
        const att = attendanceData || {};
        return Object.entries(att).flatMap(([date, records]) => 
            records ? Object.entries(records).map(([operatorId, record]) => ({ date, operatorId: Number(operatorId), ...record })) : []
        );
    }, [attendanceData]);
    
    const hasCheckedInToday = useMemo(() => !currentUser ? false : !!(attendanceData?.[today]?.[currentUser.id]), [attendanceData, today, currentUser]);
    
    const isCheckinAllowed = useMemo(() => new Date().getHours() < 22, []);

    // Optimize memory usage by calculating size only when explicitly needed, not on every render
    // This prevents frequent stringification of large objects which can cause memory issues
    const estimatedDbSize = useMemo(() => {
        try {
            // Only stringify non-null objects to reduce memory footprint
            // Note: We intentionally exclude opsAssignments and salesAssignments from size calculation
            // as they are merged into dailyAssignments and tsAssignments respectively (see lines 194-200),
            // avoiding double-counting. Changes to opsAssignments/salesAssignments are reflected through
            // mergedAssignments and mergedTSAssignments which depend on the base assignments we track here.
            const data = {
                dailyCounts: dailyCounts || {},
                dailyRideDetails: dailyRideDetails || {},
                rides: rides || {},
                operators: operators || {},
                attendanceData: attendanceData || {},
                tsAssignments: tsAssignments || {},
                history: history || [],
                packageSalesData: packageSalesData || {},
                appLogo: appLogo || '',
                otherSalesCategories: otherSalesCategories || [],
                dailyAssignments: dailyAssignments || {}
            };
            return JSON.stringify(data).length;
        } catch (e) {
            console.error('Error calculating DB size:', e);
            return 0;
        }
    }, [dailyCounts, dailyRideDetails, rides, operators, attendanceData, tsAssignments, history, packageSalesData, appLogo, otherSalesCategories, dailyAssignments]);

    const totalGuests = useMemo(() => ridesWithCounts.reduce((sum, ride) => sum + ride.count, 0), [ridesWithCounts]);

    // Clear cache handler - removes all localStorage cache and reloads from Firebase
    const handleClearCache = useCallback(() => {
        if (window.confirm('This will clear all cached data and reload from the server. You may need to log in again. Continue?')) {
            try {
                // Collect all TFW-related localStorage keys first before removing any
                const keysToRemove: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('tfw_')) {
                        keysToRemove.push(key);
                    }
                }
                
                // Remove all collected keys
                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                showNotification('Cache cleared successfully! Reloading...', 'success', 2000);
                
                // Reload the page after a short delay to allow notification to show
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } catch (error) {
                console.error('Error clearing cache:', error);
                showNotification('Failed to clear cache. Please try again.', 'error');
            }
        }
    }, [showNotification]);

    // Note: We deliberately allow the app to run even if not configured to support offline mode.
    
    if (initialLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto"></div>
            </div>
            <h1 className="text-3xl font-bold text-purple-400">Loading Toggi Fun World...</h1>
            <p className="text-gray-400 mt-2">Initializing data sync...</p>
          </div>
        </div>
      );
    }

    if (!role || !currentUser) {
        return <Login onLogin={handleLogin} operators={operatorsArray} ticketSalesPersonnel={TICKET_SALES_PERSONNEL_ARRAY} appLogo={appLogo} />;
    }
    
    const isManager = role === 'admin' || role === 'operation-officer';

    const renderView = () => {
        switch (currentView) {
            case 'reports': return <Suspense fallback={<LoadingFallback />}><Reports dailyCounts={dailyCounts || {}} dailyRideDetails={dailyRideDetails || {}} rides={RIDES_ARRAY} /></Suspense>;
            case 'assignments': return <Suspense fallback={<LoadingFallback />}><AssignmentView rides={RIDES_ARRAY} operators={operatorsArray} dailyAssignments={mergedAssignments || {}} onSave={handleSaveAssignments} selectedDate={selectedDate} attendance={attendanceArray} onSync={handleSyncAssignments} /></Suspense>;
            case 'expertise': return <Suspense fallback={<LoadingFallback />}><ExpertiseReport operators={operatorsArray} dailyAssignments={mergedAssignments || {}} rides={RIDES_ARRAY} /></Suspense>;
            case 'roster': return <Suspense fallback={<LoadingFallback />}><DailyRoster rides={ridesWithCounts} operators={operatorsArray} dailyAssignments={mergedAssignments || {}} selectedDate={selectedDate} onDateChange={handleDateChange} role={role} currentUser={currentUser} attendance={attendanceArray} onNavigate={handleNavigate} onCountChange={handleSaveCount} onShowModal={(modal, ride) => { setCurrentModal(modal); setSelectedRideForEdit(ride || null); }} onSaveAssignments={handleSaveAssignments} hasCheckedInToday={hasCheckedInToday} onClockIn={handleClockIn} isCheckinAllowed={isCheckinAllowed} onSync={handleSyncAssignments} /></Suspense>;
            case 'ts-assignments': return <Suspense fallback={<LoadingFallback />}><TicketSalesAssignmentView counters={COUNTERS_ARRAY} ticketSalesPersonnel={TICKET_SALES_PERSONNEL_ARRAY} dailyAssignments={mergedTSAssignments || {}} onSave={handleSaveTSAssignments} selectedDate={selectedDate} attendance={attendanceArray} onSync={handleSyncAssignments} /></Suspense>;
            case 'ts-roster': return <Suspense fallback={<LoadingFallback />}><TicketSalesRoster counters={COUNTERS_ARRAY} ticketSalesPersonnel={TICKET_SALES_PERSONNEL_ARRAY} dailyAssignments={mergedTSAssignments || {}} selectedDate={selectedDate} onDateChange={handleDateChange} role={role} currentUser={currentUser} attendance={attendanceArray} onNavigate={handleNavigate} onSaveAssignments={handleSaveTSAssignments} hasCheckedInToday={hasCheckedInToday} onClockIn={handleClockIn} isCheckinAllowed={isCheckinAllowed} onSync={handleSyncAssignments} /></Suspense>;
            case 'ts-expertise': return <Suspense fallback={<LoadingFallback />}><TicketSalesExpertiseReport ticketSalesPersonnel={TICKET_SALES_PERSONNEL_ARRAY} dailyAssignments={mergedTSAssignments || {}} counters={COUNTERS_ARRAY} /></Suspense>;
            case 'history': return <Suspense fallback={<LoadingFallback />}><HistoryLog history={history} onClearHistory={() => { if(window.confirm("Are you sure?")) { setHistory([]); logAction('CLEAR_HISTORY', 'Cleared the entire activity log.'); } }}/></Suspense>;
            case 'my-sales': return <Suspense fallback={<LoadingFallback />}><DailySalesEntry currentUser={currentUser} selectedDate={selectedDate} onDateChange={handleDateChange} packageSales={packageSalesData || {}} onSave={handleSavePackageSales} mySalesStartDate={mySalesStartDate} onMySalesStartDateChange={setMySalesStartDate} mySalesEndDate={mySalesEndDate} onMySalesEndDateChange={setMySalesEndDate} otherSalesCategories={otherSalesCategories} /></Suspense>;
            case 'sales-officer-dashboard': return <Suspense fallback={<LoadingFallback />}><SalesOfficerDashboard ticketSalesPersonnel={TICKET_SALES_PERSONNEL_ARRAY} packageSales={packageSalesData || {}} startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} role={role} onEditSales={handleEditPackageSales} otherSalesCategories={otherSalesCategories} /></Suspense>;
            case 'dashboard': return <Suspense fallback={<LoadingFallback />}><Dashboard ridesWithCounts={ridesWithCounts} operators={operatorsArray} attendance={attendanceArray} historyLog={history} onNavigate={handleNavigate} selectedDate={selectedDate} onDateChange={handleDateChange} dailyAssignments={mergedAssignments || {}} /></Suspense>;
            case 'management-hub': return <Suspense fallback={<LoadingFallback />}><ManagementHub onNavigate={handleNavigate} /></Suspense>;
            case 'floor-counts': return <Suspense fallback={<LoadingFallback />}><ManagementView floorGuestCounts={floorGuestCounts || {}} onNavigate={handleNavigate} /></Suspense>;
            case 'security-entry': return <Suspense fallback={<LoadingFallback />}><SecurityView selectedDate={selectedDate} floorGuestCounts={floorGuestCounts || {}} onSaveFloorCounts={handleSaveFloorCounts} /></Suspense>;
            // Explicitly handle 'counter' to avoid any confusion with default
            case 'counter':
            default: return filteredRides.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in-down">
                    {filteredRides.map(ride => <RideCard key={ride.id} ride={ride} onCountChange={handleSaveCount} role={role} onChangePicture={() => { setSelectedRideForEdit(ride); setCurrentModal('edit-image'); }}/>)}
                </div>
            ) : (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-bold text-gray-400">No rides found.</h2>
                    <p className="text-gray-500">Try adjusting your search or floor filter.</p>
                </div>
            );
        }
    };
    
    const [year, month, day] = selectedDate.split('-').map(s => parseInt(s, 10));
    const displayDate = new Date(year, month - 1, day);

    return (
      <div className="min-h-screen bg-gray-900">
        <KioskModeWrapper />
        <Header onSearch={setSearchTerm} onSelectFloor={setSelectedFloor} selectedFloor={selectedFloor} role={role} currentUser={currentUser} onLogout={handleLogout} onNavigate={handleNavigate} onShowModal={setCurrentModal} currentView={currentView} connectionStatus={connectionStatus} appLogo={appLogo} onClearCache={handleClearCache}/>
        <main className="container mx-auto p-4 md:p-6">{renderView()}</main>
        {isManager && currentView === 'counter' && <Footer title={`Total Guests for ${displayDate.toLocaleDateString()}`} count={totalGuests} onReset={() => { if (window.confirm("Are you sure you want to reset all of today's guest counts to zero?")) { setDailyCounts(prev => ({...prev, [selectedDate]: {}})); setDailyRideDetails(prev => ({...prev, [selectedDate]: {}})); logAction('RESET_COUNTS', `Reset all counts for ${selectedDate}.`); } }} showReset={true} gradient="bg-gradient-to-r from-purple-400 to-pink-600"/>}
        {currentModal === 'edit-image' && selectedRideForEdit && <Suspense fallback={<LoadingFallback />}><EditImageModal ride={selectedRideForEdit} onClose={() => setCurrentModal(null)} onSave={(rideId, imageBase64) => { setRides(prev => ({...prev, [rideId]: {...(prev?.[rideId] || {}), imageUrl: imageBase64 }})); logAction('UPDATE_IMAGE', `Updated image for ride ID ${rideId}.`); setCurrentModal(null); }}/></Suspense>}
        {currentModal === 'ai-assistant' && <Suspense fallback={<LoadingFallback />}><CodeAssistant rides={RIDES_ARRAY} dailyCounts={dailyCounts || {}} onClose={() => setCurrentModal(null)}/></Suspense>}
        {currentModal === 'operators' && <Suspense fallback={<LoadingFallback />}><OperatorManager operators={operatorsArray} onClose={() => setCurrentModal(null)} onAddOperator={handleAddOperator} onDeleteOperators={handleDeleteOperators} onImport={handleImportOperators}/></Suspense>}
        {currentModal === 'backup' && <Suspense fallback={<LoadingFallback />}><BackupManager onClose={() => setCurrentModal(null)} onExport={() => { const json = JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), data: { dailyCounts, dailyRideDetails, rides, operators, attendanceData, tsAssignments, history, packageSalesData, appLogo, otherSalesCategories, dailyAssignments }}, null, 2); const blob = new Blob([json], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `TFW_Backup_${new Date().toISOString().split('T')[0]}.json`; link.click(); logAction('EXPORT_BACKUP', 'Exported a full application backup.'); }} onImport={(json) => { if (window.confirm("WARNING: This will overwrite ALL current data. Are you sure?")) { try { const backupData = JSON.parse(json); if (backupData.version === 2 && backupData.data) { setDailyCounts(backupData.data.dailyCounts || {}); setDailyRideDetails(backupData.data.dailyRideDetails || {}); setRides(backupData.data.rides || RIDES); setOperators(backupData.data.operators || OPERATORS); setAttendanceData(backupData.data.attendanceData || {}); setTSAssignments(backupData.data.tsAssignments || {}); setHistory(backupData.data.history || []); setPackageSalesData(backupData.data.packageSalesData || {}); setAppLogo(backupData.data.appLogo || null); setOtherSalesCategories(backupData.data.otherSalesCategories || []); setDailyAssignments(backupData.data.dailyAssignments || {}); showNotification('Backup restored successfully!', 'success'); logAction('IMPORT_BACKUP', 'Restored data from a backup file.'); } else { alert("Invalid backup file format."); } } catch (e) { alert("Failed to parse backup file."); } } }} appLogo={appLogo} onLogoChange={setAppLogo} otherSalesCategories={otherSalesCategories} onRenameCategory={handleRenameOtherSalesCategory} onDeleteCategory={handleDeleteOtherSalesCategory} obsoleteRides={Object.values(rides || {}).map((r,i) => ({...r, id: Number(Object.keys(rides || {})[i])})).filter(r => !RIDES_ARRAY.some(staticRide => staticRide.id === r.id))} onRemoveObsoleteRides={handleRemoveObsoleteRides} estimatedDbSize={estimatedDbSize} onResetDay={handleResetDay} /></Suspense>}
      </div>
    );
}

// This is the root component that ensures the NotificationProvider wraps the main app.
// This structure fixes the React #310 context error.
const App: React.FC = () => (
    <NotificationProvider>
        <AppComponent />
    </NotificationProvider>
);

export default App;
