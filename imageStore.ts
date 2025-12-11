import { createContext, useContext } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
}

// Provide a default no-op implementation to prevent crashes if context is missing
const defaultNotificationContext: NotificationContextType = {
  showNotification: () => {
    console.warn('showNotification called outside NotificationProvider');
  }
};

export const NotificationContext = createContext<NotificationContextType>(defaultNotificationContext);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  return context;
};
