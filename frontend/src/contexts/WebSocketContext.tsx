import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { WEBSOCKET_URLS } from '../services/api';

// Types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface NotificationMessage {
  id: number;
  title: string;
  message: string;
  type: string;
  priority: string;
  created_at: string;
  metadata?: any;
}

export interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  notifications: NotificationMessage[];
  unreadCount: number;
  sendMessage: (type: string, data: any) => void;
  markNotificationAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

// Create context
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// WebSocket Provider Component
export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, token } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);

  useEffect(() => {
    if (isAuthenticated && user && token) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user, token]);

  const connectSocket = () => {
    try {
      // Make sure we have a user ID
      if (!user || !user.id) {
        console.error('Cannot connect WebSocket: No user ID available');
        return;
      }

      // Close any existing connection
      if (socket) {
        socket.close();
      }

      // Create WebSocket URL with user ID
      const wsUrl = `${WEBSOCKET_URLS.NOTIFICATIONS}/${user.id}`;
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      
      const newSocket = new WebSocket(wsUrl);

      // Connection event handlers
      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        reconnectDelay.current = 1000;
        
        // Subscribe to user-specific notifications
        if (user) {
          // Send subscription message
          const subscriptionMessage = {
            type: 'subscribe',
            channels: ['notifications', 'system_alerts', 'document_updates']
          };
          newSocket.send(JSON.stringify(subscriptionMessage));
        }
      };

      newSocket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Auto-reconnect logic
        if (reconnectAttempts.current < maxReconnectAttempts) {
          setTimeout(() => {
            reconnectAttempts.current += 1;
            reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
            console.log(`Reconnecting (attempt ${reconnectAttempts.current})...`);
            connectSocket();
          }, reconnectDelay.current);
        } else {
          toast.error('Failed to connect to notification service after multiple attempts');
        }
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnected(false);
      };

      // Message handler
      newSocket.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);
          console.log('Received WebSocket message:', rawData);
          
          // Process based on message type
          const messageType = rawData.type;
          const data = rawData.data;
          
          if (messageType === 'notification') {
            handleNotification(data);
          } else if (messageType === 'broadcast') {
            handleBroadcast(data);
          } else if (messageType === 'system_alert') {
            handleSystemAlert(data);
          } else if (messageType === 'document_update') {
            handleDocumentUpdate(data);
          }
          
          // Update last message
          const message: WebSocketMessage = {
            type: messageType,
            data,
            timestamp: new Date().toISOString(),
            priority: data.priority || 'medium',
          };
          setLastMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      setSocket(newSocket);
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  };

  const sendMessage = (type: string, data: any) => {
    if (socket && isConnected) {
      const message = {
        type,
        data
      };
      socket.send(JSON.stringify(message));
    } else {
      console.warn('Socket not connected, cannot send message');
    }
  };

  const handleNotification = (notification: NotificationMessage) => {
    // Add to notifications list
    setNotifications(prev => [notification, ...prev.slice(0, 99)]); // Keep last 100
    setUnreadCount(prev => prev + 1);

    // Show toast notification
    const autoClose: number | false = notification.priority === 'urgent' ? false : 5000;
    const toastOptions = {
      autoClose,
    };

    switch (notification.priority) {
      case 'urgent':
        toast.error(`${notification.title}: ${notification.message}`, toastOptions);
        break;
      case 'high':
        toast.warn(`${notification.title}: ${notification.message}`, toastOptions);
        break;
      case 'medium':
        toast.info(`${notification.title}: ${notification.message}`, toastOptions);
        break;
      default:
        toast.success(`${notification.title}: ${notification.message}`, toastOptions);
    }

    // Browser notification (if permission granted)
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: `notification-${notification.id}`,
      });
    }
  };

  const handleBroadcast = (data: any) => {
    toast.info(`System Broadcast: ${data.message}`, {
      autoClose: 7000,
    });

    // Add as notification
    const notification: NotificationMessage = {
      id: Date.now(),
      title: 'System Broadcast',
      message: data.message,
      type: 'broadcast',
      priority: data.priority || 'medium',
      created_at: new Date().toISOString(),
      metadata: data,
    };

    setNotifications(prev => [notification, ...prev.slice(0, 99)]);
    setUnreadCount(prev => prev + 1);
  };

  const handleSystemAlert = (data: any) => {
    toast.error(`System Alert: ${data.message}`, {
      autoClose: false,
    });

    // Add as notification
    const notification: NotificationMessage = {
      id: Date.now(),
      title: 'System Alert',
      message: data.message,
      type: 'system_alert',
      priority: 'urgent',
      created_at: new Date().toISOString(),
      metadata: data,
    };

    setNotifications(prev => [notification, ...prev.slice(0, 99)]);
    setUnreadCount(prev => prev + 1);
  };

  const handleDocumentUpdate = (data: any) => {
    toast.info(`Document Update: ${data.message}`, {
      autoClose: 5000,
    });

    // Add as notification
    const notification: NotificationMessage = {
      id: Date.now(),
      title: 'Document Update',
      message: data.message,
      type: 'document_update',
      priority: 'low',
      created_at: new Date().toISOString(),
      metadata: data,
    };

    setNotifications(prev => [notification, ...prev.slice(0, 99)]);
    setUnreadCount(prev => prev + 1);
  };

  const markNotificationAsRead = (notificationId: number) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Request browser notification permission
  useEffect(() => {
    if (isAuthenticated && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, [isAuthenticated]);

  const contextValue: WebSocketContextType = {
    socket,
    isConnected,
    lastMessage,
    notifications,
    unreadCount,
    sendMessage,
    markNotificationAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use WebSocket context
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
