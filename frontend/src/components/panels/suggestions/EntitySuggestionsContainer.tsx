/**
 * EntitySuggestionsContainer.tsx
 * Container component that integrates the EntitySuggestions UI component 
 * with the useEntitySuggestions hook for data fetching and management
 */
import React, { useCallback } from 'react';
import { Box, Spinner, Center, Text, useToast } from '@chakra-ui/react';
import EntitySuggestions from './EntitySuggestions';
import { useEntitySuggestions, EntitySuggestionsOptions } from '../../../hooks/useEntitySuggestions';
import { MapNodeTypeEnum } from '../../../types/map';

interface EntitySuggestionsContainerProps {
  /** ID of the entity to get suggestions for */
  entityId: string | null;
  /** Title for the suggestions panel */
  title?: string;
  /** Maximum number of suggestions to initially display */
  maxShown?: number;
  /** Visual style for suggestions */
  viewMode?: 'compact' | 'cards' | 'list';
  /** Whether to highlight high-priority suggestions */
  highlightPriority?: boolean;
  /** Optional callback when a suggestion is clicked */
  onSuggestionClick?: (suggestionId: string, label: string) => void;
  /** Configuration options passed to the suggestions hook */
  options?: EntitySuggestionsOptions;
}

/**
 * Container component that provides entity suggestions for a selected entity
 */
const EntitySuggestionsContainer: React.FC<EntitySuggestionsContainerProps> = ({
  entityId,
  title = "Suggested Connections",
  maxShown = 5,
  viewMode = 'compact',
  highlightPriority = true,
  onSuggestionClick,
  options = {}
}) => {
  const toast = useToast();
  
  // Use our custom hook to fetch suggestions and handle loading/error states
  const {
    suggestions,
    isLoading,
    error,
    submitFeedback
  } = useEntitySuggestions(entityId, options);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestionId: string, label: string) => {
    // Call the provided callback if it exists
    if (onSuggestionClick !== undefined) {
      onSuggestionClick(suggestionId, label);
    }
  }, [onSuggestionClick]);

  // Handle feedback submission
  const handleFeedback = useCallback(async (suggestionId: string, isHelpful: boolean) => {
    try {
      await submitFeedback(suggestionId, isHelpful);
      
      // Show toast notification for feedback
      toast({
        title: isHelpful ? 'Feedback received' : 'Feedback received',
        description: isHelpful 
          ? 'Thanks! We\'ll show more like this.' 
          : 'Thanks! We\'ll improve our suggestions.',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'bottom-right',
      });
    } catch (err) {
      toast({
        title: 'Feedback error',
        description: 'Unable to record your feedback',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [submitFeedback, toast]);

  // Don't show anything if there's no entity selected
  if (entityId === null || entityId === undefined) {
    return null;
  }

  // Show loading state
  if (isLoading === true && suggestions.length === 0) {
    return (
      <Box mt={4} p={4} borderWidth="1px" borderRadius="md">
        <Center>
          <Spinner size="sm" mr={2} />
          <Text fontSize="sm">Loading suggestions...</Text>
        </Center>
      </Box>
    );
  }

  // Show error state
  if (error !== undefined && isLoading !== true && suggestions.length === 0) {
    return (
      <Box mt={4} p={4} borderWidth="1px" borderRadius="md">
        <Text fontSize="sm" color="red.500">Unable to load suggestions</Text>
      </Box>
    );
  }

  // Show empty state
  if (isLoading !== true && suggestions.length === 0) {
    return null;
  }

  // Render suggestions component with data
  return (
    <EntitySuggestions
      suggestions={suggestions}
      title={title}
      maxShown={maxShown}
      viewMode={viewMode}
      highlightPriority={highlightPriority}
      isLoading={isLoading}
      onSuggestionClick={handleSuggestionClick}
      onFeedback={handleFeedback}
    />
  );
};

export default EntitySuggestionsContainer;