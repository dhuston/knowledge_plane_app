import { useCallback, useEffect, useState, useRef } from 'react';
import { apiClient } from '../api/client';
import useDeltaStream from './useDeltaStream';
import { AppError, ErrorCategory } from '../utils/errorHandling';

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

// Default preferences for when API is unavailable
const DEFAULT_PREFERENCES: NotificationPreference[] = [
  { user_id: '', notification_type: 'activity', enabled: true, email_enabled: false },
  { user_id: '', notification_type: 'insight', enabled: true, email_enabled: true },
  { user_id: '', notification_type: 'reminder', enabled: true, email_enabled: true },
  { user_id: '', notification_type: 'system', enabled: true, email_enabled: false },
  { user_id: '', notification_type: 'mention', enabled: true, email_enabled: true },
  { user_id: '', notification_type: 'relationship', enabled: true, email_enabled: false }
];

export default function useNotifications() {
  // Initialize with safe default values
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<AppError | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean>(true);
  
  // Always create this ref regardless of other conditions - fixes hook order issue
  const hookOrderRef = useRef('hook-order-fixed');
  
  // Track endpoint availability for specific notification endpoints
  const [endpointStatus, setEndpointStatus] = useState<Record<string, boolean>>({
    notifications: true,
    preferences: true,
    readAll: true,
    dismissAll: true
  });
  
  // Get delta stream subscription - ALWAYS call this hook, never conditionally
  const deltaStream = useDeltaStream();
  // Safely extract subscribe function
  const subscribe = deltaStream?.subscribe || (() => ({
    dataType: '',
    callback: () => {},
    unsubscribe: () => {}
  }));
  
  // Check API availability for notifications endpoint
  const checkNotificationEndpointAvailability = useCallback(async () => {
    const available = await apiClient.isEndpointAvailable('/api/v1/notifications');
    setEndpointStatus(prev => ({ ...prev, notifications: available }));
    return available;
  }, []);
  
  // Check API availability for preferences endpoint
  const checkPreferencesEndpointAvailability = useCallback(async () => {
    const available = await apiClient.isEndpointAvailable('/api/v1/notifications/preferences');
    setEndpointStatus(prev => ({ ...prev, preferences: available }));
    return available;
  }, []);
  
  // Fetch notifications with improved error handling
  const fetchNotifications = useCallback(async () => {
    if (!endpointStatus.notifications) {
      return { data: [] };
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First check if endpoint is available
      const isAvailable = await checkNotificationEndpointAvailability();
      if (!isAvailable) {
        setApiAvailable(false);
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        return { data: [] };
      }
      
      // Fetch notifications from API
      const response = await apiClient.get<{data: Notification[]}>('/notifications');
      
      // Process response with defensive checks
      if (response && Array.isArray(response.data)) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n: Notification) => !n.read_at).length);
      } else {
        // Set safe default values
        setNotifications([]);
        setUnreadCount(0);
      }
      
      setIsLoading(false);
      return response;
    } catch (err) {
      // Enhanced error handling using AppError
      const appError = err instanceof AppError ? err : new AppError(
        'Failed to fetch notifications',
        ErrorCategory.NETWORK, 
        err
      );
      
      // Set safe default values
      setNotifications([]);
      setUnreadCount(0);
      setError(appError);
      setIsLoading(false);
      
      // Check if this is a network or not found error
      if (appError.category === ErrorCategory.NETWORK || appError.category === ErrorCategory.NOT_FOUND) {
        setApiAvailable(false);
        setEndpointStatus(prev => ({ ...prev, notifications: false }));
      }
      
      return { data: [] };
    }
  }, [checkNotificationEndpointAvailability, endpointStatus.notifications]);

  // Fetch user preferences with improved error handling
  const fetchPreferences = useCallback(async () => {
    if (!endpointStatus.preferences) {
      return { data: { preferences: DEFAULT_PREFERENCES } };
    }
    
    try {
      // First check if endpoint is available
      const isAvailable = await checkPreferencesEndpointAvailability();
      if (!isAvailable) {
        setApiAvailable(false);
        setPreferences(DEFAULT_PREFERENCES);
        return { data: { preferences: DEFAULT_PREFERENCES } };
      }
      
      // Fetch preferences from API
      const response = await apiClient.get<UserNotificationSettings>('/notifications/preferences');
      
      // Process response with enhanced defensive checks
      if (response?.data?.preferences && Array.isArray(response.data.preferences)) {
        setPreferences(response.data.preferences);
        return response;
      } 
      
      // Handle case where API returns preferences directly as array
      if (response?.data && Array.isArray(response.data)) {
        setPreferences(response.data);
        return { data: { preferences: response.data } };
      }
      
      // Handle case where API returns empty or invalid data
      setPreferences(DEFAULT_PREFERENCES);
      return { data: { preferences: DEFAULT_PREFERENCES } };
    } catch (err) {
      // Enhanced error handling using AppError
      const appError = err instanceof AppError ? err : new AppError(
        'Failed to fetch notification preferences',
        ErrorCategory.NETWORK,
        err
      );
      
      // Set default preferences as fallback
      setPreferences(DEFAULT_PREFERENCES);
      
      // Check if this is a network or not found error
      if (appError.category === ErrorCategory.NETWORK || appError.category === ErrorCategory.NOT_FOUND) {
        setApiAvailable(false);
        setEndpointStatus(prev => ({ ...prev, preferences: false }));
      }
      
      return { data: { preferences: DEFAULT_PREFERENCES } };
    }
  }, [checkPreferencesEndpointAvailability, endpointStatus.preferences]);

  // Mark notification as read with improved error handling
  const markAsRead = useCallback(async (id: string) => {
    try {
      // Optimistically update UI state
      const now = new Date().toISOString();
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read_at: now } 
            : notification
        )
      );
      
      // Update unread count optimistically
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === id);
        return notification && !notification.read_at ? Math.max(0, prev - 1) : prev;
      });
      
      // Make API call
      await apiClient.patch(`/notifications/${id}/read`);
    } catch (err) {
      // If API call fails, revert the optimistic update
      const appError = err instanceof AppError ? err : new AppError(
        'Failed to mark notification as read',
        ErrorCategory.UNKNOWN,
        err
      );
      
      // Only revert UI if it's not a network error (if it's a network error, we want to keep
      // the optimistic update to provide a better user experience)
      if (appError.category !== ErrorCategory.NETWORK && appError.category !== ErrorCategory.NOT_FOUND) {
        // Revert notification state
        await fetchNotifications();
      }
      
      throw appError;
    }
  }, [fetchNotifications, notifications]);

  // Dismiss notification with improved error handling
  const dismiss = useCallback(async (id: string) => {
    try {
      // Check if the notification was unread
      const wasUnread = notifications.some(n => n.id === id && !n.read_at);
      
      // Update local state optimistically
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // Update unread count if needed
      if (wasUnread) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      
      // Make API call
      await apiClient.delete(`/notifications/${id}`);
    } catch (err) {
      const appError = err instanceof AppError ? err : new AppError(
        'Failed to dismiss notification',
        ErrorCategory.UNKNOWN,
        err
      );
      
      // Only revert UI if it's not a network error
      if (appError.category !== ErrorCategory.NETWORK && appError.category !== ErrorCategory.NOT_FOUND) {
        // Revert by refreshing notifications
        await fetchNotifications();
      }
      
      throw appError;
    }
  }, [fetchNotifications, notifications]);

  // Mark all as read with improved error handling
  const markAllAsRead = useCallback(async () => {
    try {
      // Update local state optimistically
      const now = new Date().toISOString();
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read_at: notification.read_at || now }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      // Make API call
      await apiClient.post('/notifications/read-all');
    } catch (err) {
      const appError = err instanceof AppError ? err : new AppError(
        'Failed to mark all notifications as read',
        ErrorCategory.UNKNOWN,
        err
      );
      
      // Only revert UI if it's not a network error
      if (appError.category !== ErrorCategory.NETWORK && appError.category !== ErrorCategory.NOT_FOUND) {
        // Revert by refreshing notifications
        await fetchNotifications();
      }
      
      if (appError.category === ErrorCategory.NOT_FOUND) {
        setEndpointStatus(prev => ({ ...prev, readAll: false }));
      }
      
      throw appError;
    }
  }, [fetchNotifications]);

  // Dismiss all notifications with improved error handling
  const dismissAll = useCallback(async () => {
    try {
      // Update local state optimistically
      setNotifications([]);
      setUnreadCount(0);
      
      // Make API call
      await apiClient.post('/notifications/dismiss-all');
    } catch (err) {
      const appError = err instanceof AppError ? err : new AppError(
        'Failed to dismiss all notifications',
        ErrorCategory.UNKNOWN,
        err
      );
      
      // Only revert UI if it's not a network error
      if (appError.category !== ErrorCategory.NETWORK && appError.category !== ErrorCategory.NOT_FOUND) {
        // Revert by refreshing notifications
        await fetchNotifications();
      }
      
      if (appError.category === ErrorCategory.NOT_FOUND) {
        setEndpointStatus(prev => ({ ...prev, dismissAll: false }));
      }
      
      throw appError;
    }
  }, [fetchNotifications]);

  // Update notification preferences with improved error handling
  const updatePreference = useCallback(async (
    notificationType: string,
    enabled: boolean,
    emailEnabled: boolean
  ) => {
    try {
      // Update local state optimistically
      const updatedPreference = {
        user_id: '', // Will be set by the server
        notification_type: notificationType,
        enabled,
        email_enabled: emailEnabled
      };
      
      setPreferences(prev => 
        prev.map(pref => 
          pref.notification_type === notificationType 
            ? updatedPreference 
            : pref
        )
      );
      
      // Make API call
      const response = await apiClient.put<NotificationPreference>('/notifications/preferences', {
        notification_type: notificationType,
        enabled,
        email_enabled: emailEnabled
      });
      
      // Update with actual server response
      setPreferences(prev => 
        prev.map(pref => 
          pref.notification_type === notificationType 
            ? response 
            : pref
        )
      );
      
      return response;
    } catch (err) {
      const appError = err instanceof AppError ? err : new AppError(
        'Failed to update notification preference',
        ErrorCategory.UNKNOWN,
        err
      );
      
      // Only revert UI if it's not a network error
      if (appError.category !== ErrorCategory.NETWORK && appError.category !== ErrorCategory.NOT_FOUND) {
        // Revert by refreshing preferences
        await fetchPreferences();
      }
      
      throw appError;
    }
  }, [fetchPreferences]);

  // Check API availability on hook initialization
  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        const isAvailable = await apiClient.isApiAvailable();
        setApiAvailable(isAvailable);
        
        // If API is available, check specific endpoints
        if (isAvailable) {
          const [notificationsAvailable, preferencesAvailable] = await Promise.all([
            checkNotificationEndpointAvailability(),
            checkPreferencesEndpointAvailability()
          ]);
          
          setEndpointStatus(prev => ({
            ...prev,
            notifications: notificationsAvailable,
            preferences: preferencesAvailable
          }));
        }
      } catch (err) {
        setApiAvailable(false);
      }
    };
    
    checkApiAvailability();
  }, [checkNotificationEndpointAvailability, checkPreferencesEndpointAvailability]);

  // Initial data loading with error handling
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Use Promise.allSettled to try both operations and continue even if one fails
        const results = await Promise.allSettled([
          fetchNotifications(),
          fetchPreferences()
        ]);
        
        // Check results to determine if API is available
        const allRejected = results.every(result => result.status === 'rejected');
        if (allRejected) {
          setApiAvailable(false);
        }
      } catch (error) {
        setApiAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [fetchNotifications, fetchPreferences]);

  // Set up real-time notification subscription
  useEffect(() => {
    // Safety check to ensure subscribe is a function
    if (typeof subscribe !== 'function') {
      return;
    }

    try {
      const subscription = subscribe('notification', (data, operation) => {
        if (operation === 'create' && data) {
          // Add new notification to the list
          setNotifications(prev => [data as Notification, ...prev]);
          
          // Update unread count
          setUnreadCount(prev => prev + 1);
        } else if (operation === 'update' && data) {
          // Update existing notification
          const updatedNotification = data as Notification;
          setNotifications(prev => 
            prev.map(notification => 
              notification.id === updatedNotification.id 
                ? updatedNotification 
                : notification
            )
          );
          
          // Update unread count if needed
          if (updatedNotification.read_at) {
            setUnreadCount(prev => {
              const oldNotification = notifications.find(n => n.id === updatedNotification.id);
              return oldNotification && !oldNotification.read_at ? Math.max(0, prev - 1) : prev;
            });
          }
        } else if (operation === 'delete' && data) {
          // Remove deleted notification
          const deletedId = (data as Notification).id;
          
          // Check if the notification was unread
          const wasUnread = notifications.some(n => n.id === deletedId && !n.read_at);
          
          // Update notifications list
          setNotifications(prev => prev.filter(notification => notification.id !== deletedId));
          
          // Update unread count if needed
          if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      });
      
      return () => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      };
    } catch (error) {
      // Just log the error and continue - subscription isn't critical
      console.error('Failed to set up notification subscription');
    }
  }, [subscribe, notifications]);

  // Return interface with safe values and additional information
  return {
    notifications: notifications || [],
    unreadCount: unreadCount || 0,
    preferences: preferences || [],
    isLoading,
    error,
    apiAvailable,
    // Expose endpoint status for more granular UI handling
    endpointStatus,
    fetchNotifications,
    markAsRead,
    dismiss,
    markAllAsRead,
    dismissAll,
    fetchPreferences,
    updatePreference,
    // Add refresh method that checks API availability first
    refresh: async () => {
      const isAvailable = await apiClient.isApiAvailable();
      setApiAvailable(isAvailable);
      
      if (isAvailable) {
        await Promise.allSettled([
          fetchNotifications(),
          fetchPreferences()
        ]);
      }
    }
  };
}