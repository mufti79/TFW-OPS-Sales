import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MaintenanceRecord } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { useNotification } from '../imageStore';

// Make sure XLSX is available from the script tag in index.html
declare var XLSX: any;

type View = 'counter' | 'reports' | 'assignments' | 'expertise' | 'roster' | 'ticket-sales-dashboard' | 'ts-assignments' | 'ts-roster' | 'ts-expertise' | 'history' | 'my-sales' | 'sales-officer-dashboard' | 'dashboard' | 'maintenance-dashboard';
interface MaintenanceDashboardProps {
  onNavigate: (view: View) => void;
}


const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({ onNavigate }) => {
  const [maintenanceData, setMaintenanceData] = useLocalStorage<MaintenanceRecord[]>('maintenanceData', []);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();
  
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            // Use header: 1 to get an array of arrays, which is more robust than relying on header names.
            const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (json.length < 2) {
                throw new Error("The Excel sheet is empty or has no data rows.");
            }

            const dataRows = json.slice(1); // Skip header row

            const parsedData = dataRows.map((row, index) => {
                if (!row || row.length === 0) return null; // Skip empty rows

                const excelDate = row[0]; // Column A: Date
                if (!excelDate) {
                    throw new Error(`Row ${index + 2} is missing a Date in the first column.`);
                }
                
                // Convert Excel date serial number to YYYY-MM-DD
                const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
                const dateStr = date.toISOString().split('T')[0];

                const rideName = row[1] || 'Unknown'; // Column B: G&R Name
                const status = (row[2] || '').toLowerCase(); // Column C: Problem Solving Status
                const outOfService = (row[3] || '').toLowerCase(); // Column D: G&R Out of Service

                return {
                    date: dateStr,
                    rideName: rideName,
                    hardwareRepaired: status.includes('hardware repaired'),
                    softwareIssueSolved: status.includes('software issue solved'),
                    partsReplaced: status.includes('parts replaced'),
                    isOutOfService: !!outOfService && outOfService !== 'n/a' && outOfService.trim() !== ''
                };
            }).filter((item): item is MaintenanceRecord => item !== null); // Filter out any skipped empty rows

            setMaintenanceData(parsedData);
            showNotification('Maintenance data loaded successfully!', 'success');

        } catch (error) {
            console.error("Error parsing Excel file:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error during file processing.";
            setError(`Failed to parse file: ${errorMessage}. Please ensure the file has the correct column order: Date, G&R Name, Problem Solving Status, G&R Out of Service.`);
            showNotification(errorMessage, 'error', 8000);
        } finally {
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
  };
  
  const monthlySummary = useMemo(() => {
    const summary: Record<string, { hardware: number; software: number; parts: number }> = {};
    maintenanceData.forEach(record => {
      const month = new Date(record.date + 'T00:00:00').toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!summary[month]) {
        summary[month] = { hardware: 0, software: 0, parts: 0 };
      }
      if (record.hardwareRepaired) summary[month].hardware++;
      if (record.softwareIssueSolved) summary[month].software++;
      if (record.partsReplaced) summary[month].parts++;
    });
    // FIX: Sort by date chronologically. Subtracting Date objects directly is disallowed by TypeScript, so we cast to `any` to perform the numeric subtraction, which is a valid JavaScript operation.
    return Object.entries(summary).sort((a,b) => (new Date(b[0]) as any) - (new Date(a[0]) as any));
  }, [maintenanceData]);

  const rangeData = useMemo(() => {
    const filtered = maintenanceData.filter(d => d.date >= startDate && d.date <= endDate);
    const summary: { hardware: number; software: number; parts: number } = { hardware: 0, software: 0, parts: 0 };
    const outOfServiceRides = new Set<string>();

    filtered.forEach(record => {
        if (record.hardwareRepaired) summary.hardware++;
        if (record.softwareIssueSolved) summary.software++;
        if (record.partsReplaced) summary.parts++;
        if (record.isOutOfService) outOfServiceRides.add(record.rideName);
    });

    return { summary, outOfServiceRides: Array.from(outOfServiceRides).sort() };
  }, [maintenanceData, startDate, endDate]);

  const maxChartValue = Math.max(1, ...Object.values(rangeData.summary));

  if (maintenanceData.length === 0) {
    return (
        <div className="max-w-xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4">
                Maintenance Dashboard
            </h1>
            <p className="text-lg text-gray-300 mb-6">
                To begin, please upload your daily maintenance Excel file. The data will be saved on this device.
            </p>
            <div className="bg-gray-800 p-8 rounded-lg border border-dashed border-gray-600">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls"
                    className="hidden"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all text-lg"
                >
                    Upload Maintenance File
                </button>
                <p className="text-xs text-gray-500 mt-4">
                    Please use the file named "TFW Daily Maintenance Update.xlsx".
                </p>
            </div>
            {error && <p className="text-red-400 mt-4">{error}</p>}
        </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Maintenance Dashboard
            </h1>
            <button
                onClick={() => setMaintenanceData([])}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg text-sm"
            >
                Clear Data & Re-upload
            </button>
        </div>

        {/* Monthly Summary Table */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
            <h2 className="text-xl font-bold p-4 bg-gray-700/50">Problem Solving Status</h2>
            <table className="w-full text-left">
                <thead className="bg-gray-700/50 border-b-2 border-indigo-500">
                    <tr>
                        <th className="p-3 font-semibold">Month</th>
                        <th className="p-3 font-semibold text-center">Hardware Repaired</th>
                        <th className="p-3 font-semibold text-center">Software Issue Solved</th>
                        <th className="p-3 font-semibold text-center">Parts Replaced</th>
                    </tr>
                </thead>
                <tbody>
                    {monthlySummary.map(([month, data], index) => (
                        <tr key={month} className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'} border-t border-gray-700`}>
                            <td className="p-3 font-medium">{month}</td>
                            <td className="p-3 text-center tabular-nums text-lg">{data.hardware}</td>
                            <td className="p-3 text-center tabular-nums text-lg">{data.software}</td>
                            <td className="p-3 text-center tabular-nums text-lg">{data.parts}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Date Range Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                 <h2 className="text-xl font-bold mb-4">Problem Solving Status (by Range)</h2>
                 <div className="flex items-center gap-4 mb-6 p-4 bg-gray-900/50 rounded-lg">
                    <label className="font-semibold">Select a Range:</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md"/>
                    <span>to</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md"/>
                 </div>
                 
                 {/* Bar Chart */}
                 <div className="flex items-end justify-around h-64 border-l border-b border-gray-600 p-4">
                    <div className="flex flex-col items-center">
                        <div className="w-16 bg-pink-500 rounded-t-md" style={{ height: `${(rangeData.summary.hardware / maxChartValue) * 100}%` }}></div>
                        <span className="mt-2 font-bold text-2xl text-pink-400">{rangeData.summary.hardware}</span>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="w-16 bg-blue-500 rounded-t-md" style={{ height: `${(rangeData.summary.software / maxChartValue) * 100}%` }}></div>
                         <span className="mt-2 font-bold text-2xl text-blue-400">{rangeData.summary.software}</span>
                    </div>
                     <div className="flex flex-col items-center">
                        <div className="w-16 bg-indigo-500 rounded-t-md" style={{ height: `${(rangeData.summary.parts / maxChartValue) * 100}%` }}></div>
                         <span className="mt-2 font-bold text-2xl text-indigo-400">{rangeData.summary.parts}</span>
                    </div>
                 </div>
                 <div className="flex justify-around mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-2"><span className="w-3 h-3 bg-pink-500 rounded-full"></span>Hardware</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-full"></span>Software</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-500 rounded-full"></span>Parts</span>
                 </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                <h2 className="text-xl font-bold mb-4 text-purple-400">G&R Out of Service</h2>
                <p className="text-xs text-gray-500 mb-4">For range: {new Date(startDate + 'T00:00:00').toLocaleDateString()} to {new Date(endDate + 'T00:00:00').toLocaleDateString()}</p>
                {rangeData.outOfServiceRides.length > 0 ? (
                    <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {rangeData.outOfServiceRides.map(rideName => (
                            <li key={rideName} className="p-2 bg-gray-700/50 rounded-md text-gray-300">{rideName}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No rides were reported out of service in this period.</p>
                )}
            </div>
        </div>

    </div>
  );
};

export default MaintenanceDashboard;