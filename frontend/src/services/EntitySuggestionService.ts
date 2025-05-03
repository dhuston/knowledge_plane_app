/**
 * EntitySuggestionService.ts
 * Service for generating and managing entity suggestions with intelligent mock data
 * for development and testing purposes until the API is available
 */

import { EntitySuggestion } from '../components/panels/suggestions/EntitySuggestions';
import { MapNodeTypeEnum } from '../types/map';

// Mock data for various entity types
const mockUsers = [
  { id: 'user1', label: 'Alex Johnson', tags: ['engineering', 'backend', 'databases'] },
  { id: 'user2', label: 'Taylor Chen', tags: ['design', 'ux', 'research'] },
  { id: 'user3', label: 'Morgan Smith', tags: ['product', 'strategy', 'analytics'] },
  { id: 'user4', label: 'Jordan Lee', tags: ['frontend', 'testing', 'accessibility'] },
  { id: 'user5', label: 'Casey Williams', tags: ['management', 'hiring', 'operations'] },
  { id: 'user6', label: 'Riley Brown', tags: ['ai', 'data science', 'machine learning'] },
  { id: 'user7', label: 'Sam Martinez', tags: ['mobile', 'performance', 'security'] }
];

const mockTeams = [
  { id: 'team1', label: 'Frontend Team', tags: ['react', 'typescript', 'design system'] },
  { id: 'team2', label: 'Data Science Team', tags: ['python', 'ml', 'analytics'] },
  { id: 'team3', label: 'Platform Team', tags: ['infrastructure', 'devops', 'security'] },
  { id: 'team4', label: 'Design Team', tags: ['ux', 'ui', 'user research'] },
  { id: 'team5', label: 'Product Team', tags: ['strategy', 'roadmap', 'requirements'] }
];

const mockProjects = [
  { id: 'project1', label: 'Living Map Redesign', tags: ['ui', 'performance', 'accessibility'] },
  { id: 'project2', label: 'Data Pipeline Upgrade', tags: ['infrastructure', 'analytics', 'scaling'] },
  { id: 'project3', label: 'Mobile App V2', tags: ['mobile', 'cross-platform', 'offline-first'] },
  { id: 'project4', label: 'Customer Analytics Portal', tags: ['dashboard', 'visualization', 'reporting'] },
  { id: 'project5', label: 'Security Hardening', tags: ['security', 'compliance', 'audit'] }
];

const mockGoals = [
  { id: 'goal1', label: 'Increase User Engagement', tags: ['analytics', 'product', 'growth'] },
  { id: 'goal2', label: 'Reduce Infrastructure Costs', tags: ['cost', 'optimization', 'cloud'] },
  { id: 'goal3', label: 'Improve Loading Performance', tags: ['performance', 'monitoring', 'optimization'] },
  { id: 'goal4', label: 'Enhance Data Security', tags: ['security', 'compliance', 'privacy'] }
];

const mockDepartments = [
  { id: 'dept1', label: 'Engineering Department', tags: ['technical', 'development', 'infrastructure'] },
  { id: 'dept2', label: 'Product Department', tags: ['product', 'strategy', 'roadmap'] },
  { id: 'dept3', label: 'Design Department', tags: ['design', 'ux', 'user research'] },
  { id: 'dept4', label: 'Operations Department', tags: ['operations', 'hr', 'finance'] }
];

const mockKnowledgeAssets = [
  { id: 'ka1', label: 'Onboarding Documentation', tags: ['documentation', 'training', 'internal'] },
  { id: 'ka2', label: 'System Architecture', tags: ['architecture', 'technical', 'reference'] },
  { id: 'ka3', label: 'Product Roadmap', tags: ['roadmap', 'strategy', 'planning'] },
  { id: 'ka4', label: 'UX Guidelines', tags: ['design', 'standards', 'patterns'] }
];

