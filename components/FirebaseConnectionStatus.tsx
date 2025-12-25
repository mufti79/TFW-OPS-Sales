/**
 * Firebase Connection Status Component
 * 
 * Displays the current Firebase connection status and allows testing the connection.
 * Useful for debugging and verifying Firebase Realtime Database connectivity.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { testFirebaseConnection, ConnectionTestResult, monitorConnectionStatus } from '../utils/firebaseConnectionTest';
import { forceReconnect } from '../firebaseConfig';

interface FirebaseConnectionStatusProps {
  onClose: () => void;
}

const FirebaseConnectionStatus: React.FC<FirebaseConnectionStatusProps> = ({ onClose }) => {
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [reconnectMessage, setReconnectMessage] = useState<string>('');

  // Monitor real-time connection status
  useEffect(() => {
    const unsubscribe = monitorConnectionStatus((connected) => {
      setIsConnected(connected);
    });

    return unsubscribe;
  }, []);

  const handleTestConnection = useCallback(async () => {
    setIsTesting(true);
    setReconnectMessage('');
    try {
      const result = await testFirebaseConnection();
      setTestResult(result);
    } catch (error) {
      console.error('Error testing connection:', error);
    } finally {
      setIsTesting(false);
    }
  }, []);
  
  const handleForceReconnect = useCallback(async () => {
    setIsReconnecting(true);
    setReconnectMessage('');
    try {
      const result = await forceReconnect();
      setReconnectMessage(result.message);
      
      // Re-test connection after reconnection attempt
      setTimeout(() => {
        handleTestConnection();
      }, 3000);
    } catch (error) {
      console.error('Error forcing reconnection:', error);
      setReconnectMessage('Reconnection failed. Check console for details.');
    } finally {
      setIsReconnecting(false);
    }
  }, [handleTestConnection]);

  // Run test with a small delay to avoid unnecessary API calls on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleTestConnection();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [handleTestConnection]);

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (status: boolean) => {
    return status ? '✓' : '✗';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-purple-400">🔥 Firebase Connection Status</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Real-time Connection Indicator */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="text-lg font-semibold text-white">
                  Real-time Status: {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isTesting ? '🔄 Testing...' : '🔍 Test Connection'}
              </button>
              
              {!isConnected && (
                <button
                  onClick={handleForceReconnect}
                  disabled={isReconnecting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                >
                  {isReconnecting ? '🔄 Reconnecting...' : '🔌 Force Reconnect'}
                </button>
              )}
            </div>
            
            {reconnectMessage && (
              <div className={`mt-3 p-3 rounded-lg ${
                reconnectMessage.includes('failed') || reconnectMessage.includes('Error') 
                  ? 'bg-red-900 bg-opacity-30 border border-red-500 text-red-300' 
                  : 'bg-blue-900 bg-opacity-30 border border-blue-500 text-blue-300'
              }`}>
                {reconnectMessage}
              </div>
            )}
          </div>

          {/* Test Results */}
          {testResult && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white border-b border-gray-700 pb-2">
                Connection Test Results
              </h3>

              {/* Configuration Status */}
              <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Configuration:</span>
                  <span className={`font-bold ${getStatusColor(testResult.configured)}`}>
                    {getStatusIcon(testResult.configured)} {testResult.configured ? 'Configured' : 'Not Configured'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Connection:</span>
                  <span className={`font-bold ${getStatusColor(testResult.connected)}`}>
                    {getStatusIcon(testResult.connected)} {testResult.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Read Permission:</span>
                  <span className={`font-bold ${getStatusColor(testResult.canRead)}`}>
                    {getStatusIcon(testResult.canRead)} {testResult.canRead ? 'Allowed' : 'Denied'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Write Permission:</span>
                  <span className={`font-bold ${getStatusColor(testResult.canWrite)}`}>
                    {getStatusIcon(testResult.canWrite)} {testResult.canWrite ? 'Allowed' : 'Denied'}
                  </span>
                </div>
              </div>

              {/* Project Information */}
              <div className="bg-gray-700 rounded-lg p-4 space-y-3">
                <h4 className="text-lg font-semibold text-purple-400">Project Details</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Project ID:</span>
                    <div className="text-white font-mono bg-gray-800 p-2 rounded mt-1 break-all">
                      {testResult.projectId}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Database URL:</span>
                    <div className="text-white font-mono bg-gray-800 p-2 rounded mt-1 break-all">
                      {testResult.databaseURL}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Test Time:</span>
                    <div className="text-white bg-gray-800 p-2 rounded mt-1">
                      {new Date(testResult.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {testResult.errors.length > 0 && (
                <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-red-400 mb-2">⚠️ Errors Detected</h4>
                  <ul className="space-y-2">
                    {testResult.errors.map((error, index) => (
                      <li key={index} className="text-red-300 text-sm">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Success Message */}
              {testResult.errors.length === 0 && testResult.configured && testResult.connected && (
                <div className="bg-green-900 bg-opacity-30 border border-green-500 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-green-400 mb-2">✓ Connection Successful</h4>
                  <p className="text-green-300 text-sm">
                    Your Firebase Realtime Database is properly configured and connected. All operations are working correctly.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          <div className="bg-gray-700 rounded-lg p-4 text-sm text-gray-300">
            <h4 className="font-semibold text-white mb-2">💡 Tips:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>If connection fails, check your internet connection</li>
              <li>If read/write fails, check Firebase Security Rules in Firebase Console</li>
              <li>The real-time status indicator shows live connection state</li>
              <li>Click "Test Connection" to run a comprehensive connectivity check</li>
              <li><strong>If stuck reconnecting:</strong> Click "Force Reconnect" to reset the connection</li>
              <li>Force reconnect closes and reopens the Firebase connection, which often resolves stuck states</li>
            </ul>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirebaseConnectionStatus;
