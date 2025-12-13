
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Counter, Operator, AttendanceRecord } from '../types';
import { useNotification } from '../imageStore';

// Make sure XLSX is available from the script tag in index.html
declare var XLSX: any;

interface TicketSalesAssignmentViewProps {
  counters: Counter[];
  ticketSalesPersonnel: Operator[];
  dailyAssignments: Record<string, Record<string, number[] | number>>;
  onSave: (date: string, assignments: Record<string, number[]>) => void;
  selectedDate: string;
  attendance: AttendanceRecord[];
}

const TicketSalesAssignmentView: React.FC<TicketSalesAssignmentViewProps> = ({ counters, ticketSalesPersonnel, dailyAssignments, onSave, selectedDate, attendance }) => {
  const [assignments, setAssignments] = useState<Record<string, number[]>>({});
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'up' | 'down'>('down');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const { showNotification } = useNotification();
  
  useEffect(() => {
    const rawAssignments = dailyAssignments[selectedDate] || {};
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
        return normalizedAssignments;
      }
      
      // Deep comparison: check if values are the same
      for (const key of prevKeys) {
        const prevVal = prev[key];
        const newVal = normalizedAssignments[key];
        if (prevVal.length !== newVal.length || !prevVal.every((id, i) => id === newVal[i])) {
          return normalizedAssignments;
        }
      }
      
      return prev; // No changes, keep previous state
    });
  }, [selectedDate, dailyAssignments]);

  const isDirty = useMemo(() => {
    const currentRemoteAssignments = dailyAssignments[selectedDate] || {};
    const normalizedRemote: Record<string, number[]> = {};
    Object.entries(currentRemoteAssignments).forEach(([key, value]) => {
      normalizedRemote[key] = Array.isArray(value) ? value : [value];
    });
    return JSON.stringify(assignments) !== JSON.stringify(normalizedRemote);
  }, [assignments, dailyAssignments, selectedDate]);

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

    // Add listener after dropdown is opened
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Clean up this dropdown's ref when it closes
      dropdownRefs.current.delete(openDropdownId);
    };
  }, [openDropdownId]);

  const attendanceStatusMap = useMemo(() => {
    const statusMap = new Map<number, boolean>();
    const allPersonnelIds = new Set(ticketSalesPersonnel.map(p => p.id));
    attendance
      .filter(record => record.date === selectedDate && allPersonnelIds.has(record.operatorId))
      .forEach(record => statusMap.set(record.operatorId, true));
    return statusMap;
  }, [attendance, selectedDate, ticketSalesPersonnel]);

  const handleAssignmentChange = (counterId: number, personnelId: number) => {
    setAssignments(prev => {
        const newAssignments = {...prev};
        const counterKey = String(counterId);
        const currentAssignedValue = newAssignments[counterKey];
        const currentAssigned = Array.isArray(currentAssignedValue) ? currentAssignedValue : currentAssignedValue ? [currentAssignedValue] : [];
        
        const isAssigned = currentAssigned.includes(personnelId);
        
        let updatedAssigned: number[];
        if (isAssigned) {
            updatedAssigned = currentAssigned.filter(id => id !== personnelId);
        } else {
            updatedAssigned = [...currentAssigned, personnelId];
        }

        if (updatedAssigned.length > 0) {
            newAssignments[counterKey] = updatedAssigned;
        } else {
            delete newAssignments[counterKey];
        }
        return newAssignments;
    });
  };

  const handleSave = () => {
    onSave(selectedDate, assignments);
  };
  
  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all of today's assignments?")) {
        setAssignments({});
    }
  };

    const handleToggleDropdown = (e: React.MouseEvent<HTMLButtonElement>, counterId: number) => {
        if (openDropdownId === counterId) {
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
        setOpenDropdownId(counterId);
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

        const counterNameMap = new Map(counters.map(c => [c.name.toLowerCase(), c.id]));
        const personnelNameMap = new Map(ticketSalesPersonnel.map(p => [p.name.toLowerCase(), p.id]));

        let successCount = 0;
        const errors: string[] = [];
        // FIX: Explicitly type `newAssignments` to prevent type-widening issues downstream.
        const newAssignments: Record<string, number[]> = { ...assignments };

        const dataRows = json.slice(1);

        dataRows.forEach((row, index) => {
          const counterName = String(row[0] ?? '').trim().toLowerCase();
          const personnelNamesStr = String(row[1] ?? '').trim();

          if (!counterName || !personnelNamesStr) return; 

          const counterId = counterNameMap.get(counterName);
          if (!counterId) {
            errors.push(`Row ${index + 2}: Counter "${String(row[0])}" not found.`);
            return;
          }

          const personnelNames = personnelNamesStr.split(',').map(name => name.trim().toLowerCase());
          const personnelIds: number[] = [];
          
          personnelNames.forEach(name => {
              const pId = personnelNameMap.get(name);
              if (pId) {
                  // FIX: Argument of type 'unknown' is not assignable to parameter of type 'number'.
                  personnelIds.push(pId as number);
              } else {
                  errors.push(`Row ${index + 2}: Personnel "${name}" not found.`);
              }
          });
          
          if (personnelIds.length > 0) {
            newAssignments[String(counterId)] = [...(newAssignments[String(counterId)] || []), ...personnelIds];
            // Remove duplicates
            // FIX: Explicitly providing the generic type to `new Set` ensures TypeScript correctly infers the array elements as numbers, resolving a type error.
            newAssignments[String(counterId)] = Array.from(new Set<number>(newAssignments[String(counterId)]));
            successCount++;
          }
        });

        setAssignments(newAssignments);

        if (errors.length > 0) {
            showNotification(`${successCount} assignment rows processed, but with errors. Check console.`, 'warning', 8000);
            console.warn("Import errors:", errors);
        } else {
            showNotification(`${successCount} assignment rows processed successfully!`, 'success');
        }

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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
              Ticket Sales Assignments for {displayDate.toLocaleDateString()}
          </h1>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto flex-wrap justify-center">
              <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xlsx, .xls, .csv" className="hidden" />
              <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 text-sm bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 active:scale-95 transition-all"
              >
                  Import
              </button>
               <button
                  onClick={handleClearAll}
                  className="w-full sm:w-auto px-4 py-2 text-sm bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-700 active:scale-95 transition-all"
              >
                  Clear All
              </button>
              <button
                  onClick={handleSave}
                  disabled={!isDirty}
                  className={`w-full sm:w-auto px-6 py-2 text-sm font-bold rounded-lg active:scale-95 transition-all ${
                    isDirty 
                    ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400 animate-pulse' 
                    : 'bg-green-600 text-white opacity-75 cursor-default'
                }`}
              >
                  {isDirty ? 'Save Changes' : 'All Saved'}
              </button>
          </div>
      </div>
      
        {ticketSalesPersonnel.length > 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
            <div className="p-4 bg-gray-700/50 text-gray-300">
                <p>Assign one or more personnel below, or use the "Import" button to upload an Excel/CSV file.</p>
                <p className="text-sm text-gray-400">In Excel, the file should have two columns: Counter Name and Personnel Name(s). You can list multiple names in the second column separated by a comma.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-700">
                {counters.map((counter) => {
                    const rawAssignment = assignments[String(counter.id)];
                    const assignedPersonnelIds = Array.isArray(rawAssignment) ? rawAssignment : rawAssignment ? [rawAssignment] : [];
                    const personnelIdMap = new Map(ticketSalesPersonnel.map(op => [op.id, op.name]));
                    const assignedNames = assignedPersonnelIds.map(id => personnelIdMap.get(id)).filter(Boolean).join(', ');

                    return (
                        <div key={counter.id} className="p-4 bg-gray-800">
                            <h3 className="font-bold text-lg">{counter.name}</h3>
                            <p className="text-sm text-gray-400 mb-2">{counter.location}</p>
                            <div 
                                className="relative" 
                                ref={(el) => {
                                    if (el && openDropdownId === counter.id) {
                                        dropdownRefs.current.set(counter.id, el);
                                    } else if (!el) {
                                        dropdownRefs.current.delete(counter.id);
                                    }
                                }}
                            >
                                <button
                                    onClick={(e) => handleToggleDropdown(e, counter.id)}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-left truncate"
                                >
                                    {assignedNames || <span className="text-gray-500">Unassigned</span>}
                                </button>
                                {openDropdownId === counter.id && (
                                    <div 
                                        className={`absolute z-10 w-full bg-gray-900 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto ${dropdownPosition === 'up' ? 'bottom-full mb-1' : 'mt-1'}`}
                                    >
                                        {ticketSalesPersonnel.sort((a, b) => a.name.localeCompare(b.name)).map(op => {
                                            const isPresent = attendanceStatusMap.get(op.id);
                                            const statusLabel = isPresent ? '(P)' : '(A)';
                                            return (
                                                <label key={op.id} className="flex items-center px-3 py-2 hover:bg-gray-700 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={assignedPersonnelIds.includes(op.id)}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleAssignmentChange(counter.id, op.id);
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="h-4 w-4 rounded bg-gray-800 border-gray-500 text-teal-600 focus:ring-teal-500"
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
            <h2 className="text-2xl font-bold text-gray-400">No Ticket Sales Personnel Found.</h2>
            <p className="text-gray-500">Personnel list is managed by the development team. Please contact them for changes.</p>
          </div>
        )}
    </div>
  );
};

export default TicketSalesAssignmentView;
