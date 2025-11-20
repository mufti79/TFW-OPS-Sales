
import React, { useState, useMemo, useCallback } from 'react';
import { Ride } from '../types';

interface ReportsProps {
  dailyCounts: Record<string, Record<string, number>>;
  rides: Ride[];
}

const Reports: React.FC<ReportsProps> = ({ dailyCounts, rides }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });

  const monthData = useMemo(() => {
    const data = new Map<string, number>();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const monthPrefix = `${year}-${month}`;

    // FIX: Changed from for...in to Object.entries for better type inference.
    for (const [dateStr, dayCounts] of Object.entries(dailyCounts)) {
      if (dateStr.startsWith(monthPrefix)) {
        // FIX: Operator '+' cannot be applied to types 'unknown' and 'unknown'.
        // FIX: Operator '>' cannot be applied to types 'unknown' and 'number'.
        // FIX: Argument of type 'unknown' is not assignable to parameter of type 'number'.
        // By using Object.entries, `dayCounts` is correctly typed as Record<string, number>, and `Object.values` returns `number[]`, fixing the reduce operation.
        const total = Object.values(dayCounts).reduce((sum, count) => sum + count, 0);
        if (total > 0) {
          data.set(dateStr, total);
        }
      }
    }
    return data;
  }, [dailyCounts, currentDate]);
  
  const monthTotal = useMemo(() => {
    let total = 0;
    for (const count of monthData.values()) {
        total += count;
    }
    return total;
  }, [monthData]);

  const rangeTotal = useMemo(() => {
    if (!selectedRange.start || !selectedRange.end) return 0;
    
    let total = 0;
    let current = new Date(selectedRange.start);
    
    while (current <= selectedRange.end) {
        const dateStr = current.toISOString().split('T')[0];
        total += monthData.get(dateStr) || 0;
        current.setDate(current.getDate() + 1);
    }
    return total;
  }, [selectedRange, monthData]);


  const handleDateClick = (day: Date) => {
    const { start, end } = selectedRange;
    
    // If a full range is already selected, or no start is selected, start a new selection.
    if (!start || (start && end)) {
        setSelectedRange({ start: day, end: null });
    } 
    // If a start date is selected but an end date is not, complete the range.
    else if (start && !end) {
        // If the newly selected day is before the start date, swap them to create a valid range.
        if (day < start) {
            setSelectedRange({ start: day, end: start });
        } else {
            setSelectedRange({ start: start, end: day });
        }
    }
  };
  
  const handleMonthChange = (offset: number) => {
    setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + offset);
        return newDate;
    });
    setSelectedRange({ start: null, end: null }); // Clear range on month change
  };
  
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Add blank days for the start of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDownloadMonthReport = () => {
    const monthRideData: Record<string, number> = {};
    for (const dateStr of monthData.keys()) {
        const countsForDay = dailyCounts[dateStr] || {};
        for (const rideId in countsForDay) {
            monthRideData[rideId] = (monthRideData[rideId] || 0) + countsForDay[rideId];
        }
    }
    
    // FIX: Explicitly providing generic types to `new Map` ensures TypeScript correctly infers `ride` as type `Ride | undefined` instead of `unknown`.
    const rideIdMap = new Map<string, Ride>(rides.map(r => [r.id.toString(), r]));
    const reportData = Object.entries(monthRideData).map(([rideId, total]) => {
        const ride = rideIdMap.get(rideId);
        return {
            // FIX: Property 'name' does not exist on type 'unknown'.
            name: ride?.name || 'Unknown Ride',
            // FIX: Property 'floor' does not exist on type 'unknown'.
            floor: ride?.floor || 'N/A',
            total
        };
    }).sort((a,b) => b.total - a.total);

    if (reportData.length === 0) return;

    const headers = ['Ride Name', 'Floor', 'Total Guests'];
    const rows = reportData.map(item => `"${item.name}","${item.floor}",${item.total}`);
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `TFW_Monthly_Report_${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}.csv`;
    link.click();
  };

  const handleDownloadRangeReport = () => {
    if (!selectedRange.start || !selectedRange.end) return;
    
    const reportData = [];
    let current = new Date(selectedRange.start);
    while (current <= selectedRange.end) {
        const dateStr = current.toISOString().split('T')[0];
        reportData.push({
            date: dateStr,
            total: monthData.get(dateStr) || 0
        });
        current.setDate(current.getDate() + 1);
    }

    const headers = ['Date', 'Total Guests'];
    const rows = reportData.map(item => `${item.date},${item.total}`);
    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `TFW_Range_Report_${selectedRange.start.toISOString().split('T')[0]}_to_${selectedRange.end.toISOString().split('T')[0]}.csv`;
    link.click();
  };


  return (
    <div className="flex flex-col">
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Operational Report
            </h1>
            <div className="flex items-center gap-4">
                <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-xl font-semibold w-48 text-center">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
            <button onClick={() => setSelectedRange({start: null, end: null})} className="text-sm text-gray-400 hover:text-white">Clear Selection</button>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
            <div className="grid grid-cols-7 text-center font-semibold text-gray-400 border-b border-gray-700">
                {weekDays.map(day => <div key={day} className="py-3">{day}</div>)}
            </div>
            <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`} className="border-r border-b border-gray-700"></div>;
                    
                    const dateStr = day.toISOString().split('T')[0];
                    const count = monthData.get(dateStr) || 0;
                    
                    const isPending = selectedRange.start && !selectedRange.end && selectedRange.start.getTime() === day.getTime();
                    const inRange = selectedRange.start && selectedRange.end && day >= selectedRange.start && day <= selectedRange.end;
                    const isStart = selectedRange.start?.getTime() === day.getTime();
                    const isEnd = selectedRange.end?.getTime() === day.getTime();

                    const cellClasses = [
                        "p-2 h-32 flex flex-col justify-between border-r border-b border-gray-700 cursor-pointer transition-colors",
                        inRange ? "bg-purple-800/50" : "hover:bg-gray-700/50",
                        isPending && "bg-purple-700/50 ring-2 ring-purple-400",
                        isStart && inRange && "bg-purple-600 font-bold",
                        isEnd && inRange && "bg-purple-600 font-bold",
                    ].filter(Boolean).join(' ');

                    return (
                        <div key={dateStr} className={cellClasses} onClick={() => handleDateClick(day)}>
                            <span className={`font-bold ${isStart || isEnd ? 'text-white' : ''}`}>{day.getDate()}</span>
                            {count > 0 && (
                                <span className="text-lg font-semibold text-pink-400 self-end tabular-nums">
                                    {count.toLocaleString()}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-300">Selected Range Total</h3>
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    {rangeTotal.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                    {selectedRange.start && selectedRange.end ? `${selectedRange.start.toLocaleDateString()} - ${selectedRange.end.toLocaleDateString()}` : "No range selected"}
                </p>
                <button 
                    onClick={handleDownloadRangeReport} 
                    disabled={!selectedRange.start || !selectedRange.end}
                    className="mt-4 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg text-sm disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Download Range Report (CSV)
                </button>
            </div>
             <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-300">Month Total</h3>
                <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
                    {monthTotal.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                    Total guests for {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </p>
                 <button 
                    onClick={handleDownloadMonthReport}
                    disabled={monthTotal === 0}
                    className="mt-4 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg text-sm disabled:bg-gray-600 disabled:cursor-not-allowed"
                 >
                    Download Month Report (CSV)
                 </button>
            </div>
        </div>
    </div>
  );
};

export default Reports;