// Realistic entity relationships for generating suggestions
const entityRelationships = new Map<string, string[]>([
  // User relationships
  ['user1', ['team1', 'project1', 'goal3', 'user4', 'user7']],
  ['user2', ['team4', 'project1', 'goal1', 'user5', 'user3']],
  ['user3', ['team5', 'project4', 'goal1', 'user2', 'user5']],
  ['user4', ['team1', 'project3', 'goal3', 'user1', 'user7']],
  ['user5', ['team5', 'project2', 'goal2', 'user2', 'user3']],
  ['user6', ['team2', 'project4', 'goal1', 'user7', 'user3']],
  ['user7', ['team3', 'project5', 'goal4', 'user6', 'user4']],
  
  // Team relationships
  ['team1', ['user1', 'user4', 'project1', 'project3', 'dept1']],
  ['team2', ['user6', 'project2', 'project4', 'goal1', 'dept1']],
  ['team3', ['user7', 'project5', 'goal2', 'goal4', 'dept1']],
  ['team4', ['user2', 'project1', 'goal1', 'dept3']],
  ['team5', ['user3', 'user5', 'project4', 'goal1', 'dept2']],
  
  // Project relationships
  ['project1', ['team1', 'team4', 'user1', 'user2', 'goal3']],
  ['project2', ['team2', 'user5', 'goal2', 'dept1']],
  ['project3', ['team1', 'user4', 'user7', 'goal3']],
  ['project4', ['team2', 'team5', 'user3', 'user6', 'goal1']],
  ['project5', ['team3', 'user7', 'goal4']],
  
  // Goal relationships
  ['goal1', ['user2', 'user3', 'user6', 'team4', 'team5', 'project4']],
  ['goal2', ['user5', 'team3', 'project2']],
  ['goal3', ['user1', 'user4', 'team1', 'project1', 'project3']],
  ['goal4', ['user7', 'team3', 'project5']],
  
  // Department relationships
  ['dept1', ['team1', 'team2', 'team3', 'project2']],
  ['dept2', ['team5', 'project4']],
  ['dept3', ['team4', 'project1']]
]);

// In-memory storage for interactions and feedback
const interactions = new Map<string, Set<string>>();
const suggestionFeedback = new Map<string, { helpful: number; notHelpful: number }>();

// Attribute-based similarity index for better suggestions
const attributeIndex = new Map<string, Set<string>>();

/**
 * Initialize attribute index for better suggestions
 */
function initializeAttributeIndex() {
  // Index all tags
  function indexEntityTags(entities: Array<{id: string, tags: string[]}>) {
    entities.forEach(entity => {
      entity.tags.forEach(tag => {
        if (!attributeIndex.has(tag)) {
          attributeIndex.set(tag, new Set<string>());
        }
        attributeIndex.get(tag)!.add(entity.id);
      });
    });
  }
  
  indexEntityTags(mockUsers);
  indexEntityTags(mockTeams);
  indexEntityTags(mockProjects);
  indexEntityTags(mockGoals);
  indexEntityTags(mockDepartments);
  indexEntityTags(mockKnowledgeAssets);
}

// Initialize the index
initializeAttributeIndex();

/**
 * Register interactions between entities to improve suggestion quality
 */
export function recordEntityInteraction(sourceEntityId: string, targetEntityId: string) {
  if (!interactions.has(sourceEntityId)) {
    interactions.set(sourceEntityId, new Set());
  }
  
  interactions.get(sourceEntityId)!.add(targetEntityId);
}

/**
 * Record user feedback on suggestions to improve future recommendations
 */
export function recordSuggestionFeedback(suggestionId: string, isHelpful: boolean) {
  if (!suggestionFeedback.has(suggestionId)) {
    suggestionFeedback.set(suggestionId, { helpful: 0, notHelpful: 0 });
  }
  
  const feedback = suggestionFeedback.get(suggestionId)!;
  
  if (isHelpful) {
    feedback.helpful += 1;
  } else {
    feedback.notHelpful += 1;
  }
}

/**
 * Get mock data for a specific entity ID
 */
