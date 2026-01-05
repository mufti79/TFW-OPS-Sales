
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Ride, Operator, AttendanceRecord } from '../types';
import { useNotification } from '../imageStore';

// Make sure XLSX is available from the script tag in index.html
declare var XLSX: any;

// Define View type to match the main app's view options
type View = 'counter' | 'reports' | 'assignments' | 'expertise' | 'roster' | 'ticket-sales-dashboard' | 'ts-assignments' | 'ts-roster' | 'ts-expertise' | 'history' | 'my-sales' | 'sales-officer-dashboard' | 'dashboard' | 'management-hub' | 'floor-counts' | 'security-entry';

interface AssignmentViewProps {
  rides: Ride[];
  operators: Operator[];
  dailyAssignments: Record<string, Record<string, number[] | number>>;
  onSave: (date: string, assignments: Record<string, number[]>) => void;
  selectedDate: string;
  attendance: AttendanceRecord[];
  onSync?: () => Promise<void>;
  onNavigate?: (view: View) => void;
}

const AssignmentView: React.FC<AssignmentViewProps> = ({ rides, operators, dailyAssignments, onSave, selectedDate, attendance, onSync, onNavigate }) => {
  const [assignments, setAssignments] = useState<Record<string, number[]>>({});
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'up' | 'down'>('down');
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const { showNotification } = useNotification();
  
  // Sync local state with prop from Firebase
  // Memoize the selected date's assignments to prevent unnecessary re-renders
  const selectedDateAssignments = useMemo(() => {
    return dailyAssignments[selectedDate] || {};
  }, [dailyAssignments, selectedDate]);

  useEffect(() => {
    const rawAssignments = selectedDateAssignments;
    const normalizedAssignments: Record<string, number[]> = {};
    Object.entries(rawAssignments).forEach(([key, value]) => {
      normalizedAssignments[key] = Array.isArray(value) ? value : [value];
    });
    
    // Compare before updating to avoid unnecessary re-renders and overwriting unsaved changes
    setAssignments(prev => {
      // Shallow comparison: check if keys are the same
      const prevKeys = Object.keys(prev).sort();
      const newKeys = Object.keys(normalizedAssignments).sort();
      if (prevKeys.length !== newKeys.length || !prevKeys.every((key, i) => key === newKeys[i])) {
        if (import.meta.env.DEV) {
          console.log('🔄 AssignmentView - Updating state (keys changed)');
        }
        return normalizedAssignments;
      }
      
      // Deep comparison: check if values are the same (order-independent)
      for (const key of prevKeys) {
        const prevVal = prev[key];
        const newVal = normalizedAssignments[key];
        // Compare arrays by content, not by position (order-independent)
        if (prevVal.length !== newVal.length) {
          if (import.meta.env.DEV) {
            console.log('🔄 AssignmentView - Updating state (values changed for key:', key, ')');
          }
          return normalizedAssignments;
        }
        // Check if all elements in prevVal exist in newVal (order-independent comparison)
        const prevSet = new Set<number>(prevVal);
        const newSet = new Set<number>(newVal);
        // Compare Set sizes for early exit (handles duplicates) and check membership
        if (prevSet.size !== newSet.size || ![...prevSet].every((id: number) => newSet.has(id))) {
          if (import.meta.env.DEV) {
            console.log('🔄 AssignmentView - Updating state (values changed for key:', key, ')');
          }
          return normalizedAssignments;
        }
      }
      
      // Return prev to avoid unnecessary state updates
      return prev; // No changes, keep previous state
    });
  }, [selectedDate, selectedDateAssignments]);

  const isDirty = useMemo(() => {
    const currentRemoteAssignments = dailyAssignments[selectedDate] || {};
    // Normalize remote for comparison
    const normalizedRemote: Record<string, number[]> = {};
    Object.entries(currentRemoteAssignments).forEach(([key, value]) => {
      normalizedRemote[key] = Array.isArray(value) ? value : [value];
    });
    
    // Compare keys first
    const localKeys = Object.keys(assignments).sort();
    const remoteKeys = Object.keys(normalizedRemote).sort();
    if (localKeys.length !== remoteKeys.length || !localKeys.every((key, i) => key === remoteKeys[i])) {
      return true; // Different keys means dirty
    }
    
    // Compare values (order-independent for arrays)
    for (const key of localKeys) {
      const localVal = assignments[key];
      const remoteVal = normalizedRemote[key];
      if (localVal.length !== remoteVal.length) {
        return true; // Different array lengths means dirty
      }
      // Order-independent comparison using Sets
      const localSet = new Set<number>(localVal);
      const remoteSet = new Set<number>(remoteVal);
      // Compare Set sizes for early exit (handles duplicates) and check membership
      if (localSet.size !== remoteSet.size || ![...localSet].every((id: number) => remoteSet.has(id))) {
        return true; // Different array contents means dirty
      }
    }
    
    return false; // No differences found, not dirty
  }, [assignments, dailyAssignments, selectedDate]);

  // Prevent leaving with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (openDropdownId === null) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const dropdownElement = dropdownRefs.current.get(openDropdownId);
      if (dropdownElement && event.target && !dropdownElement.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    // Use click event instead of pointerdown to allow checkbox onChange to fire first
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      // Clean up this dropdown's ref when it closes
      dropdownRefs.current.delete(openDropdownId);
    };
  }, [openDropdownId]);


  const attendanceStatusMap = useMemo(() => {
    const statusMap = new Map<number, boolean>();
    attendance
      .filter(record => record.date === selectedDate)
      .forEach(record => statusMap.set(record.operatorId, true));
    return statusMap;
  }, [attendance, selectedDate]);

  const handleAssignmentChange = (rideId: number, operatorId: number) => {
    setAssignments(prev => {
        const newAssignments = {...prev};
        const rideKey = String(rideId);
        const currentAssignedValue = newAssignments[rideKey];
        const currentAssigned = Array.isArray(currentAssignedValue) ? currentAssignedValue : currentAssignedValue ? [currentAssignedValue] : [];
        
        const isAssigned = currentAssigned.includes(operatorId);
        
        let updatedAssigned: number[];
        if (isAssigned) {
            updatedAssigned = currentAssigned.filter(id => id !== operatorId);
        } else {
            updatedAssigned = [...currentAssigned, operatorId];
        }

        if (updatedAssigned.length > 0) {
            newAssignments[rideKey] = updatedAssigned;
        } else {
            delete newAssignments[rideKey];
        }
        return newAssignments;
    });
  };

  const handleSave = () => {
    // Only save if there are actual changes
    if (!isDirty) {
      return;
    }
    onSave(selectedDate, assignments);
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
  
  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all of today's assignments?")) {
        setAssignments({});
        // Auto-save the cleared assignments to Firebase
        onSave(selectedDate, {});
    }
  };

    const handleToggleDropdown = (e: React.MouseEvent<HTMLButtonElement>, rideId: number) => {
        if (openDropdownId === rideId) {
            setOpenDropdownId(null);
            return;
        }

        const buttonRect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const dropdownHeight = 240; // Corresponds to max-h-60

        if (spaceBelow < dropdownHeight && buttonRect.top > spaceBelow) {
            setDropdownPosition('up');
        } else {
            setDropdownPosition('down');
        }
        setOpenDropdownId(rideId);
    };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
        // FIX: Explicitly type `newAssignments` to prevent type-widening issues downstream.
        const newAssignments: Record<string, number[]> = { ...assignments };
        
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

          const operatorNames = operatorNamesStr.split(',').map(name => name.trim().toLowerCase());
          const operatorIds: number[] = [];
          
          operatorNames.forEach(name => {
              const opId = operatorNameMap.get(name);
              if (opId) {
                  // FIX: Argument of type 'unknown' is not assignable to parameter of type 'number'.
                  operatorIds.push(opId as number);
              } else {
                  errors.push(`Row ${index + 2}: Operator "${name}" not found.`);
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

        setAssignments(newAssignments);
        
        // Automatically save imported assignments to Firebase
        onSave(selectedDate, newAssignments);
        
        // Debug logging for troubleshooting assignment visibility issues
        // This helps diagnose if assignments are being saved correctly
        if (import.meta.env.DEV) {
          console.log('📥 CSV Import completed:', {
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
          showNotification(`${successCount} assignment rows imported and saved successfully! Assignments are now visible below and in the Roster view.`, 'success', 6000);
        }
        
        // Removed automatic navigation to roster view - users can now see imported assignments
        // immediately in the current view without being redirected

      } catch (error) {
        console.error("Error parsing Excel file:", error);
        showNotification("Failed to parse file. Check format.", 'error');
      } finally {
        if(fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const [year, month, day] = selectedDate.split('-').map(Number);
  const displayDate = new Date(year, month - 1, day);

  return (
    <div className="flex flex-col">
      <div className="mb-4 p-3 bg-purple-900/30 border border-purple-700/50 rounded-lg" role="note" aria-label="Workflow recommendation">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
          <div className="text-sm text-gray-300">
            <span className="font-semibold text-purple-400">Recommended Workflow:</span> For best results, use TFW-NEW app for making assignments. Changes will automatically sync to this app and be visible to operators.
            <br/>
            <span className="text-xs text-gray-400 mt-1 inline-block">You can also make assignments here, and they will sync back to TFW-NEW app.</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Operator Assignments for {displayDate.toLocaleDateString()}
          </h1>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto flex-wrap justify-center">
              <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xlsx, .xls, .csv" className="hidden" />
              {onSync && (
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`w-full sm:w-auto px-4 py-2 text-sm font-bold rounded-lg active:scale-95 transition-all ${
                      isSyncing 
                        ? 'bg-blue-400 text-white cursor-wait' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                    {isSyncing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 text-sm bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 active:scale-95 transition-all"
              >
                  Import Roster CSV
              </button>
               <button
                  onClick={handleClearAll}
                  className="w-full sm:w-auto px-4 py-2 text-sm bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-700 active:scale-95 transition-all"
              >
                  Clear All
              </button>
              <button
                  onClick={handleSave}
                  className={`w-full sm:w-auto px-6 py-2 text-sm font-bold rounded-lg active:scale-95 transition-all ${
                    isDirty 
                    ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400 animate-pulse' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                  {isDirty ? 'Save Changes' : 'All Saved'}
              </button>
          </div>
      </div>
      
        {operators.length > 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
            <div className="p-4 bg-gray-700/50 text-gray-300">
                <p>Assign one or more operators below, or use the "Import Roster CSV" button to upload an Excel/CSV file.</p>
                <p className="text-sm text-gray-400 mb-1">In Excel, the file should have two columns: <strong>Ride Name</strong> and <strong>Operator Name(s)</strong>. You can list multiple operators in the second column separated by a comma.</p>
                <div className="text-xs bg-gray-900/50 p-2 rounded mt-2 font-mono text-gray-400">
                  <div className="font-semibold text-gray-300 mb-1">Example CSV format:</div>
                  <div>Ride Name, Operator Name(s)</div>
                  <div>Ferris Wheel, John Doe</div>
                  <div>Bumper Cars, Jane Smith, Bob Johnson</div>
                </div>
                <p className="text-sm text-green-400 mt-2">📋 <strong>Note:</strong> Operator names in the CSV must exactly match the names in the system (case-insensitive). Imported assignments will be saved and visible in the Roster view.</p>
                {Object.keys(assignments).length === 0 && (
                  <aside className="mt-3 p-3 bg-blue-900/30 border border-blue-700/50 rounded-md" role="note" aria-label="Information about missing assignments">
                    <p className="text-sm text-blue-300">
                      <strong>No assignments found for {displayDate.toLocaleDateString()}.</strong>
                    </p>
                    <p className="text-xs text-blue-400 mt-1">
                      If you have assignments in TFW-NEW app, click "🔄 Sync Now" above to fetch them. Otherwise, you can create new assignments below or import them from a file.
                    </p>
                  </aside>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-700">
                {rides.map((ride) => {
                    const rawAssignment = assignments[String(ride.id)];
                    const rawOperatorIds = Array.isArray(rawAssignment) ? rawAssignment : rawAssignment ? [rawAssignment] : [];
                    // Convert operator IDs to numbers for consistent lookups
                    // Firebase sometimes returns IDs as strings, which would fail map lookups
                    const assignedOperatorIds = rawOperatorIds
                        .map((id: string | number) => typeof id === 'number' ? id : Number(id))
                        .filter((id: number) => !isNaN(id));
                    const operatorIdMap = new Map(operators.map(op => [op.id, op.name]));
                    const assignedNames = assignedOperatorIds.map(id => operatorIdMap.get(id)).filter(Boolean).join(', ');

                    return (
                        <div key={ride.id} className="p-4 bg-gray-800">
                            <h3 className="font-bold text-lg">{ride.name}</h3>
                            <p className="text-sm text-gray-400 mb-2">{ride.floor} Floor</p>
                            <div 
                                className="relative" 
                                ref={(el) => {
                                    if (el && openDropdownId === ride.id) {
                                        dropdownRefs.current.set(ride.id, el);
                                    } else if (!el) {
                                        dropdownRefs.current.delete(ride.id);
                                    }
                                }}
                            >
                                <button
                                    onClick={(e) => handleToggleDropdown(e, ride.id)}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-left truncate"
                                >
                                    {assignedNames || <span className="text-gray-500">Unassigned</span>}
                                </button>
                                {openDropdownId === ride.id && (
                                    <div 
                                        className={`absolute z-10 w-full bg-gray-900 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto ${dropdownPosition === 'up' ? 'bottom-full mb-1' : 'mt-1'}`}
                                    >
                                        {operators.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(op => {
                                            const isPresent = attendanceStatusMap.get(op.id);
                                            const statusLabel = isPresent ? '(P)' : '(A)';
                                            return (
                                                <label 
                                                    key={op.id} 
                                                    className="flex items-center px-3 py-2 hover:bg-gray-700 cursor-pointer"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={assignedOperatorIds.includes(op.id)}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleAssignmentChange(ride.id, op.id);
                                                        }}
                                                        className="h-4 w-4 rounded bg-gray-800 border-gray-500 text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <span className="ml-3 text-gray-300">{op.name} {statusLabel}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-400">No Operators Found.</h2>
            <p className="text-gray-500">Please add operators in the 'Manage Operators' panel before making assignments.</p>
          </div>
        )}
    </div>
  );
};

export default AssignmentView;
