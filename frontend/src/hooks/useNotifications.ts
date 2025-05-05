import { useCallback, useEffect, useState, useRef } from 'react';
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
  // Initialize with safe default values
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean>(true);
  
  // Always create this ref regardless of other conditions - fixes hook order issue
  const hookOrderRef = useRef('hook-order-fixed');
  
  // Get delta stream subscription - ALWAYS call this hook, never conditionally
  const deltaStream = useDeltaStream();
  // Safely extract subscribe function
  const subscribe = deltaStream?.subscribe || (() => ({
    dataType: '',
    callback: () => {},
    unsubscribe: () => {}
  }));
  
  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get('/notifications');
      
      // Add defensive check
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n: Notification) => !n.read_at).length);
      } else {
        // Set safe default values
        setNotifications([]);
        setUnreadCount(0);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      
      // Set safe default values
      setNotifications([]);
      setUnreadCount(0);
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
      setIsLoading(false);
    }
  }, []);

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const response = await apiClient.get<UserNotificationSettings>('/notifications/preferences');
      
      // Add enhanced defensive checks for response data - make sure to check for preferences property
      if (response?.data?.preferences && Array.isArray(response.data.preferences)) {
        setPreferences(response.data.preferences);
      } else if (response?.data && typeof response.data === 'object') {
        // If the data exists but isn't in the expected structure with a preferences array,
        // it might be a direct array of preferences (API format changed)
        const dataArray = Array.isArray(response.data) ? response.data : [];
        
        if (dataArray.length > 0) {
          setPreferences(dataArray);
        } else {
          
          // Create default preferences if missing
          const defaultPreferences = [
            { user_id: '', notification_type: 'activity', enabled: true, email_enabled: false },
            { user_id: '', notification_type: 'insight', enabled: true, email_enabled: true },
            { user_id: '', notification_type: 'reminder', enabled: true, email_enabled: true },
            { user_id: '', notification_type: 'system', enabled: true, email_enabled: false },
            { user_id: '', notification_type: 'mention', enabled: true, email_enabled: true },
            { user_id: '', notification_type: 'relationship', enabled: true, email_enabled: false }
          ];
          
          // Set default preferences as fallback
          setPreferences(defaultPreferences);
          
          // Try to check API availability
          setApiAvailable(false);
        }
      } else {
        // Create default preferences if missing
        const defaultPreferences = [
          { user_id: '', notification_type: 'activity', enabled: true, email_enabled: false },
          { user_id: '', notification_type: 'insight', enabled: true, email_enabled: true },
          { user_id: '', notification_type: 'reminder', enabled: true, email_enabled: true },
          { user_id: '', notification_type: 'system', enabled: true, email_enabled: false },
          { user_id: '', notification_type: 'mention', enabled: true, email_enabled: true },
          { user_id: '', notification_type: 'relationship', enabled: true, email_enabled: false }
        ];
        
        // Set default preferences as fallback
        setPreferences(defaultPreferences);
        
        // Try to check API availability
        setApiAvailable(false);
      }
    } catch (err) {
      console.error('Failed to fetch notification preferences:', err);
      // Log more detailed error information
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
      }
      
      // Create default preferences when API call fails
      const defaultPreferences = [
        { user_id: '', notification_type: 'activity', enabled: true, email_enabled: false },
        { user_id: '', notification_type: 'insight', enabled: true, email_enabled: true },
        { user_id: '', notification_type: 'reminder', enabled: true, email_enabled: true },
        { user_id: '', notification_type: 'system', enabled: true, email_enabled: false },
        { user_id: '', notification_type: 'mention', enabled: true, email_enabled: true },
        { user_id: '', notification_type: 'relationship', enabled: true, email_enabled: false }
      ];
      
      // Set default preferences as fallback
      console.log('[Debug] Setting default preferences array due to error');
      setPreferences(defaultPreferences);
      setApiAvailable(false);
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

  // Initial data loading with error handling
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to fetch notifications
        await fetchNotifications().catch(() => {
          setApiAvailable(false);
        });
        
        // Try to fetch preferences
        await fetchPreferences().catch(() => {
          setApiAvailable(false);
        });
        
        // Always set loading to false when done, regardless of success
        setIsLoading(false);
      } catch (error) {
        setApiAvailable(false);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [fetchNotifications, fetchPreferences]);

  // Set up real-time notification subscription
  useEffect(() => {
    // Safety check to ensure subscribe is a function
    if (typeof subscribe !== 'function') {
      console.error('Error: subscribe is not a function');
      return;
    }

    try {
      const subscription = subscribe('notification', (data, operation) => {
        if (operation === 'create') {
          // Add new notification to the list
          setNotifications(prev => [data as Notification, ...prev]);
          
          // Update unread count
          setUnreadCount(prev => prev + 1);
        }
      });
      
      return () => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error('Failed to set up notification subscription');
    }
  }, [subscribe]);

  // Return interface with safe values
  return {
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
    preferences: preferences || [],
    isLoading,
    error,
    apiAvailable,
    fetchNotifications,
    markAsRead,
    dismiss,
    markAllAsRead,
    dismissAll,
    fetchPreferences,
    updatePreference
  };
}