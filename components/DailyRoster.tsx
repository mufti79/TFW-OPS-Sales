
import React, { useMemo, useState, useEffect } from 'react';
import { Ride, Operator, AttendanceRecord, RideWithCount } from '../types';
import { Role } from '../hooks/useAuth';
import BriefingCheckin from './BriefingCheckin';
import SplitCounter from './SplitCounter';
import DeveloperAttribution from './DeveloperAttribution';

type View = 'counter' | 'reports' | 'assignments' | 'expertise' | 'roster';
type Modal = 'edit-image' | 'ai-assistant' | 'operators' | 'backup' | null;

// Manage Assignments Modal Component
interface ManageAssignmentsModalProps {
    ride: RideWithCount;
    allOperators: Operator[];
    assignedOperatorIds: number[];
    onClose: () => void;
    onSave: (rideId: number, newOperatorIds: number[]) => void;
    attendance: AttendanceRecord[];
    selectedDate: string;
}

const ManageAssignmentsModal: React.FC<ManageAssignmentsModalProps> = ({ ride, allOperators, assignedOperatorIds, onClose, onSave, attendance, selectedDate }) => {
    const [selectedIds, setSelectedIds] = useState<number[]>(assignedOperatorIds);
    
    // Sync selectedIds when assignedOperatorIds prop changes
    useEffect(() => {
        setSelectedIds(assignedOperatorIds);
    }, [assignedOperatorIds]);
    
    const attendanceStatusMap = useMemo(() => {
        const statusMap = new Map<number, boolean>();
        attendance
          .filter(record => record.date === selectedDate)
          .forEach(record => statusMap.set(record.operatorId, true));
        return statusMap;
    }, [attendance, selectedDate]);
      
    const handleToggle = (operatorId: number) => {
        setSelectedIds(prev => 
            prev.includes(operatorId) 
            ? prev.filter(id => id !== operatorId) 
            : [...prev, operatorId]
        );
    };

    const handleConfirm = () => {
        onSave(ride.id, selectedIds);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm border border-gray-700 animate-fade-in-up flex flex-col">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-100">Manage Assignments</h2>
                            <p className="text-purple-400 font-semibold">{ride.name}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Select operators to assign:</label>
                        {allOperators.sort((a, b) => a.name.localeCompare(b.name)).map(op => {
                            const isPresent = attendanceStatusMap.get(op.id);
                            const statusLabel = isPresent ? '(P)' : '(A)';
                            return (
                                <label key={op.id} className="flex items-center p-2 rounded-md hover:bg-gray-700 cursor-pointer" onMouseDown={(e) => e.stopPropagation()}>
                                    <input 
                                        type="checkbox"
                                        checked={selectedIds.includes(op.id)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            handleToggle(op.id);
                                        }}
                                        className="h-4 w-4 rounded bg-gray-900 border-gray-600 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="ml-3 text-gray-300">{op.name} {statusLabel}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
                
                <div className="bg-gray-700/50 px-6 py-4 flex justify-end gap-4 rounded-b-lg mt-auto">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 active:scale-95 transition-all">
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all"
                    >
                        Save Assignments
                    </button>
                </div>
            </div>
        </div>
    );
};

interface DailyRosterProps {
  rides: RideWithCount[];
  operators: Operator[];
  dailyAssignments: Record<string, Record<string, number[] | number>>;
  selectedDate: string;
  onDateChange: (date: string) => void;
  role: Exclude<Role, null>;
  currentUser: Operator | null;
  attendance: AttendanceRecord[];
  onNavigate: (view: View) => void;
  onCountChange: (rideId: number, newCount: number, details?: { tickets: number; packages: number }) => void;
  onShowModal: (modal: Modal, ride?: Ride) => void;
  onSaveAssignments: (date: string, assignments: Record<string, number[]>) => void;
  hasCheckedInToday: boolean;
  onClockIn: (attendedBriefing: boolean, briefingTime: string | null) => void;
  isCheckinAllowed: boolean;
  onSync?: () => Promise<void>;
}

interface RosterData {
  assignmentsByOperator: Map<number, RideWithCount[]>;
  unassignedRides: RideWithCount[];
  operatorsWithAttendance: (Operator & { attendance: AttendanceRecord | null; })[];
  presentCount: number;
  absentCount: number;
}

const DailyRoster: React.FC<DailyRosterProps> = ({ rides, operators, dailyAssignments, selectedDate, onDateChange, role, currentUser, attendance, onNavigate, onCountChange, onShowModal, onSaveAssignments, hasCheckedInToday, onClockIn, isCheckinAllowed, onSync }) => {
  const [manageModalInfo, setManageModalInfo] = useState<RideWithCount | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  // Track unsaved incremental counts for each ride (operator view only)
  const [unsavedCounts, setUnsavedCounts] = useState<Record<number, { tickets: number; packages: number }>>({});
  
  const formatTime = (timeStr: string | null): string => {
      if (!timeStr) return '';
      const [hours, minutes] = timeStr.split(':');
      let h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12; // the hour '0' should be '12'
      return `${h}:${minutes} ${ampm}`;
  };

  const { assignmentsByOperator, unassignedRides, operatorsWithAttendance, presentCount, absentCount } = useMemo<RosterData>(() => {
    const assignmentsToday: Record<string, any> = dailyAssignments[selectedDate] || {};
    const rideMap = new Map<string, RideWithCount>();
    rides.forEach(r => rideMap.set(r.id.toString(), r));
    
    const assignmentsByOperator = new Map<number, RideWithCount[]>();
    const assignedRideIds = new Set<string>();

    for (const [rideId, operatorIdValue] of Object.entries(assignmentsToday)) {
        const ride = rideMap.get(rideId);
        if (ride) {
          const operatorIds = Array.isArray(operatorIdValue) ? operatorIdValue : [operatorIdValue];
          operatorIds.forEach((operatorId: number) => {
            const operatorRides = assignmentsByOperator.get(operatorId);
            if (operatorRides) {
              operatorRides.push(ride);
            } else {
              assignmentsByOperator.set(operatorId, [ride]);
            }
          });
          assignedRideIds.add(rideId);
        }
    }
    
    for (const rideList of assignmentsByOperator.values()) {
      rideList.sort((a, b) => a.name.localeCompare(b.name));
    }

    const unassignedRides = rides
        .filter(r => !assignedRideIds.has(r.id.toString()))
        .sort((a, b) => a.name.localeCompare(b.name));
    
    const attendanceTodayMap = new Map<number, AttendanceRecord>();
    attendance
      .filter(record => record.date === selectedDate)
      .forEach(record => attendanceTodayMap.set(record.operatorId, record));

    const relevantOperators = (role === 'operator' && currentUser)
        ? operators.filter(op => op.id === currentUser.id)
        : operators;

    const operatorsWithAttendance = relevantOperators.map(op => ({
      ...op,
      attendance: attendanceTodayMap.get(op.id) || null
    })).sort((a, b) => {
        if (a.attendance && !b.attendance) return -1;
        if (!a.attendance && b.attendance) return 1;
        return a.name.localeCompare(b.name);
    });

    const presentCount = operatorsWithAttendance.filter(op => op.attendance).length;
    const absentCount = operatorsWithAttendance.length - presentCount;

    return { assignmentsByOperator, unassignedRides, operatorsWithAttendance, presentCount, absentCount };
  }, [dailyAssignments, selectedDate, rides, operators, attendance, role, currentUser]);
  
  const operatorExpertise = useMemo<{ name: string; count: number }[]>(() => {
    if (role !== 'operator' || !currentUser) {
        return [];
    }
    const rideIdToNameMap = new Map<string, string>(rides.map(r => [r.id.toString(), r.name]));
    const operatedRidesCount = new Map<string, number>();

    const allAssignments = Object.values(dailyAssignments) as Record<string, number | number[]>[];

    for (const assignments of allAssignments) {
        for (const [rideId, operatorIdValue] of Object.entries(assignments)) {
            const val = operatorIdValue as number | number[];
            const operatorIds = Array.isArray(val) ? val : [val];
            if (operatorIds.includes(currentUser.id)) {
                const rideName = rideIdToNameMap.get(rideId);
                if (rideName) {
                    operatedRidesCount.set(rideName, (operatedRidesCount.get(rideName) || 0) + 1);
                }
            }
        }
    }

    return Array.from(operatedRidesCount.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));
  }, [dailyAssignments, rides, currentUser, role]);

  const handleDownloadRoster = () => {
    if (operators.length === 0) {
        alert("No operator data to download.");
        return;
    }

    const headers = ['Operator Name', 'Checked In', 'Attended Briefing', 'Briefing Time', 'Assigned Rides'];
    
    const rows = operatorsWithAttendance.map((operator: Operator & { attendance: AttendanceRecord | null }) => {
        const assignedRides = assignmentsByOperator.get(operator.id);
        const rideNames = assignedRides ? assignedRides.map(r => r.name).join('; ') : 'N/A';
        
        const checkedIn = operator.attendance ? 'Yes' : 'No';
        let attendedBriefing = 'N/A';
        let briefingTime = 'N/A';

        if(operator.attendance) {
            attendedBriefing = operator.attendance.attendedBriefing ? 'Yes' : 'No';
            briefingTime = operator.attendance.attendedBriefing ? formatTime(operator.attendance.briefingTime) : 'N/A';
        }
        
        const operatorName = `"${operator.name.replace(/"/g, '""')}"`;
        const rideNamesCsv = `"${rideNames.replace(/"/g, '""')}"`;

        return [operatorName, checkedIn, attendedBriefing, briefingTime, rideNamesCsv].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `ToggiFunWorld_Roster_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAttendanceReport = () => {
    if (operatorsWithAttendance.length === 0) {
        alert("No operator data to download.");
        return;
    }

    const headers = ['Operator Name', 'Status', 'Briefing Attended', 'Briefing Time'];
    
    const rows = operatorsWithAttendance.map((operator: Operator & { attendance: AttendanceRecord | null }) => {
        const status = operator.attendance ? 'Present' : 'Absent';
        let attendedBriefing = 'N/A';
        let briefingTime = 'N/A';

        if(operator.attendance) {
            attendedBriefing = operator.attendance.attendedBriefing ? 'Yes' : 'No';
            briefingTime = operator.attendance.attendedBriefing ? formatTime(operator.attendance.briefingTime) : 'N/A';
        }
        
        const operatorName = `"${operator.name.replace(/"/g, '""')}"`;
        
        return [operatorName, status, attendedBriefing, briefingTime].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `ToggiFunWorld_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManageAssignmentsSave = (rideId: number, newOperatorIds: number[]) => {
    const currentAssignments = dailyAssignments[selectedDate] || {};
    
    // Normalize existing assignments to arrays
    const updatedAssignments: Record<string, number[]> = {};
    Object.entries(currentAssignments).forEach(([key, val]) => {
        updatedAssignments[key] = Array.isArray(val) ? val : [val];
    });

    const rideKey = String(rideId);
    if (newOperatorIds.length > 0) {
        updatedAssignments[rideKey] = newOperatorIds;
    } else {
        delete updatedAssignments[rideKey];
    }
    onSaveAssignments(selectedDate, updatedAssignments);
  };

  const getAssignedOperatorIds = (rideId: number): number[] => {
    const assignmentsToday = dailyAssignments[selectedDate] || {};
    const val = assignmentsToday[rideId.toString()];
    return Array.isArray(val) ? val : val ? [val] : [];
  };
  
  const handleSync = async () => {
    if (!onSync || isSyncing) return;
    
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const isRosterEmpty = operatorsWithAttendance.length === 0;
  const isManager = role === 'admin' || role === 'operation-officer';
  const hasAssignments = Object.keys(dailyAssignments[selectedDate] || {}).length > 0;

  const [year, month, day] = selectedDate.split('-').map(s => parseInt(s, 10));
  const displayDate = new Date(year, month - 1, day);

  if (role === 'operator' && currentUser) {
    if (!hasCheckedInToday) {
        if (isCheckinAllowed) {
            return <BriefingCheckin operatorName={currentUser.name} onClockIn={onClockIn} />;
        } else {
            return (
                <div className="w-full max-w-lg mx-auto bg-gray-800 p-8 rounded-lg shadow-lg border border-yellow-500 text-center animate-fade-in-up">
                    <h1 className="text-3xl font-bold text-yellow-400 mb-4">Check-in Closed for Today</h1>
                    <p className="text-lg text-gray-300">
                        The check-in window for today has closed at 10:00 PM.
                    </p>
                    <p className="text-lg text-gray-400 mt-2">
                        Check-in for the next day will be available after 12:00 AM.
                    </p>
                    <DeveloperAttribution />
                </div>
            );
        }
    }

    const myAssignedRides = assignmentsByOperator.get(currentUser.id) || [];
    const myAttendance = attendance.find(a => a.operatorId === currentUser.id && a.date === selectedDate);
    
    // Handle saving incremental counts (adds to existing counts)
    const handleSaveIncrement = (rideId: number) => {
        const increment = unsavedCounts[rideId];
        if (!increment) return;
        
        const ride = myAssignedRides.find(r => r.id === rideId);
        if (!ride) return;
        
        // Add the increment to the existing count
        const newTickets = (ride.details?.tickets || 0) + increment.tickets;
        const newPackages = (ride.details?.packages || 0) + increment.packages;
        
        // Validate that counts don't go negative
        if (newTickets < 0 || newPackages < 0) {
            alert('Cannot save: Total count cannot be negative. Please adjust your entry.');
            return;
        }
        
        const newTotal = newTickets + newPackages;
        
        onCountChange(rideId, newTotal, { tickets: newTickets, packages: newPackages });
        
        // Clear the unsaved increment for this ride
        setUnsavedCounts(prev => {
            const next = { ...prev };
            delete next[rideId];
            return next;
        });
    };
    
    // Handle counter changes (stores them as unsaved increments)
    const handleCounterChange = (rideId: number, tickets: number, packages: number) => {
        setUnsavedCounts(prev => ({
            ...prev,
            [rideId]: { tickets, packages }
        }));
    };
    
    return (
        <div className="flex flex-col">
            {/* Info banner explaining the save feature */}
            <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg" role="note" aria-label="Information about saving guest counts">
                <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                    <div className="text-sm text-gray-300">
                        <span className="font-semibold text-blue-400">How to Count Guests:</span> Use the + and - buttons to count new guests, then click "💾 Save & Add to Total" to add them to your saved count. Your counts are preserved when you log out and log back in.
                    </div>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        My Roster for {displayDate.toLocaleDateString()}
                    </h1>
                    {myAttendance && (
                       <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                            <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
                            <span>
                                Checked In: <span className="font-semibold text-gray-200">{formatTime(myAttendance.briefingTime)}</span>
                                ({myAttendance.attendedBriefing ? <span className="text-teal-300">Briefing</span> : <span className="text-yellow-400">No Briefing</span>})
                            </span>
                       </div>
                    )}
                </div>
                <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                    <label htmlFor="roster-date" className="text-sm font-medium text-gray-300">View Date:</label>
                    <input
                        id="roster-date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => onDateChange(e.target.value)}
                        className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                    />
                </div>
            </div>

            {myAssignedRides.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {myAssignedRides.map(ride => {
                        const hasUnsaved = !!unsavedCounts[ride.id];
                        const unsaved = unsavedCounts[ride.id] || { tickets: 0, packages: 0 };
                        const savedTickets = ride.details?.tickets || 0;
                        const savedPackages = ride.details?.packages || 0;
                        
                        return (
                      <div key={ride.id} className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-1 transition-all duration-300 flex flex-col group ${hasUnsaved ? 'border-2 border-yellow-500' : 'border border-gray-700'}`}>
                        <div className="relative">
                          <img src={ride.imageUrl} alt={ride.name} className="w-full h-48 object-cover" />
                           {isManager && (
                              <button 
                                  onClick={() => onShowModal('edit-image', ride)}
                                  className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label="Change ride picture"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                              </button>
                          )}
                          {hasUnsaved && (
                            <div className="absolute top-2 left-2 bg-yellow-500 text-gray-900 px-2 py-1 rounded-md text-xs font-bold animate-pulse">
                              Unsaved
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                          <div className="flex-grow">
                            <span className="inline-block bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full mb-2">
                              {ride.floor} Floor
                            </span>
                            <h3 className="text-xl font-bold text-gray-100">{ride.name}</h3>
                            {savedTickets > 0 || savedPackages > 0 ? (
                              <div className="mt-2 text-sm text-gray-400">
                                Saved: <span className="font-semibold text-green-400">{savedTickets + savedPackages}</span> guests
                                <span className="text-xs block">
                                  ({savedTickets} tickets, {savedPackages} packages)
                                </span>
                              </div>
                            ) : null}
                          </div>
                          <div className="mt-2">
                            <label className="text-xs text-gray-500 block mb-1">Add New Counts:</label>
                            <SplitCounter 
                              tickets={unsaved.tickets} 
                              packages={unsaved.packages} 
                              onChange={(t, p) => handleCounterChange(ride.id, t, p)} 
                            />
                          </div>
                          <button
                            onClick={() => handleSaveIncrement(ride.id)}
                            disabled={!hasUnsaved}
                            aria-disabled={!hasUnsaved}
                            aria-label={hasUnsaved ? 'Save and add counts to total' : 'No unsaved changes'}
                            className={`mt-3 w-full py-2 rounded-lg font-bold text-sm transition-all ${
                              hasUnsaved 
                                ? 'bg-green-600 hover:bg-green-700 text-white active:scale-95' 
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {hasUnsaved ? '💾 Save & Add to Total' : '✓ Saved'}
                          </button>
                        </div>
                      </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-bold text-gray-400">No Assignments Today</h2>
                    <p className="text-gray-500 mt-2">You have not been assigned to any rides or games for {displayDate.toLocaleDateString()}.</p>
                </div>
            )}
            
            {operatorExpertise.length > 0 && (
                 <div className="mt-12">
                    <h2 className="text-2xl font-bold text-pink-500 mb-4">My Expertise</h2>
                    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4">
                        <p className="text-gray-400 mb-4">Based on your assignment history, you have experience with the following rides/games:</p>
                        <ul className="columns-1 sm:columns-2 gap-x-6 text-gray-300">
                            {operatorExpertise.map(({ name, count }) => (
                                <li key={name} className="mb-2 flex justify-between items-center bg-gray-700/50 p-2 rounded-md break-inside-avoid">
                                    <span>{name}</span>
                                    <span className="ml-2 px-2.5 py-0.5 bg-purple-600 text-white text-xs font-semibold rounded-full">
                                        {count} {count > 1 ? 'days' : 'day'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
            
            <DeveloperAttribution />
        </div>
    );
  }

  return (
    <div className="flex flex-col">
      {isManager && (
        <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg" role="status" aria-label="Synchronization status information">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            <div className="text-sm text-gray-300 flex-grow">
              <span className="font-semibold text-blue-400">Sync Enabled:</span> Assignments made in TFW-NEW app automatically appear here. Operators will see their roster in real-time.
              {!hasAssignments && (
                <p className="mt-1 text-yellow-400">
                  ⚠️ No assignments found for {displayDate.toLocaleDateString()}. Use "Sync Now" to fetch from TFW-NEW or "Edit Assignments" to create new ones.
                </p>
              )}
            </div>
            {onSync && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`ml-2 px-3 py-1.5 text-xs font-bold rounded-md active:scale-95 transition-all ${
                  isSyncing 
                    ? 'bg-blue-400 text-white cursor-wait' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title="Manually fetch latest assignments from TFW-NEW app"
              >
                {isSyncing ? (
                  <span className="flex items-center gap-1">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Syncing...
                  </span>
                ) : (
                  '🔄 Sync Now'
                )}
              </button>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Daily Roster for {displayDate.toLocaleDateString()}
            </h1>
            {isManager && (
            <div className="flex items-center gap-6 mt-2 text-lg">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-green-400">Present:</span>
                    <span className="font-bold text-2xl text-gray-100">{presentCount}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-red-500">Absent:</span>
                    <span className="font-bold text-2xl text-gray-100">{absentCount}</span>
                </div>
            </div>
        )}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
           <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                <label htmlFor="roster-date" className="text-sm font-medium text-gray-300">Date:</label>
                <input
                    id="roster-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                />
            </div>
           {isManager && (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <div className="flex items-center gap-2 p-1 bg-gray-700/50 rounded-lg">
                  <button
                      onClick={handleDownloadAttendanceReport}
                      className="px-3 py-1.5 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 active:scale-95 transition-all text-sm"
                  >
                      DL Attendance
                  </button>
                  <button
                      onClick={handleDownloadRoster}
                      className="px-3 py-1.5 bg-green-800 text-white font-semibold rounded-md hover:bg-green-700 active:scale-95 transition-all text-sm"
                  >
                      DL Roster
                  </button>
                </div>
                <button
                  onClick={() => onNavigate('assignments')}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-sm"
                >
                  Edit Assignments
                </button>
              </div>
            )}
        </div>
      </div>
      {isRosterEmpty ? (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-400">No Operator Data Found</h2>
          <p className="text-gray-500 mt-2">Please add operators via the Operator Management panel.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {operatorsWithAttendance.map(operator => {
              const operatorAssignments = assignmentsByOperator.get(operator.id);

              // If operator is absent, render a simplified card.
              if (!operator.attendance) {
                return (
                  <div key={operator.id} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 flex flex-col justify-center">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-500">{operator.name}</h2>
                      <div className="flex items-center gap-2 text-sm font-semibold text-red-500">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span>Absent</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // If present, render the full card.
              return (
                <div key={operator.id} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-purple-400">{operator.name}</h2>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
                      <span className="text-green-400">Checked In</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 mb-4 h-5">
                    {operator.attendance && (
                      <p>
                        Checked In: <span className="font-semibold text-gray-200">{formatTime(operator.attendance.briefingTime)}</span>
                        ({operator.attendance.attendedBriefing ? <span className="text-teal-300">Briefing</span> : <span className="text-yellow-400">No Briefing</span>})
                      </p>
                    )}
                  </div>

                  <div className="flex-grow">
                    <h3 className="font-semibold text-gray-300 mb-2 border-t border-gray-700 pt-3">Assignments:</h3>
                    <ul className="space-y-2 text-sm">
                      {operatorAssignments && operatorAssignments.length > 0 ? (
                        operatorAssignments.map(ride => (
                          <li key={ride.id} className="text-gray-300 bg-gray-700/50 p-2 rounded-md">
                            <div className="flex justify-between items-center">
                              <div>
                                {ride.name} <span className="text-xs text-gray-500">({ride.floor} Fl)</span>
                              </div>
                              {isManager && (
                                <button 
                                  onClick={() => setManageModalInfo(ride)}
                                  className="px-2 py-1 text-xs bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 active:scale-95 transition-all"
                                >
                                  Manage
                                </button>
                              )}
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500 italic">No assignments for this date</li>
                      )}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {unassignedRides.length > 0 && isManager && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-pink-500 mb-4">Unassigned Rides & Games</h2>
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4">
                <ul className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-x-6">
                  {unassignedRides.map(ride => (
                    <li key={ride.id} className="text-gray-400 mb-2 break-inside-avoid">{ride.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
      
      {manageModalInfo && (
        <ManageAssignmentsModal
          ride={manageModalInfo}
          allOperators={operators}
          assignedOperatorIds={getAssignedOperatorIds(manageModalInfo.id)}
          onClose={() => setManageModalInfo(null)}
          onSave={handleManageAssignmentsSave}
          attendance={attendance}
          selectedDate={selectedDate}
        />
      )}
      
      <DeveloperAttribution />
    </div>
  );
};

export default DailyRoster;
