
import React, { useState, useMemo, useCallback, useEffect, ReactNode } from 'react';
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
import Reports from './components/Reports';
import EditImageModal from './components/EditImageModal';
import CodeAssistant from './components/CodeAssistant';
import OperatorManager from './components/OperatorManager';
import AssignmentView from './components/AssignmentView';
import ExpertiseReport from './components/ExpertiseReport';
import DailyRoster from './components/DailyRoster';
import KioskModeWrapper from './components/KioskModeWrapper';
import BackupManager from './components/BackupManager';
import TicketSalesAssignmentView from './components/TicketSalesAssignmentView';
import TicketSalesRoster from './components/TicketSalesRoster';
import TicketSalesExpertiseReport from './components/TicketSalesExpertiseReport';
import HistoryLog from './components/HistoryLog';
import DailySalesEntry from './components/DailySalesEntry';
import SalesOfficerDashboard from './components/SalesOfficerDashboard';
import ConfigErrorScreen from './components/ConfigErrorScreen';
import Dashboard from './components/Dashboard';

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


type View = 'counter' | 'reports' | 'assignments' | 'expertise' | 'roster' | 'ticket-sales-dashboard' | 'ts-assignments' | 'ts-roster' | 'ts-expertise' | 'history' | 'my-sales' | 'sales-officer-dashboard' | 'dashboard';
type Modal = 'edit-image' | 'ai-assistant' | 'operators' | 'backup' | null;

const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to normalize assignment values to arrays
const normalizeAssignmentToArray = (value: number | number[]): number[] => {
    return Array.isArray(value) ? value : [value];
};

