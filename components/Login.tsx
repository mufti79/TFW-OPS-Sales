
import React, { useState } from 'react';
import { Operator } from '../types';

interface LoginProps {
  onLogin: (role: 'operator' | 'admin' | 'operation-officer' | 'ticket-sales' | 'sales-officer', payload?: string | Operator) => boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  operators: Operator[];
  ticketSalesPersonnel: Operator[];
}

const FullscreenEnterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9M20.25 20.25h-4.5m4.5 0v-4.5m0-4.5L15 15" />
  </svg>
);

const FullscreenExitIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
  </svg>
);

const Login: React.FC<LoginProps> = ({ onLogin, isFullscreen, onToggleFullscreen, operators, ticketSalesPersonnel }) => {
  const [adminPin, setAdminPin] = useState('');
  const [adminError, setAdminError] = useState('');
  const [officerPin, setOfficerPin] = useState('');
  const [officerError, setOfficerError] = useState('');
  const [salesOfficerPin, setSalesOfficerPin] = useState('');
  const [salesOfficerError, setSalesOfficerError] = useState('');
  const [selectedOperatorId, setSelectedOperatorId] = useState<string>('');
  const [selectedTicketSalesId, setSelectedTicketSalesId] = useState<string>('');

  const handleAdminLogin = () => {
    if (onLogin('admin', adminPin)) {
      setAdminError('');
      setAdminPin('');
    } else {
      setAdminError('Incorrect PIN. Please try again.');
      setAdminPin('');
    }
  };

  const handleOfficerLogin = () => {
    if (onLogin('operation-officer', officerPin)) {
        setOfficerError('');
        setOfficerPin('');
    } else {
        setOfficerError('Incorrect PIN. Please try again.');
        setOfficerPin('');
    }
  };
  
  const handleSalesOfficerLogin = () => {
    if (onLogin('sales-officer', salesOfficerPin)) {
      setSalesOfficerError('');
      setSalesOfficerPin('');
    } else {
      setSalesOfficerError('Incorrect PIN. Please try again.');
      setSalesOfficerPin('');
    }
  };
  
  const handleOperatorLogin = () => {
    if (!selectedOperatorId) return;
    const operator = operators.find(op => op.id === parseInt(selectedOperatorId, 10));
    if (operator) {
      onLogin('operator', operator);
    }
  };

  const handleTicketSalesLogin = () => {
    if (!selectedTicketSalesId) return;
    const personnel = ticketSalesPersonnel.find(p => p.id === parseInt(selectedTicketSalesId, 10));
    if (personnel) {
        onLogin('ticket-sales', personnel);
    }
  };

  const handleAdminPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminError('');
    setAdminPin(e.target.value);
  };
  
  const handleOfficerPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOfficerError('');
    setOfficerPin(e.target.value);
  };

  const handleSalesOfficerPinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSalesOfficerError('');
    setSalesOfficerPin(e.target.value);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4 relative">
       <button
            onClick={onToggleFullscreen}
            className="absolute top-4 right-4 p-3 bg-gray-700 text-white rounded-full hover:bg-gray-600 active:scale-95 transition-all z-10"
            aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
        >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
        </button>

      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          Toggi Fun World
        </h1>
        <p className="text-lg text-gray-400">Feel the thrill</p>
      </div>

      <div className="w-full max-w-4xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operator Login */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-center text-gray-100 mb-4">Operator Login</h2>
            <div className="space-y-4">
                <select
                value={selectedOperatorId}
                onChange={(e) => setSelectedOperatorId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                aria-label="Select your name"
                >
                <option value="">-- Select Your Name --</option>
                {operators.sort((a,b) => a.name.localeCompare(b.name)).map(op => (
                    <option key={op.id} value={op.id}>{op.name}</option>
                ))}
                </select>
                <button
                onClick={handleOperatorLogin}
                disabled={!selectedOperatorId}
                className="w-full px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 active:scale-95 transition-all text-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                Login
                </button>
            </div>
            </div>
            {/* Ticket Sales Login */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                <h2 className="text-2xl font-bold text-center text-gray-100 mb-4">Ticket Sales Login</h2>
                <div className="space-y-4">
                    <select
                    value={selectedTicketSalesId}
                    onChange={(e) => setSelectedTicketSalesId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    aria-label="Select your name for Ticket Sales"
                    >
                    <option value="">-- Select Your Name --</option>
                    {ticketSalesPersonnel.sort((a,b) => a.name.localeCompare(b.name)).map(op => (
                        <option key={op.id} value={op.id}>{op.name}</option>
                    ))}
                    </select>
                    <button
                    onClick={handleTicketSalesLogin}
                    disabled={!selectedTicketSalesId}
                    className="w-full px-6 py-3 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 active:scale-95 transition-all text-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                    Login
                    </button>
                </div>
            </div>
        </div>
        
        <div className="w-full max-w-4xl mx-auto space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Operation Officer Login */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                <h2 className="text-2xl font-bold text-center text-gray-100 mb-4">Operation Officer Login</h2>
                <div className="space-y-3">
                    <input
                    type="password"
                    placeholder="Enter Officer PIN"
                    value={officerPin}
                    onChange={handleOfficerPinChange}
                    onKeyDown={(e) => e.key === 'Enter' && handleOfficerLogin()}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center text-xl tracking-widest"
                    maxLength={4}
                    aria-label="Operation Officer PIN"
                    autoComplete="off"
                    />
                    {officerError && <p className="text-red-400 text-sm text-center">{officerError}</p>}
                    <button
                    onClick={handleOfficerLogin}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-lg"
                    >
                    Enter as Officer
                    </button>
                </div>
                </div>
                {/* Sales Officer Login */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                    <h2 className="text-2xl font-bold text-center text-gray-100 mb-4">Sales Officer Login</h2>
                    <div className="space-y-3">
                        <input
                            type="password"
                            placeholder="Enter Officer PIN"
                            value={salesOfficerPin}
                            onChange={handleSalesOfficerPinChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleSalesOfficerLogin()}
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-center text-xl tracking-widest"
                            maxLength={4}
                            aria-label="Sales Officer PIN"
                            autoComplete="off"
                        />
                        {salesOfficerError && <p className="text-red-400 text-sm text-center">{salesOfficerError}</p>}
                        <button
                            onClick={handleSalesOfficerLogin}
                            className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all text-lg"
                        >
                            Enter as Sales Officer
                        </button>
                    </div>
                </div>
            </div>

            {/* Admin Login */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 max-w-sm mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-100 mb-4">Admin Login</h2>
            <div className="space-y-3">
                <input
                type="password"
                placeholder="Enter Admin PIN"
                value={adminPin}
                onChange={handleAdminPinChange}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all text-center text-xl tracking-widest"
                maxLength={4}
                aria-label="Admin PIN"
                autoComplete="off"
                />
                {adminError && <p className="text-red-400 text-sm text-center">{adminError}</p>}
                <button
                onClick={handleAdminLogin}
                className="w-full px-6 py-3 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 active:scale-95 transition-all text-lg"
                >
                Enter as Admin
                </button>
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;