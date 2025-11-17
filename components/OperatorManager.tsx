import React, { useState, useRef, useEffect } from 'react';
import { Operator } from '../types';
import { useNotification } from '../imageStore';

// Make sure XLSX is available from the script tag in index.html
declare var XLSX: any;

interface OperatorManagerProps {
  operators: Operator[];
  onClose: () => void;
  onAddOperator: (name: string) => void;
  onDeleteOperators: (ids: number[]) => void;
  onImport: (newOperators: Operator[], strategy: 'merge' | 'replace') => void;
}

const OperatorManager: React.FC<OperatorManagerProps> = ({ operators, onClose, onAddOperator, onDeleteOperators, onImport }) => {
  const [newOperatorName, setNewOperatorName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<Operator[] | null>(null);
  const { showNotification } = useNotification();

  // When operators prop changes (from Firebase), clear selection
  useEffect(() => {
    setSelectedIds(new Set());
  }, [operators]);

  const handleAddOperator = () => {
    if (newOperatorName.trim() && !operators.some(op => op.name.toLowerCase() === newOperatorName.trim().toLowerCase())) {
        onAddOperator(newOperatorName.trim());
        showNotification(`Operator "${newOperatorName.trim()}" added.`, 'success');
        setNewOperatorName('');
    } else if (newOperatorName.trim()) {
      showNotification("An operator with this name already exists.", 'error');
    }
  };
  
  const handleDeleteOperator = (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this operator? This action is immediate and cannot be undone.')) {
        onDeleteOperators([id]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === operators.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(operators.map(op => op.id)));
    }
  };
  
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to permanently delete ${selectedIds.size} selected operator(s)? This action is immediate and cannot be undone.`)) {
      onDeleteOperators(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('WARNING: This will delete ALL operators from the system. This action is immediate and cannot be undone.\n\nAre you sure you want to proceed?')) {
        onDeleteOperators(operators.map(op => op.id));
        setSelectedIds(new Set());
    }
  };
  
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const importedOperators: Operator[] = [];
            
            for(let i = 1; i < json.length; i++) {
                const row = json[i];
                const name = row[0]?.toString().trim();
                if (name) {
                    importedOperators.push({ id: 0, name }); // id is placeholder
                }
            }

            if (importedOperators.length > 0) {
                setPendingImport(importedOperators);
            } else {
                showNotification('No valid operator names found in the first column.', 'warning');
            }
        } catch (error) {
            console.error("Error parsing Excel file:", error);
            showNotification("Failed to parse the file. Please check the format.", 'error');
        } finally {
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
  };

   const handleConfirmImport = (strategy: 'merge' | 'replace') => {
    if (pendingImport) {
        onImport(pendingImport, strategy);
        setPendingImport(null);
        showNotification('Import successful! The operator list has been updated.', 'success');
    }
  };
  
  const handleExportOperators = () => {
    if (operators.length === 0) {
      showNotification("There are no operators to export.", "info");
      return;
    }

    const exportData = operators.sort((a,b) => a.name.localeCompare(b.name)).map(op => ({ "Operator Name": op.name }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Operators");
    XLSX.writeFile(workbook, "ToggiFunWorld_Operators.xlsx");
  };

  const isAllSelected = operators.length > 0 && selectedIds.size === operators.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-gray-700 animate-fade-in-up flex flex-col">
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-100">Manage Operators</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>
            </div>
            
            {operators.length > 0 && (
                <div className="flex justify-between items-center bg-gray-700/50 p-2 rounded-lg mb-2">
                    <div className="flex items-center">
                    <input
                        id="select-all"
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        className="h-5 w-5 rounded bg-gray-900 border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <label htmlFor="select-all" className="ml-3 font-medium text-sm cursor-pointer select-none">
                        {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select All'}
                    </label>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="px-3 py-1 bg-red-600 text-white font-semibold rounded-md text-sm hover:bg-red-700 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete Selected
                        </button>
                        )}
                        <button
                            onClick={handleDeleteAll}
                            className="px-3 py-1 bg-red-800 text-white font-semibold rounded-md text-sm hover:bg-red-700 flex items-center gap-2"
                            title="Delete all operators"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete All
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2 max-h-[calc(50vh-80px)] overflow-y-auto pr-2">
                {operators.sort((a,b) => a.name.localeCompare(b.name)).map(op => (
                <div key={op.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                    <div className="flex items-center flex-grow">
                        <input
                            type="checkbox"
                            checked={selectedIds.has(op.id)}
                            onChange={() => handleToggleSelect(op.id)}
                            className="h-5 w-5 rounded bg-gray-900 border-gray-600 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            aria-label={`Select ${op.name}`}
                        />
                        <div className="flex-grow ml-4">
                            <span className="text-lg font-medium">{op.name}</span>
                        </div>
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                        <button onClick={() => handleDeleteOperator(op.id)} className="px-3 py-1 bg-red-600 text-white font-semibold rounded-md text-sm hover:bg-red-700">Delete</button>
                    </div>
                </div>
                ))}
                {operators.length === 0 && <p className="text-gray-400 text-center py-4">No operators have been added yet.</p>}
            </div>
            
            <div className="mt-6 border-t border-gray-700 pt-4 space-y-4">
                <div>
                <h3 className="text-lg font-semibold mb-2">Add New Operator</h3>
                <div className="flex gap-3">
                    <input
                    type="text"
                    placeholder="Enter new operator name"
                    value={newOperatorName}
                    onChange={(e) => setNewOperatorName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddOperator()}
                    className="flex-grow px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <button onClick={handleAddOperator} className="px-5 py-2 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 active:scale-95 transition-all">Add</button>
                </div>
                </div>
                <div>
                <h3 className="text-lg font-semibold mb-2">Import / Export Operators</h3>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xlsx, .xls, .csv" className="hidden" />
                <div className="flex gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="w-full px-5 py-2 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 active:scale-95 transition-all">
                        Import from Excel
                    </button>
                    <button onClick={handleExportOperators} className="w-full px-5 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all">
                        Export to Excel
                    </button>
                    </div>
                </div>
            </div>

        </div>
        <div className="bg-gray-700/50 px-6 py-4 flex justify-end gap-4 rounded-b-lg mt-auto">
            <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 active:scale-95 transition-all">
            Close
            </button>
        </div>
        
        {pendingImport && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10 p-4 rounded-lg">
                <div className="bg-gray-700 p-8 rounded-lg shadow-xl border border-gray-600 animate-fade-in-up text-center w-full max-w-sm">
                    <h3 className="text-2xl font-bold mb-4">Import Options</h3>
                    <p className="text-gray-300 mb-2">
                        Found <span className="font-bold text-purple-400 text-xl">{pendingImport.length}</span> operators in the file.
                    </p>
                    <p className="text-gray-400 mb-6">How would you like to add them?</p>
                    
                    <div className="space-y-4">
                        <button 
                          onClick={() => handleConfirmImport('merge')}
                          className="w-full px-5 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
                        >
                          Merge with Existing List
                        </button>
                        <button 
                          onClick={() => { 
                              if (window.confirm("WARNING:\n\nThis will DELETE ALL existing operators and their entire assignment and attendance history.\n\nThis action cannot be undone. Are you sure?")) {
                                  handleConfirmImport('replace');
                              }
                          }}
                          className="w-full px-5 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 active:scale-95 transition-all"
                        >
                          Replace Entire List
                        </button>
                    </div>

                    <button 
                        onClick={() => setPendingImport(null)} 
                        className="mt-8 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        Cancel Import
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default OperatorManager;