// Helper function to merge two assignment objects
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
                    // Combine arrays if both exist
                    const existing = normalizeAssignmentToArray(merged[date][itemId]);
                    const incoming = normalizeAssignmentToArray(incomingData[date][itemId]);
                    // Merge and deduplicate
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
    
    // Merge assignments from both paths for compatibility with TFW-NEW app
    const mergedAssignments = useMemo(() => {
        return mergeAssignments(dailyAssignments, opsAssignments);
    }, [dailyAssignments, opsAssignments]);
    
    // Merge ticket sales assignments from both paths for compatibility with TFW-NEW app
    const mergedTSAssignments = useMemo(() => {
        return mergeAssignments(tsAssignments, salesAssignments);
    }, [tsAssignments, salesAssignments]);
    
    // Debug logging for assignment sync (development only)
    useEffect(() => {
        if (import.meta.env.DEV) {
            if (Object.keys(opsAssignments).length > 0) {
                console.log('🔄 Synced assignments from TFW-NEW (data/opsAssignments):', opsAssignments);
            }
            if (Object.keys(dailyAssignments).length > 0) {
                console.log('📋 Local assignments (data/dailyAssignments):', dailyAssignments);
            }
            if (Object.keys(salesAssignments).length > 0) {
                console.log('🔄 Synced ticket sales assignments from TFW-NEW (data/salesAssignments):', salesAssignments);
            }
            if (Object.keys(tsAssignments).length > 0) {
                console.log('🎫 Local ticket sales assignments (data/tsAssignments):', tsAssignments);
            }
        }
    }, [opsAssignments, dailyAssignments, salesAssignments, tsAssignments]);
    
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
                localStorage.setItem('TFW_APP_NEW_DAY_FLAG', 'true');
                window.location.reload();
            }
        };
        const intervalId = setInterval(checkDate, 60000);
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') checkDate();
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [today]);
    
    useEffect(() => {
        const newDayFlag = localStorage.getItem('TFW_APP_NEW_DAY_FLAG');
        if (newDayFlag) {
            localStorage.removeItem('TFW_APP_NEW_DAY_FLAG');
            logout();
            showNotification("A new day has started. Please log in for your daily check-in.", "info");
            const newToday = toLocalDateString(new Date());
            setToday(newToday);
            setSelectedDate(newToday);
        }
    }, [logout, showNotification]);

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
            const mergedDailyAssignments = mergeAssignments(dailyData, opsData);
            
            // Save merged operator assignments to local state
            setDailyAssignments(mergedDailyAssignments);

            // Merge ticket sales assignments from TFW-NEW (salesAssignments) into tsAssignments
            const salesData = salesSnapshot.exists() ? salesSnapshot.val() : {};
            const tsData = tsSnapshot.exists() ? tsSnapshot.val() : {};
            const mergedTSAssignments = mergeAssignments(tsData, salesData);
            
            // Save merged ticket sales assignments to local state
            setTSAssignments(mergedTSAssignments);

            showNotification('✓ Assignments synced successfully!', 'success');
            logAction('SYNC_ASSIGNMENTS', 'Manually synced assignments from TFW-NEW app');
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
        showNotification('Check-in successful! You will be logged out momentarily.', 'success');
        setTimeout(handleLogout, 3000);
    }, [currentUser, setAttendanceData, today, logAction, showNotification, handleLogout]);

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

    const estimatedDbSize = useMemo(() => JSON.stringify({ dailyCounts, dailyRideDetails, rides, operators, attendanceData, tsAssignments, history, packageSalesData, appLogo, otherSalesCategories, dailyAssignments, opsAssignments, salesAssignments }).length, [dailyCounts, dailyRideDetails, rides, operators, attendanceData, tsAssignments, history, packageSalesData, appLogo, otherSalesCategories, dailyAssignments, opsAssignments, salesAssignments]);

    const totalGuests = useMemo(() => ridesWithCounts.reduce((sum, ride) => sum + ride.count, 0), [ridesWithCounts]);

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
        return <Login onLogin={handleLogin} operators={OPERATORS_ARRAY} ticketSalesPersonnel={TICKET_SALES_PERSONNEL_ARRAY} appLogo={appLogo} />;
    }
    
    const isManager = role === 'admin' || role === 'operation-officer';

    const renderView = () => {
        switch (currentView) {
            case 'reports': return <Reports dailyCounts={dailyCounts || {}} dailyRideDetails={dailyRideDetails || {}} rides={RIDES_ARRAY} />;
            case 'assignments': return <AssignmentView rides={RIDES_ARRAY} operators={OPERATORS_ARRAY} dailyAssignments={mergedAssignments || {}} onSave={handleSaveAssignments} selectedDate={selectedDate} attendance={attendanceArray} onSync={handleSyncAssignments} />;
            case 'expertise': return <ExpertiseReport operators={OPERATORS_ARRAY} dailyAssignments={mergedAssignments || {}} rides={RIDES_ARRAY} />;
            case 'roster': return <DailyRoster rides={ridesWithCounts} operators={OPERATORS_ARRAY} dailyAssignments={mergedAssignments || {}} selectedDate={selectedDate} onDateChange={handleDateChange} role={role} currentUser={currentUser} attendance={attendanceArray} onNavigate={handleNavigate} onCountChange={handleSaveCount} onShowModal={(modal, ride) => { setCurrentModal(modal); setSelectedRideForEdit(ride || null); }} onSaveAssignments={handleSaveAssignments} hasCheckedInToday={hasCheckedInToday} onClockIn={handleClockIn} isCheckinAllowed={isCheckinAllowed} />;
            case 'ts-assignments': return <TicketSalesAssignmentView counters={COUNTERS_ARRAY} ticketSalesPersonnel={TICKET_SALES_PERSONNEL_ARRAY} dailyAssignments={mergedTSAssignments || {}} onSave={handleSaveTSAssignments} selectedDate={selectedDate} attendance={attendanceArray} onSync={handleSyncAssignments} />;
            case 'ts-roster': return <TicketSalesRoster counters={COUNTERS_ARRAY} ticketSalesPersonnel={TICKET_SALES_PERSONNEL_ARRAY} dailyAssignments={mergedTSAssignments || {}} selectedDate={selectedDate} onDateChange={handleDateChange} role={role} currentUser={currentUser} attendance={attendanceArray} onNavigate={handleNavigate} onSaveAssignments={handleSaveTSAssignments} hasCheckedInToday={hasCheckedInToday} onClockIn={handleClockIn} isCheckinAllowed={isCheckinAllowed} />;
            case 'ts-expertise': return <TicketSalesExpertiseReport ticketSalesPersonnel={TICKET_SALES_PERSONNEL_ARRAY} dailyAssignments={mergedTSAssignments || {}} counters={COUNTERS_ARRAY} />;
            case 'history': return <HistoryLog history={history} onClearHistory={() => { if(window.confirm("Are you sure?")) { setHistory([]); logAction('CLEAR_HISTORY', 'Cleared the entire activity log.'); } }}/>;
            case 'my-sales': return <DailySalesEntry currentUser={currentUser} selectedDate={selectedDate} onDateChange={handleDateChange} packageSales={packageSalesData || {}} onSave={handleSavePackageSales} mySalesStartDate={mySalesStartDate} onMySalesStartDateChange={setMySalesStartDate} mySalesEndDate={mySalesEndDate} onMySalesEndDateChange={setMySalesEndDate} otherSalesCategories={otherSalesCategories} />;
            case 'sales-officer-dashboard': return <SalesOfficerDashboard ticketSalesPersonnel={TICKET_SALES_PERSONNEL_ARRAY} packageSales={packageSalesData || {}} startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} role={role} onEditSales={handleEditPackageSales} otherSalesCategories={otherSalesCategories} />;
            case 'dashboard': return <Dashboard ridesWithCounts={ridesWithCounts} operators={OPERATORS_ARRAY} attendance={attendanceArray} historyLog={history} onNavigate={handleNavigate} selectedDate={selectedDate} onDateChange={handleDateChange} dailyAssignments={mergedAssignments || {}} />;
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
        <Header onSearch={setSearchTerm} onSelectFloor={setSelectedFloor} selectedFloor={selectedFloor} role={role} currentUser={currentUser} onLogout={handleLogout} onNavigate={handleNavigate} onShowModal={setCurrentModal} currentView={currentView} connectionStatus={connectionStatus} appLogo={appLogo}/>
        <main className="container mx-auto p-4 md:p-6">{renderView()}</main>
        {isManager && currentView === 'counter' && <Footer title={`Total Guests for ${displayDate.toLocaleDateString()}`} count={totalGuests} onReset={() => { if (window.confirm("Are you sure you want to reset all of today's guest counts to zero?")) { setDailyCounts(prev => ({...prev, [selectedDate]: {}})); setDailyRideDetails(prev => ({...prev, [selectedDate]: {}})); logAction('RESET_COUNTS', `Reset all counts for ${selectedDate}.`); } }} showReset={true} gradient="bg-gradient-to-r from-purple-400 to-pink-600"/>}
        {currentModal === 'edit-image' && selectedRideForEdit && <EditImageModal ride={selectedRideForEdit} onClose={() => setCurrentModal(null)} onSave={(rideId, imageBase64) => { setRides(prev => ({...prev, [rideId]: {...(prev?.[rideId] || {}), imageUrl: imageBase64 }})); logAction('UPDATE_IMAGE', `Updated image for ride ID ${rideId}.`); setCurrentModal(null); }}/>}
        {currentModal === 'ai-assistant' && <CodeAssistant rides={RIDES_ARRAY} dailyCounts={dailyCounts || {}} onClose={() => setCurrentModal(null)}/>}
        {currentModal === 'operators' && <OperatorManager operators={OPERATORS_ARRAY} onClose={() => setCurrentModal(null)} onAddOperator={(name) => { /* Logic to be handled by dev */ }} onDeleteOperators={(ids) => { /* Logic to be handled by dev */ }} onImport={(newOperators, strategy) => { /* Logic to be handled by dev */ }}/>}
        {currentModal === 'backup' && <BackupManager onClose={() => setCurrentModal(null)} onExport={() => { const json = JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), data: { dailyCounts, dailyRideDetails, rides, operators, attendanceData, tsAssignments, history, packageSalesData, appLogo, otherSalesCategories, dailyAssignments }}, null, 2); const blob = new Blob([json], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `TFW_Backup_${new Date().toISOString().split('T')[0]}.json`; link.click(); logAction('EXPORT_BACKUP', 'Exported a full application backup.'); }} onImport={(json) => { if (window.confirm("WARNING: This will overwrite ALL current data. Are you sure?")) { try { const backupData = JSON.parse(json); if (backupData.version === 2 && backupData.data) { setDailyCounts(backupData.data.dailyCounts || {}); setDailyRideDetails(backupData.data.dailyRideDetails || {}); setRides(backupData.data.rides || RIDES); setOperators(backupData.data.operators || OPERATORS); setAttendanceData(backupData.data.attendanceData || {}); setTSAssignments(backupData.data.tsAssignments || {}); setHistory(backupData.data.history || []); setPackageSalesData(backupData.data.packageSalesData || {}); setAppLogo(backupData.data.appLogo || null); setOtherSalesCategories(backupData.data.otherSalesCategories || []); setDailyAssignments(backupData.data.dailyAssignments || {}); showNotification('Backup restored successfully!', 'success'); logAction('IMPORT_BACKUP', 'Restored data from a backup file.'); } else { alert("Invalid backup file format."); } } catch (e) { alert("Failed to parse backup file."); } } }} appLogo={appLogo} onLogoChange={setAppLogo} otherSalesCategories={otherSalesCategories} onRenameCategory={handleRenameOtherSalesCategory} onDeleteCategory={handleDeleteOtherSalesCategory} obsoleteRides={Object.values(rides || {}).map((r,i) => ({...r, id: Number(Object.keys(rides || {})[i])})).filter(r => !RIDES_ARRAY.some(staticRide => staticRide.id === r.id))} onRemoveObsoleteRides={handleRemoveObsoleteRides} estimatedDbSize={estimatedDbSize} onResetDay={handleResetDay} />}
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
