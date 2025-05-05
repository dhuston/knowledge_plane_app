/**
 * Feature flag system to enable/disable features in the UI
 * Now supports loading from backend when available, with localStorage as fallback
 */
import { useState, useEffect } from 'react';
import axios from 'axios';

export interface FeatureFlags {
  enableDeltaStream: boolean;
  enableIntegrations: boolean;
  enableAnalytics: boolean;
  enableSuggestions: boolean;
  enableActivityTimeline: boolean;
  enableTeamClustering: boolean;
  enableHierarchyNavigator: boolean;
}

// Define feature flag item structure from backend
interface FeatureFlagItem {
  key: string;
  enabled: boolean;
  description: string;
  category: string;
}

// Default flags - used as fallback when backend is unavailable
const defaultFlags: FeatureFlags = {
  enableDeltaStream: true,
  enableIntegrations: true,
  enableAnalytics: true,
  enableSuggestions: true,
  enableActivityTimeline: true,
  enableTeamClustering: true,
  enableHierarchyNavigator: true // Enable the new Organizational Hierarchy Navigator by default
};

// API Base URL for axios calls
// Using format consistent with the project structure
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

/**
 * Load feature flags from backend API
 * Returns null if API call fails
 */
const loadFromBackend = async (): Promise<FeatureFlags | null> => {
  try {
    try {
      // First try the authenticated admin endpoint
      let response;
      let source = 'admin';
      
      try {
        // Try using the standard API client first for the admin endpoint
        const { apiClient } = await import('../api/client');
        // Make sure we're using the correct path format
        response = await apiClient.get('/api/v1/admin/feature-flags');
      } catch (adminEndpointError) {
        // If admin endpoint fails with 401/403/500, try the public endpoint
        try {
          // Try the public endpoint that doesn't require authentication
          const publicResponse = await axios.get(`${API_BASE_URL}/api/v1/debug/public-feature-flags`);
          
          // Extract the flags from the response
          if (publicResponse.data && publicResponse.data.flags) {
            response = publicResponse.data.flags;
            source = 'public';
          } else {
            throw new Error('Invalid response format from public endpoint');
          }
        } catch (publicEndpointError) {
          // If public endpoint also fails, try the debug status endpoint for diagnostic info
          try {
            const statusResponse = await axios.get(`${API_BASE_URL}/api/v1/debug/feature-flags-status`);
          } catch (statusError) {
          }
          
          // Rethrow the original error since we're just collecting debug info here
          throw adminEndpointError;
        }
      }
      
      // Check if we have valid response data
      if (!response) {
        throw new Error('No response data from feature flags API');
      }
      
      // Process response based on source
      let flags: Partial<FeatureFlags> = {};
      
      if (source === 'admin') {
        // Admin endpoint returns objects with enabled property
        const backendFlags: Record<string, FeatureFlagItem> = response;
        Object.entries(backendFlags).forEach(([key, value]) => {
          if (key in defaultFlags) {
            flags[key as keyof FeatureFlags] = value.enabled;
          }
        });
      } else {
        // Public endpoint returns direct boolean values
        const simpleFlags: Record<string, boolean> = response;
        Object.entries(simpleFlags).forEach(([key, value]) => {
          if (key in defaultFlags) {
            flags[key as keyof FeatureFlags] = value;
          }
        });
      }
      
      return { ...defaultFlags, ...flags };
    } catch (error: any) {
      // Log an error but don't include detailed debug info
      console.error('Feature flags API unavailable');
      return null;
    }
  } catch (error) {
    console.error('Unexpected error in loadFromBackend');
    return null;
  }
};

/**
 * Load feature flags from localStorage or use defaults
 */
const loadFromLocalStorage = (): FeatureFlags => {
  try {
    const savedFlags = localStorage.getItem('featureFlags');
    if (savedFlags) {
      return { ...defaultFlags, ...JSON.parse(savedFlags) };
    }
  } catch (error) {
    console.error('Error loading feature flags from localStorage:', error);
  }
  return defaultFlags;
};

/**
 * Save feature flags to localStorage
 */
