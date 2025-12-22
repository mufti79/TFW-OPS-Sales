import React, { useState } from 'react';
import { RideWithCount } from '../types';
import SplitCounter from './SplitCounter';
import { Role } from '../hooks/useAuth';

interface RideCardProps {
  ride: RideWithCount;
  onCountChange: (rideId: number, newCount: number, details?: { tickets: number; packages: number }) => void;
  role: Role;
  onChangePicture: () => void;
}

const RideCard: React.FC<RideCardProps> = ({ ride, onCountChange, role, onChangePicture }) => {
  const canChangePicture = role === 'admin' || role === 'operation-officer';
  const [imageError, setImageError] = useState(false);

  const handleSplitChange = (tickets: number, packages: number) => {
    onCountChange(ride.id, tickets + packages, { tickets, packages });
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg transform hover:-translate-y-1 transition-all duration-300 border border-gray-700 flex flex-col group">
      <div className="relative">
        {!imageError ? (
          <img 
            src={ride.imageUrl} 
            alt={ride.name} 
            className="w-full h-48 object-cover" 
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-sm">Image not available</p>
            </div>
          </div>
        )}
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
      </div>
    </div>
  );
};

export default RideCard;
