import React from 'react';

type View = 'floor-counts';

interface ManagementHubProps {
  onNavigate: (view: View) => void;
}

const ManagementHub: React.FC<ManagementHubProps> = ({ onNavigate }) => {
  return (
    <div className="animate-fade-in-down">
      <div className="mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
          Management Panel
        </h1>
        <p className="text-gray-400">Select a dashboard to view.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <button
          onClick={() => onNavigate('floor-counts')}
          className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 flex flex-col items-center justify-center text-center transform hover:-translate-y-1 transition-all duration-300 group"
        >
          <div className="p-4 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-100 group-hover:text-cyan-400 transition-colors">
            Floor Guest Count Dashboard
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            View hourly guest counts for each level entered by security.
          </p>
        </button>
        
        {/* Future dashboards can be added here as more cards */}
        
      </div>
    </div>
  );
};

export default ManagementHub;
