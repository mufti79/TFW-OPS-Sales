import React, { useEffect, useRef, useState } from 'react';

type Operator = {
  id: number;
  name: string;
  // ...other fields if applicable
};

type Props = {
  maintenancePersonnel: Operator[];
  // ...other props your app uses
};

const MaintenanceDashboard: React.FC<Props> = ({ maintenancePersonnel }) => {
  const [selectedTechnician, setSelectedTechnician] = useState<Operator | null>(null);
  const [needsHelper, setNeedsHelper] = useState<boolean>(false);
  const [selectedHelpers, setSelectedHelpers] = useState<Operator[]>([]);
  const helperDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isHelperDropdownOpen, setIsHelperDropdownOpen] = useState(false);

  // Helper: when setting a primary technician ensure they are removed from helpers list
  const handleTechnicianSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value; // always a string from the DOM
    if (!value) {
      setSelectedTechnician(null);
      // also disable helper when no primary technician
      setNeedsHelper(false);
      setSelectedHelpers([]);
      return;
    }

    // Find by string comparison to avoid parseInt/NaN issues
    const technician = maintenancePersonnel.find(p => String(p.id) === value) || null;
    setSelectedTechnician(technician);

    if (technician) {
      // If the newly selected primary technician was also in helpers, remove them
      setSelectedHelpers(prev => prev.filter(h => h.id !== technician.id));
    }
  };

  const handleHelperCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setNeedsHelper(isChecked);
    if (!isChecked) {
      setSelectedHelpers([]);
      setIsHelperDropdownOpen(false);
    }
  };

  const handleToggleHelper = (helper: Operator) => {
    setSelectedHelpers(prev =>
      prev.some(h => h.id === helper.id) ? prev.filter(h => h.id !== helper.id) : [...prev, helper]
    );
  };

  // Render
  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Maintenance Dashboard
          </h1>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-grow w-full sm:w-auto">
          <label htmlFor="technician-select" className="block text-lg font-medium text-gray-200 mb-2">Select Your Name</label>
          <select
            id="technician-select"
            // ensure value is a string to match option values from the DOM
            value={selectedTechnician ? String(selectedTechnician.id) : ''}
            onChange={handleTechnicianSelect}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg"
          >
            <option value="">-- Select --</option>
            {maintenancePersonnel
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(p => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
          </select>
          {!selectedTechnician && <p className="text-yellow-400 text-sm mt-2">You must select your name before you can take or solve issues.</p>}
        </div>

        <div className="flex items-center h-[52px] pb-3">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={needsHelper}
              onChange={handleHelperCheckboxChange}
              // enable the checkbox as soon as a technician is selected (safe string check)
              disabled={!selectedTechnician}
              className="w-5 h-5 bg-gray-900 border-gray-500 rounded text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className={`text-sm font-medium ${!selectedTechnician ? 'text-gray-500' : 'text-gray-200'}`}>I need a helper</span>
          </label>
        </div>

        {needsHelper && (
          <div className="flex-grow relative w-full sm:w-auto" ref={helperDropdownRef}>
            <label className="block text-sm font-medium text-gray-400 mb-1">Select Helper name(s)</label>
            <button
              onClick={() => setIsHelperDropdownOpen(prev => !prev)}
              disabled={!selectedTechnician}
              className="w-full sm:w-auto px-4 py-3 bg-gray-900 border border-gray-500 rounded-lg text-left"
            >
              {selectedHelpers.length ? selectedHelpers.map(h => h.name).join(', ') : 'Choose helper(s)'}
            </button>

            {isHelperDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full sm:w-64 bg-gray-800 border border-gray-600 rounded shadow-lg p-2">
                {maintenancePersonnel
                  .filter(p => !selectedTechnician || p.id !== selectedTechnician.id)
                  .map(p => (
                    <label key={p.id} className="flex items-center space-x-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedHelpers.some(h => h.id === p.id)}
                        onChange={() => handleToggleHelper(p)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-200">{p.name}</span>
                    </label>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ...rest of dashboard UI (tickets, actions, etc.) ... */}
    </div>
  );
};

export default MaintenanceDashboard;