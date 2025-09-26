import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { toast } from 'react-toastify';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
});

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { socket, isConnected } = useWebSocket();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (socket && isConnected) {
      // Create message handler function
      const handleSocketMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle individual notification
          if (data.type === 'notification') {
            const notification = data.data as Notification;
            setNotifications((prev) => [notification, ...prev]);
            
            // Show toast for new notifications
            toast[notification.type](`${notification.title}: ${notification.message}`, {
              toastId: notification.id,
            });
          }
          
          // Handle bulk notifications
          else if (data.type === 'notification_bulk') {
            const newNotifications = data.data as Notification[];
            setNotifications((prev) => [...newNotifications, ...prev]);
          }
        } catch (error) {
          console.error('Error parsing notification message:', error);
        }
      };
      
      // Add event listener for messages
      socket.addEventListener('message', handleSocketMessage);
      
      // Clean up
      return () => {
        socket.removeEventListener('message', handleSocketMessage);
      };
    }
  }, [socket, isConnected]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
