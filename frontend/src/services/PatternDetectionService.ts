import { 
  Insight,
  InsightCategory,
  InsightSourceType,
  InsightTimePeriod,
  RelatedEntity
} from '../types/insight';
import OpenAIService from './OpenAIService';
import { apiClient } from '../api/client';

/**
 * Types related to user activities that will be analyzed for patterns
 */
export interface ActivityData {
  id: string;
  type: string; // e.g., 'document-edit', 'meeting', 'collaboration', etc.
  timestamp: string; // ISO date string
  user: {
    id: string;
    name: string;
  };
  details: Record<string, any>; // Activity-specific details
}

/**
 * Types of patterns that can be detected
 */
export type PatternType = 
  | 'frequent-collaboration' 
  | 'knowledge-gap' 
  | 'project-risk' 
  | 'productivity-trend'
  | 'unused-skill'
  | 'meeting-pattern'
  | 'communication-cluster';

/**
 * Interface for pattern detectors
 */
interface PatternDetector {
  type: PatternType;
  detect: (activities: ActivityData[], contextData?: any) => Promise<Insight[]>;
  relevanceThreshold: number;
  description: string;
}

/**
 * Factory function to create pattern detectors
 */
export const createPatternDetector = (type: PatternType): PatternDetector => {
  switch (type) {
    case 'frequent-collaboration':
      return {
        type,
        relevanceThreshold: 0.7,
        description: 'Detects patterns in collaboration frequency with other team members',
        detect: async (activities) => {
          // Real implementation should analyze collaboration patterns
          // For now, we'll rely on the OpenAI service for real insights
          return [];
        }
      };
    
    case 'knowledge-gap':
      return {
        type,
        relevanceThreshold: 0.6,
        description: 'Identifies gaps in team knowledge compared to project requirements',
        detect: async (activities, contextData) => {
          // Real implementation should analyze skills vs. project requirements
          // For now, we'll rely on the OpenAI service for real insights
          return [];
        }
      };
      
    case 'project-risk':
      return {
        type,
        relevanceThreshold: 0.75,
        description: 'Identifies potential risks in project execution based on activity patterns',
        detect: async (activities) => {
          // Real implementation should analyze project activities for risk patterns
          // For now, we'll rely on the OpenAI service for real insights
          return [];
        }
      };
      
    case 'productivity-trend':
      return {
        type,
        relevanceThreshold: 0.65,
        description: 'Analyzes productivity trends over time',
        detect: async (activities) => {
          // Real implementation should analyze work patterns and productivity metrics
          // For now, we'll rely on the OpenAI service for real insights
          return [];
        }
      };
    
    // More pattern detectors can be added here
      
    default:
      throw new Error(`Unknown pattern type: ${type}`);
  }
};

/**
 * Main service to detect patterns in user activities
 */
export const detectPatterns = async (
  activities: ActivityData[],
  contextData?: any,
  patternTypes: PatternType[] = [
    'frequent-collaboration', 
    'knowledge-gap',
    'project-risk',
    'productivity-trend'
  ]
): Promise<Insight[]> => {
  try {
    // Use the OpenAI service for pattern detection - no mock fallbacks
    if (OpenAIService.isAvailable()) {
      try {
        console.log('Using OpenAI for pattern detection');
        const openAiInsights = await OpenAIService.generateInsights(activities, contextData);
        
        if (openAiInsights && openAiInsights.length > 0) {
          console.log(`Generated ${openAiInsights.length} insights using OpenAI`);
          return openAiInsights;
        }
      } catch (openAiError) {
        console.error('Error using OpenAI for pattern detection:', openAiError);
      }
    }
    
    console.log('No insights generated - OpenAI service unavailable or returned no results');
    return [];
  } catch (error) {
    console.error('Error detecting patterns:', error);
    return [];
  }
};

/**
 * Function to fetch user activities from API
 */
export const fetchUserActivities = async (
  userId: string,
  timePeriod: InsightTimePeriod
): Promise<ActivityData[]> => {
  try {
    console.log(`[Debug] Starting fetchUserActivities for user: ${userId}, period: ${timePeriod}`);
    
    // Define the endpoint with full path
    const endpoint = `/api/v1/insights/activities`;
    console.log(`[Debug] Checking if endpoint ${endpoint} exists`);
    
    // First check if the endpoint actually exists before trying to call it
    const endpointExists = await apiClient.isEndpointAvailable(endpoint);
    
    if (!endpointExists) {
      console.log(`[Debug] Endpoint ${endpoint} is not available`);
      return []; // Return empty array if endpoint doesn't exist
    }
    
    // If endpoint exists, make the actual API call
    console.log(`[Debug] Endpoint exists, making API call to ${endpoint}`);
    try {
      const data = await apiClient.get<ActivityData[]>(`${endpoint}?userId=${userId}&period=${timePeriod}`);
      console.log(`[Debug] Received ${data.length || 0} activities from API`);
      return data;
    } catch (apiError) {
      // Handle API error gracefully
      console.error(`[Debug] Error while calling API: `, apiError);
      return [];
    }
  } catch (error) {
    console.error('[Debug] Error in fetchUserActivities:', error);
    // Return an empty array
    console.log('[Debug] Returning empty activities array');
    return [];
  }
};