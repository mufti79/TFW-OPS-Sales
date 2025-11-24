import React, { useMemo, useState } from 'react';
import { MaintenanceTicket, Operator } from '../types';

interface MaintenanceDashboardProps {
  maintenanceTickets: Record<string, Record<string, MaintenanceTicket>>;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onUpdateTicketStatus: (ticket: MaintenanceTicket, newStatus: 'in-progress' | 'solved', technician: Operator) => void;
  maintenancePersonnel: Operator[];
}

const MaintenanceDashboard: React.FC<MaintenanceDashboardProps> = ({ maintenanceTickets, selectedDate, onDateChange, onUpdateTicketStatus, maintenancePersonnel }) => {
  const [selectedTechnician, setSelectedTechnician] = useState<Operator | null>(null);

  const { sortedTickets, ticketNumberMap } = useMemo(() => {
    const tickets = Object.values(maintenanceTickets[selectedDate] || {}) as MaintenanceTicket[];
    const sorted = tickets.sort((a, b) => new Date(a.reportedAt).getTime() - new Date(b.reportedAt).getTime());
    const map = new Map<string, number>();
    sorted.forEach((ticket, index) => {
      map.set(ticket.id, index + 1);
    });
    return { sortedTickets: sorted, ticketNumberMap: map };
  }, [maintenanceTickets, selectedDate]);

  const reportedTickets = useMemo(() => sortedTickets.filter(t => t.status === 'reported'), [sortedTickets]);
  const inProgressTickets = useMemo(() => sortedTickets.filter(t => t.status === 'in-progress'), [sortedTickets]);
  const solvedTickets = useMemo(() => sortedTickets.filter(t => t.status === 'solved'), [sortedTickets]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const [year, month, day] = selectedDate.split('-').map(Number);
  const displayDate = new Date(year, month - 1, day);

  const handleDownloadReport = () => {
    if (sortedTickets.length === 0) {
      alert("No maintenance tickets to download for this date.");
      return;
    }

    const headers = [
      'Ticket #', 'Ride Name', 'Problem', 'Status',
      'Reported By', 'Reported At', 'Assigned To', 'In Progress At', 'Solved At'
    ];

    const formatCsvField = (field: string | undefined | number) => {
      if (field === undefined || field === null) return '';
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = sortedTickets.map(ticket => {
      const rowData = [
        ticketNumberMap.get(ticket.id),
        ticket.rideName,
        ticket.problem,
        ticket.status,
        ticket.reportedByName,
        ticket.reportedAt ? new Date(ticket.reportedAt).toLocaleString() : '',
        ticket.assignedToName,
        ticket.inProgressAt ? new Date(ticket.inProgressAt).toLocaleString() : '',
        ticket.solvedAt ? new Date(ticket.solvedAt).toLocaleString() : ''
      ];
      return rowData.map(formatCsvField).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `TFW_Maintenance_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleTechnicianSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const techId = parseInt(e.target.value, 10);
      const technician = maintenancePersonnel.find(p => p.id === techId) || null;
      setSelectedTechnician(technician);
  };


  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Maintenance Dashboard
          </h1>
          <p className="text-gray-400">Showing tickets for {displayDate.toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
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
            <button
                onClick={handleDownloadReport}
                className="px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all text-sm"
            >
                Download Report
            </button>
        </div>
      </div>
      
       <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <label htmlFor="technician-select" className="block text-lg font-medium text-gray-200 mb-2">Select Your Name to Proceed</label>
            <select
                id="technician-select"
                value={selectedTechnician?.id || ''}
                onChange={handleTechnicianSelect}
                className="w-full max-w-sm px-4 py-3 bg-gray-900 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg"
            >
                <option value="">-- Select Technician --</option>
                {maintenancePersonnel.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
            {!selectedTechnician && <p className="text-yellow-400 text-sm mt-2">You must select your name before you can take or solve issues.</p>}
        </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Reported Column */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Reported ({reportedTickets.length})</h2>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {reportedTickets.map(ticket => (
              <div key={ticket.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-600">
                <p className="font-bold text-lg">#{ticketNumberMap.get(ticket.id)} - {ticket.rideName}</p>
                <p className="text-sm text-gray-400 mb-2">Reported by {ticket.reportedByName} at {formatTime(ticket.reportedAt)}</p>
                <p className="text-gray-300 mb-4">{ticket.problem}</p>
                <button
                  onClick={() => selectedTechnician && onUpdateTicketStatus(ticket, 'in-progress', selectedTechnician)}
                  disabled={!selectedTechnician}
                  className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
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
                <p className="font-bold text-lg">#{ticketNumberMap.get(ticket.id)} - {ticket.rideName}</p>
                <p className="text-sm text-gray-400 mb-2">Taken by {ticket.assignedToName} at {formatTime(ticket.inProgressAt)}</p>
                <p className="text-gray-300 mb-4">{ticket.problem}</p>
                <button
                  onClick={() => selectedTechnician && onUpdateTicketStatus(ticket, 'solved', selectedTechnician)}
                  disabled={!selectedTechnician || ticket.assignedToId !== selectedTechnician.id}
                  className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  title={!selectedTechnician ? "Select your name first" : (ticket.assignedToId !== selectedTechnician.id ? "Another technician is handling this issue" : "")}
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
                <p className="font-bold text-lg">#{ticketNumberMap.get(ticket.id)} - {ticket.rideName}</p>
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