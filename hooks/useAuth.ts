import useLocalStorage from './useLocalStorage';
import { Operator } from '../types';
import { useCallback } from 'react';

export type Role = 'admin' | 'operator' | 'operation-officer' | 'ticket-sales' | 'sales-officer' | null;

export const ADMIN_PIN = '9999';
export const OPERATION_OFFICER_PIN = '4321';
export const SALES_OFFICER_PIN = '5678';




export const useAuth = () => {
  const [role, setRole] = useLocalStorage<Role>('authRole', null);
  const [currentUser, setCurrentUser] = useLocalStorage<Operator | null>('authUser', null);

  const login = useCallback((
    newRole: 'admin' | 'operator' | 'operation-officer' | 'ticket-sales' | 'sales-officer', 
    payload?: string | Operator
  ): boolean => {
    switch (newRole) {
      case 'admin':
        if (payload === ADMIN_PIN) {
          setRole('admin');
          setCurrentUser({ id: 0, name: 'Admin' });
          return true;
        }
        return false;
      case 'operation-officer':
        if (payload === OPERATION_OFFICER_PIN) {
          setRole('operation-officer');
          setCurrentUser({ id: -1, name: 'Operation Officer' });
          return true;
        }
        return false;
      case 'sales-officer':
        if (payload === SALES_OFFICER_PIN) {
          setRole('sales-officer');
          setCurrentUser({ id: -2, name: 'Sales Officer' });
          return true;
        }
        return false;
      
      case 'operator':
      case 'ticket-sales':
        if (payload && typeof payload !== 'string') {
          setRole(newRole);
          setCurrentUser(payload as Operator);
          return true;
        }
        return false;
      default:
        return false;
    }
  }, [setRole, setCurrentUser]);

  const logout = useCallback(() => {
    setRole(null);
    setCurrentUser(null);
  }, [setRole, setCurrentUser]);

  return { role, currentUser, login, logout };
};
