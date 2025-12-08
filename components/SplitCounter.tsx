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
       <div className="bg-gray-900/50 rounded-lg p-2 text-center border border-gray-700">
          <span className="text-gray-400 text-xs uppercase tracking-wider block mb-1">Total Guests</span>
          <span className="text-3xl font-bold text-white tabular-nums">{tickets + packages}</span>
       </div>
       
       <div className="grid grid-cols-2 gap-3">
          {/* Tickets */}
          <div className="flex flex-col items-center bg-gray-700/30 rounded-lg p-2 border border-gray-700">
             <span className="text-xs text-purple-300 font-semibold mb-2">Tickets</span>
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => update(tickets - 1, packages)}
                  className="w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-500 text-white font-bold flex items-center justify-center transition-colors active:scale-95"
                  aria-label="Decrease Tickets"
                >-</button>
                <span className="text-xl font-bold w-8 text-center tabular-nums text-gray-200">{tickets}</span>
                <button 
                  onClick={() => update(tickets + 1, packages)}
                  className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center transition-colors active:scale-95"
                  aria-label="Increase Tickets"
                >+</button>
             </div>
          </div>

          {/* Packages */}
          <div className="flex flex-col items-center bg-gray-700/30 rounded-lg p-2 border border-gray-700">
             <span className="text-xs text-pink-300 font-semibold mb-2">Packages</span>
             <div className="flex items-center gap-2">
                <button 
                   onClick={() => update(tickets, packages - 1)}
                   className="w-8 h-8 rounded-full bg-gray-600 hover:bg-gray-500 text-white font-bold flex items-center justify-center transition-colors active:scale-95"
                   aria-label="Decrease Packages"
                >-</button>
                <span className="text-xl font-bold w-8 text-center tabular-nums text-gray-200">{packages}</span>
                <button 
                   onClick={() => update(tickets, packages + 1)}
                   className="w-8 h-8 rounded-full bg-pink-600 hover:bg-pink-500 text-white font-bold flex items-center justify-center transition-colors active:scale-95"
                   aria-label="Increase Packages"
                >+</button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default SplitCounter;
