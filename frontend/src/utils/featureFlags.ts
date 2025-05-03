/**
 * Feature flag system to enable/disable features in the UI
 */
import { useState, useEffect } from 'react';

export interface FeatureFlags {
  enableDeltaStream: boolean;
  enableIntegrations: boolean;
  enableAnalytics: boolean;
  enableSuggestions: boolean;
  enableActivityTimeline: boolean;
  enableTeamClustering: boolean;
  enableHierarchyNavigator: boolean;
}

// Default flags - could be loaded from backend or localStorage
const defaultFlags: FeatureFlags = {
  enableDeltaStream: true,
  enableIntegrations: true,
  enableAnalytics: true,
  enableSuggestions: true,
  enableActivityTimeline: true,
  enableTeamClustering: true,
  enableHierarchyNavigator: true // Enable the new Organizational Hierarchy Navigator by default
};

/**
 * Load feature flags from localStorage or use defaults
 */
const loadFeatureFlags = (): FeatureFlags => {
  try {
    const savedFlags = localStorage.getItem('featureFlags');
    if (savedFlags) {
      return { ...defaultFlags, ...JSON.parse(savedFlags) };
    }
  } catch (error) {
    console.error('Error loading feature flags:', error);
  }
  return defaultFlags;
};

/**
 * Save feature flags to localStorage
 */
export const saveFeatureFlags = (flags: FeatureFlags): void => {
  localStorage.setItem('featureFlags', JSON.stringify(flags));
};

// Export current flags
export const featureFlags: FeatureFlags = loadFeatureFlags();

/**
 * Hook for components to use feature flags
 * 
 * @returns Object with flags and toggle function
 */
export const useFeatureFlags = () => {
  const [flags, setFlags] = useState<FeatureFlags>(featureFlags);

  // Function to toggle a feature flag
  const toggleFeature = (feature: keyof FeatureFlags) => {
    const updatedFlags = { 
      ...flags, 
      [feature]: !flags[feature] 
    };
    setFlags(updatedFlags);
    saveFeatureFlags(updatedFlags);
  };

  return { flags, toggleFeature };
};