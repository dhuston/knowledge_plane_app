/**
 * EntitySuggestionService.ts
 * Service for generating and managing ML-based entity suggestions
 */

import { EntitySuggestion } from '../components/panels/suggestions/EntitySuggestions';
import { MapNodeTypeEnum } from '../types/map';

// Mock database of interactions for generating suggestions
const interactions = new Map<string, Set<string>>();

// Mock entity information database
const entityDatabase = new Map<string, {
  id: string;
  type: MapNodeTypeEnum;
  label: string;
  tags?: string[];
  department?: string;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  properties: Record<string, any>;
}>();

// Similarity scores between entities
const similarityScores = new Map<string, Map<string, number>>();

// Mock feedback store for suggestion improvement
const suggestionFeedback = new Map<string, {
  helpful: number;
  notHelpful: number;
}>();

/**
 * Generate embedding vector representation for an entity (simplified mock version)
 * In a real implementation, this would use actual NLP/ML embedding techniques
 */
function generateEntityEmbedding(entityId: string): number[] {
  // Mock vector generation - in real implementation this would use ML models
  // This returns a simplified embedding vector with 5 dimensions
  const seed = entityId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rng = (n: number) => ((seed * (n + 1)) % 100) / 100;
  
  return [
    rng(1),
    rng(2),
    rng(3),
    rng(4),
    rng(5)
  ];
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same dimensions');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += Math.pow(vectorA[i], 2);
    normB += Math.pow(vectorB[i], 2);
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Register interactions between entities to improve suggestion quality
 */
export function recordEntityInteraction(sourceEntityId: string, targetEntityId: string) {
  if (!interactions.has(sourceEntityId)) {
    interactions.set(sourceEntityId, new Set());
  }
  
  interactions.get(sourceEntityId)?.add(targetEntityId);
}

/**
 * Register a new entity in the system
 */
export function registerEntity(
  id: string,
  type: MapNodeTypeEnum,
  label: string,
  properties: Record<string, any> = {},
  tags?: string[],
  description?: string
) {
  entityDatabase.set(id, {
    id,
    type,
    label,
    tags,
    createdAt: new Date(),
    updatedAt: new Date(),
    description,
    properties
  });
  
  // Pre-calculate similarity to other entities
  const newEntityEmbedding = generateEntityEmbedding(id);
  const similarityMap = new Map<string, number>();
  
  entityDatabase.forEach((entity, entityId) => {
    if (entityId !== id) {
      const otherEmbedding = generateEntityEmbedding(entityId);
      const similarity = cosineSimilarity(newEntityEmbedding, otherEmbedding);
      similarityMap.set(entityId, similarity);
    }
  });
  
  similarityScores.set(id, similarityMap);
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
 * Get the mutual connections between two entities
 */
function getMutualConnections(sourceId: string, targetId: string): string[] {
  const sourceConnections = interactions.get(sourceId) || new Set();
  const targetConnections = interactions.get(targetId) || new Set();
  
  return Array.from(sourceConnections).filter(id => targetConnections.has(id));
}

/**
 * Calculate a suggestion confidence score based on multiple factors
 */
function calculateConfidenceScore(
  sourceId: string,
  targetId: string,
  similarity: number
): number {
  // Get mutual connections
  const mutualConnections = getMutualConnections(sourceId, targetId);
  const mutualFactor = Math.min(mutualConnections.length * 0.1, 0.5); // Cap at 0.5
  
  // Consider feedback if available
  let feedbackFactor = 0;
  if (suggestionFeedback.has(targetId)) {
    const feedback = suggestionFeedback.get(targetId)!;
    const total = feedback.helpful + feedback.notHelpful;
    
    if (total > 0) {
      feedbackFactor = (feedback.helpful / total) * 0.2;
    }
  }
  
  // Get recency factor
  const targetEntity = entityDatabase.get(targetId);
  let recencyFactor = 0;
  
  if (targetEntity) {
    // More recent entities get a boost
    const daysSinceUpdate = (Date.now() - targetEntity.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    recencyFactor = Math.max(0, 0.3 - (daysSinceUpdate / 30) * 0.3); // Max 0.3, decays over a month
  }
  
  // Combine factors with different weights
  return Math.min(
    0.2 + (similarity * 0.3) + mutualFactor + feedbackFactor + recencyFactor,
    1.0 // Cap at 1.0
  );
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
  const {
    maxResults = 10,
    types,
    excludeIds = [],
    includeTags = true,
    includeReason = true
  } = options;
  
  // Check if entity exists
  if (!entityDatabase.has(entityId)) {
    return [];
  }
  
  const sourceEntity = entityDatabase.get(entityId)!;
  const suggestions: EntitySuggestion[] = [];
  
  // Build candidates from all entities, filtered by types if specified
  const candidateEntities = Array.from(entityDatabase.entries())
    .filter(([id, entity]) => 
      id !== entityId && 
      !excludeIds.includes(id) &&
      (!types || types.includes(entity.type))
    )
    .map(([id, entity]) => entity);
  
  // Get similarity scores for all candidates
  for (const candidate of candidateEntities) {
    const simScore = similarityScores.get(entityId)?.get(candidate.id) || 0;
    const confidence = calculateConfidenceScore(entityId, candidate.id, simScore);
    const mutualConnections = getMutualConnections(entityId, candidate.id).length;
    
    // Generate a reason for the suggestion
    let reason = '';
    if (includeReason) {
      if (mutualConnections > 0) {
        reason = `${mutualConnections} mutual connection${mutualConnections > 1 ? 's' : ''}`;
      } else if (sourceEntity.properties.department && candidate.properties.department === sourceEntity.properties.department) {
        reason = `Same department: ${candidate.properties.department}`;
      } else if (sourceEntity.tags && candidate.tags && sourceEntity.tags.some(tag => candidate.tags!.includes(tag))) {
        const sharedTags = sourceEntity.tags.filter(tag => candidate.tags!.includes(tag));
        reason = `Shared interests: ${sharedTags.join(', ')}`;
      } else {
        reason = 'You might be interested in this';
      }
    }
    
    // Add to suggestions
    suggestions.push({
      id: candidate.id,
      type: candidate.type,
      label: candidate.label,
      reason,
      confidence,
      priority: confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low',
      similarity: simScore,
      tags: includeTags ? candidate.tags : undefined,
      mutualConnections: mutualConnections > 0 ? mutualConnections : undefined,
      description: candidate.description
    });
  }
  
  // Sort by confidence score and limit results
  return suggestions
    .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    .slice(0, maxResults);
}

// Initialize with some sample entities for demonstration
function initializeSampleData() {
  // Sample users
  registerEntity('user1', MapNodeTypeEnum.USER, 'John Smith', { department: 'Engineering', title: 'Senior Developer' }, ['coding', 'architecture']);
  registerEntity('user2', MapNodeTypeEnum.USER, 'Emily Johnson', { department: 'Engineering', title: 'UI Designer' }, ['design', 'usability']);
  registerEntity('user3', MapNodeTypeEnum.USER, 'Michael Davis', { department: 'Product', title: 'Product Manager' }, ['strategy', 'agile']);
  registerEntity('user4', MapNodeTypeEnum.USER, 'Sarah Wilson', { department: 'Engineering', title: 'QA Engineer' }, ['testing', 'automation']);
  registerEntity('user5', MapNodeTypeEnum.USER, 'David Thompson', { department: 'Research', title: 'Research Scientist' }, ['data analysis', 'statistics']);
  
  // Sample teams
  registerEntity('team1', MapNodeTypeEnum.TEAM, 'Frontend Team', { department: 'Engineering', members: ['user1', 'user2'] }, ['react', 'ui']);
  registerEntity('team2', MapNodeTypeEnum.TEAM, 'Backend Team', { department: 'Engineering', members: ['user1', 'user4'] }, ['api', 'database']);
  registerEntity('team3', MapNodeTypeEnum.TEAM, 'Research Team', { department: 'Research', members: ['user5'] }, ['data science', 'analytics']);
  
  // Sample projects
  registerEntity('project1', MapNodeTypeEnum.PROJECT, 'Website Redesign', { teams: ['team1'], status: 'in-progress' }, ['frontend', 'design']);
  registerEntity('project2', MapNodeTypeEnum.PROJECT, 'API Overhaul', { teams: ['team2'], status: 'planning' }, ['backend', 'api']);
  registerEntity('project3', MapNodeTypeEnum.PROJECT, 'Data Platform', { teams: ['team2', 'team3'], status: 'in-progress' }, ['data', 'platform']);
  
  // Sample goals
  registerEntity('goal1', MapNodeTypeEnum.GOAL, 'Improve User Experience', { projects: ['project1'], status: 'active' }, ['ux', 'frontend']);
  registerEntity('goal2', MapNodeTypeEnum.GOAL, 'Scale Infrastructure', { projects: ['project2', 'project3'], status: 'active' }, ['infrastructure', 'performance']);
  
  // Sample knowledge assets
  registerEntity('asset1', MapNodeTypeEnum.KNOWLEDGE_ASSET, 'Design System Documentation', { owner: 'user2', type: 'document' }, ['design', 'guidelines']);
  registerEntity('asset2', MapNodeTypeEnum.KNOWLEDGE_ASSET, 'API Architecture', { owner: 'user1', type: 'document' }, ['api', 'architecture']);
  registerEntity('asset3', MapNodeTypeEnum.KNOWLEDGE_ASSET, 'Data Schema', { owner: 'user5', type: 'document' }, ['data', 'schema']);
  
  // Sample departments
  registerEntity('dept1', MapNodeTypeEnum.DEPARTMENT, 'Engineering', { head: 'user1', teams: ['team1', 'team2'] });
  registerEntity('dept2', MapNodeTypeEnum.DEPARTMENT, 'Research', { head: 'user5', teams: ['team3'] });
  registerEntity('dept3', MapNodeTypeEnum.DEPARTMENT, 'Product', { head: 'user3', teams: [] });
  
  // Record some interactions to build the graph
  recordEntityInteraction('user1', 'team1');
  recordEntityInteraction('user1', 'team2');
  recordEntityInteraction('user1', 'project1');
  recordEntityInteraction('user1', 'project2');
  recordEntityInteraction('user2', 'team1');
  recordEntityInteraction('user2', 'project1');
  recordEntityInteraction('user2', 'asset1');
  recordEntityInteraction('user3', 'project1');
  recordEntityInteraction('user3', 'goal1');
  recordEntityInteraction('user4', 'team2');
  recordEntityInteraction('user4', 'project2');
  recordEntityInteraction('user5', 'team3');
  recordEntityInteraction('user5', 'project3');
  recordEntityInteraction('user5', 'asset3');
  recordEntityInteraction('team1', 'project1');
  recordEntityInteraction('team1', 'goal1');
  recordEntityInteraction('team2', 'project2');
  recordEntityInteraction('team2', 'project3');
  recordEntityInteraction('team2', 'goal2');
  recordEntityInteraction('team3', 'project3');
  recordEntityInteraction('dept1', 'team1');
  recordEntityInteraction('dept1', 'team2');
  recordEntityInteraction('dept2', 'team3');
}

// Initialize sample data
initializeSampleData();

export default {
  getEntitySuggestions,
  recordEntityInteraction,
  recordSuggestionFeedback,
  registerEntity
};