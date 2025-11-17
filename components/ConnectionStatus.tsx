import React from 'react';

type Status = 'connecting' | 'connected' | 'disconnected';

interface ConnectionStatusProps {
  status: Status;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const statusConfig = {
    connecting: { color: 'bg-yellow-500', text: 'Connecting to server...' },
    connected: { color: 'bg-green-500', text: 'Real-time sync active' },
    disconnected: { color: 'bg-red-500', text: 'Disconnected. Changes will not be saved or synced.' },
  };

  const { color, text } = statusConfig[status];

  return (
    <div className="flex items-center gap-2" title={text}>
      <span className={`w-3 h-3 rounded-full ${color} ${status !== 'connected' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-gray-400 hidden sm:inline">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
    </div>
  );
};

export default ConnectionStatus;
