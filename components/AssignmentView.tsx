import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Ride, Operator, AttendanceRecord } from '../types';

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
  const [assignments, setAssignments] = useState<Record<string, number>>(dailyAssignments[selectedDate] || {});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setAssignments(dailyAssignments[selectedDate] || {});
  }, [selectedDate, dailyAssignments]);

  const attendanceStatusMap = useMemo(() => {
    const statusMap = new Map<number, boolean>();
    attendance
      .filter(record => record.date === selectedDate)
      .forEach(record => statusMap.set(record.operatorId, true));
    return statusMap;
  }, [attendance, selectedDate]);

  const handleAssignmentChange = (rideId: number, operatorId: number) => {
    setAssignments(prev => ({
      ...prev,
      [rideId]: operatorId,
    }));
  };

  const handleSave = () => {
    onSave(selectedDate, assignments);
    alert('Assignments saved successfully!');
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

        let reportMessage = `${successCount} assignments imported successfully from the file.`;
        if (errors.length > 0) {
          reportMessage += `\n\n${errors.length} rows had errors:\n` + errors.slice(0, 10).join('\n'); // Show first 10 errors
          if (errors.length > 10) reportMessage += `\n...and ${errors.length - 10} more.`;
        }
        alert(reportMessage);

      } catch (error) {
        console.error("Error parsing Excel file:", error);
        alert("Failed to parse the file. Please ensure it's a valid Excel (xlsx) or CSV file with 'Ride Name' in the first column and 'Operator Name' in the second.");
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
                  className="w-full sm:w-auto px-4 py-2 text-sm bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all"
              >
                  Save
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
