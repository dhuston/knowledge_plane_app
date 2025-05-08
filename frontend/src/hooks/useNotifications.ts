import { useCallback, useEffect, useState, useRef } from 'react';
import { apiClient } from '../api/client';
import useDeltaStream from './useDeltaStream';
import { AppError, ErrorCategory } from '../utils/errorHandling';
import { IS_DEVELOPMENT } from '../config/env';

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
  const [preferences, setPreferences] = useState<NotificationPreference[]>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState<boolean>(false); // Start with not loading to avoid spinner flicker
  const [error, setError] = useState<AppError | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean>(false); // Start pessimistic for better UX
  
  // Always create this ref regardless of other conditions - fixes hook order issue
  const hookOrderRef = useRef('hook-order-fixed');
  
  // Track endpoint availability for specific notification endpoints
  const [endpointStatus, setEndpointStatus] = useState<Record<string, boolean>>({
    notifications: false,  // Start with false until we confirm availability
    preferences: false,    // Start with false until we confirm availability
    readAll: false,
    dismissAll: false
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
    try {
      // In development mode, also check the dev endpoint
      if (IS_DEVELOPMENT) {
        try {
          const currentTenant = localStorage.getItem('knowledge_plane_tenant');
          if (currentTenant) {
            const devEndpoint = `/api/v1/notifications/dev/${currentTenant}`;
            const devAvailable = await apiClient.isEndpointAvailable(devEndpoint);
            if (devAvailable) {
              console.log("[DEV MODE] Dev notifications endpoint is available");
              setEndpointStatus(prev => ({ ...prev, notifications: true }));
              return true;
            }
          }
        } catch (devCheckError) {
          console.log("[DEV MODE] Error checking dev notifications endpoint: silently handling");
        }
      }
      
      // Check the standard endpoint
      const available = await apiClient.isEndpointAvailable('/api/v1/notifications');
      setEndpointStatus(prev => ({ ...prev, notifications: available }));
      return available;
    } catch (error) {
      // Suppress errors and return false
      console.log("[useNotifications] Error checking notifications endpoint: silently handling");
      setEndpointStatus(prev => ({ ...prev, notifications: false }));
      return false;
    }
  }, []);
  
  // Check API availability for preferences endpoint
  const checkPreferencesEndpointAvailability = useCallback(async () => {
    try {
      // In development mode, also check the dev endpoint
      if (IS_DEVELOPMENT) {
        try {
          const currentTenant = localStorage.getItem('knowledge_plane_tenant');
          if (currentTenant) {
            const devEndpoint = `/api/v1/notifications/dev/${currentTenant}/preferences`;
            const devAvailable = await apiClient.isEndpointAvailable(devEndpoint);
            if (devAvailable) {
              console.log("[DEV MODE] Dev notification preferences endpoint is available");
              setEndpointStatus(prev => ({ ...prev, preferences: true }));
              return true;
            }
          }
        } catch (devCheckError) {
          console.log("[DEV MODE] Error checking dev preferences endpoint: silently handling");
        }
      }
      
      // Check the standard endpoint
      const available = await apiClient.isEndpointAvailable('/api/v1/notifications/preferences');
      setEndpointStatus(prev => ({ ...prev, preferences: available }));
      return available;
    } catch (error) {
      // Suppress errors and return false
      console.log("[useNotifications] Error checking preferences endpoint: silently handling");
      setEndpointStatus(prev => ({ ...prev, preferences: false }));
      return false;
    }
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
      if (!isAvailable && !IS_DEVELOPMENT) {
        setApiAvailable(false);
        setNotifications([]);
        setUnreadCount(0);
        setIsLoading(false);
        return { data: [] };
      }
      
      // Check if we're in development mode - use the development endpoint if so
      if (IS_DEVELOPMENT) {
        console.log("[DEV MODE] Using unauthenticated dev endpoint for notifications");
        try {
          // Get the current tenant from local storage
          const currentTenant = localStorage.getItem('knowledge_plane_tenant') || '3fa85f64-5717-4562-b3fc-2c963f66afa6';
          console.log(`[DEV MODE] Using tenant ${currentTenant}`);
          
          // Use the development endpoint that doesn't require authentication
          const devData = await apiClient.getDevNotifications(currentTenant);
          
          // Process response
          if (devData && Array.isArray(devData)) {
            setNotifications(devData);
            setUnreadCount(devData.filter((n: Notification) => !n.read_at).length);
            console.log(`[DEV MODE] Loaded ${devData.length} notifications from dev endpoint`);
          } else {
            setNotifications([]);
            setUnreadCount(0);
            console.log("[DEV MODE] No notifications returned from dev endpoint");
          }
          
          setIsLoading(false);
          return { data: devData || [] };
        } catch (devErr) {
          console.error("[DEV MODE] Failed to fetch from dev endpoint:", devErr);
          console.log("[DEV MODE] Falling back to standard endpoints");
          // Continue to standard endpoint as fallback
        }
      }
      
      // Fetch notifications from API with proper authorization
      try {
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
        return { data: response?.data || [] };
      } catch (fetchError) {
        // Handle 401 errors specifically 
        if (fetchError.status === 401 || (fetchError.message && fetchError.message.includes('401'))) {
          console.log('[Debug] Notifications API returned 401 Unauthorized');
          setEndpointStatus(prev => ({ ...prev, notifications: false }));
          
          // In dev mode, try the dev endpoint as a fallback
          if (IS_DEVELOPMENT) {
            console.log("[DEV MODE] Got 401 from standard endpoint, trying dev endpoint");
            try {
              const currentTenant = localStorage.getItem('knowledge_plane_tenant') || '3fa85f64-5717-4562-b3fc-2c963f66afa6';
              const devData = await apiClient.getDevNotifications(currentTenant);
              
              if (devData && Array.isArray(devData)) {
                setNotifications(devData);
                setUnreadCount(devData.filter((n: Notification) => !n.read_at).length);
                console.log(`[DEV MODE] Successfully loaded ${devData.length} notifications from dev endpoint after 401`);
                setIsLoading(false);
                return { data: devData || [] };
              }
            } catch (devFallbackErr) {
              console.error("[DEV MODE] Dev endpoint fallback failed:", devFallbackErr);
            }
          }
          
          setNotifications([]);
          setUnreadCount(0);
        }
        
        setIsLoading(false);
        return { data: [] };
      }
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
      if (!isAvailable && !IS_DEVELOPMENT) {
        setApiAvailable(false);
        setPreferences(DEFAULT_PREFERENCES);
        return { data: { preferences: DEFAULT_PREFERENCES } };
      }
      
      // Check if we're in development mode - use the development endpoint if so
      if (IS_DEVELOPMENT) {
        console.log("[DEV MODE] Using unauthenticated dev endpoint for notification preferences");
        try {
          // Get the current tenant from local storage
          const currentTenant = localStorage.getItem('knowledge_plane_tenant') || '3fa85f64-5717-4562-b3fc-2c963f66afa6';
          console.log(`[DEV MODE] Using tenant ${currentTenant}`);
          
          // Use the development endpoint that doesn't require authentication
          const devData = await apiClient.getDevNotificationPreferences(currentTenant);
          
          // Process response
          if (devData?.preferences && Array.isArray(devData.preferences)) {
            setPreferences(devData.preferences);
            console.log(`[DEV MODE] Loaded ${devData.preferences.length} notification preferences from dev endpoint`);
            return { data: devData };
          } else if (devData && Array.isArray(devData)) {
            // Handle case where preferences are returned as a direct array
            setPreferences(devData);
            console.log(`[DEV MODE] Loaded ${devData.length} notification preferences from dev endpoint (array format)`);
            return { data: { preferences: devData } };
          } else {
            console.log("[DEV MODE] No preferences returned from dev endpoint, using defaults");
          }
        } catch (devErr) {
          console.error("[DEV MODE] Failed to fetch preferences from dev endpoint:", devErr);
          console.log("[DEV MODE] Falling back to standard endpoints");
          // Continue to standard endpoint as fallback
        }
      }
      
      // Fetch preferences from API with error handling for 401
      let response;
      try {
        response = await apiClient.get<UserNotificationSettings>('/notifications/preferences');
        
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
      } catch (fetchError) {
        // Handle 401 errors specifically
        if (fetchError.status === 401 || (fetchError.message && fetchError.message.includes('401'))) {
          console.log('[Debug] Preferences API returned 401 Unauthorized');
          setEndpointStatus(prev => ({ ...prev, preferences: false }));
          
          // In dev mode, try the dev endpoint as a fallback
          if (IS_DEVELOPMENT) {
            console.log("[DEV MODE] Got 401 from standard endpoint, trying dev endpoint for preferences");
            try {
              const currentTenant = localStorage.getItem('knowledge_plane_tenant') || '3fa85f64-5717-4562-b3fc-2c963f66afa6';
              const devData = await apiClient.getDevNotificationPreferences(currentTenant);
              
              if (devData?.preferences && Array.isArray(devData.preferences)) {
                setPreferences(devData.preferences);
                console.log(`[DEV MODE] Successfully loaded ${devData.preferences.length} preferences from dev endpoint after 401`);
                return { data: devData };
              }
            } catch (devFallbackErr) {
              console.error("[DEV MODE] Dev endpoint fallback failed for preferences:", devFallbackErr);
            }
          }
          
          setPreferences(DEFAULT_PREFERENCES);
        }
        return { data: { preferences: DEFAULT_PREFERENCES } };
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
        // Check if the user is authenticated first
        const authToken = localStorage.getItem('knowledge_plane_token');
        if (!authToken) {
          console.log("[useNotifications] No auth token found, skipping API checks");
          setApiAvailable(false);
          setEndpointStatus({
            notifications: false,
            preferences: false,
            readAll: false,
            dismissAll: false
          });
          return;
        }
        
        // Try isApiAvailable but don't fail if it throws
        let isAvailable = false;
        try {
          isAvailable = await apiClient.isApiAvailable();
        } catch (err) {
          console.log("[useNotifications] Error checking API availability: silently handling");
          isAvailable = false;
        }
        
        setApiAvailable(isAvailable);
        
        // Always try to check endpoint status regardless of general API availability
        // This helps with partial API availability
        try {
          const [notificationsAvailable, preferencesAvailable] = await Promise.allSettled([
            checkNotificationEndpointAvailability(),
            checkPreferencesEndpointAvailability()
          ]);
          
          setEndpointStatus(prev => ({
            ...prev,
            notifications: notificationsAvailable.status === 'fulfilled' ? notificationsAvailable.value : false,
            preferences: preferencesAvailable.status === 'fulfilled' ? preferencesAvailable.value : false
          }));
        } catch (endpointErr) {
          // If we can't check endpoints, set all to false
          setEndpointStatus({
            notifications: false,
            preferences: false,
            readAll: false,
            dismissAll: false
          });
        }
      } catch (err) {
        // Ensure we have a safe default state if anything goes wrong
        setApiAvailable(false);
        setEndpointStatus({
          notifications: false,
          preferences: false,
          readAll: false,
          dismissAll: false
        });
      }
    };
    
    // Add a small delay to ensure auth token is available
    const timer = setTimeout(() => {
      checkApiAvailability();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [checkNotificationEndpointAvailability, checkPreferencesEndpointAvailability]);

  // Initial data loading with error handling
  useEffect(() => {
    const loadData = async () => {
      // First check if we're authenticated
      const authToken = localStorage.getItem('knowledge_plane_token');
      if (!authToken) {
        console.log("[useNotifications] No auth token found, skipping data loading");
        setApiAvailable(false);
        setNotifications([]);
        setUnreadCount(0);
        setPreferences(DEFAULT_PREFERENCES);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Try loading data but suppress any errors that might bubble up
        try {
          // Use Promise.allSettled to try both operations and continue even if one fails
          const results = await Promise.allSettled([
            fetchNotifications().catch(() => ({ data: [] })), // Catch individual operation errors
            fetchPreferences().catch(() => ({ data: { preferences: DEFAULT_PREFERENCES } })) // Catch individual operation errors
          ]);
          
          // Check results to determine if API is available
          const allRejected = results.every(result => result.status === 'rejected');
          if (allRejected) {
            console.log("[useNotifications] All data loading operations failed");
            setApiAvailable(false);
          }
        } catch (innerError) {
          console.log("[useNotifications] Error loading notification data: silently handling");
          // Do nothing - we've already set default values
        }
      } catch (error) {
        // Set up safe defaults
        setApiAvailable(false);
        setNotifications([]);
        setUnreadCount(0);
        setPreferences(DEFAULT_PREFERENCES);
        console.log("[useNotifications] Critical error in loadData: using defaults");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Add delay to ensure auth token is set
    const timer = setTimeout(() => {
      // Only try to load data if we think endpoints are available
      if (endpointStatus.notifications || endpointStatus.preferences) {
        loadData();
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [fetchNotifications, fetchPreferences, endpointStatus.notifications, endpointStatus.preferences]);

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