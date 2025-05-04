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

// Mock data generator for development - used as fallback if pattern detection fails
const generateMockInsights = (count: number, timePeriod: string): Insight[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `insight-${i}`,
    title: getRandomTitle(timePeriod),
    description: getRandomDescription(timePeriod),
    category: getRandomCategory(),
    createdAt: getRandomDate(timePeriod),
    relevanceScore: Math.random() * 0.5 + 0.5, // Score between 0.5 and 1.0
    source: {
      type: getRandomSourceType(),
      id: `source-${Math.floor(Math.random() * 100)}`
    },
    relatedEntities: generateRandomEntities(1 + Math.floor(Math.random() * 3)),
    suggestedActions: generateRandomActions(1 + Math.floor(Math.random() * 2))
  }));
};

// Helper functions for generating mock data
const getRandomTitle = (timePeriod: string): string => {
  const titles = [
    'Frequent collaboration pattern detected',
    'Knowledge gap identified in project team',
    'Communication cluster forming between teams',
    'Potential project bottleneck detected',
    'Meeting pattern may impact productivity',
    'Untapped expertise identified in your network',
    'Cross-team collaboration opportunity',
    'Resource allocation might need adjustment',
    'Successful pattern from previous projects detected'
  ];
  
  const randomTitle = titles[Math.floor(Math.random() * titles.length)];
  return randomTitle;
};

const getRandomDescription = (timePeriod: string): string => {
  const descriptions = [
    'You\'ve been collaborating frequently with Team Alpha on documentation. Consider formalizing knowledge sharing sessions.',
    'Your project team might be missing critical expertise in cloud infrastructure that could be needed for upcoming milestones.',
    'There\'s an emerging communication cluster between Marketing and Design teams that you\'re connected to. This could be leveraged for better cross-functional work.',
    'Based on activity patterns, the current sprint might be at risk of delays due to dependency bottlenecks.',
    'Your meeting patterns have changed recently, with 30% more time spent in cross-team meetings than last month.',
    'There\'s untapped UX design expertise in your extended network that could benefit your current project.',
    'We\'ve detected a potential opportunity to collaborate with Team Beta based on overlapping project goals.',
    'Resource allocation on Project X shows potential imbalance, with 70% of tasks assigned to 30% of team members.',
    'Your most successful previous projects had similar communication patterns to what we\'re seeing in your current work.'
  ];
  
  const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
  return randomDescription;
};

const getRandomCategory = (): InsightCategory => {
  const categories = [
    InsightCategory.COLLABORATION,
    InsightCategory.KNOWLEDGE,
    InsightCategory.PRODUCTIVITY,
    InsightCategory.PROJECT,
    InsightCategory.COMMUNICATION
  ];
  
  return categories[Math.floor(Math.random() * categories.length)];
};

const getRandomSourceType = (): InsightSourceType => {
  const sourceTypes = [
    InsightSourceType.ACTIVITY,
    InsightSourceType.PROJECT,
    InsightSourceType.TEAM,
    InsightSourceType.USER,
    InsightSourceType.DOCUMENT,
    InsightSourceType.SYSTEM
  ];
  
  return sourceTypes[Math.floor(Math.random() * sourceTypes.length)];
};

const getRandomDate = (timePeriod: string): string => {
  const now = new Date();
  let daysAgo;
  
  switch (timePeriod) {
    case 'daily': daysAgo = Math.random() * 1; break;
    case 'weekly': daysAgo = Math.random() * 7; break;
    case 'monthly': daysAgo = Math.random() * 30; break;
    default: daysAgo = Math.random() * 7;
  }
  
  return new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000)).toISOString();
};

const generateRandomEntities = (count: number) => {
  const entityTypes = ['user', 'team', 'project', 'document'];
  const connectionTypes = [
    'frequent collaborator', 
    'team member',
    'project dependency',
    'knowledge source',
    'related work'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `entity-${Math.floor(Math.random() * 100)}`,
    type: entityTypes[Math.floor(Math.random() * entityTypes.length)],
    name: `Entity ${Math.floor(Math.random() * 20) + 1}`,
    connection: connectionTypes[Math.floor(Math.random() * connectionTypes.length)]
  }));
};

const generateRandomActions = (count: number) => {
  const actionTypes = ['schedule', 'message', 'task', 'view', 'other'];
  const actionLabels = [
    'Schedule a meeting',
    'Send a message',
    'Create a task',
    'View details',
    'Share with team',
    'Add to favorites',
    'Set reminder'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    label: actionLabels[Math.floor(Math.random() * actionLabels.length)],
    type: actionTypes[Math.floor(Math.random() * actionTypes.length)],
    icon: 'default-icon'
  }));
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
    const activities = await fetchUserActivities(userId, timePeriod);
    
    // 2. Detect patterns based on the activities
    const patternTypes: PatternType[] = [
      'frequent-collaboration',
      'knowledge-gap',
      'project-risk',
      'productivity-trend'
      // Add more patterns as implemented
    ];
    
    // Additional context data could be passed here (user profile, team info, etc.)
    const contextData = {
      userId,
      timePeriod
    };
    
    const insights = await detectPatterns(activities, contextData, patternTypes);
    
    // 3. If we got enough insights from pattern detection, return them
    if (insights.length >= 3) {
      // Sort by relevance score
      return insights.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    
    // 4. If we got some insights but not enough, supplement with mock insights
    if (insights.length > 0) {
      // Generate some additional mock insights
      const additionalCount = 5 - insights.length;
      const mockInsights = generateMockInsights(additionalCount, timePeriod);
      
      // Combine real and mock insights, then sort by relevance
      return [...insights, ...mockInsights].sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    
    // 5. Fallback: If pattern detection returned no insights, use mock data
    const count = timePeriod === 'daily' ? 5 : timePeriod === 'weekly' ? 10 : 15;
    return generateMockInsights(count, timePeriod);
  } catch (error) {
    console.error('Error generating insights:', error);
    
    // If anything fails, fall back to mock insights
    const count = timePeriod === 'daily' ? 5 : timePeriod === 'weekly' ? 8 : 12;
    return generateMockInsights(count, timePeriod);
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