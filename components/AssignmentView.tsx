import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Ride, Operator, AttendanceRecord } from '../types';
import { useNotification } from '../imageStore';

// Make sure XLSX is available from the script tag in index.html
declare var XLSX: any;

interface AssignmentViewProps {
  rides: Ride[];
  operators: Operator[];
  dailyAssignments: Record<string, Record<string, number>>;
  onSave: (date: string, assignments: Record<string, number>) => void;
  selectedDate: string;
  attendance: AttendanceRecord[];
}

const AssignmentView: React.FC<AssignmentViewProps> = ({ rides, operators, dailyAssignments, onSave, selectedDate, attendance }) => {
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();
  
  // Sync local state with prop from Firebase
  useEffect(() => {
    setAssignments(dailyAssignments[selectedDate] || {});
  }, [selectedDate, dailyAssignments]);

  const isDirty = useMemo(() => {
    const currentRemoteAssignments = dailyAssignments[selectedDate] || {};
    // Compare keys and values to see if they are different
    const localKeys = Object.keys(assignments);
    const remoteKeys = Object.keys(currentRemoteAssignments);
    if (localKeys.length !== remoteKeys.length) return true;
    return localKeys.some(key => assignments[key] !== currentRemoteAssignments[key]);
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
        if(operatorId) {
            newAssignments[rideId] = operatorId;
        } else {
            delete newAssignments[rideId]; // Handle 'Unassigned'
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
        // Expecting [Ride Name, Operator Name]
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const rideNameMap = new Map(rides.map(r => [r.name.toLowerCase(), r.id]));
        const operatorNameMap = new Map(operators.map(o => [o.name.toLowerCase(), o.id]));

        let successCount = 0;
        const errors: string[] = [];
        const newAssignments = { ...assignments };

        // Start from row 1 to skip a potential header
        const dataRows = json.slice(1);

        dataRows.forEach((row, index) => {
          const rideName = String(row[0] ?? '').trim().toLowerCase();
          const operatorName = String(row[1] ?? '').trim().toLowerCase();

          if (!rideName || !operatorName) return; // Skip empty or incomplete rows

          const rideId = rideNameMap.get(rideName);
          const operatorId = operatorNameMap.get(operatorName);

          if (rideId && operatorId) {
            newAssignments[String(rideId)] = operatorId;
            successCount++;
          } else {
            if (!rideId) errors.push(`Row ${index + 2}: Ride "${String(row[0])}" not found.`);
            if (!operatorId) errors.push(`Row ${index + 2}: Operator "${String(row[1])}" not found.`);
          }
        });

        setAssignments(newAssignments);

        if (errors.length > 0) {
          showNotification(`${successCount} assignments imported, but ${errors.length} errors occurred.`, 'warning', 8000);
          console.warn("Import errors:", errors);
        } else {
          showNotification(`${successCount} assignments imported successfully!`, 'success');
        }

      } catch (error) {
        console.error("Error parsing Excel file:", error);
        showNotification("Failed to parse file. Please check format.", 'error');
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
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Operator Assignments for {displayDate.toLocaleDateString()}
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
      
        {operators.length > 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
            <div className="p-4 bg-gray-700/50 text-gray-300">
                <p>Assign operators below, or use the "Import" button to upload an Excel/CSV file.</p>
                <p className="text-sm text-gray-400">The file should have two columns: Ride Name and Operator Name.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-700">
                {rides.map((ride) => (
                    <div key={ride.id} className="p-4 bg-gray-800">
                        <h3 className="font-bold text-lg">{ride.name}</h3>
                        <p className="text-sm text-gray-400 mb-2">{ride.floor} Floor</p>
                        <select
                            value={assignments[ride.id] || ''}
                            onChange={(e) => handleAssignmentChange(ride.id, parseInt(e.target.value, 10))}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        >
                            <option value="">Unassigned</option>
                            {operators.sort((a, b) => a.name.localeCompare(b.name)).map(op => {
                                const isPresent = attendanceStatusMap.get(op.id);
                                const statusLabel = isPresent ? '(P)' : '(A)';
                                return (
                                    <option key={op.id} value={op.id}>
                                        {op.name} {statusLabel}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                ))}
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