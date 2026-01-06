
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Ride, Operator, AttendanceRecord, RideWithCount } from '../types';
import { Role } from '../hooks/useAuth';
import SplitCounter from './SplitCounter';
import DeveloperAttribution from './DeveloperAttribution';
import { useNotification } from '../imageStore';

// XLSX is loaded from CDN script tag in index.html
declare var XLSX: any;

// Constants
const DOWNLOAD_CLEANUP_DELAY_MS = 100; // Delay before removing download link from DOM

type View = 'counter' | 'reports' | 'assignments' | 'expertise' | 'roster' | 'ticket-sales-dashboard' | 'ts-assignments' | 'ts-roster' | 'ts-expertise' | 'history' | 'my-sales' | 'sales-officer-dashboard' | 'dashboard' | 'management-hub' | 'floor-counts' | 'security-entry';
type Modal = 'edit-image' | 'ai-assistant' | 'operators' | 'backup' | null;

// Troubleshooting steps for when operators don't see assignments
const ASSIGNMENT_TROUBLESHOOTING_STEPS = [
  'Ask your manager to check if assignments were imported for the correct date',
  'Verify your name in the roster file matches exactly',
  'Try logging out and logging back in',
  'Check with your manager if using the TFW-NEW app to make assignments'
] as const;

// Manage Assignments Component - Simplified Direct Assignment Interface
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
    const [autoSaved, setAutoSaved] = useState<boolean>(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoSavedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasPendingSave = useRef<boolean>(false);
    
    // Sync selectedIds when assignedOperatorIds prop changes, but only if no pending save
    // This prevents Firebase sync from overwriting local changes before they're saved
    useEffect(() => {
        if (!hasPendingSave.current) {
            setSelectedIds(assignedOperatorIds);
        }
    }, [assignedOperatorIds]);
    
    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                hasPendingSave.current = false;
            }
            if (autoSavedTimeoutRef.current) {
                clearTimeout(autoSavedTimeoutRef.current);
            }
        };
    }, []);
    
    const attendanceStatusMap = useMemo(() => {
        const statusMap = new Map<number, boolean>();
        attendance
          .filter(record => record.date === selectedDate)
          .forEach(record => statusMap.set(record.operatorId, true));
        return statusMap;
    }, [attendance, selectedDate]);
    
    const autoSaveChanges = (newSelectedIds: number[]) => {
        setAutoSaved(false);
        hasPendingSave.current = true;
        
        // Clear any existing save timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        if (autoSavedTimeoutRef.current) {
            clearTimeout(autoSavedTimeoutRef.current);
        }
        
        // Auto-save after 500ms
        saveTimeoutRef.current = setTimeout(() => {
            onSave(ride.id, newSelectedIds);
            hasPendingSave.current = false;
            setAutoSaved(true);
            autoSavedTimeoutRef.current = setTimeout(() => setAutoSaved(false), 2000);
        }, 500);
    };
      
    const handleAddOperator = (operatorId: number) => {
        const newSelectedIds = [...selectedIds, operatorId];
        setSelectedIds(newSelectedIds);
        autoSaveChanges(newSelectedIds);
    };

    const handleRemoveOperator = (operatorId: number) => {
        const newSelectedIds = selectedIds.filter(id => id !== operatorId);
        setSelectedIds(newSelectedIds);
        autoSaveChanges(newSelectedIds);
    };

    const availableOperators = allOperators
        .filter(op => !selectedIds.includes(op.id))
        .sort((a, b) => {
            // Present operators first
            const aPresent = attendanceStatusMap.get(a.id);
            const bPresent = attendanceStatusMap.get(b.id);
            if (aPresent && !bPresent) return -1;
            if (!aPresent && bPresent) return 1;
            return (a.name || '').localeCompare(b.name || '');
        });

    const assignedOperators = allOperators
        .filter(op => selectedIds.includes(op.id))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl border border-gray-700 animate-fade-in-up flex flex-col max-h-[90vh]">
                <div className="p-6 flex-shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-grow">
                            <h2 className="text-2xl font-bold text-gray-100">Assign Operators</h2>
                            <p className="text-purple-400 font-semibold">{ride.name}</p>
                            {autoSaved && (
                                <p className="text-green-400 text-sm mt-1 animate-pulse">
                                    ✓ Auto-saved!
                                </p>
                            )}
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="mb-3 p-2 bg-blue-900/30 border border-blue-700/50 rounded text-xs text-blue-300">
                        💡 <strong>Tip:</strong> Click "+" to assign an operator, "×" to remove. Changes are auto-saved.
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto px-6">
                    {/* Assigned Operators Section */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-300 mb-2">
                            Assigned Operators ({assignedOperators.length})
                        </h3>
                        {assignedOperators.length > 0 ? (
                            <div className="space-y-2">
                                {assignedOperators.map(op => {
                                    const isPresent = attendanceStatusMap.get(op.id);
                                    const statusLabel = isPresent ? '(Present)' : '(Absent)';
                                    return (
                                        <div 
                                            key={op.id} 
                                            className="flex items-center justify-between p-3 bg-purple-900/30 border border-purple-600 rounded-md"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${isPresent ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                                                <span className="text-gray-200 font-medium">{op.name}</span>
                                                <span className="text-xs text-gray-400">{statusLabel}</span>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveOperator(op.id)}
                                                className="px-3 py-1 text-sm bg-red-600 text-white font-bold rounded hover:bg-red-700 active:scale-95 transition-all"
                                                aria-label={`Remove ${op.name}`}
                                            >
                                                × Remove
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500 italic">
                                No operators assigned yet
                            </div>
                        )}
                    </div>
                    
                    {/* Available Operators Section */}
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-300 mb-2">
                            Available Operators ({availableOperators.length})
                        </h3>
                        {availableOperators.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {availableOperators.map(op => {
                                    const isPresent = attendanceStatusMap.get(op.id);
                                    const statusLabel = isPresent ? '(Present)' : '(Absent)';
                                    return (
                                        <div 
                                            key={op.id} 
                                            className="flex items-center justify-between p-3 bg-gray-700/50 rounded-md hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${isPresent ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                                                <span className="text-gray-300">{op.name}</span>
                                                <span className="text-xs text-gray-500">{statusLabel}</span>
                                            </div>
                                            <button
                                                onClick={() => handleAddOperator(op.id)}
                                                className="px-3 py-1 text-sm bg-green-600 text-white font-bold rounded hover:bg-green-700 active:scale-95 transition-all"
                                                aria-label={`Assign ${op.name}`}
                                            >
                                                + Assign
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500 italic">
                                All operators have been assigned
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="bg-gray-700/50 px-6 py-4 flex justify-between items-center rounded-b-lg flex-shrink-0">
                    <p className="text-xs text-gray-400">
                        {assignedOperators.length === 0 && 'No operators assigned'}
                        {assignedOperators.length === 1 && '1 operator assigned'}
                        {assignedOperators.length > 1 && `${assignedOperators.length} operators assigned`}
                    </p>
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-lg"
                        aria-label="Close"
                    >
                        ✓ Done
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();
  
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
    
    // Debug logging for diagnosing "No Assignments Today" issue
    // Helps verify that assignments are being loaded correctly from Firebase
    if (import.meta.env.DEV) {
      console.log('📋 DailyRoster - Processing assignments:', {
        date: selectedDate,
        assignmentsForDate: Object.keys(assignmentsToday).length,
        sampleAssignment: Object.entries(assignmentsToday)[0],
        allDates: Object.keys(dailyAssignments)
      });
    }
    
    const rideMap = new Map<string, RideWithCount>();
    rides.forEach(r => rideMap.set(r.id.toString(), r));
    
    const assignmentsByOperator = new Map<number, RideWithCount[]>();
    const assignedRideIds = new Set<string>();

    for (const [rideId, operatorIdValue] of Object.entries(assignmentsToday)) {
        const ride = rideMap.get(rideId);
        if (ride) {
          const operatorIds = Array.isArray(operatorIdValue) ? operatorIdValue : [operatorIdValue];
          
          // Debug logging for assignment processing
          if (import.meta.env.DEV && Object.keys(assignmentsToday).length > 0) {
            console.log('🎢 Processing assignment:', {
              rideId,
              rideName: ride.name,
              operatorIds,
              operatorIdType: typeof operatorIds[0]
            });
          }
          
          // Convert operator IDs to numbers to ensure type consistency
          // Firebase sometimes returns IDs as strings, which causes lookup failures
          operatorIds.forEach((operatorId: string | number) => {
            const numericOperatorId = typeof operatorId === 'number' ? operatorId : Number(operatorId);
            // Skip invalid IDs (NaN) to prevent silent failures
            if (isNaN(numericOperatorId)) {
              console.warn(`Invalid operator ID in assignments: ${operatorId}`);
              return;
            }
            const operatorRides = assignmentsByOperator.get(numericOperatorId);
            if (operatorRides) {
              operatorRides.push(ride);
            } else {
              assignmentsByOperator.set(numericOperatorId, [ride]);
            }
          });
          assignedRideIds.add(rideId);
        }
    }
    
    for (const rideList of assignmentsByOperator.values()) {
      rideList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    const unassignedRides = rides
        .filter(r => !assignedRideIds.has(r.id.toString()))
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
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
        return (a.name || '').localeCompare(b.name || '');
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
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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

  /**
   * Alternative roster download method using Data URI approach.
   * This method provides better compatibility with older browsers and devices
   * that may have issues with Blob-based downloads due to security restrictions.
   * 
   * Uses Data URI encoding instead of Blob API to bypass potential browser restrictions.
   * Includes enhanced error handling and user feedback via notifications.
   * 
   * @remarks
   * - Better compatibility with mobile devices and older browsers
   * - Works around strict Content Security Policy restrictions
   * - Provides clear success/error feedback to users
   * - Performs same CSV generation as primary method
   */
  const handleDownloadRosterAlternative = () => {
    if (operators.length === 0) {
        showNotification('No operator data to download.', 'error');
        return;
    }

    try {
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
      
      // Use Data URI approach instead of Blob for better compatibility
      const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      const link = document.createElement('a');
      link.href = encodedUri;
      link.download = `ToggiFunWorld_Roster_${selectedDate}.csv`;
      
      // Some browsers require the link to be in the document
      document.body.appendChild(link);
      link.click();
      
      // Clean up - remove link after brief delay to ensure download starts
      setTimeout(() => {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
      }, DOWNLOAD_CLEANUP_DELAY_MS);
      
      showNotification('Roster downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading roster:', error);
      showNotification('Failed to download roster. Please try again.', 'error');
    }
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
    const ids = Array.isArray(val) ? val : val ? [val] : [];
    // Convert to numbers to ensure type consistency (Firebase may return strings)
    return ids.map((id: string | number) => typeof id === 'number' ? id : Number(id))
              .filter((id: number) => !isNaN(id)); // Filter out invalid IDs
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

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
      showNotification('Excel library is not loaded. Please check your internet connection and reload the page.', 'error', 8000);
      console.error('XLSX library not available. It may have been blocked by an ad blocker or failed to load from CDN.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const rideNameMap = new Map(rides.map(r => [r.name.toLowerCase(), r.id]));
        const operatorNameMap = new Map(operators.map(o => [o.name.toLowerCase(), o.id]));

        let successCount = 0;
        const errors: string[] = [];
        const currentAssignments = dailyAssignments[selectedDate] || {};
        
        // Normalize existing assignments to arrays
        const newAssignments: Record<string, number[]> = {};
        Object.entries(currentAssignments).forEach(([key, val]) => {
          newAssignments[key] = Array.isArray(val) ? val : [val];
        });
        
        // Track which rides are being imported to replace their assignments
        const importedRideAssignments: Record<string, number[]> = {};

        const dataRows = json.slice(1);

        dataRows.forEach((row, index) => {
          const rideName = String(row[0] ?? '').trim().toLowerCase();
          const operatorNamesStr = String(row[1] ?? '').trim();
          
          if (!rideName || !operatorNamesStr) return;

          const rideId = rideNameMap.get(rideName);
          if (!rideId) {
            errors.push(`Row ${index + 2}: Ride "${String(row[0])}" not found.`);
            return;
          }

          const operatorNames = operatorNamesStr.split(',').map(name => name.trim());
          const operatorIds: number[] = [];
          
          operatorNames.forEach((originalName, idx) => {
              const name = originalName.toLowerCase();
              const opId = operatorNameMap.get(name);
              if (opId) {
                  operatorIds.push(opId);
              } else {
                  errors.push(`Row ${index + 2}: Operator "${originalName}" not found.`);
              }
          });

          if (operatorIds.length > 0) {
              // For rides in import file, accumulate operators from all rows (don't append to existing)
              const rideKey = String(rideId);
              importedRideAssignments[rideKey] = [...(importedRideAssignments[rideKey] || []), ...operatorIds];
              successCount++;
          }
        });
        
        // Replace assignments for imported rides, removing duplicates
        Object.entries(importedRideAssignments).forEach(([rideKey, operatorIds]) => {
          newAssignments[rideKey] = Array.from(new Set<number>(operatorIds));
        });

        // Automatically save imported assignments to Firebase
        onSaveAssignments(selectedDate, newAssignments);
        
        // Debug logging for troubleshooting assignment visibility issues
        if (import.meta.env.DEV) {
          console.log('📥 CSV Import completed in DailyRoster:', {
            date: selectedDate,
            totalRows: successCount,
            assignments: Object.keys(newAssignments).length,
            sampleAssignment: Object.entries(newAssignments)[0]
          });
        }

        if (errors.length > 0) {
          showNotification(`${successCount} assignment rows imported and saved successfully, but with errors. Check console for details.`, 'warning', 8000);
          console.warn("Import errors:", errors);
        } else {
          showNotification(`${successCount} assignment rows imported and saved successfully! Assignments are now visible in the roster below and operators can view them.`, 'success', 6000);
        }

      } catch (error) {
        console.error("Error parsing Excel file:", error);
        showNotification("Failed to parse file. Check format.", 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const isRosterEmpty = operatorsWithAttendance.length === 0;
  const isManager = role === 'admin' || role === 'operation-officer';
  const hasAssignments = Object.keys(dailyAssignments[selectedDate] || {}).length > 0;

  const [year, month, day] = selectedDate.split('-').map(s => parseInt(s, 10));
  const displayDate = new Date(year, month - 1, day);

  if (role === 'operator' && currentUser) {
    // Debug logging for operator view
    if (import.meta.env.DEV) {
      console.log('👤 Operator View:', {
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        selectedDate,
        assignmentsForOperator: assignmentsByOperator.get(currentUser.id),
        totalAssignmentsByOperator: assignmentsByOperator.size,
        allOperatorIds: Array.from(assignmentsByOperator.keys())
      });
    }
    
    // Auto check-in operator when viewing roster if not already checked in
    if (!hasCheckedInToday) {
        // Automatically mark attendance with briefing attended set to true and current time
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;
        onClockIn(true, currentTime);
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
                    <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg max-w-md mx-auto text-left">
                        <p className="text-sm text-blue-300 font-semibold mb-2">If you should have assignments:</p>
                        <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
                            {ASSIGNMENT_TROUBLESHOOTING_STEPS.map((step, index) => (
                              <li key={index}>
                                {index === 1 ? (
                                  <>{step}: <span className="font-semibold text-white">{currentUser.name}</span></>
                                ) : (
                                  step
                                )}
                              </li>
                            ))}
                        </ul>
                    </div>
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Daily Roster for {displayDate.toLocaleDateString()}
            </h1>
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
                <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xlsx, .xls, .csv" className="hidden" />
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
                      title="Download roster using Blob method"
                  >
                      DL Roster
                  </button>
                  <button
                      onClick={handleDownloadRosterAlternative}
                      className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 active:scale-95 transition-all text-sm"
                      title="Download roster using alternative method (better compatibility)"
                  >
                      DL Roster (Alt)
                  </button>
                </div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 active:scale-95 transition-all text-sm"
                >
                    Import Roster CSV
                </button>
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
            {operatorsWithAttendance
              .filter(operator => operator.attendance) // Only show operators who are present
              .map(operator => {
              const operatorAssignments = assignmentsByOperator.get(operator.id);

              // Render the full card for present operators
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
                                  className="px-3 py-1 text-xs bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 active:scale-95 transition-all"
                                  title="Manage assignments for this ride"
                                >
                                  Edit
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
              <h2 className="text-2xl font-bold text-pink-500 mb-4">
                Unassigned Rides & Games ({unassignedRides.length})
              </h2>
              <div className="bg-gray-800 rounded-lg shadow-lg border-2 border-red-600/50 p-4">
                <p className="text-yellow-400 text-sm mb-3">
                  ⚠️ These rides have no operators assigned. Click "Assign Operators" to add assignments.
                </p>
                <ul className="space-y-2">
                  {unassignedRides.map(ride => (
                    <li key={ride.id} className="text-gray-300 bg-gray-700/50 p-3 rounded-md flex justify-between items-center hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="font-medium">{ride.name}</span>
                        <span className="text-xs text-gray-500">({ride.floor} Floor)</span>
                      </div>
                      <button 
                        onClick={() => setManageModalInfo(ride)}
                        className="px-4 py-2 text-sm bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-md"
                        title="Click to assign operators to this ride"
                      >
                        🔧 Assign Operators
                      </button>
                    </li>
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
