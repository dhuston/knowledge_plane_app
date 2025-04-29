import React from 'react';
import {
  Grid,
  Card,
  HStack,
  Text,
  Icon,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiFileText, FiLink, FiClock, FiBarChart2 } from 'react-icons/fi';

// Define types for research highlights
interface ResearchHighlight {
  id: string;
  title: string;
  type: 'publication' | 'document' | 'clinical' | 'data';
  content?: string;
}

interface TeamResearchHighlightsProps {
  highlights?: ResearchHighlight[];
}

const TeamResearchHighlights: React.FC<TeamResearchHighlightsProps> = ({ highlights = [] }) => {
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardHoverBg = useColorModeValue('gray.100', 'gray.600');
  
  // If no highlights provided, use placeholders
  const displayHighlights = highlights.length > 0 ? highlights : [
    { id: '1', title: 'Publications', type: 'publication' },
    { id: '2', title: 'Key Documents', type: 'document' },
    { id: '3', title: 'Clinical Response', type: 'clinical' },
  ];
  
  // Helper function to get icon based on type
  const getIconForType = (type: string) => {
    switch (type) {
      case 'publication':
        return FiFileText;
      case 'document':
        return FiLink;
      case 'clinical':
        return FiClock;
      case 'data':
        return FiBarChart2;
      default:
        return FiFileText;
    }
  };
  
  return (
    <Grid templateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }} gap={4}>
      {displayHighlights.map((highlight) => (
        <Card 
          key={highlight.id} 
          p={4} 
          bg={cardBg} 
          borderRadius="md"
          _hover={{ 
            bg: cardHoverBg, 
            transform: 'translateY(-2px)',
            boxShadow: 'md'
          }}
          transition="all 0.2s"
          cursor="pointer"
        >
          <HStack mb={2}>
            <Icon as={getIconForType(highlight.type)} />
            <Text fontWeight="medium">{highlight.title}</Text>
          </HStack>
          {highlight.content ? (
            <Text fontSize="sm">{highlight.content}</Text>
          ) : (
            <Box h="100px" bg="gray.100" borderRadius="md" />
          )}
        </Card>
      ))}
    </Grid>
  );
};

export default TeamResearchHighlights;
