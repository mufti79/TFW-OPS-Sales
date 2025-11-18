

import React, { useMemo, useState } from 'react';
import { Counter, Operator, AttendanceRecord, HandoverRecord } from '../types';
import { Role } from '../hooks/useAuth';
import BriefingCheckin from './BriefingCheckin';

type View = 'counter' | 'reports' | 'assignments' | 'expertise' | 'roster' | 'ticket-sales-dashboard' | 'ts-assignments' | 'ts-roster';

// Re-assignment Modal Component
interface ReassignModalProps {
    counter: Counter;
    currentPersonnel: Operator;
    allPersonnel: Operator[];
    onClose: () => void;
    onReassign: (counterId: number, newPersonnelId: number) => void;
    attendance: AttendanceRecord[];
    selectedDate: string;
}

const ReassignModal: React.FC<ReassignModalProps> = ({ counter, currentPersonnel, allPersonnel, onClose, onReassign, attendance, selectedDate }) => {
    const [selectedPersonnelId, setSelectedPersonnelId] = useState<string>('');
    
    const attendanceStatusMap = useMemo(() => {
        const statusMap = new Map<number, boolean>();
        attendance
          .filter(record => record.date === selectedDate)
          .forEach(record => statusMap.set(record.operatorId, true));
        return statusMap;
    }, [attendance, selectedDate]);
      
    const availablePersonnel = useMemo(() => {
        return allPersonnel
            .filter(p => p.id !== currentPersonnel.id)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [allPersonnel, currentPersonnel.id]);

    const handleConfirm = () => {
        if (selectedPersonnelId) {
            onReassign(counter.id, parseInt(selectedPersonnelId, 10));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm border border-gray-700 animate-fade-in-up">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-100">Handover / Re-assign</h2>
                            <p className="text-teal-400 font-semibold">{counter.name}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <p className="text-gray-400 text-sm">Currently assigned to: <span className="font-bold text-gray-200">{currentPersonnel.name}</span></p>
                        <div>
                            <label htmlFor="personnel-select" className="block text-sm font-medium text-gray-300 mb-2">Assign to:</label>
                            <select
                                id="personnel-select"
                                value={selectedPersonnelId}
                                onChange={(e) => setSelectedPersonnelId(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                            >
                                <option value="">-- Select Personnel --</option>
                                {availablePersonnel.map(p => {
                                    const isPresent = attendanceStatusMap.get(p.id);
                                    const statusLabel = isPresent ? '(P)' : '(A)';
                                    return (
                                        <option key={p.id} value={p.id}>{p.name} {statusLabel}</option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gray-700/50 px-6 py-4 flex justify-end gap-4 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 active:scale-95 transition-all">
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        disabled={!selectedPersonnelId}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        Confirm Handover
                    </button>
                </div>
            </div>
        </div>
    );
};


interface TicketSalesRosterProps {
  counters: Counter[];
  ticketSalesPersonnel: Operator[];
  dailyAssignments: Record<string, Record<string, number>>;
  selectedDate: string;
  onDateChange: (date: string) => void;
  role: Exclude<Role, null>;
  currentUser: Operator | null;
  attendance: AttendanceRecord[];
  onNavigate: (view: View) => void;
  onReassign: (counterId: number, newPersonnelId: number) => void;
  handovers: HandoverRecord[];
  hasCheckedInToday: boolean;
  onClockIn: (attendedBriefing: boolean, briefingTime: string | null) => void;
  isCheckinAllowed: boolean;
}

const TicketSalesRoster: React.FC<TicketSalesRosterProps> = ({ counters, ticketSalesPersonnel, dailyAssignments, selectedDate, onDateChange, role, currentUser, attendance, onNavigate, onReassign, handovers, hasCheckedInToday, onClockIn, isCheckinAllowed }) => {
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [reassignModalInfo, setReassignModalInfo] = useState<{ counter: Counter; currentPersonnel: Operator } | null>(null);
  
  const formatTime = (timeStr: string | null): string => {
      if (!timeStr) return '';
      const [hours, minutes] = timeStr.split(':');
      let h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      return `${h}:${minutes} ${ampm}`;
  };

  const { assignmentsByPersonnel, unassignedCounters, personnelWithAttendance, presentCount, absentCount } = useMemo(() => {
    const assignmentsToday: Record<string, number> = dailyAssignments[selectedDate] || {};
    const counterMap = new Map(counters.map(c => [c.id.toString(), c]));
    
    const assignmentsByPersonnel = new Map<number, Counter[]>();
    const assignedCounterIds = new Set<string>();

    for (const [counterId, personnelId] of Object.entries(assignmentsToday)) {
      const counter = counterMap.get(counterId);
      if (counter) {
        const personnelCounters = assignmentsByPersonnel.get(personnelId);
        if (personnelCounters) {
          personnelCounters.push(counter as Counter);
        } else {
          assignmentsByPersonnel.set(personnelId, [counter as Counter]);
        }
        assignedCounterIds.add(counterId);
      }
    }
    
    for (const counterList of assignmentsByPersonnel.values()) {
      counterList.sort((a, b) => a.name.localeCompare(b.name));
    }

    const unassignedCounters = counters
        .filter(c => !assignedCounterIds.has(c.id.toString()))
        .sort((a, b) => a.name.localeCompare(b.name));
    
    const attendanceTodayMap = new Map<number, AttendanceRecord>();
    const allPersonnelIds = new Set(ticketSalesPersonnel.map(p => p.id));
    attendance
      .filter(record => record.date === selectedDate && allPersonnelIds.has(record.operatorId))
      .forEach(record => attendanceTodayMap.set(record.operatorId, record));

    const personnelWithAttendance = ticketSalesPersonnel.map(op => ({
      ...op,
      attendance: attendanceTodayMap.get(op.id) || null
    })).sort((a, b) => {
        if (a.attendance && !b.attendance) return -1;
        if (!a.attendance && b.attendance) return 1;
        return a.name.localeCompare(b.name);
    });

    const presentCount = personnelWithAttendance.filter(op => op.attendance).length;
    const absentCount = personnelWithAttendance.length - presentCount;

    return { assignmentsByPersonnel, unassignedCounters, personnelWithAttendance, presentCount, absentCount };
  }, [dailyAssignments, selectedDate, counters, ticketSalesPersonnel, attendance]);

  const handoversByCounter = useMemo(() => {
    const map = new Map<number, HandoverRecord[]>();
    handovers
        .filter(h => h.date === selectedDate)
        .forEach(h => {
            const existing = map.get(h.counterId) || [];
            map.set(h.counterId, [...existing, h]);
        });
    for(const records of map.values()) {
        records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return map;
  }, [handovers, selectedDate]);

  const filteredPersonnel = useMemo(() => {
    const relevantPersonnel = (role === 'ticket-sales' && currentUser)
        ? personnelWithAttendance.filter(op => op.id === currentUser.id)
        : personnelWithAttendance;

    if (attendanceFilter === 'present') {
        return relevantPersonnel.filter(p => p.attendance);
    }
    if (attendanceFilter === 'absent') {
        return relevantPersonnel.filter(p => !p.attendance);
    }
    return relevantPersonnel;
  }, [personnelWithAttendance, attendanceFilter, role, currentUser]);

  const handleDownloadAttendanceReport = () => {
    if (filteredPersonnel.length === 0) {
        alert("No personnel data to download for the current filter.");
        return;
    }

    const headers = ['Personnel Name', 'Status', 'Briefing Attended', 'Briefing Time'];
    
    const rows = filteredPersonnel.map(personnel => {
        const status = personnel.attendance ? 'Present' : 'Absent';
        let attendedBriefing = 'N/A';
        let briefingTime = 'N/A';

        if(personnel.attendance) {
            attendedBriefing = personnel.attendance.attendedBriefing ? 'Yes' : 'No';
            briefingTime = personnel.attendance.attendedBriefing ? formatTime(personnel.attendance.briefingTime) : 'N/A';
        }
        
        const personnelName = `"${personnel.name.replace(/"/g, '""')}"`;
        
        return [personnelName, status, attendedBriefing, briefingTime].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    const filterText = attendanceFilter !== 'all' ? `_${attendanceFilter}` : '';
    link.setAttribute('download', `ToggiFunWorld_SalesAttendance_${selectedDate}${filterText}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
    const handleReassignConfirm = (counterId: number, newPersonnelId: number) => {
        onReassign(counterId, newPersonnelId);
        setReassignModalInfo(null);
    };

  const isRosterEmpty = personnelWithAttendance.length === 0;
  const isManager = role === 'admin' || role === 'sales-officer';

  const [year, month, day] = selectedDate.split('-').map(Number);
  const displayDate = new Date(year, month - 1, day);

  if (role === 'ticket-sales' && currentUser) {
      if (!hasCheckedInToday) {
        if (isCheckinAllowed) {
            return <BriefingCheckin operatorName={currentUser.name} onClockIn={onClockIn} />;
        } else {
            return (
                <div className="w-full max-w-lg mx-auto bg-gray-800 p-8 rounded-lg shadow-lg border border-yellow-500 text-center animate-fade-in-up">
                    <h1 className="text-3xl font-bold text-yellow-400 mb-4">Check-in Closed for Today</h1>
                    <p className="text-lg text-gray-300">
                        The check-in window for today has closed at 10:00 PM.
                    </p>
                    <p className="text-lg text-gray-400 mt-2">
                        Check-in for the next day will be available after 12:00 AM.
                    </p>
                </div>
            );
        }
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
              Ticket Sales Roster for {displayDate.toLocaleDateString()}
            </h1>
            {isManager && (
            <div className="flex items-center gap-6 mt-2 text-lg">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-green-400">Present:</span>
                    <span className="font-bold text-2xl text-gray-100">{presentCount}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-red-500">Absent:</span>
                    <span className="font-bold text-2xl text-gray-100">{absentCount}</span>
                </div>
            </div>
        )}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
           <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                <label htmlFor="roster-date" className="text-sm font-medium text-gray-300">Date:</label>
                <input
                    id="roster-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
                />
            </div>
            {isManager && (
                <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                    <label htmlFor="attendance-filter" className="text-sm font-medium text-gray-300">Filter:</label>
                    <select
                        id="attendance-filter"
                        value={attendanceFilter}
                        onChange={(e) => setAttendanceFilter(e.target.value as 'all' | 'present' | 'absent')}
                        className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
                    >
                        <option value="all">All</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                    </select>
                </div>
            )}
           {isManager && (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                  <div className="flex items-center gap-2 p-1 bg-gray-700/50 rounded-lg">
                      <button
                          onClick={handleDownloadAttendanceReport}
                          className="px-3 py-1.5 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 active:scale-95 transition-all text-sm"
                      >
                          DL Attendance
                      </button>
                  </div>
                  <button
                    onClick={() => onNavigate('ts-assignments')}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-sm"
                  >
                    Edit Assignments
                  </button>
              </div>
            )}
        </div>
      </div>
      
        {isRosterEmpty ? (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold text-gray-400">No Personnel Data Found</h2>
                <p className="text-gray-500 mt-2">The personnel list is managed by the development team.</p>
            </div>
        ) : (
            <>
                <div className={role === 'ticket-sales' ? "max-w-xl mx-auto w-full" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
                {filteredPersonnel.map(personnel => {
                    const personnelAssignments = assignmentsByPersonnel.get(personnel.id);

                    // If personnel is absent, render a simplified card.
                    if (!personnel.attendance) {
                        return (
                            <div key={personnel.id} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 flex flex-col justify-center">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-500">{personnel.name}</h2>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-red-500">
                                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                        <span>Absent</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // If present, render the full card.
                    return (
                        <div key={personnel.id} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-xl font-bold text-teal-400">{personnel.name}</h2>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
                                    <span className="text-green-400">
                                        Checked In
                                    </span>
                                </div>
                            </div>

                            <div className="text-sm text-gray-400 mb-4 h-5">
                               {personnel.attendance && (
                                    <p>
                                        Checked In: <span className="font-semibold text-gray-200">{formatTime(personnel.attendance.briefingTime)}</span> 
                                        ({personnel.attendance.attendedBriefing ? <span className="text-teal-300">Briefing</span> : <span className="text-yellow-400">No Briefing</span>})
                                    </p>
                                )}
                            </div>

                            <div className="flex-grow">
                                <h3 className="font-semibold text-gray-300 mb-2 border-t border-gray-700 pt-3">Assignments:</h3>
                                <ul className="space-y-2 text-sm">
                                    {personnelAssignments && personnelAssignments.length > 0 ? (
                                        personnelAssignments.map(counter => {
                                            const counterHandovers = handoversByCounter.get(counter.id);
                                            const lastHandover = counterHandovers?.[0];
                                            const isResultOfHandover = lastHandover && lastHandover.toPersonnelId === personnel.id;

                                            return (
                                                <li key={counter.id} className="text-gray-300 bg-gray-700/50 p-2 rounded-md">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            {counter.name} <span className="text-xs text-gray-500">({counter.location})</span>
                                                        </div>
                                                        {(isManager || currentUser?.id === personnel.id) && (
                                                            <button 
                                                                onClick={() => setReassignModalInfo({ counter, currentPersonnel: personnel })}
                                                                className="px-2 py-1 text-xs bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 active:scale-95 transition-all"
                                                            >
                                                                {isManager ? 'Re-assign' : 'Handover'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    {isResultOfHandover && (
                                                        <div className="text-xs text-gray-400 mt-1 pt-1 border-t border-gray-600/50">
                                                            Taken over from <span className="font-semibold text-gray-300">{lastHandover.fromPersonnelName}</span> at {new Date(lastHandover.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}
                                                </li>
                                            );
                                        })
                                    ) : (
                                        <li className="text-gray-500 italic">No assignments for this date</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    );
                })}
                </div>

                {filteredPersonnel.length === 0 && !isRosterEmpty && (
                    <div className="text-center py-16 md:col-span-2 lg:col-span-3">
                        <h2 className="text-2xl font-bold text-gray-400">No Personnel Found</h2>
                        <p className="text-gray-500 mt-2">Try adjusting the attendance filter.</p>
                    </div>
                )}

                {isManager && unassignedCounters.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-pink-500 mb-4">Unassigned Counters</h2>
                    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4">
                    <ul className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-x-6">
                        {unassignedCounters.map(counter => (
                        <li key={counter.id} className="text-gray-400 mb-2 break-inside-avoid">{counter.name}</li>
                        ))}
                    </ul>
                    </div>
                </div>
                )}
            </>
        )}

        {reassignModalInfo && (
            <ReassignModal
                counter={reassignModalInfo.counter}
                currentPersonnel={reassignModalInfo.currentPersonnel}
                allPersonnel={ticketSalesPersonnel}
                onClose={() => setReassignModalInfo(null)}
                onReassign={handleReassignConfirm}
                attendance={attendance}
                selectedDate={selectedDate}
            />
        )}
    </div>
  );
};

export default TicketSalesRoster;
