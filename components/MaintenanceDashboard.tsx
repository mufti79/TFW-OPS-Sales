import React, { useMemo } from 'react';
import { MaintenanceTicket, Operator } from '../types';

interface MaintenanceDashboardProps {
  maintenanceTickets: Record<string, Record<string, MaintenanceTicket>>;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onUpdateTicketStatus: (ticket: MaintenanceTicket, newStatus: 'in-progress' | 'solved') => void;
  currentUser: Operator;
}

const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({ maintenanceTickets, selectedDate, onDateChange, onUpdateTicketStatus, currentUser }) => {
  const ticketsForDay = useMemo(() => {
    return Object.values(maintenanceTickets[selectedDate] || {});
  }, [maintenanceTickets, selectedDate]);

  const reportedTickets = useMemo(() => ticketsForDay.filter(t => t.status === 'reported').sort((a,b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime()), [ticketsForDay]);
  const inProgressTickets = useMemo(() => ticketsForDay.filter(t => t.status === 'in-progress').sort((a,b) => new Date(a.inProgressAt || 0).getTime() - new Date(b.inProgressAt || 0).getTime()), [ticketsForDay]);
  const solvedTickets = useMemo(() => ticketsForDay.filter(t => t.status === 'solved').sort((a,b) => new Date(a.solvedAt || 0).getTime() - new Date(b.solvedAt || 0).getTime()), [ticketsForDay]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const [year, month, day] = selectedDate.split('-').map(Number);
  const displayDate = new Date(year, month - 1, day);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Maintenance Dashboard
          </h1>
          <p className="text-gray-400">Showing tickets for {displayDate.toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
          <label htmlFor="maintenance-date" className="text-sm font-medium text-gray-300">View Date:</label>
          <input
            id="maintenance-date"
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Reported Column */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Reported ({reportedTickets.length})</h2>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {reportedTickets.map(ticket => (
              <div key={ticket.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                <p className="font-bold text-lg">{ticket.rideName}</p>
                <p className="text-sm text-gray-400 mb-2">Reported by {ticket.reportedByName} at {formatTime(ticket.reportedAt)}</p>
                <p className="text-gray-300 mb-4">{ticket.problem}</p>
                <button
                  onClick={() => onUpdateTicketStatus(ticket, 'in-progress')}
                  className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Take Issue
                </button>
              </div>
            ))}
            {reportedTickets.length === 0 && <p className="text-gray-500 text-center py-8">No new issues reported.</p>}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-xl font-bold text-blue-400 mb-4">In Progress ({inProgressTickets.length})</h2>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {inProgressTickets.map(ticket => (
              <div key={ticket.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                <p className="font-bold text-lg">{ticket.rideName}</p>
                <p className="text-sm text-gray-400 mb-2">Taken by {ticket.assignedToName} at {formatTime(ticket.inProgressAt)}</p>
                <p className="text-gray-300 mb-4">{ticket.problem}</p>
                <button
                  onClick={() => onUpdateTicketStatus(ticket, 'solved')}
                  disabled={ticket.assignedToId !== currentUser.id}
                  className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  Mark as Solved
                </button>
              </div>
            ))}
             {inProgressTickets.length === 0 && <p className="text-gray-500 text-center py-8">No issues in progress.</p>}
          </div>
        </div>

        {/* Solved Column */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-xl font-bold text-green-400 mb-4">Solved ({solvedTickets.length})</h2>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {solvedTickets.map(ticket => (
              <div key={ticket.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-600 opacity-70">
                <p className="font-bold text-lg">{ticket.rideName}</p>
                 <p className="text-sm text-gray-400 mb-2">Solved by {ticket.assignedToName} at {formatTime(ticket.solvedAt)}</p>
                <p className="text-gray-300">{ticket.problem}</p>
              </div>
            ))}
            {solvedTickets.length === 0 && <p className="text-gray-500 text-center py-8">No issues solved yet today.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDashboard;