
import React, { useState, useMemo } from 'react';
import { Ride } from '../types';

interface ReportsProps {
  dailyCounts: Record<string, Record<string, number>>;
  rides: Ride[];
}

interface MonthlyReportData {
  rideId: number;
  rideName: string;
  rideFloor: string;
  total: number;
}

const Reports: React.FC<ReportsProps> = ({ dailyCounts, rides }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    Object.keys(dailyCounts).forEach(dateStr => {
      months.add(dateStr.substring(0, 7)); // 'YYYY-MM'
    });
    return Array.from(months).sort().reverse();
  }, [dailyCounts]);

  const monthlyReport = useMemo<MonthlyReportData[]>(() => {
    const rideData: Record<number, { total: number }> = {};

    Object.entries(dailyCounts).forEach(([dateStr, counts]) => {
      if (dateStr.startsWith(selectedMonth)) {
        Object.entries(counts).forEach(([rideIdStr, count]) => {
          const rideId = parseInt(rideIdStr, 10);
          if (!rideData[rideId]) {
            rideData[rideId] = { total: 0 };
          }
          rideData[rideId].total += count;
        });
      }
    });

    return rides.map(ride => ({
      rideId: ride.id,
      rideName: ride.name,
      rideFloor: ride.floor,
      total: rideData[ride.id]?.total || 0,
    })).filter(item => item.total > 0)
       .sort((a, b) => b.total - a.total);
  }, [selectedMonth, dailyCounts, rides]);

  const totalMonthlyGuests = useMemo(() => {
    return monthlyReport.reduce((sum, item) => sum + item.total, 0);
  }, [monthlyReport]);

  const handleDownload = () => {
    if (monthlyReport.length === 0) return;

    const headers = ['Ride Name', 'Floor', 'Total Guests'];
    const rows = monthlyReport.map(item => 
        [item.rideName, item.rideFloor, item.total].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    const monthName = new Date(selectedMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' });
    link.setAttribute('download', `ToggiFunWorld_Report_${monthName.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col">
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Monthly Reports
            </h1>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                 <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none"
                    aria-label="Select month to view report"
                >
                    {availableMonths.length > 0 ? (
                      availableMonths.map(month => (
                        <option key={month} value={month}>
                          {new Date(month + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </option>
                      ))
                    ) : (
                       <option>{new Date(selectedMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
                    )}
                </select>
                <button
                    onClick={handleDownload}
                    disabled={monthlyReport.length === 0}
                    className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed"
                    aria-label="Download report as CSV file"
                >
                    Download CSV
                </button>
            </div>
        </div>
      
        {monthlyReport.length > 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
            <table className="w-full text-left">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="p-4 font-semibold">Ride / Game Name</th>
                  <th className="p-4 font-semibold">Floor</th>
                  <th className="p-4 font-semibold text-right">Total Guests</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReport.map((item, index) => (
                  <tr key={item.rideId} className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'} border-t border-gray-700`}>
                    <td className="p-4 font-medium">{item.rideName}</td>
                    <td className="p-4 text-gray-400">{item.rideFloor}</td>
                    <td className="p-4 text-right font-bold text-xl text-purple-400 tabular-nums">{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-700/50 border-t-2 border-purple-500">
                 <tr>
                    <td className="p-4 font-bold text-lg" colSpan={2}>Month Total</td>
                    <td className="p-4 text-right font-bold text-2xl text-pink-500 tabular-nums">{totalMonthlyGuests.toLocaleString()}</td>
                 </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-400">No data found for this month.</h2>
            <p className="text-gray-500">Guest counts will appear here once they are recorded.</p>
          </div>
        )}
    </div>
  );
};

export default Reports;