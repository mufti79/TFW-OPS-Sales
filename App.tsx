
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { RIDES, FLOORS, OPERATORS, TICKET_SALES_PERSONNEL, COUNTERS } from './constants';
import { RideWithCount, Ride, Operator, AttendanceRecord, Counter, CounterWithSales, HistoryRecord, HandoverRecord, PackageSalesRecord } from './types';
import { useAuth, Role } from './hooks/useAuth';
import useFirebaseSync from './hooks/useFirebaseSync';

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
import AttendanceCheckin from './components/AttendanceCheckin';
import KioskModeWrapper from './components/KioskModeWrapper';
import BackupManager from './components/BackupManager';
import TicketSalesView from './components/TicketSalesView';
import TicketSalesAssignmentView from './components/TicketSalesAssignmentView';
import TicketSalesRoster from './components/TicketSalesRoster';
import TicketSalesExpertiseReport from './components/TicketSalesExpertiseReport';
import HistoryLog from './components/HistoryLog';
import DailySalesEntry from './components/DailySalesEntry';
import SalesOfficerDashboard from './components/SalesOfficerDashboard';


type View = 'counter' | 'reports' | 'assignments' | 'expertise' | 'roster' | 'ticket-sales-dashboard' | 'ts-assignments' | 'ts-roster' | 'ts-expertise' | 'history' | 'my-sales' | 'sales-officer-dashboard';
type Modal = 'edit-image' | 'ai-assistant' | 'operators' | 'backup' | null;

