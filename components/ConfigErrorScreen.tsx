import React from 'react';

const ConfigErrorScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-100 p-8">
      <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-lg shadow-2xl border-2 border-red-500 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h1 className="text-3xl font-bold text-red-400 mb-4">Action Required: Configure Firebase</h1>
        <p className="text-lg text-gray-300 mb-6">
          This application requires a connection to a Firebase Realtime Database to save and sync data, but it has not been configured yet.
        </p>
        <div className="text-left bg-gray-900 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100 mb-3">What to do:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-400">
            <li>Open the file <code className="bg-gray-700 text-yellow-300 px-2 py-1 rounded-md text-sm">firebaseConfig.ts</code> in your project.</li>
            <li>Follow the instructions inside the file to create a free Firebase project.</li>
            <li>Copy the configuration object provided by Firebase and paste it into the file.</li>
            <li>Save the file. The application will automatically reload.</li>
          </ol>
        </div>
        <p className="mt-6 text-gray-500 text-sm">
          Without this configuration, the app will not work correctly, and no data will be saved or synchronized between devices.
        </p>
      </div>
    </div>
  );
};

export default ConfigErrorScreen;
