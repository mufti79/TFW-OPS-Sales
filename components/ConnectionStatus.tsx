
import React from 'react';

type Status = 'connecting' | 'connected' | 'disconnected' | 'sdk-error';

interface ConnectionStatusProps {
  status: Status;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const statusConfig = {
    connecting: { color: 'bg-yellow-500', text: 'Connecting...' },
    connected: { color: 'bg-green-500', text: 'Online: Synced' },
    disconnected: { color: 'bg-orange-500', text: 'Offline: Saved Locally' },
    'sdk-error': { color: 'bg-red-600', text: 'Error: Database Blocked' },
  };

  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700 shadow-sm" title={config.text}>
      <span className={`w-3 h-3 rounded-full ${config.color} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
      <span className="text-xs font-semibold text-gray-300 whitespace-nowrap">{config.text}</span>
    </div>
  );
};

export default ConnectionStatus;
