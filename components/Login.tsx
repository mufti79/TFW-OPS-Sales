import React, { useState } from 'react';
import { Operator } from '../types';

interface LoginProps {
  onLogin: (role: 'operator' | 'admin' | 'operation-officer' | 'ticket-sales' | 'sales-officer', payload?: string | Operator) => boolean;
  operators: Operator[];
  ticketSalesPersonnel: Operator[];
  appLogo: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, operators, ticketSalesPersonnel, appLogo }) => {
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

  const handlePinChange = (setter: React.Dispatch<React.SetStateAction<string>>, errorSetter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    errorSetter('');
    setter(value);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4 relative">
      <div className="mb-12 flex flex-col items-center justify-center text-center gap-2">
        {appLogo ? (
            <img src={appLogo} alt="Toggi Fun World Logo" className="w-20 h-20 md:w-24 md:h-24 object-contain" />
        ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
                <span className="text-gray-600 font-bold">Logo</span>
            </div>
        )}
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Toggi Fun World
        </h1>
        <p className="text-lg font-semibold text-gray-300 tracking-wider">feel the thrill</p>
        <p className="text-base text-gray-500 mt-2">Bashundhara City Development Ltd, Panthapath, Dhaka</p>
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
                    onChange={(e) => handlePinChange(setOfficerPin, setOfficerError, e.target.value)}
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
                            onChange={(e) => handlePinChange(setSalesOfficerPin, setSalesOfficerError, e.target.value)}
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
                onChange={(e) => handlePinChange(setAdminPin, setAdminError, e.target.value)}
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