function getMockEntityById(id: string): { id: string; label: string; type: MapNodeTypeEnum; tags?: string[] } | null {
  const prefix = id.substring(0, id.indexOf('1')) || id;
  
  switch (prefix) {
    case 'user':
      const user = mockUsers.find(u => u.id === id);
      return user ? { ...user, type: MapNodeTypeEnum.USER } : null;
      
    case 'team':
      const team = mockTeams.find(t => t.id === id);
      return team ? { ...team, type: MapNodeTypeEnum.TEAM } : null;
      
    case 'project':
      const project = mockProjects.find(p => p.id === id);
      return project ? { ...project, type: MapNodeTypeEnum.PROJECT } : null;
      
    case 'goal':
      const goal = mockGoals.find(g => g.id === id);
      return goal ? { ...goal, type: MapNodeTypeEnum.GOAL } : null;
      
    case 'dept':
      const dept = mockDepartments.find(d => d.id === id);
      return dept ? { ...dept, type: MapNodeTypeEnum.DEPARTMENT } : null;
      
    case 'ka':
      const ka = mockKnowledgeAssets.find(k => k.id === id);
      return ka ? { ...ka, type: MapNodeTypeEnum.KNOWLEDGE_ASSET } : null;
      
    default:
      return null;
  }
}

/**
 * Calculate a suggestion reason based on entity relationships
 */
function getSuggestionReason(sourceId: string, targetId: string): string {
  const sourceEntity = getMockEntityById(sourceId);
  const targetEntity = getMockEntityById(targetId);
  
  if (!sourceEntity || !targetEntity) {
    return 'Suggested based on organizational patterns';
  }
  
  // Check for shared relationships
  const sourceRelations = entityRelationships.get(sourceId) || [];
  const targetRelations = entityRelationships.get(targetId) || [];
  
  const sharedRelations = sourceRelations.filter(rel => targetRelations.includes(rel));
  
  if (sharedRelations.length > 0) {
    // Get a shared entity name for the explanation
    const sharedEntityId = sharedRelations[0];
    const sharedEntity = getMockEntityById(sharedEntityId);
    
    if (sharedEntity) {
      return `Connected through ${sharedEntity.label}`;
    }
  }
  
  // Check for tag-based similarities
  if (sourceEntity.tags && targetEntity.tags) {
    const sharedTags = sourceEntity.tags.filter(tag => targetEntity.tags!.includes(tag));
    
    if (sharedTags.length > 0) {
      return `Shares interests in ${sharedTags.slice(0, 2).join(', ')}`;
    }
  }
  
  // Generic reasons based on entity types
  if (sourceEntity.type === MapNodeTypeEnum.USER && targetEntity.type === MapNodeTypeEnum.TEAM) {
    return 'Suggested team based on your skills';
  } else if (sourceEntity.type === MapNodeTypeEnum.USER && targetEntity.type === MapNodeTypeEnum.PROJECT) {
    return 'Project that may interest you';
  } else if (sourceEntity.type === MapNodeTypeEnum.USER && targetEntity.type === MapNodeTypeEnum.USER) {
    return 'Potential collaboration opportunity';
  } else if (sourceEntity.type === MapNodeTypeEnum.TEAM && targetEntity.type === MapNodeTypeEnum.GOAL) {
    return 'Strategic goal alignment';
  }
  
  return 'Based on organizational patterns';
}

/**
 * Calculate a confidence score for a suggested relationship
 */
