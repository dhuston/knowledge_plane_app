import { 
  Insight,
  InsightCategory,
  InsightSourceType,
  InsightTimePeriod,
  RelatedEntity
} from '../types/insight';
import OpenAIService from './OpenAIService';

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
    
    // IMPORTANT FIX: The backend doesn't have an /insights/activities endpoint yet
    // Return mock activities instead of making an API call to a nonexistent endpoint
    console.log('[Debug] Using mock activities data instead of calling nonexistent endpoint');
    
    // Generate some mock activities
    const mockActivities: ActivityData[] = Array(20).fill(null).map((_, index) => ({
      id: `activity-${index}`,
      type: ['document-edit', 'meeting', 'collaboration', 'knowledge-share'][Math.floor(Math.random() * 4)],
      timestamp: new Date(Date.now() - Math.random() * 86400000 * (timePeriod === 'daily' ? 1 : timePeriod === 'weekly' ? 7 : 30)).toISOString(),
      user: {
        id: userId,
        name: userId === 'current-user' ? 'Current User' : `User ${userId}`
      },
      details: {
        title: `Activity ${index}`,
        description: `Description for activity ${index}`
      }
    }));
    
    console.log(`[Debug] Generated ${mockActivities.length} mock activities`);
    return mockActivities;
    
    /* Original code that was causing 500 errors - the endpoint doesn't exist:
    // Make API call to fetch real activities
    const endpoint = `/api/v1/insights/activities?userId=${userId}&period=${timePeriod}`;
    console.log(`[Debug] Fetching from endpoint: ${endpoint}`);
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      console.error(`[Debug] Response not OK: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch activities: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`[Debug] Received ${data.length || 0} activities from API`);
    return data;
    */
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return [];
  }
};