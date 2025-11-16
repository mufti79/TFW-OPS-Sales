import React, { useState, useMemo } from 'react';
import { HistoryRecord } from '../types';

interface HistoryLogProps {
  history: HistoryRecord[];
  onClearHistory: () => void;
}

const HistoryLog: React.FC<HistoryLogProps> = ({ history, onClearHistory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const filteredHistory = useMemo(() => {
    return history.filter(record => {
      const recordDate = record.timestamp.split('T')[0];
      const matchesDate = !selectedDate || recordDate === selectedDate;

      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        record.user.toLowerCase().includes(lowerSearch) ||
        record.action.toLowerCase().includes(lowerSearch) ||
        record.details.toLowerCase().includes(lowerSearch);
      
      return matchesDate && matchesSearch;
    });
  }, [history, searchTerm, selectedDate]);
  
  const uniqueDates = useMemo(() => {
      const dates = new Set<string>();
      history.forEach(record => dates.add(record.timestamp.split('T')[0]));
      return Array.from(dates).sort().reverse();
  }, [history]);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Activity History Log
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Dates</option>
            {uniqueDates.map(date => <option key={date} value={date}>{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</option>)}
          </select>
          <button
            onClick={onClearHistory}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 active:scale-95 transition-all"
          >
            Clear Log
          </button>
        </div>
      </div>

      {filteredHistory.length > 0 ? (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="p-4 font-semibold">Timestamp</th>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Action</th>
                  <th className="p-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((record, index) => (
                  <tr key={record.id} className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/50'} border-t border-gray-700`}>
                    <td className="p-4 text-gray-400 text-sm whitespace-nowrap">
                      {new Date(record.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-medium">{record.user}</td>
                    <td className="p-4 text-purple-400 font-mono text-sm">{record.action}</td>
                    <td className="p-4 text-gray-300">{record.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-400">No history records found.</h2>
          <p className="text-gray-500">Actions performed in the app will be logged here.</p>
        </div>
      )}
    </div>
  );
};

export default HistoryLog;
