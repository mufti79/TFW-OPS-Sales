import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Check if it's a memory error
    const isMemoryError = 
      error.message?.toLowerCase().includes('memory') ||
      error.message?.toLowerCase().includes('heap') ||
      error.name === 'RangeError';

    if (isMemoryError) {
      // Try to clear some memory
      this.clearMemory();
    }
  }

  clearMemory = () => {
    try {
      // Clear service worker cache
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }

      // Clear localStorage except auth data
      const authRole = localStorage.getItem('authRole');
      const authUser = localStorage.getItem('authUser');
      localStorage.clear();
      if (authRole) localStorage.setItem('authRole', authRole);
      if (authUser) localStorage.setItem('authUser', authUser);

      console.log('Memory cleared due to error');
    } catch (e) {
      console.error('Failed to clear memory:', e);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleClearAndReload = () => {
    this.clearMemory();
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  render() {
    if (this.state.hasError) {
      const isMemoryError = 
        this.state.error?.message?.toLowerCase().includes('memory') ||
        this.state.error?.message?.toLowerCase().includes('heap') ||
        this.state.error?.name === 'RangeError';

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-8 border border-gray-700">
            <div className="flex items-center mb-6">
              <svg
                className="w-12 h-12 text-red-500 mr-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h1 className="text-3xl font-bold text-red-400">
                  {isMemoryError ? 'Out of Memory Error' : 'Something Went Wrong'}
                </h1>
                <p className="text-gray-400 mt-1">
                  {isMemoryError
                    ? 'The application ran out of memory'
                    : 'An unexpected error occurred'}
                </p>
              </div>
            </div>

            {isMemoryError && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-6">
                <h3 className="text-yellow-400 font-semibold mb-2">Memory Issue Detected</h3>
                <p className="text-gray-300 text-sm mb-3">
                  This error typically occurs when the application uses too much memory. This can happen due to:
                </p>
                <ul className="text-gray-400 text-sm list-disc list-inside space-y-1 mb-3">
                  <li>Large amounts of data stored locally</li>
                  <li>Too many browser tabs open</li>
                  <li>Insufficient device memory</li>
                  <li>Long session without refreshing</li>
                </ul>
                <p className="text-gray-300 text-sm">
                  Try clearing cache and reloading the page. Your login data will be preserved.
                </p>
              </div>
            )}

            <div className="bg-gray-700 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
              <p className="text-red-400 font-mono text-sm mb-2">
                {this.state.error?.name}: {this.state.error?.message}
              </p>
              {this.state.errorInfo && (
                <details className="text-gray-400 text-xs">
                  <summary className="cursor-pointer hover:text-gray-300">Stack trace</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={this.handleReload}
                className="flex-1 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 active:scale-95 transition-all"
              >
                Reload Page
              </button>
              {isMemoryError && (
                <button
                  onClick={this.handleClearAndReload}
                  className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all"
                >
                  Clear Cache & Reload
                </button>
              )}
            </div>

            <p className="text-gray-500 text-sm text-center mt-6">
              If the problem persists, try closing other tabs, restarting your browser, or using a different device.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
