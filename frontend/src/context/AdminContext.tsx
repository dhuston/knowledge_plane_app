import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  // State for the active admin view
  const [activeView, setActiveView] = useState<string>(AdminViews.DASHBOARD);
  
  // State for data refreshing
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // State for breadcrumb navigation
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ label: string; path?: string }>>([
    { label: 'Admin Console' },
    { label: 'Dashboard' }
  ]);
  
  // Function to refresh admin data
  const refreshData = async () => {
    setIsRefreshing(true);
    
    try {
      // Here we would implement actual data refresh logic
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing admin data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Create the context value object
  const value: AdminContextValue = {
    activeView,
    setActiveView,
    isRefreshing,
    refreshData,
    breadcrumbs,
    setBreadcrumbs
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