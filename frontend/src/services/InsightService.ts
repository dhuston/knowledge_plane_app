import { 
  Insight, 
  InsightCategory,
  InsightSourceType,
  InsightTimePeriod,
  InsightFeedback
} from '../types/insight';
import { 
  detectPatterns, 
  fetchUserActivities, 
  PatternType 
} from './PatternDetectionService';

// Create a system notice about AI service availability
const createAIServiceNotice = (timePeriod: InsightTimePeriod): Insight => {
  return {
    id: `ai-service-notice-${Date.now()}`,
    title: 'AI Insights Service Configuration Required',
    description: 'To enable AI-powered insights, please configure the BMS Azure OpenAI integration. Refer to the documentation at /docs/BMS_AZURE_OPENAI_INTEGRATION.md for setup instructions.',
    category: InsightCategory.SYSTEM,
    createdAt: new Date().toISOString(),
    relevanceScore: 1.0,
    source: {
      type: InsightSourceType.SYSTEM,
      id: 'system-notice'
    },
    relatedEntities: [],
    suggestedActions: [{
      label: 'View Documentation',
      type: 'view'
    }]
  };
};

/**
 * Fetches insights based on the specified time period
 */
export const fetchInsights = async (
  timePeriod: InsightTimePeriod,
  userId: string = 'current-user' // In a real app, would get from auth context
): Promise<Insight[]> => {
  try {
    // Use pattern detection service to generate insights
    
    // 1. Fetch user activities
    console.log(`Fetching user activities for user: ${userId}, period: ${timePeriod}`);
    const activities = await fetchUserActivities(userId, timePeriod);
    
    if (activities.length === 0) {
      console.log('No activities found, returning service notice');
      return [createAIServiceNotice(timePeriod)];
    }
    
    // 2. Detect patterns based on the activities
    console.log(`Detecting patterns from ${activities.length} activities`);
    const patternTypes: PatternType[] = [
      'frequent-collaboration',
      'knowledge-gap',
      'project-risk',
      'productivity-trend'
    ];
    
    // Additional context data could be passed here (user profile, team info, etc.)
    const contextData = {
      userId,
      timePeriod
    };
    
    const insights = await detectPatterns(activities, contextData, patternTypes);
    
    // If we got insights, sort and return them
    if (insights.length > 0) {
      console.log(`Returning ${insights.length} insights from pattern detection`);
      return insights.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    
    // If pattern detection returned no insights, return a service notice
    console.log('No insights from pattern detection, returning service notice');
    return [createAIServiceNotice(timePeriod)];
  } catch (error) {
    console.error('Error generating insights:', error);
    
    // If anything fails, return a service notice instead of mock insights
    return [{
      id: `ai-service-error-${Date.now()}`,
      title: 'AI Service Status',
      description: 'The AI insights service encountered an error. Please check your integration configuration or try again later.',
      category: InsightCategory.SYSTEM,
      createdAt: new Date().toISOString(),
      relevanceScore: 1.0,
      source: {
        type: InsightSourceType.SYSTEM,
        id: 'system-error'
      },
      relatedEntities: [],
      suggestedActions: []
    }];
  }
};

/**
 * Saves an insight for the user
 */
export const saveInsight = async (insightId: string): Promise<boolean> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

/**
 * Dismisses an insight for the user
 */
export const dismissInsight = async (insightId: string): Promise<boolean> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

/**
 * Submits user feedback about an insight's relevance
 */
export const submitInsightFeedback = async (feedback: InsightFeedback): Promise<boolean> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};