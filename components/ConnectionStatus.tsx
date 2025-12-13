
import React, { useState } from 'react';

type Status = 'connecting' | 'connected' | 'disconnected' | 'sdk-error';

interface ConnectionStatusProps {
  status: Status;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const statusConfig = {
    connecting: { 
      color: 'bg-yellow-500', 
      text: 'Connecting...', 
      tooltip: 'Establishing connection to Firebase. Roster updates will sync when connected.'
    },
    connected: { 
      color: 'bg-green-500', 
      text: 'Online: Synced', 
      tooltip: 'Real-time sync active! Roster updates from TFW-NEW app will appear instantly.'
    },
    disconnected: { 
      color: 'bg-orange-500', 
      text: 'Offline: Saved Locally', 
      tooltip: 'Working offline. Changes saved locally and will sync when reconnected.'
    },
    'sdk-error': { 
      color: 'bg-red-600', 
      text: 'Error: Database Blocked', 
      tooltip: 'Cannot connect to Firebase. Check browser settings and network connection.'
    },
  };

  const config = statusConfig[status] || statusConfig.disconnected;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowTooltip(!showTooltip);
    }
  };

  return (
    <div className="relative">
      <div 
        className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700 shadow-sm cursor-help" 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label="Connection status"
        aria-expanded={showTooltip}
        aria-describedby="connection-status-tooltip"
      >
        <span className={`w-3 h-3 rounded-full ${config.color} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
        <span className="text-xs font-semibold text-gray-300 whitespace-nowrap">{config.text}</span>
      </div>
      
      {showTooltip && (
        <div 
          id="connection-status-tooltip"
          role="tooltip"
          className="absolute top-full mt-2 right-0 z-50 w-72 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl text-xs text-gray-300"
        >
          <p className="mb-2">{config.tooltip}</p>
          {status === 'connected' && (
            <p className="text-green-400 text-[11px]">
              ✓ Syncing with TFW-NEW app
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