export const saveFeatureFlags = (flags: FeatureFlags): void => {
  localStorage.setItem('featureFlags', JSON.stringify(flags));
};

/**
 * Save a single feature flag to backend
 */
export const saveFeatureFlagToBackend = async (feature: keyof FeatureFlags, enabled: boolean): Promise<boolean> => {
  try {
    try {
      let success = false;
      
      try {
        // First try using our standard apiClient 
        const { apiClient } = await import('../api/client');
        
        // Ensure we're using the correct API path
        await apiClient.put(`/api/v1/admin/feature-flags/${feature}`, { enabled });
        success = true;
        
        // Try to update the debug status endpoint to verify the update
        try {
          const statusResponse = await axios.get(`${API_BASE_URL}/api/v1/debug/feature-flags-status`);
        } catch (statusError) {
          // This is just for debugging, so don't throw if it fails
        }
      } catch (apiClientError) {
        // Check for specific error types
        if (apiClientError.response) {
          const status = apiClientError.response.status;
          
          if (status === 401 || status === 403) {
            // No fallback for auth errors - the user needs to be logged in
            throw new Error('Authentication required to update feature flags');
          }
        }
        
        // Fall back to direct axios call if apiClient fails
        
        // For direct axios call, we need the full path with /api/v1
        const url = `${API_BASE_URL}/api/v1/admin/feature-flags/${feature}`;
        
        // Add auth token to the request
        const token = localStorage.getItem('knowledge_plane_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await axios.put(
          url,
          { enabled },
          { 
            withCredentials: true,
            headers 
          }
        );
        
        success = true;
      }
      
      return success;
    } catch (error: any) {
      // Just log a simpler error message
      if (error.response) {
        const status = error.response.status;
        console.error(`Error saving feature flag: ${status}`);
      } else {
        console.error(`Error saving feature flag to backend`);
      }
      
      return false;
    }
  } catch (error) {
    console.error(`Error saving feature flag ${feature} to backend:`, error);
    return false;
  }
};

// Initial load from localStorage as default
export const featureFlags: FeatureFlags = loadFromLocalStorage();

/**
 * Hook for components to use feature flags
 * Tries to load from backend first, falls back to localStorage
 * 
 * @returns Object with flags, toggle function, and loading state
 */
export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlags>(featureFlags);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasLoadedFromBackend, setHasLoadedFromBackend] = useState<boolean>(false);

  // Load flags from backend on component mount
  useEffect(() => {
    const fetchFlags = async () => {
      setIsLoading(true);
      
      try {
        const backendFlags = await loadFromBackend();
        
        if (backendFlags) {
          // Successfully loaded from backend
          setFlags(backendFlags);
          saveFeatureFlags(backendFlags); // Update localStorage with backend values
          setHasLoadedFromBackend(true);
        } else {
          // Failed to load from backend, use localStorage
          const localFlags = loadFromLocalStorage();
          setFlags(localFlags);
          
          // Only log failure message once to reduce noise
          const hasShownMessage = sessionStorage.getItem('feature_flags_logged');
          if (!hasShownMessage) {
            console.log('Feature flags API endpoint not available - some admin features may be limited');
            sessionStorage.setItem('feature_flags_logged', 'true');
          }
        }
      } catch (error) {
        console.error('useFeatureFlags: Unexpected error');
        setFlags(loadFromLocalStorage());
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFlags();
  }, []);

  // Function to toggle a feature flag
  const toggleFeature = async (feature: keyof FeatureFlags) => {
    const newValue = !flags[feature];
    const updatedFlags = { ...flags, [feature]: newValue };
    
    // Update local state immediately for responsive UI
    setFlags(updatedFlags);
    
    // Try to update backend first
    const backendSuccess = await saveFeatureFlagToBackend(feature, newValue);
    
    // Always update localStorage as fallback
    saveFeatureFlags(updatedFlags);
    
    if (!backendSuccess && hasLoadedFromBackend) {
      console.warn(`Feature flag ${feature} updated in localStorage but failed to update in backend`);
    }
  };

  return { flags, toggleFeature, isLoading };
};