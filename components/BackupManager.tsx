import React, { useState, useRef } from 'react';
import { useNotification } from '../imageStore';

interface BackupManagerProps {
  onClose: () => void;
  onExport: () => void;
  onImport: (backupJson: string) => void;
  onResetDay: (date: string) => void;
  appLogo: string | null;
  onLogoChange: (logoBase64: string | null) => void;
}

const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            if (!event.target?.result) {
                return reject(new Error("FileReader did not return a result."));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Could not get canvas context'));
                
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/png', quality));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};


const BackupManager: React.FC<BackupManagerProps> = ({ onClose, onExport, onImport, onResetDay, appLogo, onLogoChange }) => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [resetDate, setResetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newLogoPreview, setNewLogoPreview] = useState<string | null>(null);
  const { showNotification } = useNotification();

  const handleFileImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleResetClick = () => {
    onResetDay(resetDate);
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

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
              showNotification('File is too large. Please select an image under 5MB.', 'error');
              return;
          }
          try {
              const resizedBase64 = await resizeImage(file, 256, 256, 0.9);
              setNewLogoPreview(resizedBase64);
          } catch (e) {
              console.error("Image processing failed", e);
              showNotification("Could not process image. Please try a different one.", "error");
          }
      }
  };

  const handleSaveLogo = () => {
      if (newLogoPreview) {
          onLogoChange(newLogoPreview);
          showNotification('Logo updated successfully!', 'success');
          setNewLogoPreview(null);
          if (logoFileInputRef.current) logoFileInputRef.current.value = '';
      }
  };

  const handleRemoveLogo = () => {
      if (window.confirm("Are you sure you want to remove the application logo?")) {
          onLogoChange(null);
          showNotification('Logo removed.', 'info');
          setNewLogoPreview(null);
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-gray-700 animate-fade-in-up flex flex-col">
        <div className="p-6 relative overflow-y-auto max-h-[90vh]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-100">Backup & Restore</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="mt-8 border-t border-gray-600 pt-6">
            <h3 className="text-xl font-bold text-gray-100 mb-2">Manage Application Logo</h3>
            <p className="text-sm text-gray-400 mb-4">Set the logo for the login screen, header, and browser tab.</p>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex-shrink-0">
                    <p className="block text-sm font-medium text-gray-300 mb-1 text-center">Preview</p>
                    <div className="w-24 h-24 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
                        {newLogoPreview ? <img src={newLogoPreview} alt="New Logo Preview" className="w-full h-full object-contain p-1" /> : appLogo ? <img src={appLogo} alt="Current Logo" className="w-full h-full object-contain p-1" /> : <span className="text-gray-600 text-xs font-bold">No Logo</span>}
                    </div>
                </div>
                <div className="flex-grow w-full">
                    <input type="file" ref={logoFileInputRef} onChange={handleLogoFileChange} accept="image/png, image/jpeg, image/webp" className="hidden" />
                    <button onClick={() => logoFileInputRef.current?.click()} className="w-full mb-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm">Choose Image...</button>
                    {newLogoPreview && <button onClick={handleSaveLogo} className="w-full mb-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg text-sm">Save New Logo</button>}
                    {appLogo && <button onClick={handleRemoveLogo} className="w-full px-4 py-2 bg-red-800 text-white font-semibold rounded-lg text-sm">Remove Logo</button>}
                </div>
            </div>
          </div>
          
          <div className="mt-8 border-t border-gray-600 pt-6">
            <h3 className="text-xl font-bold text-gray-100 mb-2">Full Application Backup</h3>
            <p className="text-sm text-gray-400 mb-6">Save or load all application data, including custom images, history, and all records. Use this for complete backups or migrating to a new device.</p>
            <div className="space-y-4">
                <button onClick={onExport} className="w-full px-5 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Export All Data to File
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                <button onClick={handleFileImportClick} disabled={isImporting} className="w-full px-5 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-wait flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {isImporting ? 'Importing...' : 'Restore from Backup File'}
                </button>
            </div>
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 text-red-300 text-sm rounded-lg">
                <strong>Warning:</strong> Restoring from a backup is a destructive action. It will permanently overwrite all current data in the application.
            </div>
          </div>

           <div className="mt-8 border-t border-gray-600 pt-6">
            <h3 className="text-xl font-bold text-red-400 mb-2">Reset Daily Data</h3>
            <p className="text-sm text-gray-400 mb-4">This will permanently delete all guest counts, sales, assignments, and attendance records for a specific day. This action cannot be undone.</p>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex-grow w-full sm:w-auto">
                    <label htmlFor="reset-date" className="block text-sm font-medium text-gray-300 mb-1">Select Date to Reset</label>
                    <input
                        id="reset-date"
                        type="date"
                        value={resetDate}
                        onChange={(e) => setResetDate(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                    />
                </div>
                <button
                    onClick={handleResetClick}
                    className="w-full sm:w-auto px-5 py-2.5 bg-red-800 text-white font-bold rounded-lg hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 self-end"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Reset Selected Day's Data
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