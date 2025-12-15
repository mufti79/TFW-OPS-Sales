import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SECURITY_FLOORS } from '../constants';

interface SecurityViewProps {
  selectedDate: string;
  floorGuestCounts: Record<string, Record<string, Record<string, number>>>;
  onSaveFloorCounts: (date: string, floor: string, counts: Record<string, number>) => void;
}

const SecurityView: React.FC<SecurityViewProps> = ({ selectedDate, floorGuestCounts, onSaveFloorCounts }) => {
  const [selectedFloor, setSelectedFloor] = useState(SECURITY_FLOORS[0]);
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});
  const previousDataRef = useRef<string>('');
  
  // 2 PM to 9 PM (21:00)
  const hours = Array.from({ length: 8 }, (_, i) => 14 + i); 

  // Sync local state when the actual data changes (not just the reference)
  useEffect(() => {
    const countsForFloorAndDate = floorGuestCounts[selectedDate]?.[selectedFloor] || {};
    const currentDataKey = JSON.stringify(countsForFloorAndDate);
    
    // Only update if the actual data has changed
    if (currentDataKey !== previousDataRef.current) {
      previousDataRef.current = currentDataKey;
      setLocalCounts(countsForFloorAndDate);
    }
  }, [selectedDate, selectedFloor, floorGuestCounts]);

  const remoteCounts = useMemo(() => floorGuestCounts[selectedDate]?.[selectedFloor] || {}, [floorGuestCounts, selectedDate, selectedFloor]);

  const isDirty = useMemo(() => {
    for (const hour of hours) {
        const local = localCounts[hour.toString()] || 0;
        const remote = remoteCounts[hour.toString()] || 0;
        if (local !== remote) {
            return true;
        }
    }
    return false;
  }, [localCounts, remoteCounts, hours]);

  const handleCountChange = (hour: number, countStr: string) => {
    // Allow empty string to clear the field
    if (countStr === '') {
      setLocalCounts(prev => {
        const { [hour.toString()]: _, ...newCounts } = prev;
        return newCounts;
      });
      return;
    }
    
    const count = parseInt(countStr, 10);
    if (!isNaN(count) && count >= 0) {
      setLocalCounts(prev => ({
        ...prev,
        [hour.toString()]: count
      }));
    }
  };

  const handleSave = () => {
      onSaveFloorCounts(selectedDate, selectedFloor, localCounts);
  };

  const formatHour = (hour: number) => {
    const nextHour = hour + 1;
    const startAmPm = hour >= 12 ? 'PM' : 'AM';
    const endAmPm = nextHour >= 12 ? 'PM' : 'AM';
    const startHour = hour % 12 === 0 ? 12 : hour % 12;
    const endHour = nextHour % 12 === 0 ? 12 : nextHour % 12;
    return `${startHour}:00 ${startAmPm} - ${endHour}:00 ${endAmPm}`;
  };

  const [year, month, day] = selectedDate.split('-').map(Number);
  const displayDate = new Date(year, month - 1, day);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <div>
              <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                  Hourly Floor guest Count
              </h1>
              <p className="text-gray-400">Entries for {displayDate.toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
              <label htmlFor="floor-select" className="text-sm font-medium text-gray-300">Select Floor:</label>
              <select
                  id="floor-select"
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              >
                  {SECURITY_FLOORS.map(floor => <option key={floor} value={floor}>Level {floor.replace('th', '')}</option>)}
              </select>
          </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6 space-y-4">
          {hours.map(hour => (
              <div key={hour} className="grid grid-cols-3 items-center gap-4 p-3 bg-gray-900/50 rounded-lg">
                  <label htmlFor={`count-${hour}`} className="col-span-1 text-gray-300 font-medium">
                      {formatHour(hour)}
                  </label>
                  <div className="col-span-2">
                      <input
                          id={`count-${hour}`}
                          type="number"
                          placeholder="Total Guests"
                          value={localCounts[hour.toString()] || ''}
                          onChange={(e) => handleCountChange(hour, e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          min="0"
                      />
                  </div>
              </div>
          ))}
      </div>
      <div className="mt-8 flex justify-end">
        <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`px-8 py-3 font-bold rounded-lg active:scale-95 transition-all text-lg ${
                isDirty 
                ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400 animate-pulse' 
                : 'bg-green-600 text-white opacity-75 cursor-default'
            }`}
        >
            {isDirty ? 'Save Changes' : 'All Saved'}
        </button>
      </div>
    </div>
  );
};

export default SecurityView;