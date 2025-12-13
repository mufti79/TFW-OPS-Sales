import React from 'react';
import { RideWithCount } from '../types';
import SplitCounter from './SplitCounter';
import { Role } from '../hooks/useAuth';

interface RideCardProps {
  ride: RideWithCount;
  onCountChange: (rideId: number, newCount: number, details?: { tickets: number; packages: number }) => void;
  role: Role;
  onChangePicture: () => void;
  onReportProblem?: () => void;
}

const RideCard: React.FC<RideCardProps> = ({ ride, onCountChange, role, onChangePicture, onReportProblem }) => {
  const canChangePicture = role === 'admin' || role === 'operation-officer';
  const canReportProblem = role === 'operator' || role === 'admin' || role === 'operation-officer';

  const handleSplitChange = (tickets: number, packages: number) => {
    onCountChange(ride.id, tickets + packages, { tickets, packages });
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 flex flex-col group">
      <div className="relative">
        <img src={ride.imageUrl} alt={ride.name} className="w-full h-48 object-cover" />
        {canChangePicture && (
            <button 
                onClick={onChangePicture}
                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Change ride picture"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
            </button>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex-grow">
          <span className="inline-block bg-purple-600 text-white text-xs font-semibold px-2 py-1 rounded-full mb-2">
            {ride.floor} Floor
          </span>
          <h3 className="text-xl font-bold text-gray-100">{ride.name}</h3>
        </div>
        <SplitCounter 
          tickets={ride.details?.tickets || 0} 
          packages={ride.details?.packages || 0} 
          onChange={handleSplitChange} 
        />
        {canReportProblem && onReportProblem && (
          <button
            onClick={onReportProblem}
            className="mt-2 w-full px-3 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Report Problem
          </button>
        )}
      </div>
    </div>
  );
};

export default RideCard;