function calculateConfidence(sourceId: string, targetId: string): number {
  let score = 0;
  
  // Direct relationship is a strong signal
  const sourceRelations = entityRelationships.get(sourceId) || [];
  if (sourceRelations.includes(targetId)) {
    score += 0.5;
  }
  
  // Check if they share connections (2nd degree relationship)
  const targetRelations = entityRelationships.get(targetId) || [];
  const sharedConnections = sourceRelations.filter(rel => targetRelations.includes(rel)).length;
  
  if (sharedConnections > 0) {
    score += Math.min(0.3, sharedConnections * 0.1);
  }
  
  // Consider recorded interactions (if any)
  if (interactions.has(sourceId) && interactions.get(sourceId)!.has(targetId)) {
    score += 0.2;
  }
  
  // Consider feedback (if any)
  if (suggestionFeedback.has(targetId)) {
    const feedback = suggestionFeedback.get(targetId)!;
    const totalFeedback = feedback.helpful + feedback.notHelpful;
    
    if (totalFeedback > 0) {
      const positiveRatio = feedback.helpful / totalFeedback;
      score += (positiveRatio - 0.5) * 0.2; // -0.1 to 0.1 adjustment
    }
  }
  
  // Ensure the score is between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Generate entity suggestions for a given entity
 */
export async function getEntitySuggestions(
  entityId: string,
  options: {
    maxResults?: number;
    types?: MapNodeTypeEnum[];
    excludeIds?: string[];
    includeTags?: boolean;
    includeReason?: boolean;
  } = {}
): Promise<EntitySuggestion[]> {
  // Default options
  const {
    maxResults = 10,
    types = Object.values(MapNodeTypeEnum),
    excludeIds = [],
    includeTags = true,
    includeReason = true
  } = options;
  
  // Add a small delay to simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // If the entity doesn't exist in our mock data, return empty array
  if (!getMockEntityById(entityId)) {
    return [];
  }
  
  const suggestions: EntitySuggestion[] = [];
  
  // Get direct relations from the entity relationships graph
  const directRelations = entityRelationships.get(entityId) || [];
  
  // Add direct relations first (but not excluded IDs)
  for (const relatedId of directRelations) {
    if (excludeIds.includes(relatedId)) continue;
    
    const entityDetails = getMockEntityById(relatedId);
    if (!entityDetails || !types.includes(entityDetails.type)) continue;
    
    // Calculate a confidence score
    const confidence = calculateConfidence(entityId, relatedId);
    const priority = confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low';
    
    suggestions.push({
      id: relatedId,
      type: entityDetails.type,
      label: entityDetails.label,
      confidence,
      priority,
      reason: includeReason ? getSuggestionReason(entityId, relatedId) : undefined,
      tags: includeTags ? entityDetails.tags : undefined,
      mutualConnections: 1, // For illustration purposes
    });
  }
  
  // Find 2nd-degree relations (entities related to entity's relations)
  const secondDegreeRelations = new Set<string>();
  
  for (const relation of directRelations) {
    const secondaryRelations = entityRelationships.get(relation) || [];
    
    for (const secondary of secondaryRelations) {
      // Skip if it's the original entity or already a direct relation
      if (secondary === entityId || directRelations.includes(secondary) || excludeIds.includes(secondary)) {
        continue;
      }
      
      secondDegreeRelations.add(secondary);
    }
  }
  
  // Add second-degree relations
  for (const relatedId of secondDegreeRelations) {
    const entityDetails = getMockEntityById(relatedId);
    if (!entityDetails || !types.includes(entityDetails.type)) continue;
    
    const confidence = calculateConfidence(entityId, relatedId) * 0.8; // Slightly lower confidence
    const priority = confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low';
    
    suggestions.push({
      id: relatedId,
      type: entityDetails.type,
      label: entityDetails.label,
      confidence,
      priority,
      reason: includeReason ? getSuggestionReason(entityId, relatedId) : undefined,
      tags: includeTags ? entityDetails.tags : undefined,
      mutualConnections: 2, // Illustrative - would be calculated in real implementation
    });
  }
  
  // If we don't have enough suggestions, add some based on attribute similarity
  if (suggestions.length < maxResults) {
    const sourceEntity = getMockEntityById(entityId);
    
    if (sourceEntity && sourceEntity.tags) {
      const similarEntities = new Set<string>();
      
      // Find entities that share tags with the source entity
      for (const tag of sourceEntity.tags) {
        const entitiesWithTag = attributeIndex.get(tag) || new Set();
        
        for (const entityWithTag of entitiesWithTag) {
          // Skip if it's already included or excluded
          if (entityWithTag === entityId || 
              directRelations.includes(entityWithTag) || 
              secondDegreeRelations.has(entityWithTag) || 
              excludeIds.includes(entityWithTag)) {
            continue;
          }
          
          similarEntities.add(entityWithTag);
        }
      }
      
      // Add similar entities to suggestions
      for (const similarId of similarEntities) {
        const entityDetails = getMockEntityById(similarId);
        if (!entityDetails || !types.includes(entityDetails.type)) continue;
        
        const confidence = calculateConfidence(entityId, similarId) * 0.6; // Even lower confidence
        const priority = confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low';
        
        suggestions.push({
          id: similarId,
          type: entityDetails.type,
          label: entityDetails.label,
          confidence,
          priority,
          reason: includeReason ? getSuggestionReason(entityId, similarId) : undefined,
          tags: includeTags ? entityDetails.tags : undefined,
        });
      }
    }
  }
  
  // Sort by confidence and limit to maxResults
  return suggestions
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    .slice(0, maxResults);
}

export default {
  getEntitySuggestions,
  recordEntityInteraction,
  recordSuggestionFeedback
};