
import React from 'react';

type Status = 'connecting' | 'connected' | 'disconnected';

interface ConnectionStatusProps {
  status: Status;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const statusConfig = {
    connecting: { color: 'bg-yellow-500', text: 'Connecting to server...' },
    connected: { color: 'bg-green-500', text: 'Online: Synced' },
    disconnected: { color: 'bg-orange-500', text: 'Offline: Saved Locally' },
  };

  const { color, text } = statusConfig[status];

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700 shadow-sm" title={text}>
      <span className={`w-3 h-3 rounded-full ${color} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
      <span className="text-xs font-semibold text-gray-300 whitespace-nowrap">{text}</span>
    </div>
  );
};

export default ConnectionStatus;
