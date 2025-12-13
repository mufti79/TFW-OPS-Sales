import React, { useState } from 'react';
import { Ride, Operator } from '../types';

interface ReportProblemModalProps {
  ride: Ride;
  currentUser: Operator;
  onClose: () => void;
  onSubmit: (rideId: number, rideName: string, problem: string, reportedBy: Operator) => void;
}

const ReportProblemModal: React.FC<ReportProblemModalProps> = ({ ride, currentUser, onClose, onSubmit }) => {
  const [problem, setProblem] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim()) {
      alert('Please describe the problem.');
      return;
    }
    
    setIsSubmitting(true);
    onSubmit(ride.id, ride.name, problem.trim(), currentUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 animate-fade-in">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Report Problem</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-gray-300 font-semibold mb-2">Ride</label>
            <div className="px-4 py-3 bg-gray-900 rounded-lg border border-gray-600">
              <p className="text-white font-medium">{ride.name}</p>
              <p className="text-sm text-gray-400">{ride.floor} Floor</p>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-300 font-semibold mb-2">Reported By</label>
            <div className="px-4 py-3 bg-gray-900 rounded-lg border border-gray-600">
              <p className="text-white">{currentUser.name}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="problem-description" className="block text-gray-300 font-semibold mb-2">
              Problem Description *
            </label>
            <textarea
              id="problem-description"
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="Describe the issue with this ride..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-500"
              required
            />
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportProblemModal;
