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
          // Implementation would analyze collaboration patterns
          const collaborators = new Map<string, {
            id: string;
            name: string;
            count: number;
            lastActivity: string;
          }>();
          
          // Count collaborations by person
          activities
            .filter(a => a.type === 'collaboration')
            .forEach(a => {
              if (a.details.collaboratorId) {
                const existing = collaborators.get(a.details.collaboratorId);
                if (existing) {
                  collaborators.set(a.details.collaboratorId, {
                    ...existing,
                    count: existing.count + 1,
                    lastActivity: a.timestamp > existing.lastActivity ? a.timestamp : existing.lastActivity
                  });
                } else {
                  collaborators.set(a.details.collaboratorId, {
                    id: a.details.collaboratorId,
                    name: a.details.collaboratorName || 'Team Member',
                    count: 1,
                    lastActivity: a.timestamp
                  });
                }
              }
            });
          
          // Find frequent collaborators (more than 3 interactions)
          const frequentCollaborators = Array.from(collaborators.values())
            .filter(c => c.count > 3)
            .sort((a, b) => b.count - a.count);
          
          // Generate insights for frequent collaborators
          return frequentCollaborators.map(collaborator => ({
            id: `collab-${collaborator.id}`,
            title: `Frequent collaboration with ${collaborator.name}`,
            description: `You've collaborated with ${collaborator.name} ${collaborator.count} times recently. Consider formalizing this working relationship or creating shared resources.`,
            category: InsightCategory.COLLABORATION,
            createdAt: new Date().toISOString(),
            relevanceScore: Math.min(0.5 + (collaborator.count / 10), 1),
            source: {
              type: InsightSourceType.ACTIVITY,
              id: collaborator.id
            },
            relatedEntities: [
              {
                id: collaborator.id,
                type: 'user',
                name: collaborator.name,
                connection: 'frequent collaborator'
              }
            ],
            suggestedActions: [
              {
                label: 'Schedule regular sync',
                type: 'schedule'
              },
              {
                label: 'Create shared document',
                type: 'task'
              }
            ]
          }));
        }
      };
    
    case 'knowledge-gap':
      return {
        type,
        relevanceThreshold: 0.6,
        description: 'Identifies gaps in team knowledge compared to project requirements',
        detect: async (activities, contextData) => {
          // Implementation would analyze skills vs. project requirements
          // This is a simplified mock implementation
          return [{
            id: `kg-1-${new Date().getTime()}`,
            title: 'Knowledge gap in cloud infrastructure',
            description: 'Your team appears to be missing expertise in cloud infrastructure that may be needed for upcoming project milestones.',
            category: InsightCategory.KNOWLEDGE,
            createdAt: new Date().toISOString(),
            relevanceScore: 0.85,
            source: {
              type: InsightSourceType.PROJECT,
              id: 'project-123'
            },
            relatedEntities: [
              {
                id: 'skill-cloud-infra',
                type: 'skill',
                name: 'Cloud Infrastructure',
                connection: 'missing skill'
              },
              {
                id: 'project-123',
                type: 'project',
                name: 'Project Alpha',
                connection: 'affected project'
              }
            ],
            suggestedActions: [
              {
                label: 'Find team member with expertise',
                type: 'task'
              },
              {
                label: 'Schedule training',
                type: 'schedule'
              }
            ]
          }];
        }
      };
      
    case 'project-risk':
      return {
        type,
        relevanceThreshold: 0.75,
        description: 'Identifies potential risks in project execution based on activity patterns',
        detect: async (activities) => {
          // Implementation would analyze project activities for risk patterns
          // This is a simplified mock implementation
          const projectActivities = activities.filter(a => 
            a.details.projectId && 
            (a.type === 'task-update' || a.type === 'document-edit')
          );
          
          // Group by project
          const projectGroups = new Map<string, {
            id: string;
            name: string;
            activities: ActivityData[];
          }>();
          
          projectActivities.forEach(a => {
            const projectId = a.details.projectId;
            const existing = projectGroups.get(projectId);
            
            if (existing) {
              existing.activities.push(a);
            } else {
              projectGroups.set(projectId, {
                id: projectId,
                name: a.details.projectName || `Project ${projectId}`,
                activities: [a]
              });
            }
          });
          
          // Look for risk patterns
          const riskInsights: Insight[] = [];
          projectGroups.forEach(project => {
            // Example risk pattern: Low recent activity on a project
            const recentActivities = project.activities.filter(a => {
              const activityDate = new Date(a.timestamp);
              const twoWeeksAgo = new Date();
              twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
              return activityDate > twoWeeksAgo;
            });
            
            if (project.activities.length > 5 && recentActivities.length < 2) {
              riskInsights.push({
                id: `risk-${project.id}`,
                title: `Low activity detected on ${project.name}`,
                description: `There has been minimal activity on ${project.name} in the past two weeks, which could indicate a bottleneck or stalled progress.`,
                category: InsightCategory.PROJECT,
                createdAt: new Date().toISOString(),
                relevanceScore: 0.85,
                source: {
                  type: InsightSourceType.PROJECT,
                  id: project.id
                },
                relatedEntities: [
                  {
                    id: project.id,
                    type: 'project',
                    name: project.name,
                    connection: 'at-risk project'
                  }
                ],
                suggestedActions: [
                  {
                    label: 'Schedule project review',
                    type: 'schedule'
                  },
                  {
                    label: 'Check for blockers',
                    type: 'task'
                  }
                ]
              });
            }
          });
          
          return riskInsights;
        }
      };
      
    case 'productivity-trend':
      return {
        type,
        relevanceThreshold: 0.65,
        description: 'Analyzes productivity trends over time',
        detect: async (activities) => {
          // Implementation would analyze work patterns and productivity metrics
          // This is a simplified mock implementation
          
          // Count activities by day
          const activityByDay = new Map<string, number>();
          activities.forEach(a => {
            const day = new Date(a.timestamp).toISOString().split('T')[0];
            const count = activityByDay.get(day) || 0;
            activityByDay.set(day, count + 1);
          });
          
          // Calculate average daily activity
          const days = Array.from(activityByDay.keys());
          const totalActivities = Array.from(activityByDay.values())
                                       .reduce((sum, count) => sum + count, 0);
          const avgActivitiesPerDay = totalActivities / days.length;
          
          // Get most recent day's activity
          const sortedDays = days.sort();
          const mostRecentDay = sortedDays[sortedDays.length - 1];
          const mostRecentActivity = activityByDay.get(mostRecentDay) || 0;
          
          // Compare to average
          const percentDifference = ((mostRecentActivity - avgActivitiesPerDay) / avgActivitiesPerDay) * 100;
          
          // Only create insight if there's a significant difference
          if (Math.abs(percentDifference) >= 20) {
            return [{
              id: `prod-trend-${new Date().getTime()}`,
              title: percentDifference > 0 ? 
                    'Productivity increase detected' : 
                    'Productivity decrease detected',
              description: percentDifference > 0 ?
                          `Your recent activity level is ${Math.round(percentDifference)}% higher than your average. This could be a good time to tackle complex tasks.` :
                          `Your recent activity level is ${Math.round(Math.abs(percentDifference))}% lower than your average. This might indicate focus issues or need for a break.`,
              category: InsightCategory.PRODUCTIVITY,
              createdAt: new Date().toISOString(),
              relevanceScore: 0.7 + (Math.min(Math.abs(percentDifference), 50) / 100),
              source: {
                type: InsightSourceType.ACTIVITY,
                id: 'productivity-trend'
              },
              suggestedActions: percentDifference > 0 ? [
                {
                  label: 'Review high-priority tasks',
                  type: 'task'
                }
              ] : [
                {
                  label: 'Schedule focused work time',
                  type: 'schedule'
                },
                {
                  label: 'Review task priorities',
                  type: 'task'
                }
              ]
            }];
          }
          
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
    // Create detectors for requested pattern types
    const detectors = patternTypes.map(type => createPatternDetector(type));
    
    // Run all detectors in parallel
    const detectionPromises = detectors.map(detector => 
      detector.detect(activities, contextData).catch(err => {
        console.error(`Error in ${detector.type} pattern detector:`, err);
        return [];
      })
    );
    
    const detectionResults = await Promise.all(detectionPromises);
    
    // Flatten results and filter by relevance threshold
    const allInsights = detectionResults
      .flat()
      .filter(insight => {
        const detector = detectors.find(d => d.type === insight.category);
        return detector ? insight.relevanceScore >= detector.relevanceThreshold : true;
      });
    
    return allInsights;
  } catch (error) {
    console.error('Error detecting patterns:', error);
    return [];
  }
};

