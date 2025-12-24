
import useLocalStorage from './useLocalStorage';
import { Operator } from '../types';
import { useCallback, useEffect } from 'react';

export type Role = 'admin' | 'operator' | 'operation-officer' | 'ticket-sales' | 'sales-officer' | 'security' | null;

export const ADMIN_PIN = '9999';
export const OPERATION_OFFICER_PIN = '4321';
export const SALES_OFFICER_PIN = '5678';
export const SECURITY_PIN = '1234';

// Track session across tabs/devices
const SESSION_ID_KEY = 'authSessionId';
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useAuth = () => {
  const [role, setRole] = useLocalStorage<Role>('authRole', null);
  const [currentUser, setCurrentUser] = useLocalStorage<Operator | null>('authUser', null);
  const [lastActivity, setLastActivity] = useLocalStorage<number>('authLastActivity', Date.now());
  const [sessionId, setSessionId] = useLocalStorage<string>(SESSION_ID_KEY, generateSessionId());

  // Backup auth data to sessionStorage as additional protection against localStorage clearing
  useEffect(() => {
    if (role && currentUser) {
      try {
        sessionStorage.setItem('authBackup', JSON.stringify({ role, currentUser, lastActivity, sessionId }));
      } catch (error) {
        console.warn('Failed to backup auth to sessionStorage:', error);
      }
    }
  }, [role, currentUser, lastActivity, sessionId]);

  // Attempt to recover auth from sessionStorage if localStorage is empty but session exists
  useEffect(() => {
    if (!role && !currentUser) {
      try {
        const backup = sessionStorage.getItem('authBackup');
        if (backup) {
          const parsed = JSON.parse(backup);
          // Check if the backup is still valid (less than 24 hours old)
          if (parsed.lastActivity && Date.now() - parsed.lastActivity < 86400000) {
            console.log('Recovering session from backup...');
            setRole(parsed.role);
            setCurrentUser(parsed.currentUser);
            setLastActivity(Date.now());
            // Restore or generate new session ID
            if (parsed.sessionId) {
              setSessionId(parsed.sessionId);
            } else {
              setSessionId(generateSessionId());
            }
          } else {
            // Backup is too old, clear it
            sessionStorage.removeItem('authBackup');
          }
        }
      } catch (error) {
        console.warn('Failed to recover auth from backup:', error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, currentUser]); // Re-run when role/user changes to catch recovery opportunities

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
    // Generate a new session ID for this login
    const newSessionId = generateSessionId();
    
    switch (newRole) {
      case 'admin':
        if (payload === ADMIN_PIN) {
          setRole('admin');
          setCurrentUser({ id: 0, name: 'Admin' });
          setLastActivity(Date.now());
          setSessionId(newSessionId);
          console.log(`✓ Admin logged in with session: ${newSessionId}`);
          return true;
        }
        return false;
      case 'operation-officer':
        if (payload === OPERATION_OFFICER_PIN) {
          setRole('operation-officer');
          setCurrentUser({ id: -1, name: 'Operation Officer' });
          setLastActivity(Date.now());
          setSessionId(newSessionId);
          console.log(`✓ Operation Officer logged in with session: ${newSessionId}`);
          return true;
        }
        return false;
      case 'sales-officer':
        if (payload === SALES_OFFICER_PIN) {
          setRole('sales-officer');
          setCurrentUser({ id: -2, name: 'Sales Officer' });
          setLastActivity(Date.now());
          setSessionId(newSessionId);
          console.log(`✓ Sales Officer logged in with session: ${newSessionId}`);
          return true;
        }
        return false;
      case 'security':
        if (payload === SECURITY_PIN) {
          setRole('security');
          setCurrentUser({ id: -3, name: 'Security' });
          setLastActivity(Date.now());
          setSessionId(newSessionId);
          console.log(`✓ Security logged in with session: ${newSessionId}`);
          return true;
        }
        return false;
      
      case 'operator':
      case 'ticket-sales':
        if (payload && typeof payload !== 'string') {
          setRole(newRole);
          setCurrentUser(payload as Operator);
          setLastActivity(Date.now());
          setSessionId(newSessionId);
          console.log(`✓ ${newRole} logged in: ${(payload as Operator).name} with session: ${newSessionId}`);
          return true;
        }
        return false;
      default:
        return false;
    }
  }, [setRole, setCurrentUser, setLastActivity, setSessionId]);

  const logout = useCallback(() => {
    setRole(null);
    setCurrentUser(null);
    // Clear backup when user explicitly logs out
    try {
      sessionStorage.removeItem('authBackup');
    } catch (error) {
      console.warn('Failed to clear auth backup:', error);
    }
  }, [setRole, setCurrentUser]);

  return { role, currentUser, login, logout };
};
