/**
 * useEntitySuggestions.ts
 * Custom hook for fetching and managing entity suggestions
 * with loading states, error handling, and feedback functionality
 */
import { useState, useEffect, useCallback } from 'react';
import { useApiClient } from './useApiClient';
import { MapNodeTypeEnum } from '../types/map';
import { EntitySuggestion } from '../components/panels/suggestions/EntitySuggestions';
import EntitySuggestionService from '../services/EntitySuggestionService';

export interface EntitySuggestionsOptions {
  /** Maximum number of suggestions to return */
  maxResults?: number;
  /** Filter suggestions by entity types */
  types?: MapNodeTypeEnum[];
  /** IDs of entities to exclude from suggestions */
  excludeIds?: string[];
  /** Whether to include tag information in results */
  includeTags?: boolean;
  /** Whether to include explanation for suggestion in results */
  includeReason?: boolean;
  /** Automatically refresh suggestions on feedback */
  refreshOnFeedback?: boolean;
}

export interface EntitySuggestionsResult {
  /** List of suggested entities */
  suggestions: EntitySuggestion[];
  /** True while suggestions are being fetched */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: Error | null;
  /** Function to manually refresh suggestions */
  refresh: () => Promise<void>;
  /** Submit feedback about a suggestion's helpfulness */
  submitFeedback: (suggestionId: string, isHelpful: boolean) => Promise<void>;
  /** Clear all suggestions */
  clearSuggestions: () => void;
}

/**
 * Hook for fetching entity suggestions for an entity
 * @param entityId - ID of the entity to get suggestions for
 * @param options - Configuration options for suggestions
 * @returns Object with suggestions data, loading state, error state, and helper functions
 */
export const useEntitySuggestions = (
  entityId: string | null,
  options: EntitySuggestionsOptions = {}
): EntitySuggestionsResult => {
  const [suggestions, setSuggestions] = useState<EntitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const apiClient = useApiClient();

  const defaultOptions: Required<EntitySuggestionsOptions> = {
    maxResults: 10,
    types: Object.values(MapNodeTypeEnum),
    excludeIds: [],
    includeTags: true,
    includeReason: true,
    refreshOnFeedback: true,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  /**
   * Fetch suggestions from the API
   */
  const fetchSuggestions = useCallback(async () => {
    // Don't fetch if entityId is null/empty
    if (entityId === null || entityId === undefined || entityId === '') {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First try the real API endpoint
      try {
        const response = await apiClient.get(`/entities/${entityId}/suggestions`, {
          params: {
            max_results: mergedOptions.maxResults,
            types: mergedOptions.types.join(','),
            exclude_ids: mergedOptions.excludeIds.join(','),
            include_tags: mergedOptions.includeTags,
            include_reason: mergedOptions.includeReason,
          }
        });
        
        setSuggestions(response.data);
      } catch (apiError) {
        // If API call fails, fall back to the local service
        console.warn('API suggestion endpoint not available, using local service');
        
        const localSuggestions = await EntitySuggestionService.getEntitySuggestions(entityId, {
          maxResults: mergedOptions.maxResults,
          types: mergedOptions.types,
          excludeIds: mergedOptions.excludeIds,
          includeTags: mergedOptions.includeTags,
          includeReason: mergedOptions.includeReason,
        });
        
        setSuggestions(localSuggestions);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch suggestions'));
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [entityId, apiClient, mergedOptions]);

  /**
   * Submit user feedback on a suggestion's relevance
   * @param suggestionId - ID of the suggestion being rated
   * @param isHelpful - Whether the user found the suggestion helpful
   */
  const submitFeedback = useCallback(async (suggestionId: string, isHelpful: boolean) => {
    try {
      // First try to submit to the API
      try {
        await apiClient.post(`/entities/suggestions/${suggestionId}/feedback`, {
          helpful: isHelpful
        });
      } catch (apiError) {
        // Fall back to the local service if API call fails
        console.warn('API feedback endpoint not available, using local service');
        EntitySuggestionService.recordSuggestionFeedback(suggestionId, isHelpful);
      }

      // Refresh suggestions if needed
      if (mergedOptions.refreshOnFeedback) {
        await fetchSuggestions();
      }

      return;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to submit feedback');
    }
  }, [apiClient, fetchSuggestions, mergedOptions.refreshOnFeedback]);

  /**
   * Record an interaction between entities to improve future suggestions
   * @param sourceEntityId - ID of the source entity
   * @param targetEntityId - ID of the target entity
   */
  const recordInteraction = useCallback(async (sourceEntityId: string, targetEntityId: string) => {
    try {
      // Try the API first
      try {
        await apiClient.post(`/entities/interactions`, {
          source_id: sourceEntityId,
          target_id: targetEntityId
        });
      } catch (apiError) {
        // Fall back to local service
        console.warn('API interaction endpoint not available, using local service');
        EntitySuggestionService.recordEntityInteraction(sourceEntityId, targetEntityId);
      }
    } catch (err) {
      console.error('Failed to record entity interaction:', err);
    }
  }, [apiClient]);

  /**
   * Clear all current suggestions
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  // Fetch suggestions when entityId or options change
  useEffect(() => {
    if (entityId !== null && entityId !== undefined && entityId !== '') {
      fetchSuggestions();
    } else {
      clearSuggestions();
    }
  }, [entityId, fetchSuggestions, clearSuggestions]);

  return {
    suggestions,
    isLoading,
    error,
    refresh: fetchSuggestions,
    submitFeedback,
    clearSuggestions,
  };
};

export default useEntitySuggestions;