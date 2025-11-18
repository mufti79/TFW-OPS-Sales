
import React, { useMemo } from 'react';
import { Ride, Operator, AttendanceRecord, RideWithCount } from '../types';
import { Role } from '../hooks/useAuth';
import RideCard from './RideCard';
import BriefingCheckin from './BriefingCheckin';

type View = 'counter' | 'reports' | 'assignments' | 'expertise' | 'roster';
type Modal = 'edit-image' | 'ai-assistant' | 'operators' | 'backup' | null;

interface DailyRosterProps {
  rides: RideWithCount[];
  operators: Operator[];
  dailyAssignments: Record<string, Record<string, number>>;
  selectedDate: string;
  onDateChange: (date: string) => void;
  role: Exclude<Role, null>;
  currentUser: Operator | null;
  attendance: AttendanceRecord[];
  onNavigate: (view: View) => void;
  onCountChange: (rideId: number, newCount: number) => void;
  onShowModal: (modal: Modal, ride?: Ride) => void;
  hasCheckedInToday: boolean;
  onClockIn: (attendedBriefing: boolean, briefingTime: string | null) => void;
  isCheckinAllowed: boolean;
}

const DailyRoster: React.FC<DailyRosterProps> = ({ rides, operators, dailyAssignments, selectedDate, onDateChange, role, currentUser, attendance, onNavigate, onCountChange, onShowModal, hasCheckedInToday, onClockIn, isCheckinAllowed }) => {
  const formatTime = (timeStr: string | null): string => {
      if (!timeStr) return '';
      const [hours, minutes] = timeStr.split(':');
      let h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12; // the hour '0' should be '12'
      return `${h}:${minutes} ${ampm}`;
  };

  const { assignmentsByOperator, unassignedRides, operatorsWithAttendance, presentCount, absentCount } = useMemo(() => {
    const assignmentsToday: Record<string, number> = dailyAssignments[selectedDate] || {};
    const rideMap = new Map<string, RideWithCount>(rides.map(r => [r.id.toString(), r]));
    
    const assignmentsByOperator = new Map<number, RideWithCount[]>();
    const assignedRideIds = new Set<string>();

    for (const [rideId, operatorId] of Object.entries(assignmentsToday)) {
      const ride = rideMap.get(rideId);
      if (ride) {
        const operatorRides = assignmentsByOperator.get(operatorId);
        if (operatorRides) {
          operatorRides.push(ride);
        } else {
          assignmentsByOperator.set(operatorId, [ride]);
        }
        assignedRideIds.add(rideId);
      }
    }
    
    for (const rideList of assignmentsByOperator.values()) {
      rideList.sort((a, b) => a.name.localeCompare(b.name));
    }

    const unassignedRides = rides
        .filter(r => !assignedRideIds.has(r.id.toString()))
        .sort((a, b) => a.name.localeCompare(b.name));
    
    const attendanceTodayMap = new Map<number, AttendanceRecord>();
    attendance
      .filter(record => record.date === selectedDate)
      .forEach(record => attendanceTodayMap.set(record.operatorId, record));

    const relevantOperators = (role === 'operator' && currentUser)
        ? operators.filter(op => op.id === currentUser.id)
        : operators;

    const operatorsWithAttendance = relevantOperators.map(op => ({
      ...op,
      attendance: attendanceTodayMap.get(op.id) || null
    })).sort((a, b) => {
        if (a.attendance && !b.attendance) return -1;
        if (!a.attendance && b.attendance) return 1;
        return a.name.localeCompare(b.name);
    });

    const presentCount = operatorsWithAttendance.filter(op => op.attendance).length;
    const absentCount = operatorsWithAttendance.length - presentCount;

    return { assignmentsByOperator, unassignedRides, operatorsWithAttendance, presentCount, absentCount };
  }, [dailyAssignments, selectedDate, rides, operators, attendance, role, currentUser]);
  
  const operatorExpertise = useMemo<{ name: string; count: number }[]>(() => {
    if (role !== 'operator' || !currentUser) {
        return [];
    }

    const rideIdToNameMap = new Map(rides.map(r => [r.id.toString(), r.name]));
    const operatedRidesCount = new Map<string, number>();

    for (const dayAssignments of Object.values(dailyAssignments)) {
        for (const rideId of Object.keys(dayAssignments)) {
            const operatorId = dayAssignments[rideId];
            if (operatorId === currentUser.id) {
                const rideName = rideIdToNameMap.get(rideId) as string | undefined;
                if (rideName) {
                    operatedRidesCount.set(rideName, (operatedRidesCount.get(rideName) || 0) + 1);
                }
            }
        }
    }

    return Array.from(operatedRidesCount.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));
  }, [dailyAssignments, rides, currentUser, role]);

  const handleDownloadRoster = () => {
    if (operators.length === 0) {
        alert("No operator data to download.");
        return;
    }

    const headers = ['Operator Name', 'Checked In', 'Attended Briefing', 'Briefing Time', 'Assigned Rides'];
    
    const rows = operatorsWithAttendance.map(operator => {
        const assignedRides = assignmentsByOperator.get(operator.id);
        const rideNames = assignedRides ? assignedRides.map(r => r.name).join('; ') : 'N/A';
        
        const checkedIn = operator.attendance ? 'Yes' : 'No';
        let attendedBriefing = 'N/A';
        let briefingTime = 'N/A';

        if(operator.attendance) {
            attendedBriefing = operator.attendance.attendedBriefing ? 'Yes' : 'No';
            briefingTime = formatTime(operator.attendance.briefingTime);
        }
        
        const operatorName = `"${operator.name.replace(/"/g, '""')}"`;
        const rideNamesCsv = `"${rideNames.replace(/"/g, '""')}"`;

        return [operatorName, checkedIn, attendedBriefing, briefingTime, rideNamesCsv].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `ToggiFunWorld_Roster_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAttendanceReport = () => {
    if (operatorsWithAttendance.length === 0) {
        alert("No operator data to download.");
        return;
    }

    const headers = ['Operator Name', 'Status', 'Briefing Attended', 'Briefing Time'];
    
    const rows = operatorsWithAttendance.map(operator => {
        const status = operator.attendance ? 'Present' : 'Absent';
        let attendedBriefing = 'N/A';
        let briefingTime = 'N/A';

        if(operator.attendance) {
            attendedBriefing = operator.attendance.attendedBriefing ? 'Yes' : 'No';
            briefingTime = formatTime(operator.attendance.briefingTime);
        }
        
        const operatorName = `"${operator.name.replace(/"/g, '""')}"`;
        
        return [operatorName, status, attendedBriefing, briefingTime].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `ToggiFunWorld_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isRosterEmpty = operatorsWithAttendance.length === 0;
  const isManager = role === 'admin' || role === 'operation-officer';

  const [year, month, day] = selectedDate.split('-').map(Number);
  const displayDate = new Date(year, month - 1, day);

  if (role === 'operator' && currentUser) {
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

    const myAssignedRides = assignmentsByOperator.get(currentUser.id) || [];
    const myAttendance = attendance.find(a => a.operatorId === currentUser.id && a.date === selectedDate);
    
    return (
        <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                        My Roster for {displayDate.toLocaleDateString()}
                    </h1>
                    {myAttendance && (
                       <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                            <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
                            <span>
                                Checked In: <span className="font-semibold text-gray-200">{formatTime(myAttendance.briefingTime)}</span>
                                ({myAttendance.attendedBriefing ? <span className="text-teal-300">Briefing</span> : <span className="text-yellow-400">No Briefing</span>})
                            </span>
                       </div>
                    )}
                </div>
                <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                    <label htmlFor="roster-date" className="text-sm font-medium text-gray-300">View Date:</label>
                    <input
                        id="roster-date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => onDateChange(e.target.value)}
                        className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                    />
                </div>
            </div>

            {myAssignedRides.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {myAssignedRides.map(ride => (
                        <RideCard
                            key={ride.id}
                            ride={ride}
                            onCountChange={onCountChange}
                            role={role}
                            onChangePicture={() => onShowModal('edit-image', ride)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-bold text-gray-400">No Assignments Today</h2>
                    <p className="text-gray-500 mt-2">You have not been assigned to any rides or games for {displayDate.toLocaleDateString()}.</p>
                </div>
            )}
            
            {operatorExpertise.length > 0 && (
                 <div className="mt-12">
                    <h2 className="text-2xl font-bold text-pink-500 mb-4">My Expertise</h2>
                    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4">
                        <p className="text-gray-400 mb-4">Based on your assignment history, you have experience with the following rides/games:</p>
                        <ul className="columns-1 sm:columns-2 gap-x-6 text-gray-300">
                            {operatorExpertise.map(({ name, count }) => (
                                <li key={name} className="mb-2 flex justify-between items-center bg-gray-700/50 p-2 rounded-md break-inside-avoid">
                                    <span>{name}</span>
                                    <span className="ml-2 px-2.5 py-0.5 bg-purple-600 text-white text-xs font-semibold rounded-full">
                                        {count} {count > 1 ? 'days' : 'day'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Daily Roster for {displayDate.toLocaleDateString()}
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
                    className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                />
            </div>
           {isManager && (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <div className="flex items-center gap-2 p-1 bg-gray-700/50 rounded-lg">
                  <button
                      onClick={handleDownloadAttendanceReport}
                      className="px-3 py-1.5 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 active:scale-95 transition-all text-sm"
                  >
                      DL Attendance
                  </button>
                  <button
                      onClick={handleDownloadRoster}
                      className="px-3 py-1.5 bg-green-800 text-white font-semibold rounded-md hover:bg-green-700 active:scale-95 transition-all text-sm"
                  >
                      DL Roster
                  </button>
                </div>
                <button
                  onClick={() => onNavigate('assignments')}
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
          <h2 className="text-2xl font-bold text-gray-400">No Operator Data Found</h2>
          <p className="text-gray-500 mt-2">Please add operators via the Operator Management panel.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {operatorsWithAttendance.map(operator => {
              const operatorAssignments = assignmentsByOperator.get(operator.id);

              // If operator is absent, render a simplified card.
              if (!operator.attendance) {
                return (
                  <div key={operator.id} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 flex flex-col justify-center">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold text-gray-500">{operator.name}</h2>
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
                <div key={operator.id} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-purple-400">{operator.name}</h2>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
                      <span className="text-green-400">Checked In</span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 mb-4 h-5">
                    {operator.attendance && (
                      <p>
                        Checked In: <span className="font-semibold text-gray-200">{formatTime(operator.attendance.briefingTime)}</span>
                        ({operator.attendance.attendedBriefing ? <span className="text-teal-300">Briefing</span> : <span className="text-yellow-400">No Briefing</span>})
                      </p>
                    )}
                  </div>

                  <div className="flex-grow">
                    <h3 className="font-semibold text-gray-300 mb-2 border-t border-gray-700 pt-3">Assignments:</h3>
                    <ul className="space-y-2 text-sm">
                      {operatorAssignments && operatorAssignments.length > 0 ? (
                        operatorAssignments.map(ride => (
                          <li key={ride.id} className="text-gray-300 bg-gray-700/50 p-2 rounded-md">
                            {ride.name} <span className="text-xs text-gray-500">({ride.floor} Fl)</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-500 italic">No assignments for this date</li>
                      )}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {unassignedRides.length > 0 && isManager && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-pink-500 mb-4">Unassigned Rides & Games</h2>
              <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4">
                <ul className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-x-6">
                  {unassignedRides.map(ride => (
                    <li key={ride.id} className="text-gray-400 mb-2 break-inside-avoid">{ride.name}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DailyRoster;
