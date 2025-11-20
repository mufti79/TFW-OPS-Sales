import React, { useState, useMemo } from 'react';
import { SECURITY_FLOORS } from '../constants';

interface ManagementViewProps {
  floorGuestCounts: Record<string, Record<string, Record<string, number>>>;
  onNavigate: (view: 'management-hub') => void;
}

const ManagementView: React.FC<ManagementViewProps> = ({ floorGuestCounts, onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Hours are 2 PM (14) to 9 PM (21)
  const hours = useMemo(() => Array.from({ length: 8 }, (_, i) => 14 + i), []); 

  // New compact header format: e.g., "2-3p", "9-10p"
  const formatHourHeader = (hour: number) => {
    const nextHourRaw = hour + 1;
    const startHour12 = hour % 12 === 0 ? 12 : hour % 12;
    const endHour12 = nextHourRaw % 12 === 0 ? 12 : nextHourRaw % 12;
    const endAmPm = nextHourRaw >= 12 && nextHourRaw < 24 ? 'p' : 'a';
    return `${startHour12}-${endHour12}${endAmPm}`;
  };

  const dailyData = useMemo(() => {
    const countsForDate = floorGuestCounts[selectedDate] || {};
    
    const tableData = SECURITY_FLOORS.map(floor => {
        const floorCounts = countsForDate[floor] || {};
        const hourlyData = hours.map(hour => floorCounts[hour.toString()] || 0);
        return { floor, hourlyData };
    });
    
    const colTotals = hours.map((hour, colIndex) => 
        tableData.reduce((sum, row) => sum + (row.hourlyData[colIndex] || 0), 0)
    );
    
    const grandTotal = colTotals.reduce((sum, total) => sum + total, 0);

    return { tableData, colTotals, grandTotal };
  }, [floorGuestCounts, selectedDate, hours]);
  
  const [year, month, day] = selectedDate.split('-').map(Number);
  const displayDate = new Date(year, month - 1, day);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Floor Guest Count Dashboard
          </h1>
          <p className="text-gray-400">Viewing data for {displayDate.toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
            <button
              onClick={() => onNavigate('management-hub')}
              className="px-4 py-2.5 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 active:scale-95 transition-all text-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Back to Hub
            </button>
            <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
              <label htmlFor="management-date" className="text-sm font-medium text-gray-300">View Date:</label>
              <input
                id="management-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              />
            </div>
        </div>
      </div>
      
      {/* Desktop Table View - visible on medium screens and up */}
      <div className="hidden md:block bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="p-2 font-semibold">Level</th>
              {hours.map(hour => <th key={hour} className="p-2 font-semibold text-center text-xs">{formatHourHeader(hour)}</th>)}
            </tr>
          </thead>
          <tbody>
            {dailyData.tableData.map((row) => (
              <tr key={row.floor} className="border-t border-gray-700">
                <td className="p-2 font-medium">{`L-${row.floor.replace('th', '')}`}</td>
                {row.hourlyData.map((count, colIndex) => (
                  <td key={colIndex} className="p-2 text-center tabular-nums text-gray-300">
                    {count > 0 ? count.toLocaleString() : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-700/50 border-t-2 border-indigo-500">
            <tr>
              <th className="p-2 font-bold text-base text-center">
                  <div>Total</div>
                  <div className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    {dailyData.grandTotal.toLocaleString()}
                  </div>
              </th>
              {dailyData.colTotals.map((total, index) => (
                <th key={index} className="p-2 font-bold text-center text-base text-cyan-400 tabular-nums">
                  {total > 0 ? total.toLocaleString() : '-'}
                </th>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile List View - visible on small screens */}
      <div className="block md:hidden space-y-4">
        {dailyData.tableData.map(row => (
            <div key={row.floor} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4">
                <h2 className="text-lg font-bold text-cyan-400 mb-3">{`Level ${row.floor.replace('th', '')}`}</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {hours.map((hour, index) => (
                        <div key={hour} className="flex justify-between border-b border-gray-700/50 pb-1">
                            <span className="text-gray-400">{formatHourHeader(hour)}:</span>
                            <span className="font-semibold text-gray-200 tabular-nums">
                                {row.hourlyData[index] > 0 ? row.hourlyData[index].toLocaleString() : '-'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        ))}
         {/* Mobile Totals */}
        <div className="bg-gray-700 rounded-lg shadow-lg border border-indigo-500 p-4">
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-indigo-400">Total</h2>
                <div className="text-right">
                    <p className="text-xs text-gray-400">Grand Total</p>
                    <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                        {dailyData.grandTotal.toLocaleString()}
                    </p>
                </div>
            </div>
             <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {hours.map((hour, index) => (
                    <div key={hour} className="flex justify-between border-b border-gray-600/50 pb-1">
                        <span className="text-gray-400">{formatHourHeader(hour)}:</span>
                        <span className="font-semibold text-cyan-300 tabular-nums">
                            {dailyData.colTotals[index] > 0 ? dailyData.colTotals[index].toLocaleString() : '-'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementView;