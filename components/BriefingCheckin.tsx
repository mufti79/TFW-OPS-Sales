
import React, { useState, useEffect } from 'react';

interface BriefingCheckinProps {
  operatorName: string;
  onClockIn: (attendedBriefing: boolean, briefingTime: string | null) => void;
}

const BriefingCheckin: React.FC<BriefingCheckinProps> = ({ operatorName, onClockIn }) => {
  const [attendedBriefing, setAttendedBriefing] = useState(false);
  const [briefingTime, setBriefingTime] = useState('');
  
  // Initialize minTime to the current time when component loads.
  const [minTime, setMinTime] = useState(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  });

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // This effect updates the time when the user decides to log their briefing time,
  // ensuring the minimum time is current.
  useEffect(() => {
    if (attendedBriefing) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${hours}:${minutes}`;
      
      setMinTime(currentTime);
      // If the currently set briefing time is in the past, update it to now.
      if (!briefingTime || briefingTime < currentTime) {
        setBriefingTime(currentTime);
      }
    }
  }, [attendedBriefing]);


  const handleClockInClick = () => {
    onClockIn(attendedBriefing, attendedBriefing ? briefingTime : null);
  };

  const isTimeInvalid = attendedBriefing && briefingTime < minTime;
  const canClockIn = !attendedBriefing || (attendedBriefing && briefingTime && !isTimeInvalid);

  return (
    <div className="w-full max-w-lg mx-auto bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700 text-center animate-fade-in-up">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
        Daily Check-in for {operatorName}
      </h1>
      <p className="text-lg text-gray-400 mb-8">{today}</p>
      
      <div className="my-8 space-y-6">
        <label 
          htmlFor="briefing-checkbox"
          className="flex items-center justify-center text-xl text-gray-200 cursor-pointer p-4 rounded-lg hover:bg-gray-700/50 transition-colors"
        >
          <input 
            id="briefing-checkbox"
            type="checkbox"
            checked={attendedBriefing}
            onChange={() => setAttendedBriefing(!attendedBriefing)}
            className="w-6 h-6 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-offset-gray-800 mr-4"
          />
          I attended the briefing.
        </label>
        
        {attendedBriefing && (
          <div className="animate-fade-in-up">
              <label htmlFor="briefing-time" className="block text-lg font-medium text-gray-300 mb-2">Briefing Time:</label>
              <input
                id="briefing-time"
                type="time"
                value={briefingTime}
                min={minTime}
                onChange={(e) => setBriefingTime(e.target.value)}
                className="w-full max-w-xs mx-auto px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-center text-xl"
                required
              />
              {isTimeInvalid && (
                  <p className="text-red-400 text-sm mt-2">Briefing time cannot be in the past.</p>
              )}
          </div>
        )}
      </div>

      <button
        onClick={handleClockInClick}
        disabled={!canClockIn}
        className="w-full px-6 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all text-xl disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        Clock In & Logout
      </button>
    </div>
  );
}

export default BriefingCheckin;