/**
 * Mock function to get user activities for testing
 */
export const fetchUserActivities = async (
  userId: string,
  timePeriod: InsightTimePeriod
): Promise<ActivityData[]> => {
  // This would be a real API call in production
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate mock activity data
  const activityCount = timePeriod === 'daily' ? 10 : timePeriod === 'weekly' ? 30 : 90;
  const activities: ActivityData[] = [];
  
  const activityTypes = [
    'document-edit', 
    'meeting-attendance', 
    'collaboration', 
    'message-sent',
    'project-update',
    'knowledge-share',
    'task-update'
  ];
  
  // Generate timestamp within the time period
  const getTimestamp = () => {
    const now = new Date();
    let daysAgo;
    
    switch (timePeriod) {
      case 'daily': daysAgo = Math.random() * 1; break;
      case 'weekly': daysAgo = Math.random() * 7; break;
      case 'monthly': daysAgo = Math.random() * 30; break;
    }
    
    return new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000)).toISOString();
  };
  
  // Generate collaborator IDs and names
  const collaborators = Array.from({ length: 10 }, (_, i) => ({
    id: `user-${i + 1}`,
    name: `User ${i + 1}`
  }));
  
  // Generate project IDs and names
  const projects = Array.from({ length: 5 }, (_, i) => ({
    id: `project-${i + 1}`,
    name: `Project ${String.fromCharCode(65 + i)}` // Project A, B, C, etc.
  }));
  
  // Generate mock activities
  for (let i = 0; i < activityCount; i++) {
    const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const timestamp = getTimestamp();
    
    let details: Record<string, any> = {};
    
    // Generate type-specific details
    if (type === 'collaboration') {
      const collaborator = collaborators[Math.floor(Math.random() * collaborators.length)];
      const project = projects[Math.floor(Math.random() * projects.length)];
      
      details = {
        collaboratorId: collaborator.id,
        collaboratorName: collaborator.name,
        projectId: project.id,
        projectName: project.name,
        durationType: ['meeting', 'document-edit', 'chat'][Math.floor(Math.random() * 3)]
      };
    } else if (type === 'meeting-attendance') {
      const attendeeCount = Math.floor(Math.random() * 5) + 2;
      const attendees = Array.from({ length: attendeeCount }, (_, j) => {
        const collaborator = collaborators[Math.floor(Math.random() * collaborators.length)];
        return {
          id: collaborator.id,
          name: collaborator.name
        };
      });
      
      details = {
        meetingId: `meeting-${Math.floor(Math.random() * 20) + 1}`,
        meetingName: `Project Sync ${Math.floor(Math.random() * 10) + 1}`,
        attendees,
        duration: Math.floor(Math.random() * 60) + 15 // 15-75 minutes
      };
    } else if (type === 'task-update' || type === 'project-update') {
      const project = projects[Math.floor(Math.random() * projects.length)];
      
      details = {
        projectId: project.id,
        projectName: project.name,
        taskId: `task-${Math.floor(Math.random() * 100) + 1}`,
        taskName: `Task ${Math.floor(Math.random() * 100) + 1}`,
        status: ['in-progress', 'completed', 'blocked', 'new'][Math.floor(Math.random() * 4)]
      };
    }
    
    activities.push({
      id: `activity-${i}`,
      type,
      timestamp,
      user: {
        id: userId,
        name: 'Current User' // Would be real name in production
      },
      details
    });
  }
  
  return activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};