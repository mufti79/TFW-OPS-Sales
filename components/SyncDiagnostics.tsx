import React, { useState, useEffect } from 'react';
import { database, isFirebaseConfigured } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';

interface DiagnosticInfo {
  firebaseConfigured: boolean;
  databaseConnected: boolean;
  localStorageAvailable: boolean;
  localStorageSize: number;
  cachedPaths: string[];
  connectionStatus: 'connected' | 'disconnected' | 'unknown';
  timestamp: string;
}

const SyncDiagnostics: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const runDiagnostics = () => {
    setIsRefreshing(true);
    
    // Check localStorage
    let localStorageAvailable = false;
    let localStorageSize = 0;
    const cachedPaths: string[] = [];
    
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      localStorageAvailable = true;
      
      // Calculate size and collect paths
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            localStorageSize += key.length + value.length;
          }
          if (key.startsWith('tfw_data_')) {
            cachedPaths.push(key.replace('tfw_data_', '').replace(/_/g, '/'));
          }
        }
      }
    } catch (error) {
      console.error('localStorage check failed:', error);
    }

    // Check Firebase connection
    let connectionStatus: 'connected' | 'disconnected' | 'unknown' = 'unknown';
    
    if (isFirebaseConfigured && database) {
      const connectedRef = ref(database, '.info/connected');
      const unsubscribe = onValue(connectedRef, (snapshot) => {
        connectionStatus = snapshot.val() ? 'connected' : 'disconnected';
        
        setDiagnostics({
          firebaseConfigured: isFirebaseConfigured,
          databaseConnected: connectionStatus === 'connected',
          localStorageAvailable,
          localStorageSize: Math.round(localStorageSize / 1024), // KB
          cachedPaths,
          connectionStatus,
          timestamp: new Date().toLocaleString(),
        });
        
        setIsRefreshing(false);
        
        // Unsubscribe immediately after getting the value to prevent memory leak
        unsubscribe();
      });
    } else {
      setDiagnostics({
        firebaseConfigured: isFirebaseConfigured,
        databaseConnected: false,
        localStorageAvailable,
        localStorageSize: Math.round(localStorageSize / 1024),
        cachedPaths,
        connectionStatus: 'disconnected',
        timestamp: new Date().toLocaleString(),
      });
      
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusIcon = (status: boolean) => {
    return status ? '✅' : '❌';
  };

  const getConnectionColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  const copyToClipboard = () => {
    if (diagnostics) {
      const text = `TFW OPS Sales - Sync Diagnostics
Generated: ${diagnostics.timestamp}

Firebase Configuration: ${diagnostics.firebaseConfigured ? 'Yes' : 'No'}
Database Connected: ${diagnostics.databaseConnected ? 'Yes' : 'No'}
Connection Status: ${diagnostics.connectionStatus}
LocalStorage Available: ${diagnostics.localStorageAvailable ? 'Yes' : 'No'}
LocalStorage Size: ${diagnostics.localStorageSize} KB

Cached Data Paths (${diagnostics.cachedPaths.length}):
${diagnostics.cachedPaths.join('\n')}

User Agent: ${navigator.userAgent}
Online: ${navigator.onLine ? 'Yes' : 'No'}
`;
      
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => {
            alert('Diagnostics copied to clipboard!');
          })
          .catch(err => {
            console.error('Clipboard API failed, trying fallback:', err);
            copyToClipboardFallback(text);
          });
      } else {
        // Fallback for browsers without clipboard API
        copyToClipboardFallback(text);
      }
    }
  };
  
  const copyToClipboardFallback = (text: string) => {
    // Create a temporary textarea for fallback copying
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert('Diagnostics copied to clipboard!');
      } else {
        alert('Failed to copy. Please manually copy the text from the console.');
        console.log('=== DIAGNOSTICS REPORT ===\n' + text);
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      alert('Copy failed. Diagnostic report has been logged to console (press F12).');
      console.log('=== DIAGNOSTICS REPORT ===\n' + text);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border-2 border-purple-500">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">🔍 Sync Diagnostics</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
            aria-label="Close diagnostics"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {diagnostics ? (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-purple-400 mb-3">System Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Firebase Configured:</span>
                    <span className="font-mono">{getStatusIcon(diagnostics.firebaseConfigured)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Database Connected:</span>
                    <span className="font-mono">{getStatusIcon(diagnostics.databaseConnected)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Connection Status:</span>
                    <span className={`font-mono font-bold ${getConnectionColor(diagnostics.connectionStatus)}`}>
                      {diagnostics.connectionStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">LocalStorage Available:</span>
                    <span className="font-mono">{getStatusIcon(diagnostics.localStorageAvailable)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">LocalStorage Size:</span>
                    <span className="font-mono text-blue-400">{diagnostics.localStorageSize} KB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Browser Online:</span>
                    <span className="font-mono">{getStatusIcon(navigator.onLine)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-purple-400 mb-3">
                  Cached Data ({diagnostics.cachedPaths.length} paths)
                </h3>
                {diagnostics.cachedPaths.length > 0 ? (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {diagnostics.cachedPaths.map((path, index) => (
                      <div key={index} className="text-xs font-mono text-gray-400 bg-gray-900 px-2 py-1 rounded">
                        {path}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No cached data found</p>
                )}
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-purple-400 mb-3">Troubleshooting</h3>
                <div className="space-y-3 text-sm text-gray-300">
                  {!diagnostics.databaseConnected && (
                    <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded p-3">
                      <p className="font-semibold text-red-400">⚠️ Database Not Connected</p>
                      <p className="mt-1">Possible causes:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Check your internet connection</li>
                        <li>Verify Firebase rules allow access</li>
                        <li>Check browser console for errors</li>
                      </ul>
                    </div>
                  )}
                  
                  {!diagnostics.localStorageAvailable && (
                    <div className="bg-red-900 bg-opacity-30 border border-red-500 rounded p-3">
                      <p className="font-semibold text-red-400">⚠️ LocalStorage Not Available</p>
                      <p className="mt-1">Enable cookies and local storage in browser settings</p>
                    </div>
                  )}
                  
                  {diagnostics.localStorageSize > 5000 && (
                    <div className="bg-yellow-900 bg-opacity-30 border border-yellow-500 rounded p-3">
                      <p className="font-semibold text-yellow-400">⚠️ Large Cache Size</p>
                      <p className="mt-1">Consider clearing cache to free up space</p>
                    </div>
                  )}
                  
                  {diagnostics.databaseConnected && diagnostics.localStorageAvailable && (
                    <div className="bg-green-900 bg-opacity-30 border border-green-500 rounded p-3">
                      <p className="font-semibold text-green-400">✓ All Systems Operational</p>
                      <p className="mt-1">Data sync is working normally</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center">
                Generated: {diagnostics.timestamp}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Running diagnostics...</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-4 flex gap-3 border-t border-gray-700">
          <button
            onClick={runDiagnostics}
            disabled={isRefreshing}
            className="flex-1 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isRefreshing ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <button
            onClick={copyToClipboard}
            disabled={!diagnostics}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            📋 Copy Report
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncDiagnostics;
