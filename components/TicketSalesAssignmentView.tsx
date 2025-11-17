import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Counter, Operator, AttendanceRecord } from '../types';
import { useNotification } from '../imageStore';

// Make sure XLSX is available from the script tag in index.html
declare var XLSX: any;

interface TicketSalesAssignmentViewProps {
  counters: Counter[];
  ticketSalesPersonnel: Operator[];
  dailyAssignments: Record<string, Record<string, number>>;
  onSave: (date: string, assignments: Record<string, number>) => void;
  selectedDate: string;
  attendance: AttendanceRecord[];
}

const TicketSalesAssignmentView: React.FC<TicketSalesAssignmentViewProps> = ({ counters, ticketSalesPersonnel, dailyAssignments, onSave, selectedDate, attendance }) => {
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();
  
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
    const allPersonnelIds = new Set(ticketSalesPersonnel.map(p => p.id));
    attendance
      .filter(record => record.date === selectedDate && allPersonnelIds.has(record.operatorId))
      .forEach(record => statusMap.set(record.operatorId, true));
    return statusMap;
  }, [attendance, selectedDate, ticketSalesPersonnel]);

  const handleAssignmentChange = (counterId: number, operatorId: number) => {
    setAssignments(prev => {
        const newAssignments = {...prev};
        if (operatorId) {
            newAssignments[counterId] = operatorId;
        } else {
            delete newAssignments[counterId]; // Handle 'Unassigned'
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
        // Expecting [Counter Name, Personnel Name]
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const counterNameMap = new Map(counters.map(c => [c.name.toLowerCase(), c.id]));
        const personnelNameMap = new Map(ticketSalesPersonnel.map(p => [p.name.toLowerCase(), p.id]));

        let successCount = 0;
        const errors: string[] = [];
        const newAssignments = { ...assignments };

        const dataRows = json.slice(1);

        dataRows.forEach((row, index) => {
          const counterName = String(row[0] ?? '').trim().toLowerCase();
          const personnelName = String(row[1] ?? '').trim().toLowerCase();

          if (!counterName || !personnelName) return; 

          const counterId = counterNameMap.get(counterName);
          const personnelId = personnelNameMap.get(personnelName);

          if (counterId && personnelId) {
            newAssignments[String(counterId)] = personnelId;
            successCount++;
          } else {
            if (!counterId) errors.push(`Row ${index + 2}: Counter "${String(row[0])}" not found.`);
            if (!personnelId) errors.push(`Row ${index + 2}: Personnel "${String(row[1])}" not found.`);
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
                <p>Assign personnel below, or use the "Import" button to upload an Excel/CSV file.</p>
                <p className="text-sm text-gray-400">The file should have two columns: Counter Name and Personnel Name.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-700">
                {counters.map((counter) => (
                    <div key={counter.id} className="p-4 bg-gray-800">
                        <h3 className="font-bold text-lg">{counter.name}</h3>
                        <p className="text-sm text-gray-400 mb-2">{counter.location}</p>
                        <select
                            value={assignments[counter.id] || ''}
                            onChange={(e) => handleAssignmentChange(counter.id, parseInt(e.target.value, 10))}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                        >
                            <option value="">Unassigned</option>
                            {ticketSalesPersonnel.sort((a, b) => a.name.localeCompare(b.name)).map(op => {
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
            <h2 className="text-2xl font-bold text-gray-400">No Ticket Sales Personnel Found.</h2>
            <p className="text-gray-500">Personnel list is managed by the development team. Please contact them for changes.</p>
          </div>
        )}
    </div>
  );
};

export default TicketSalesAssignmentView;