/**
 * EntitySuggestions.tsx
 * Displays suggested entity connections
 */
import React from 'react';
import { Box, Heading, HStack, Badge, Icon, Tooltip, useColorModeValue } from '@chakra-ui/react';
import { MdOutlineQuestionMark } from 'react-icons/md';
import { MapNodeTypeEnum } from '../../../types/map';

export interface EntitySuggestion {
  id: string;
  type: MapNodeTypeEnum;
  label: string;
  reason?: string;
}

interface EntitySuggestionsProps {
  suggestions: EntitySuggestion[];
  onSuggestionClick: (suggestionId: string, label: string) => void;
}

const EntitySuggestions: React.FC<EntitySuggestionsProps> = ({
  suggestions,
  onSuggestionClick
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (!suggestions || suggestions.length === 0) return null;
  
  return (
    <Box 
      mt={4} 
      p={3} 
      borderWidth="1px" 
      borderRadius="md" 
      borderColor={borderColor}
      aria-labelledby="suggestions-heading"
    >
      <Heading size="xs" mb={3} id="suggestions-heading">Suggested Connections</Heading>
      <HStack 
        spacing={2} 
        flexWrap="wrap" 
        role="list"
        aria-label="Suggested connections"
      >
        {suggestions.map(suggestion => (
          <Badge 
            key={suggestion.id}
            px={2} py={1} 
            borderRadius="full"
            variant="subtle"
            colorScheme="blue"
            cursor="pointer"
            onClick={() => onSuggestionClick(suggestion.id, suggestion.label)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSuggestionClick(suggestion.id, suggestion.label);
                e.preventDefault();
              }
            }}
            role="listitem"
            tabIndex={0}
            aria-label={`Connect to ${suggestion.label}${suggestion.reason ? `: ${suggestion.reason}` : ''}`}
          >
            {suggestion.label}
            {suggestion.reason && (
              <Tooltip label={suggestion.reason} hasArrow placement="top">
                <Icon as={MdOutlineQuestionMark} ml={1} boxSize={3} aria-hidden="true" />
              </Tooltip>
            )}
          </Badge>
        ))}
      </HStack>
    </Box>
  );
};

export default EntitySuggestions;