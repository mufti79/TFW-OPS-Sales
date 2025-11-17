import React from 'react';

interface BriefingCheckinProps {
  operatorName: string;
  onClockIn: (attendedBriefing: boolean, briefingTime: string | null) => void;
}

const BriefingCheckin: React.FC<BriefingCheckinProps> = ({ operatorName, onClockIn }) => {

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleClockInWithBriefing = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    onClockIn(true, currentTime);
  };

  const handleClockInWithoutBriefing = () => {
    onClockIn(false, null);
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700 text-center animate-fade-in-up">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
        Daily Check-in for {operatorName}
      </h1>
      <p className="text-lg text-gray-400 mb-8">{today}</p>
      
      <div className="my-8 space-y-6">
        <p className="text-xl text-gray-200">Please confirm your briefing attendance to clock in.</p>
        <div className="flex flex-col space-y-4">
            <button
                onClick={handleClockInWithBriefing}
                className="w-full px-6 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all text-xl"
            >
                YES, I attended the briefing
            </button>
            <button
                onClick={handleClockInWithoutBriefing}
                className="w-full px-6 py-4 bg-yellow-600 text-gray-900 font-bold rounded-lg hover:bg-yellow-500 active:scale-95 transition-all text-xl"
            >
                NO, I did not attend
            </button>
        </div>
      </div>
       <p className="text-sm text-gray-500 mt-8">After selecting an option, you will be automatically logged out.</p>
    </div>
  );
}

export default BriefingCheckin;
