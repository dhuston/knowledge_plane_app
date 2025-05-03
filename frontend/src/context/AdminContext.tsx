import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useApiClient } from '../hooks/useApiClient';

// Define the shape of the Admin Context
export interface AdminContextValue {
  // Current active view in the admin console
  activeView: string;
  setActiveView: (view: string) => void;
  
  // Refreshing data state
  isRefreshing: boolean;
  refreshData: () => Promise<void>;
  
  // Breadcrumb state
  breadcrumbs: Array<{ label: string; path?: string }>;
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; path?: string }>) => void;
  
  // Admin statistics
  adminStats: AdminStats | null;
  loadStats: () => Promise<void>;
  
  // Feature flags
  featureFlags: Record<string, FeatureFlag> | null;
  loadFeatureFlags: () => Promise<void>;
  updateFeatureFlag: (key: string, enabled: boolean) => Promise<void>;
}

// Admin statistics shape
export interface AdminStats {
  users: number;
  teams: number;
  projects: number;
  integrations: number;
}

// Feature flag shape
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string;
  category: string;
}

// Create the context with undefined as initial value
const AdminContext = createContext<AdminContextValue | undefined>(undefined);

// Available admin views
export const AdminViews = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  TEAMS: 'teams', 
  FEATURES: 'features',
  INTEGRATIONS: 'integrations',
  TENANTS: 'tenants',
  SETTINGS: 'settings',
  LOGS: 'logs'
};

// Provider component
export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // API client instance
  const apiClient = useApiClient();
  
  // State for the active admin view
  const [activeView, setActiveView] = useState<string>(AdminViews.DASHBOARD);
  
  // State for data refreshing
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // State for breadcrumb navigation
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ label: string; path?: string }>>([
    { label: 'Admin Console' },
    { label: 'Dashboard' }
  ]);
  
  // State for admin statistics
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  
  // State for feature flags
  const [featureFlags, setFeatureFlags] = useState<Record<string, FeatureFlag> | null>(null);
  
  // Function to load admin statistics
  const loadStats = useCallback(async (): Promise<void> => {
    try {
      const response = await apiClient.get('/api/v1/admin/stats/summary');
      setAdminStats(response.data);
    } catch (error) {
      console.error('Error loading admin statistics:', error);
    }
  }, [apiClient]);
  
  // Function to load feature flags
  const loadFeatureFlags = useCallback(async (): Promise<void> => {
    try {
      const response = await apiClient.get('/api/v1/admin/feature-flags');
      setFeatureFlags(response.data);
    } catch (error) {
      console.error('Error loading feature flags:', error);
    }
  }, [apiClient]);
  
  // Function to update a feature flag
  const updateFeatureFlag = useCallback(async (key: string, enabled: boolean): Promise<void> => {
    try {
      await apiClient.put(`/api/v1/admin/feature-flags/${key}`, { enabled });
      // Refresh the feature flags after update
      await loadFeatureFlags();
    } catch (error) {
      console.error(`Error updating feature flag ${key}:`, error);
      throw error;
    }
  }, [apiClient, loadFeatureFlags]);
  
  // Function to refresh admin data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Load data based on active view
      switch (activeView) {
        case AdminViews.DASHBOARD:
          await loadStats();
          break;
        case AdminViews.FEATURES:
          await loadFeatureFlags();
          break;
        default:
          // For other views, load basic stats
          await loadStats();
      }
    } catch (error) {
      console.error('Error refreshing admin data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeView, loadStats, loadFeatureFlags]);
  
  // Initial data loading
  useEffect(() => {
    const initialLoad = async () => {
      await loadStats();
      await loadFeatureFlags();
    };
    
    initialLoad();
  }, [loadStats, loadFeatureFlags]);
  
  // Create the context value object
  const value: AdminContextValue = {
    activeView,
    setActiveView,
    isRefreshing,
    refreshData,
    breadcrumbs,
    setBreadcrumbs,
    adminStats,
    loadStats,
    featureFlags,
    loadFeatureFlags,
    updateFeatureFlag
  };
  
  // Return the Provider with the value
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

// Hook for using admin context
export const useAdmin = (): AdminContextValue => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};