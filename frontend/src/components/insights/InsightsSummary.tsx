import React, { useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  Flex,
  Badge,
  Button,
  Spinner,
  useColorModeValue,
  Link as ChakraLink,
  HStack,
  Icon
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiClock } from 'react-icons/fi';
import { useInsights } from '../../context/InsightsContext';
import { InsightCategory } from '../../types/insight';

interface InsightsSummaryProps {
  maxInsights?: number;
}

/**
 * Summary component that displays top insights in a compact view
 * This can be embedded in dashboards and other pages
 */
const InsightsSummary: React.FC<InsightsSummaryProps> = ({ maxInsights = 3 }) => {
  const { insights, loading, error, fetchInsights } = useInsights();
  
  useEffect(() => {
    fetchInsights('daily');
  }, [fetchInsights]);
  
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('white', 'gray.700');
  const headerBgColor = useColorModeValue('gray.50', 'gray.800');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.400');
  
  // Get top insights by relevance score
  const topInsights = insights
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxInsights);
  
  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case InsightCategory.COLLABORATION: return 'blue';
      case InsightCategory.PRODUCTIVITY: return 'green';
      case InsightCategory.KNOWLEDGE: return 'purple';
      case InsightCategory.PROJECT: return 'orange';
      case InsightCategory.COMMUNICATION: return 'teal';
      default: return 'gray';
    }
  };
  
  // Format relative time (e.g., "2 hours ago")
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
  
  if (loading) {
    return (
      <Box 
        borderWidth="1px" 
        borderRadius="lg" 
        overflow="hidden" 
        borderColor={borderColor}
        bg={bgColor}
        shadow="sm"
      >
        <Box p={4} bg={headerBgColor}>
          <Heading size="md">Daily Insights</Heading>
        </Box>
        <Box p={6} textAlign="center">
          <Spinner size="md" />
          <Text mt={2}>Loading insights</Text>
        </Box>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box 
        borderWidth="1px" 
        borderRadius="lg" 
        overflow="hidden" 
        borderColor={borderColor}
        bg={bgColor}
        shadow="sm"
      >
        <Box p={4} bg={headerBgColor}>
          <Heading size="md">Daily Insights</Heading>
        </Box>
        <Box p={6} textAlign="center" color="red.500">
          <Text>Error loading insights</Text>
        </Box>
      </Box>
    );
  }
  
  if (!insights.length) {
    return (
      <Box 
        borderWidth="1px" 
        borderRadius="lg" 
        overflow="hidden" 
        borderColor={borderColor}
        bg={bgColor}
        shadow="sm"
      >
        <Box p={4} bg={headerBgColor}>
          <Heading size="md">Daily Insights</Heading>
        </Box>
        <Box p={6} textAlign="center">
          <Text>No insights available for today.</Text>
        </Box>
      </Box>
    );
  }
  
  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden" 
      borderColor={borderColor} 
      bg={bgColor}
      shadow="sm"
    >
      <Box p={4} bg={headerBgColor}>
        <Flex justifyContent="space-between" alignItems="center">
          <Heading size="md">Daily Insights</Heading>
          <ChakraLink as={Link} to="/insights" color="blue.500" fontSize="sm">
            View All
          </ChakraLink>
        </Flex>
      </Box>
      
      <VStack spacing={0} align="stretch" divider={<Box borderBottomWidth="1px" borderColor={borderColor} />}>
        {topInsights.map(insight => (
          <Box 
            key={insight.id} 
            p={4} 
            _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
            transition="background 0.2s"
          >
            <Flex justify="space-between" mb={1}>
              <Badge colorScheme={getCategoryColor(insight.category)} borderRadius="full" px={2}>
                {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
              </Badge>
              
              {/* Format relevance score as percentage */}
              <Badge 
                colorScheme={insight.relevanceScore > 0.8 ? "green" : 
                          insight.relevanceScore > 0.6 ? "orange" : "red"}
                variant="subtle"
                fontSize="xs"
              >
                {Math.round(insight.relevanceScore * 100)}% relevant
              </Badge>
            </Flex>
            
            <Text fontWeight="medium" mb={1}>{insight.title}</Text>
            <Text fontSize="sm" noOfLines={2} mb={2}>{insight.description}</Text>
            
            <Flex justifyContent="space-between" alignItems="center">
              <HStack fontSize="xs" color={mutedTextColor}>
                <Icon as={FiClock} />
                <Text>{formatRelativeTime(insight.createdAt)}</Text>
              </HStack>
              
              <ChakraLink 
                as={Link} 
                to={`/insights?id=${insight.id}`} 
                color="blue.500" 
                fontSize="sm"
                fontWeight="medium"
              >
                View Details
              </ChakraLink>
            </Flex>
          </Box>
        ))}
      </VStack>
      
      <Box p={4} bg={headerBgColor} textAlign="center">
        <Button
          as={Link}
          to="/insights"
          variant="outline"
          size="sm"
          colorScheme="blue"
          width="full"
          rightIcon={<FiArrowRight />}
        >
          View All Insights
        </Button>
      </Box>
    </Box>
  );
};

export default InsightsSummary;