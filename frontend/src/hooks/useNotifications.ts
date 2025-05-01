import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import useDeltaStream from './useDeltaStream';

export interface Notification {
  id: string;
  type: 'activity' | 'insight' | 'reminder' | 'system' | 'mention' | 'relationship';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
  dismissed_at: string | null;
  entity_type?: string;
  entity_id?: string;
  action_url?: string;
}

export interface NotificationPreference {
  user_id: string;
  notification_type: string;
  enabled: boolean;
  email_enabled: boolean;
}

export interface UserNotificationSettings {
  preferences: NotificationPreference[];
}

export default function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Listen for real-time notifications
  const { subscribe } = useDeltaStream();
  
  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/notifications');
      setNotifications(response.data);
      setUnreadCount(response.data.filter((n: Notification) => !n.read_at).length);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
      setIsLoading(false);
    }
  }, []);

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const response = await apiClient.get<UserNotificationSettings>('/notifications/preferences');
      setPreferences(response.data.preferences);
    } catch (err) {
      console.error('Failed to fetch notification preferences:', err);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read_at: new Date().toISOString() } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  }, []);

  // Dismiss notification
  const dismiss = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      
      // Update local state by removing the dismissed notification
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // Update unread count if needed
      setNotifications(prev => {
        const wasUnread = prev.find(n => n.id === id && !n.read_at);
        if (wasUnread) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.filter(n => n.id !== id);
      });
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
      throw err;
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.post('/notifications/read-all');
      
      // Update local state
      const now = new Date().toISOString();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read_at: notification.read_at || now }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      throw err;
    }
  }, []);

  // Dismiss all notifications
  const dismissAll = useCallback(async () => {
    try {
      await apiClient.post('/notifications/dismiss-all');
      
      // Clear notifications
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to dismiss all notifications:', err);
      throw err;
    }
  }, []);

  // Update notification preferences
  const updatePreference = useCallback(async (
    notificationType: string,
    enabled: boolean,
    emailEnabled: boolean
  ) => {
    try {
      const response = await apiClient.put('/notifications/preferences', {
        notification_type: notificationType,
        enabled,
        email_enabled: emailEnabled
      });
      
      // Update local preferences state
      setPreferences(prev => 
        prev.map(pref => 
          pref.notification_type === notificationType 
            ? response.data 
            : pref
        )
      );
      
      return response.data;
    } catch (err) {
      console.error('Failed to update notification preference:', err);
      throw err;
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  // Set up real-time notification subscription
  useEffect(() => {
    const subscription = subscribe('notification', (data, operation) => {
      if (operation === 'create') {
        // Add new notification to the list
        setNotifications(prev => [data as Notification, ...prev]);
        
        // Update unread count
        setUnreadCount(prev => prev + 1);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [subscribe]);

  return {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    dismiss,
    markAllAsRead,
    dismissAll,
    fetchPreferences,
    updatePreference
  };
}