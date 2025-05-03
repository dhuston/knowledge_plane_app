/**
 * EntitySuggestionService.ts
 * Service for generating and managing entity suggestions
 */

import { EntitySuggestion } from '../components/panels/suggestions/EntitySuggestions';
import { MapNodeTypeEnum } from '../types/map';

// Interaction history storage
const interactions = new Map<string, Set<string>>();

// Feedback storage for suggestion improvement
const suggestionFeedback = new Map<string, {
  helpful: number;
  notHelpful: number;
}>();

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
 * Generate entity suggestions for a given entity
 * This is a placeholder implementation that returns empty results
 * It should be replaced with actual API integration
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
  // Return empty array to represent no suggestions available
  // This will be replaced with actual API integration
  return [];
}

export default {
  getEntitySuggestions,
  recordEntityInteraction,
  recordSuggestionFeedback
};