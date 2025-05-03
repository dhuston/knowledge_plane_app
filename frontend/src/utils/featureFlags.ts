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

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

/**
 * Load feature flags from backend API
 * Returns null if API call fails
 */
const loadFromBackend = async (): Promise<FeatureFlags | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/feature-flags`, {
      withCredentials: true,
    });
    
    // Convert backend format to local format
    const backendFlags: Record<string, FeatureFlagItem> = response.data;
    const flags: Partial<FeatureFlags> = {};
    
    // Map each key to our flags object
    Object.entries(backendFlags).forEach(([key, value]) => {
      if (key in defaultFlags) {
        flags[key as keyof FeatureFlags] = value.enabled;
      }
    });
    
    return { ...defaultFlags, ...flags };
  } catch (error) {
    console.error('Error loading feature flags from backend:', error);
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
    await axios.put(
      `${API_BASE_URL}/admin/feature-flags/${feature}`,
      { enabled },
      { withCredentials: true }
    );
    return true;
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
      const backendFlags = await loadFromBackend();
      
      if (backendFlags) {
        // Successfully loaded from backend
        setFlags(backendFlags);
        saveFeatureFlags(backendFlags); // Update localStorage with backend values
        setHasLoadedFromBackend(true);
      } else {
        // Failed to load from backend, use localStorage
        setFlags(loadFromLocalStorage());
      }
      
      setIsLoading(false);
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