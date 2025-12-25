
import React, { useState } from 'react';

type Status = 'connecting' | 'connected' | 'disconnected' | 'sdk-error';

interface ConnectionStatusProps {
  status: Status;
  onTestConnection?: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, onTestConnection }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isStuckReconnecting, setIsStuckReconnecting] = useState(false);
  const disconnectedTimeRef = React.useRef<number | null>(null);

  // Track how long we've been disconnected and check periodically
  React.useEffect(() => {
    if (status === 'disconnected' || status === 'connecting') {
      // Record when disconnection started
      if (disconnectedTimeRef.current === null) {
        disconnectedTimeRef.current = Date.now();
        setIsStuckReconnecting(false);
      }
      
      // Check periodically if we're stuck
      const checkInterval = setInterval(() => {
        if (disconnectedTimeRef.current !== null) {
          const timeSinceDisconnect = Date.now() - disconnectedTimeRef.current;
          if (timeSinceDisconnect > 30000) {
            setIsStuckReconnecting(true);
            // No need to keep checking once stuck is detected
            clearInterval(checkInterval);
          }
        }
      }, 5000); // Check every 5 seconds
      
      return () => clearInterval(checkInterval);
    } else {
      // Reset when connected
      disconnectedTimeRef.current = null;
      setIsStuckReconnecting(false);
    }
  }, [status]);

  const statusConfig = {
    connecting: { 
      color: 'bg-yellow-500', 
      text: 'Connecting to Firebase...', 
      tooltip: 'Establishing connection to Firebase Realtime Database. All changes will be saved to Firebase when connected.'
    },
    connected: { 
      color: 'bg-green-500', 
      text: 'Firebase: Connected', 
      tooltip: 'Connected to Firebase Realtime Database! All changes are automatically saved to Firebase and synced in real-time across all devices.'
    },
    disconnected: { 
      color: 'bg-orange-500', 
      text: 'Firebase: Reconnecting...', 
      tooltip: 'Temporarily disconnected from Firebase. Changes will be saved to Firebase automatically when connection is restored.'
    },
    'sdk-error': { 
      color: 'bg-red-600', 
      text: 'Firebase: Connection Error', 
      tooltip: 'Cannot connect to Firebase Realtime Database. Check browser settings and network connection.'
    },
  };

  const config = statusConfig[status] || statusConfig.disconnected;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowTooltip(!showTooltip);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowTooltip(false);
    }
  };

  const handleTestClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onTestConnection) {
      onTestConnection();
    }
  };

  return (
    <div className="relative">
      <div 
        className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm cursor-help ${
          isStuckReconnecting ? 'bg-red-900 border-red-600 animate-pulse' : 'bg-gray-800 border-gray-700'
        }`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label="Connection status"
        aria-expanded={showTooltip ? 'true' : 'false'}
        aria-describedby="connection-status-tooltip"
      >
        <span className={`w-3 h-3 rounded-full ${config.color} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
        <span className="text-xs font-semibold text-gray-300 whitespace-nowrap">
          {isStuckReconnecting ? 'Connection Issue' : config.text}
        </span>
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
          {isStuckReconnecting && (
            <div className="mt-2 mb-3 p-2 bg-red-900 bg-opacity-30 border border-red-600 rounded">
              <p className="text-red-400 font-semibold mb-1">⚠️ Connection Stuck</p>
              <p className="text-red-300 text-[11px]">
                Unable to connect for 30+ seconds. This may indicate:
              </p>
              <ul className="text-red-300 text-[11px] mt-1 ml-3 list-disc">
                <li>Database doesn't exist</li>
                <li>Network/firewall issue</li>
                <li>Wrong database URL</li>
              </ul>
            </div>
          )}
          {onTestConnection && (
            <button
              onClick={handleTestClick}
              className={`mt-3 w-full text-white text-xs py-2 px-3 rounded transition-colors ${
                isStuckReconnecting 
                  ? 'bg-red-600 hover:bg-red-700 font-semibold' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {isStuckReconnecting ? '🔧 Diagnose Connection Issue' : '🔍 Test Firebase Connection'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
