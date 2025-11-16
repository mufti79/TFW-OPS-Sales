import React from 'react';
import { RideWithCount } from '../types';
import Counter from './Counter';
import { Role } from '../hooks/useAuth';

interface RideCardProps {
  ride: RideWithCount;
  onCountChange: (rideId: number, newCount: number) => void;
  role: Role;
  onChangePicture: () => void;
}

const RideCard: React.FC<RideCardProps> = ({ ride, onCountChange, role, onChangePicture }) => {
  const canChangePicture = role === 'admin' || role === 'operation-officer';

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
        <Counter count={ride.count} onCountChange={(newCount) => onCountChange(ride.id, newCount)} />
      </div>
    </div>
  );
};

export default RideCard;