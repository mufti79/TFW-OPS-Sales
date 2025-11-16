import React, { useState, useRef } from 'react';

interface BackupManagerProps {
  onClose: () => void;
  onExport: () => void;
  onImport: (backupJson: string) => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ onClose, onExport, onImport }) => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImportClick = () => {
    if (window.confirm("WARNING:\n\nImporting a backup file will completely overwrite all current data in the application (operators, counts, assignments, images, etc.).\n\nThis action cannot be undone. Are you sure you want to proceed?")) {
        fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result as string;
            onImport(content);
        } catch (error) {
            console.error("Error reading file:", error);
            alert("Failed to read the backup file.");
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.onerror = () => {
        alert("An error occurred while reading the file.");
        setIsImporting(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-gray-700 animate-fade-in-up flex flex-col">
        <div className="p-6 relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-100">Backup & Restore</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-gray-100 mb-2">Full Backup (File)</h3>
            <p className="text-sm text-gray-400 mb-6">Save or load all application data, including custom images and history. Use this for complete backups or migrating to a new device.</p>
            <div className="space-y-4">
                <button onClick={onExport} className="w-full px-5 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export All Data
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                <button onClick={handleFileImportClick} disabled={isImporting} className="w-full px-5 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-wait flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {isImporting ? 'Importing...' : 'Import from Backup File'}
                </button>
            </div>
          </div>
        </div>
        <div className="bg-gray-700/50 px-6 py-4 flex justify-end gap-4 rounded-b-lg mt-auto">
          <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 active:scale-95 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;