const App: React.FC = () => {
    const { role, currentUser, login, logout } = useAuth();
    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

    const getInitialViewForRole = useCallback((r: Role): View => {
        if (r === 'sales-officer') {
            return 'sales-officer-dashboard';
        }
        if (r === 'ticket-sales') {
            return 'ts-roster';
        }
        if (r === 'operator') {
            return 'roster';
        }
        return 'counter'; // Default for admin, op officer
    }, []);

    // App State
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [currentView, setCurrentView] = useState<View>(() => getInitialViewForRole(role));
    const [modal, setModal] = useState<Modal>(null);
    const [selectedRideForModal, setSelectedRideForModal] = useState<Ride | null>(null);

    // Refs for detecting data updates
    // FIX: Provided an explicit initial value of `undefined` to the `useRef` hooks to resolve the "Expected 1 arguments, but got 0" error.
    const prevOperatorsRef = useRef<Operator[] | undefined>(undefined);
    const prevTicketSalesPersonnelRef = useRef<Operator[] | undefined>(undefined);

    // Firebase Synced State
    const [dailyCounts, setDailyCounts, l1] = useFirebaseSync<Record<string, Record<string, number>>>('data/dailyCounts', {});
    const [ticketSalesData, setTicketSalesData, l2] = useFirebaseSync<Record<string, Record<string, number>>>('data/ticketSalesData', {});
    const [rides, setRides, l3] = useFirebaseSync<Ride[]>('config/rides', RIDES);
    const [operators, setOperators, l4] = useFirebaseSync<Operator[]>('config/operators', OPERATORS);
    const [ticketSalesPersonnel, setTicketSalesPersonnel, l5] = useFirebaseSync<Operator[]>('config/ticketSalesPersonnel', TICKET_SALES_PERSONNEL);
    const [counters, , l6] = useFirebaseSync<Counter[]>('config/counters', COUNTERS);
    const [dailyAssignments, setDailyAssignments, l7] = useFirebaseSync<Record<string, Record<string, number>>>('data/operatorAssignments', {});
    const [ticketSalesAssignments, setTicketSalesAssignments, l8] = useFirebaseSync<Record<string, Record<string, number>>>('data/ticketSalesAssignments', {});
    const [attendance, setAttendance, l9] = useFirebaseSync<AttendanceRecord[]>('data/attendance', []);
    const [historyLog, setHistoryLog, l10] = useFirebaseSync<HistoryRecord[]>('data/historyLog', []);
    const [handovers, setHandovers, l11] = useFirebaseSync<HandoverRecord[]>('data/handovers', []);
    const [packageSales, setPackageSales, l12] = useFirebaseSync<PackageSalesRecord[]>('data/packageSales', []);
    
    const isFirebaseLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12;

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFloor, setSelectedFloor] = useState('');
    const [selectedDate, setSelectedDate] = useState(today);
    // Date range state for sales officer dashboard
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    // Date range state for my sales view
    const [mySalesStartDate, setMySalesStartDate] = useState(today);
    const [mySalesEndDate, setMySalesEndDate] = useState(today);


    // This effect ensures that when the role changes (login/logout),
    // the view is reset to the appropriate default for that role.
    useEffect(() => {
        setCurrentView(getInitialViewForRole(role));
    }, [role, getInitialViewForRole]);
    
    // Logger
    const logAction = useCallback((action: string, details: string) => {
        if (!currentUser) return;
        const newRecord: HistoryRecord = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            user: currentUser.name,
            action,
            details,
        };
        setHistoryLog(prev => [newRecord, ...prev].slice(0, 1000)); // Keep last 1000 records
    }, [currentUser, setHistoryLog]);

    const handleLogout = useCallback(() => {
        if (currentUser) {
            logAction('LOGOUT', `${currentUser.name} logged out.`);
        }
        logout();
    }, [currentUser, logAction, logout]);

    // Effect to handle live updates to core data, forcing a re-login.
    useEffect(() => {
        // The ref will be undefined on the first render.
        // On subsequent renders, we compare the current data with the previous.
        if (prevOperatorsRef.current && role) {
            // Simple but effective deep-ish compare for this data structure.
            if (JSON.stringify(prevOperatorsRef.current) !== JSON.stringify(operators)) {
                alert("The list of operators has been updated by an administrator. For security and data consistency, you will be logged out. Please log in again.");
                handleLogout();
            }
        }
        // Update the ref with the current data for the next render.
        prevOperatorsRef.current = operators;
    }, [operators, role, handleLogout]);

    useEffect(() => {
        if (prevTicketSalesPersonnelRef.current && role) {
            if (JSON.stringify(prevTicketSalesPersonnelRef.current) !== JSON.stringify(ticketSalesPersonnel)) {
                alert("The list of ticket sales personnel has been updated by an administrator. For security and data consistency, you will be logged out. Please log in again.");
                handleLogout();
            }
        }
        prevTicketSalesPersonnelRef.current = ticketSalesPersonnel;
    }, [ticketSalesPersonnel, role, handleLogout]);

    // Derived State
    const ridesWithCounts = useMemo<RideWithCount[]>(() => {
        const countsForToday = dailyCounts[today] || {};
        return rides.map(ride => ({
            ...ride,
            count: countsForToday[ride.id] || 0,
        }));
    }, [rides, dailyCounts, today]);

    const countersWithSales = useMemo<CounterWithSales[]>(() => {
        const salesForToday = ticketSalesData[today] || {};
        return counters.map(counter => ({
            ...counter,
            sales: salesForToday[counter.id] || 0,
        }));
    }, [counters, ticketSalesData, today]);

    const filteredRides = useMemo(() => {
        return ridesWithCounts.filter(ride => {
            const matchesSearch = ride.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFloor = !selectedFloor || ride.floor === selectedFloor;
            return matchesSearch && matchesFloor;
        });
    }, [ridesWithCounts, searchTerm, selectedFloor]);

    const totalGuests = useMemo(() => {
        return Object.values(dailyCounts[today] || {}).reduce((sum, count) => sum + count, 0);
    }, [dailyCounts, today]);

    const totalSales = useMemo(() => {
        return Object.values(ticketSalesData[today] || {}).reduce((sum, count) => sum + count, 0);
    }, [ticketSalesData, today]);

    const hasCheckedInToday = useMemo(() => {
        if (!currentUser) return false;
        return attendance.some(a => a.operatorId === currentUser.id && a.date === today);
    }, [currentUser, attendance, today]);

    // Handlers
    const handleLogin = (
        newRole: 'admin' | 'operator' | 'operation-officer' | 'ticket-sales' | 'sales-officer',
        payload?: string | Operator
    ): boolean => {
        const success = login(newRole, payload);
        if (success) {
            const user = typeof payload === 'object' ? payload : { name: newRole.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) };
            const record: HistoryRecord = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                user: user.name,
                action: 'LOGIN',
                details: `${user.name} logged in as ${newRole}.`,
            };
            setHistoryLog(prev => [record, ...prev]);
        }
        return success;
    };

    const handleCountChange = (rideId: number, newCount: number) => {
        const rideName = rides.find(r => r.id === rideId)?.name || 'Unknown Ride';
        const oldCount = dailyCounts[selectedDate]?.[rideId] || 0; // Use selectedDate for accuracy on roster view

        if (oldCount === newCount) return;

        setDailyCounts(prev => {
            const newDailyCounts = { ...prev };
            const dateCounts = { ...(newDailyCounts[selectedDate] || {}) };
            dateCounts[rideId] = newCount;
            newDailyCounts[selectedDate] = dateCounts;
            return newDailyCounts;
        });

        logAction('GUEST_COUNT_UPDATE', `Set count for '${rideName}' from ${oldCount} to ${newCount}.`);
    };

    const handleSalesChange = (counterId: number, newCount: number) => {
        const counterName = counters.find(c => c.id === counterId)?.name || 'Unknown Counter';
        const oldSales = ticketSalesData[today]?.[counterId] || 0;

        if (oldSales === newCount) return;

        setTicketSalesData(prev => {
            const newSalesData = { ...prev };
            const todaySales = { ...(newSalesData[today] || {}) };
            todaySales[counterId] = newCount;
            newSalesData[today] = todaySales;
            return newSalesData;
        });
        
        logAction('SALES_COUNT_UPDATE', `Set sales for '${counterName}' from ${oldSales} to ${newCount}.`);
    };

    const handleResetCounts = () => {
        if (window.confirm("Are you sure you want to reset all of today's guest counts to zero? This cannot be undone.")) {
            setDailyCounts(prev => {
                const newDailyCounts = { ...prev };
                newDailyCounts[today] = {};
                return newDailyCounts;
            });
            logAction('RESET_GUEST_COUNTS', `Reset all guest counts for ${today}.`);
        }
    };

    const handleResetSales = () => {
        if (window.confirm("Are you sure you want to reset all of today's ticket sales to zero? This cannot be undone.")) {
            setTicketSalesData(prev => {
                const newSalesData = { ...prev };
                newSalesData[today] = {};
                return newSalesData;
            });
            logAction('RESET_SALES_COUNTS', `Reset all ticket sales for ${today}.`);
        }
    };
    
    const handleSaveImage = useCallback(async (rideId: number, imageBase64: string) => {
        try {
            // The imageBase64 is a data URL from the modal, ready to be used as an image source.
            setRides(prevRides => prevRides.map(r => r.id === rideId ? { ...r, imageUrl: imageBase64 } : r));
            logAction('UPDATE_RIDE_IMAGE', `Updated image for ride: '${rides.find(r => r.id === rideId)?.name}'.`);
            setModal(null);
        } catch (error) {
            console.error("Failed to save image", error);
            alert("Error saving image. Please try again.");
        }
    }, [setRides, rides, logAction]);
    
    const handleClockIn = useCallback((attendedBriefing: boolean, briefingTime: string | null) => {
        if (!currentUser) return;
        const newRecord: AttendanceRecord = {
            operatorId: currentUser.id,
            date: today,
            attendedBriefing,
            briefingTime,
        };
        setAttendance(prev => [...prev.filter(a => !(a.operatorId === currentUser.id && a.date === today)), newRecord]);
        
        const record: HistoryRecord = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            user: currentUser.name,
            action: 'ATTENDANCE_CHECKIN',
            details: `${currentUser.name} checked in. Briefing: ${attendedBriefing ? 'Yes' : 'No'}.`
        };
        setHistoryLog(prev => [record, ...prev]);

    }, [currentUser, today, setAttendance, setHistoryLog]);

    const handleSavePackageSales = useCallback((salesData: Omit<PackageSalesRecord, 'date' | 'personnelId'>) => {
        if (!currentUser) return;
        
        const newRecord: PackageSalesRecord = {
            ...salesData,
            date: selectedDate,
            personnelId: currentUser.id,
        };

        setPackageSales(prev => {
            const index = prev.findIndex(r => r.date === selectedDate && r.personnelId === currentUser.id);
            if (index > -1) {
                const updated = [...prev];
                updated[index] = newRecord;
                return updated;
            }
            return [...prev, newRecord];
        });
        
        logAction('PACKAGE_SALES_UPDATE', `${currentUser.name} updated package sales for ${selectedDate}.`);
        alert('Sales data saved successfully!');
    }, [currentUser, selectedDate, setPackageSales, logAction]);

    const handleNavigate = (view: View) => {
        setCurrentView(view);
        setSearchTerm('');
        setSelectedFloor('');
    };

    const handleShowModal = (modalType: Modal, ride?: Ride) => {
        if (ride) setSelectedRideForModal(ride);
        setModal(modalType);
    };

    const handleToggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullScreen(true);
        } else {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    }, []);

    const handleSaveOperators = (newOperators: Operator[]) => {
        setOperators(newOperators);
        logAction('UPDATE_OPERATORS', `Operator list updated. Total operators: ${newOperators.length}.`);
    };

    const handleImportOperators = (newOperators: Operator[], strategy: 'merge' | 'replace') => {
        logAction('IMPORT_OPERATORS', `Imported operators with strategy: '${strategy}'.`);
        if (strategy === 'replace') {
            const newWithIds = newOperators.map((op, index) => ({ ...op, id: index + 1 }));
            setOperators(newWithIds);
            setDailyAssignments({});
            setAttendance([]);
        } else {
             setOperators(prev => {
                const existingNames = new Set(prev.map(op => op.name.toLowerCase()));
                let maxId = prev.reduce((max, op) => Math.max(op.id, max), 0);
                const merged = [...prev];
                newOperators.forEach(op => {
                    if (!existingNames.has(op.name.toLowerCase())) {
                        maxId++;
                        merged.push({ id: maxId, name: op.name });
                    }
                });
                return merged;
            });
        }
    };

    const handleSaveAssignments = (date: string, assignmentsForDate: Record<string, number>) => {
        setDailyAssignments(prev => ({
            ...prev,
            [date]: assignmentsForDate
        }));
        logAction('SAVE_ASSIGNMENTS', `Operator assignments saved for ${date}.`);
    };
    
    const handleSaveTicketSalesAssignments = (date: string, assignmentsForDate: Record<string, number>) => {
        setTicketSalesAssignments(prev => ({
            ...prev,
            [date]: assignmentsForDate
        }));
        logAction('SAVE_TS_ASSIGNMENTS', `Ticket sales assignments saved for ${date}.`);
    };

    const handleReassignTicketSales = (counterId: number, newPersonnelId: number) => {
        const assignmentsForToday = ticketSalesAssignments[today] || {};
        const oldPersonnelId = assignmentsForToday[counterId];

        if (oldPersonnelId === newPersonnelId || !currentUser) return;

        const counterName = counters.find(c => c.id === counterId)?.name || 'Unknown Counter';
        const newPersonnel = ticketSalesPersonnel.find(p => p.id === newPersonnelId);
        const oldPersonnel = ticketSalesPersonnel.find(p => p.id === oldPersonnelId);
        
        // Log handover
        const newHandover: HandoverRecord = {
            id: Date.now(),
            date: today,
            timestamp: new Date().toISOString(),
            counterId: counterId,
            fromPersonnelId: oldPersonnelId,
            fromPersonnelName: oldPersonnel?.name || 'N/A',
            toPersonnelId: newPersonnelId,
            toPersonnelName: newPersonnel?.name || 'Unknown',
            assignerName: currentUser.name,
        };
        setHandovers(prev => [newHandover, ...prev].slice(0, 500)); // Keep last 500 handovers

        // Update current assignment state
        setTicketSalesAssignments(prev => {
            const newAssignments = { ...prev };
            const todayAssignments = { ...(newAssignments[today] || {}) };
            todayAssignments[counterId] = newPersonnelId;
            newAssignments[today] = todayAssignments;
            return newAssignments;
        });

        // Log to general history
        logAction('REASSIGN_TICKET_SALES', `${currentUser.name} reassigned '${counterName}' from '${oldPersonnel?.name || 'N/A'}' to '${newPersonnel?.name || 'Unknown'}'.`);
    };

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to permanently delete all history logs? This action cannot be undone.")) {
            setHistoryLog([]);
        }
    };

    // Main Render Logic
    if (isFirebaseLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-2xl">Syncing Data...</div>;
    }

    if (!role || !currentUser) {
        return <Login 
            onLogin={handleLogin} 
            isFullscreen={isFullScreen} 
            onToggleFullscreen={handleToggleFullscreen}
            operators={operators}
            ticketSalesPersonnel={ticketSalesPersonnel}
        />;
    }
    
    if ((role === 'operator' || role === 'ticket-sales') && !hasCheckedInToday) {
        return <AttendanceCheckin operatorName={currentUser.name} onClockIn={handleClockIn} />;
    }

    const renderContent = () => {
        switch (currentView) {
            case 'reports':
                return <Reports dailyCounts={dailyCounts} rides={rides} />;
            case 'assignments':
                return <AssignmentView rides={rides} operators={operators} dailyAssignments={dailyAssignments} onSave={handleSaveAssignments} selectedDate={selectedDate} attendance={attendance} />;
            case 'expertise':
                return <ExpertiseReport operators={operators} dailyAssignments={dailyAssignments} rides={rides} />;
            case 'roster':
                const ridesForRoster = rides.map(ride => ({
                    ...ride,
                    count: dailyCounts[selectedDate]?.[ride.id] || 0,
                }));
                return <DailyRoster 
                    rides={ridesForRoster} 
                    operators={operators} 
                    dailyAssignments={dailyAssignments} 
                    selectedDate={selectedDate} 
                    onDateChange={setSelectedDate} 
                    role={role} 
                    currentUser={currentUser} 
                    attendance={attendance} 
                    onNavigate={handleNavigate}
                    onCountChange={handleCountChange}
                    onShowModal={handleShowModal}
                />;
            case 'ticket-sales-dashboard':
                return <TicketSalesView countersWithSales={countersWithSales} onSalesChange={handleSalesChange} />;
            case 'ts-assignments':
                return <TicketSalesAssignmentView counters={counters} ticketSalesPersonnel={ticketSalesPersonnel} dailyAssignments={ticketSalesAssignments} onSave={handleSaveTicketSalesAssignments} selectedDate={selectedDate} attendance={attendance} />;
            case 'ts-roster':
                return <TicketSalesRoster counters={counters} ticketSalesPersonnel={ticketSalesPersonnel} dailyAssignments={ticketSalesAssignments} selectedDate={selectedDate} onDateChange={setSelectedDate} role={role} currentUser={currentUser} attendance={attendance} onNavigate={handleNavigate} onReassign={handleReassignTicketSales} handovers={handovers} />;
            case 'ts-expertise':
                return <TicketSalesExpertiseReport ticketSalesPersonnel={ticketSalesPersonnel} dailyAssignments={ticketSalesAssignments} counters={counters}/>;
            case 'history':
                return <HistoryLog history={historyLog} onClearHistory={handleClearHistory} />;
            case 'my-sales':
                 return <DailySalesEntry 
                    currentUser={currentUser!}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    packageSales={packageSales}
                    onSave={handleSavePackageSales}
                    mySalesStartDate={mySalesStartDate}
                    onMySalesStartDateChange={setMySalesStartDate}
                    mySalesEndDate={mySalesEndDate}
                    onMySalesEndDateChange={setMySalesEndDate}
                 />;
            case 'sales-officer-dashboard':
                return <SalesOfficerDashboard
                    ticketSalesPersonnel={ticketSalesPersonnel}
                    packageSales={packageSales}
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                />;
            case 'counter':
            default:
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredRides.map(ride => (
                            <RideCard
                                key={ride.id}
                                ride={ride}
                                onCountChange={handleCountChange}
                                role={role}
                                onChangePicture={() => handleShowModal('edit-image', ride)}
                            />
                        ))}
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {(role === 'operator' || role === 'ticket-sales') && <KioskModeWrapper />}
            <Header
                onSearch={setSearchTerm}
                onSelectFloor={setSelectedFloor}
                selectedFloor={selectedFloor}
                role={role}
                currentUser={currentUser}
                onLogout={handleLogout}
                onNavigate={handleNavigate}
                onShowModal={handleShowModal}
                currentView={currentView}
            />
            <main className="container mx-auto p-4 flex-grow">
                {renderContent()}
            </main>
            {currentView === 'counter' && (
                <Footer 
                    title="Total Guests Today"
                    count={totalGuests}
                    showReset={role === 'admin'}
                    onReset={handleResetCounts}
                    gradient="bg-gradient-to-r from-purple-400 to-pink-600"
                />
            )}
            {currentView === 'ticket-sales-dashboard' && (
                <Footer
                    title="Total Ticket Sales Today"
                    count={totalSales}
                    showReset={role === 'admin' || role === 'sales-officer'}
                    onReset={handleResetSales}
                    gradient="bg-gradient-to-r from-teal-400 to-cyan-500"
                />
            )}

            {/* Modals */}
            {modal === 'edit-image' && selectedRideForModal && (
                <EditImageModal ride={selectedRideForModal} onClose={() => setModal(null)} onSave={handleSaveImage} />
            )}
            {modal === 'ai-assistant' && (
                <CodeAssistant rides={rides} dailyCounts={dailyCounts} onClose={() => setModal(null)} />
            )}
            {modal === 'operators' && (
                <OperatorManager operators={operators} onClose={() => setModal(null)} onSave={handleSaveOperators} onImport={handleImportOperators} />
            )}
            {/* The BackupManager is no longer needed with real-time sync */}
        </div>
    );
};

export default App;
