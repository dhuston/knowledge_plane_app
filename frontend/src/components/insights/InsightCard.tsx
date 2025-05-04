import React from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Badge,
  IconButton,
  Button,
  useColorModeValue,
  useDisclosure,
  HStack,
  Icon
} from '@chakra-ui/react';
import { 
  FiThumbsUp, 
  FiThumbsDown, 
  FiSave, 
  FiX, 
  FiShare2, 
  FiInfo,
  FiArrowRight,
  FiClock
} from 'react-icons/fi';
import InsightDetailModal from './InsightDetailModal';
import { Insight } from '../../types/insight';
import { useInsights } from '../../context/InsightsContext';
import { InlineTooltip } from '../common/InlineTooltip';

interface InsightCardProps {
  insight: Insight;
}

/**
 * Card component to display individual insights
 */
const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const { dismissInsight, saveInsight, provideFeedback } = useInsights();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Colors for different categories
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'collaboration': return 'blue';
      case 'productivity': return 'green';
      case 'knowledge': return 'purple';
      case 'project': return 'orange';
      case 'communication': return 'teal';
      default: return 'gray';
    }
  };
  
  // Format relevance score as percentage
  const relevancePercentage = Math.round(insight.relevanceScore * 100);
  
  // Format date relative to now (e.g., "2 hours ago")
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffHours / 24);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };
  
  // Card styles
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.600');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  
  // Function to handle feedback
  const handleFeedback = (isRelevant: boolean) => {
    provideFeedback(insight.id, isRelevant);
  };
  
  return (
    <>
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        bg={bgColor}
        borderColor={borderColor}
        boxShadow="sm"
        transition="all 0.2s"
        _hover={{ boxShadow: 'md', transform: 'translateY(-2px)', borderColor: 'blue.300' }}
        height="100%"
        display="flex"
        flexDirection="column"
      >
        <Box p={4} flex="1" display="flex" flexDirection="column">
          {/* Header with category badge and relevance */}
          <Flex justifyContent="space-between" alignItems="center" mb={2}>
            <Badge colorScheme={getCategoryColor(insight.category)} borderRadius="full" px={2}>
              {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
            </Badge>
            
            <HStack spacing={1}>
              {insight.feedback?.isRelevant === true && (
                <Badge colorScheme="green" variant="outline" fontSize="xs">
                  Marked Relevant
                </Badge>
              )}
              {insight.feedback?.isRelevant === false && (
                <Badge colorScheme="red" variant="outline" fontSize="xs">
                  Marked Irrelevant
                </Badge>
              )}
              <Badge 
                colorScheme={relevancePercentage > 80 ? "green" : 
                          relevancePercentage > 60 ? "orange" : "red"}
                variant="subtle"
                fontSize="xs"
              >
                {relevancePercentage}% relevant
              </Badge>
            </HStack>
          </Flex>
          
          {/* Title and description */}
          <Heading as="h3" size="sm" mb={2} flex="0">
            {insight.title}
          </Heading>
          
          <Text noOfLines={3} mb={4} fontSize="sm" flex="1">
            {insight.description}
          </Text>
          
          {/* Timestamp */}
          <HStack fontSize="xs" color={mutedTextColor} mb={3}>
            <Icon as={FiClock} />
            <Text>{formatRelativeTime(insight.createdAt)}</Text>
          </HStack>
          
          {/* Action buttons */}
          <Flex justifyContent="space-between" alignItems="center" mt="auto">
            <HStack spacing={1}>
              <InlineTooltip label="Mark as relevant">
                <IconButton
                  aria-label="Mark as relevant"
                  icon={<FiThumbsUp />}
                  size="sm"
                  variant="ghost"
                  colorScheme={insight.feedback?.isRelevant === true ? "green" : "gray"}
                  onClick={() => handleFeedback(true)}
                />
              </InlineTooltip>
              <InlineTooltip label="Mark as not relevant">
                <IconButton
                  aria-label="Mark as not relevant"
                  icon={<FiThumbsDown />}
                  size="sm"
                  variant="ghost"
                  colorScheme={insight.feedback?.isRelevant === false ? "red" : "gray"}
                  onClick={() => handleFeedback(false)}
                />
              </InlineTooltip>
            </HStack>
            
            <HStack spacing={1}>
              <InlineTooltip label="Save for later">
                <IconButton
                  aria-label="Save insight"
                  icon={<FiSave />}
                  size="sm"
                  variant="ghost"
                  colorScheme={insight.saved ? "blue" : "gray"}
                  onClick={() => saveInsight(insight.id)}
                />
              </InlineTooltip>
              <InlineTooltip label="Dismiss">
                <IconButton
                  aria-label="Dismiss insight"
                  icon={<FiX />}
                  size="sm"
                  variant="ghost"
                  onClick={() => dismissInsight(insight.id)}
                />
              </InlineTooltip>
            </HStack>
          </Flex>
        </Box>
        
        {/* Footer with "View Details" button */}
        <Box 
          p={3}
          borderTop="1px solid"
          borderColor={borderColor}
          bg={useColorModeValue('gray.50', 'gray.800')}
        >
          <Button
            size="sm"
            width="full"
            variant="ghost"
            rightIcon={<FiArrowRight />}
            justifyContent="space-between"
            fontWeight="medium"
            color={useColorModeValue('blue.600', 'blue.300')}
            onClick={onOpen}
          >
            View Details
          </Button>
        </Box>
      </Box>
      
      {/* Detail Modal */}
      <InsightDetailModal
        insight={insight}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  );
};

export default InsightCard;