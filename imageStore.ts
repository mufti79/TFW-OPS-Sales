import { createContext, useContext } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
}

// Provide a default no-op function to prevent errors if context is accessed before provider mounts
const defaultContext: NotificationContextType = {
  showNotification: () => {
    console.warn('showNotification called outside of NotificationProvider');
  }
};

export const NotificationContext = createContext<NotificationContextType>(defaultContext);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  return context;
};
