
import useLocalStorage from './useLocalStorage';
import { Operator } from '../types';
import { useCallback, useEffect } from 'react';

export type Role = 'admin' | 'operator' | 'operation-officer' | 'ticket-sales' | 'sales-officer' | 'security' | null;

export const ADMIN_PIN = '9999';
export const OPERATION_OFFICER_PIN = '4321';
export const SALES_OFFICER_PIN = '5678';
export const SECURITY_PIN = '1234';

export const useAuth = () => {
  const [role, setRole] = useLocalStorage<Role>('authRole', null);
  const [currentUser, setCurrentUser] = useLocalStorage<Operator | null>('authUser', null);
  const [lastActivity, setLastActivity] = useLocalStorage<number>('authLastActivity', Date.now());

  // Update last activity timestamp on any user interaction to prevent auto-logout
  useEffect(() => {
    if (!role || !currentUser) return;

    let activityTimeout: NodeJS.Timeout | null = null;
    
    const updateActivity = () => {
      // Debounce activity updates to avoid excessive localStorage writes
      if (activityTimeout) clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        setLastActivity(Date.now());
      }, 5000); // Only update after 5 seconds of activity
    };

    // Listen to various user activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Periodically save the last activity timestamp to prevent session loss
    // Using a longer interval (5 minutes) to reduce localStorage writes
    const activityInterval = setInterval(() => {
      setLastActivity(Date.now());
    }, 300000); // Update every 5 minutes

    return () => {
      if (activityTimeout) clearTimeout(activityTimeout);
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(activityInterval);
    };
  }, [role, currentUser, setLastActivity]);

  const login = useCallback((
    newRole: 'admin' | 'operator' | 'operation-officer' | 'ticket-sales' | 'sales-officer' | 'security', 
    payload?: string | Operator
  ): boolean => {
    switch (newRole) {
      case 'admin':
        if (payload === ADMIN_PIN) {
          setRole('admin');
          setCurrentUser({ id: 0, name: 'Admin' });
          setLastActivity(Date.now());
          return true;
        }
        return false;
      case 'operation-officer':
        if (payload === OPERATION_OFFICER_PIN) {
          setRole('operation-officer');
          setCurrentUser({ id: -1, name: 'Operation Officer' });
          setLastActivity(Date.now());
          return true;
        }
        return false;
      case 'sales-officer':
        if (payload === SALES_OFFICER_PIN) {
          setRole('sales-officer');
          setCurrentUser({ id: -2, name: 'Sales Officer' });
          setLastActivity(Date.now());
          return true;
        }
        return false;
      case 'security':
        if (payload === SECURITY_PIN) {
          setRole('security');
          setCurrentUser({ id: -3, name: 'Security' });
          setLastActivity(Date.now());
          return true;
        }
        return false;
      
      case 'operator':
      case 'ticket-sales':
        if (payload && typeof payload !== 'string') {
          setRole(newRole);
          setCurrentUser(payload as Operator);
          setLastActivity(Date.now());
          return true;
        }
        return false;
      default:
        return false;
    }
  }, [setRole, setCurrentUser, setLastActivity]);

  const logout = useCallback(() => {
    setRole(null);
    setCurrentUser(null);
  }, [setRole, setCurrentUser]);

  return { role, currentUser, login, logout };
};
