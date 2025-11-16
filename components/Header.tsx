import React, { useState } from 'react';
import { FLOORS } from '../constants';
import { Role } from '../hooks/useAuth';
import { Operator } from '../types';

type View = 'counter' | 'reports' | 'assignments' | 'expertise' | 'roster' | 'ticket-sales-dashboard' | 'ts-assignments' | 'ts-roster' | 'ts-expertise' | 'history';
type Modal = 'ai-assistant' | 'operators' | 'backup' | null;

interface HeaderProps {
  onSearch: (term: string) => void;
  onSelectFloor: (floor: string) => void;
  selectedFloor: string;
  role: Role;
  currentUser: Operator;
  onLogout: () => void;
  onNavigate: (view: View) => void;
  onShowModal: (modal: Modal) => void;
  currentView: View;
}

const Header: React.FC<HeaderProps> = ({
  onSearch,
  onSelectFloor,
  selectedFloor,
  role,
  currentUser,
  onLogout,
  onNavigate,
  onShowModal,
  currentView,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isManager = role === 'admin' || role === 'operation-officer';
  const isSalesManager = role === 'admin' || role === 'sales-officer';
  const isAdmin = role === 'admin';

  const navLinkClasses = "px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors";

  const renderNavLinks = () => {
      const links = [];
      if (isManager) {
          links.push(<button key="counter" onClick={() => onNavigate('counter')} className={navLinkClasses}>G&R</button>);
          links.push(<button key="roster" onClick={() => onNavigate('roster')} className={navLinkClasses}>Ops Roster</button>);
          links.push(<button key="reports" onClick={() => onNavigate('reports')} className={navLinkClasses}>Ops Reports</button>);
      }
      if (isSalesManager) {
          links.push(<button key="ts-roster" onClick={() => onNavigate('ts-roster')} className={navLinkClasses}>Sales Roster</button>);
          links.push(<button key="ts-expertise" onClick={() => onNavigate('ts-expertise')} className={navLinkClasses}>Sales Reports</button>);
      }
      if (isManager || isSalesManager) {
          links.push(<button key="history" onClick={() => onNavigate('history')} className={navLinkClasses}>History Log</button>);
      }
      if (role === 'operator') {
          links.push(<button key="my-roster" onClick={() => onNavigate('roster')} className={navLinkClasses}>My Roster</button>);
      }
      if (role === 'ticket-sales') {
          links.push(<button key="my-ts-roster" onClick={() => onNavigate('ts-roster')} className={navLinkClasses}>My Roster</button>);
      }
      return links;
  }
   const renderMobileNavLinks = () => {
      const links = [];
      const closeMenu = (view: View) => { onNavigate(view); setMenuOpen(false); };
      
      if (isManager) {
          links.push(<button key="m-counter" onClick={() => closeMenu('counter')} className={`${navLinkClasses} w-full text-left block`}>G&R</button>);
          links.push(<button key="m-roster" onClick={() => closeMenu('roster')} className={`${navLinkClasses} w-full text-left block`}>Ops Roster</button>);
          links.push(<button key="m-reports" onClick={() => closeMenu('reports')} className={`${navLinkClasses} w-full text-left block`}>Ops Reports</button>);
      }
      if (isSalesManager) {
          links.push(<button key="m-ts-roster" onClick={() => closeMenu('ts-roster')} className={`${navLinkClasses} w-full text-left block`}>Sales Roster</button>);
          links.push(<button key="m-ts-expertise" onClick={() => closeMenu('ts-expertise')} className={`${navLinkClasses} w-full text-left block`}>Sales Reports</button>);
      }
      if (isManager || isSalesManager) {
        links.push(<button key="m-history" onClick={() => closeMenu('history')} className={`${navLinkClasses} w-full text-left block`}>History Log</button>);
      }
      if (role === 'operator') {
          links.push(<button key="m-my-roster" onClick={() => closeMenu('roster')} className={`${navLinkClasses} w-full text-left block`}>My Roster</button>);
      }
      if (role === 'ticket-sales') {
          links.push(<button key="m-my-ts-roster" onClick={() => closeMenu('ts-roster')} className={`${navLinkClasses} w-full text-left block`}>My Roster</button>);
      }
      return links;
  }

  return (
    <header className="sticky top-0 z-20 bg-gray-900/80 backdrop-blur-md shadow-lg py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
               <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                TFW
              </h1>
            </div>
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {renderNavLinks()}
              </div>
            </nav>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="text-sm text-gray-300">Welcome, <span className="font-bold">{currentUser.name}</span></div>
            {isAdmin && (
                <>
                    <button onClick={() => onShowModal('ai-assistant')} className={navLinkClasses}>AI Assistant</button>
                    <button onClick={() => onShowModal('operators')} className={navLinkClasses}>Manage Operators</button>
                    <button onClick={() => onShowModal('backup')} className={navLinkClasses}>Backup / Restore</button>
                </>
            )}
            <button onClick={onLogout} className="bg-pink-600 hover:bg-pink-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Logout</button>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)} type="button" className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white" aria-controls="mobile-menu" aria-expanded="false">
              <span className="sr-only">Open main menu</span>
              {!menuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {menuOpen && (
        <nav className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {renderMobileNavLinks()}
            <div className="border-t border-gray-700 my-2" />
            
            {isAdmin && (
                <>
                <button onClick={() => { onShowModal('ai-assistant'); setMenuOpen(false); }} className={`${navLinkClasses} w-full text-left block`}>AI Assistant</button>
                <button onClick={() => { onShowModal('operators'); setMenuOpen(false); }} className={`${navLinkClasses} w-full text-left block`}>Manage Operators</button>
                <button onClick={() => { onShowModal('backup'); setMenuOpen(false); }} className={`${navLinkClasses} w-full text-left block`}>Backup / Restore</button>
                <div className="border-t border-gray-700 my-2" />
                </>
            )}

            <div className="px-3 py-2 text-sm font-medium text-gray-400">Welcome, <span className="font-bold">{currentUser.name}</span></div>
            <button onClick={() => { onLogout(); setMenuOpen(false); }} className={`${navLinkClasses} w-full text-left block bg-pink-600 text-white`}>Logout</button>
          </div>
        </nav>
      )}

      <div className="container mx-auto px-4 pt-2">
         {currentView === 'counter' && (
            <div className="flex flex-col sm:flex-row gap-4 w-full">
                <input
                    type="text"
                    placeholder="Search rides..."
                    onChange={e => onSearch(e.target.value)}
                    className="w-full sm:w-64 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    aria-label="Search for a ride"
                />
                <select
                    value={selectedFloor}
                    onChange={e => onSelectFloor(e.target.value)}
                    className="w-full sm:w-48 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all appearance-none"
                    aria-label="Filter by floor"
                >
                    <option value="">All Floors</option>
                    {FLOORS.map(floor => (
                    <option key={floor} value={floor}>{floor} Floor</option>
                    ))}
                </select>
            </div>
         )}
      </div>
    </header>
  );
};

export default Header;