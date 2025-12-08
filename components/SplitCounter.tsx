import React from 'react';

interface SplitCounterProps {
  tickets: number;
  packages: number;
  onChange: (tickets: number, packages: number) => void;
}

const SplitCounter: React.FC<SplitCounterProps> = ({ tickets, packages, onChange }) => {
  const update = (t: number, p: number) => onChange(Math.max(0, t), Math.max(0, p));

  return (
    <div className="flex flex-col gap-3 mt-4 w-full">
       <div className="bg-gray-900/80 rounded-lg p-2 text-center border border-gray-600 shadow-sm">
          <span className="text-gray-400 text-[10px] uppercase tracking-wider block mb-1">Total Guests</span>
          <span className="text-3xl font-extrabold text-white tabular-nums">{tickets + packages}</span>
       </div>
       
       <div className="grid grid-cols-2 gap-3">
          {/* Tickets Section */}
          <div className="flex flex-col items-center bg-purple-900/20 rounded-lg p-2 border border-purple-500/30 shadow-inner">
             <span className="text-xs text-purple-300 font-bold uppercase tracking-wide mb-2">Tickets</span>
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => update(tickets - 1, packages)}
                  className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center transition-colors active:scale-95 border border-gray-500"
                  aria-label="Decrease Tickets"
                >-</button>
                <span className="text-xl font-bold w-8 text-center tabular-nums text-gray-100">{tickets}</span>
                <button 
                  onClick={() => update(tickets + 1, packages)}
                  className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center transition-colors active:scale-95 shadow-md"
                  aria-label="Increase Tickets"
                >+</button>
             </div>
          </div>

          {/* Packages Section */}
          <div className="flex flex-col items-center bg-pink-900/20 rounded-lg p-2 border border-pink-500/30 shadow-inner">
             <span className="text-xs text-pink-300 font-bold uppercase tracking-wide mb-2">Packages</span>
             <div className="flex items-center gap-2">
                <button 
                   onClick={() => update(tickets, packages - 1)}
                   className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-bold flex items-center justify-center transition-colors active:scale-95 border border-gray-500"
                   aria-label="Decrease Packages"
                >-</button>
                <span className="text-xl font-bold w-8 text-center tabular-nums text-gray-100">{packages}</span>
                <button 
                   onClick={() => update(tickets, packages + 1)}
                   className="w-8 h-8 rounded-full bg-pink-600 hover:bg-pink-500 text-white font-bold flex items-center justify-center transition-colors active:scale-95 shadow-md"
                   aria-label="Increase Packages"
                >+</button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default SplitCounter;