import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Heading, 
  Flex, 
  Select, 
  Spinner, 
  Text,
  SimpleGrid,
  useColorModeValue,
  Button,
  HStack,
  Icon,
  Badge,
  Tooltip
} from '@chakra-ui/react';
import { FiRefreshCw, FiClock } from 'react-icons/fi';
import { useInsights } from '../../context/InsightsContext';
import { InsightCategory, InsightTimePeriod, InsightSortOption } from '../../types/insight';
import InsightCard from './InsightCard';
import InsightFilters from './InsightFilters';

interface InsightsDashboardProps {
  // Props if needed
}

/**
 * Main dashboard component for displaying AI-generated insights
 */
const InsightsDashboard: React.FC<InsightsDashboardProps> = () => {
  const [timePeriod, setTimePeriod] = useState<InsightTimePeriod>('daily');
  const [categoryFilter, setCategoryFilter] = useState<InsightCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<InsightSortOption>('relevance');
  const { insights, loading, error, fetchInsights, lastUpdated } = useInsights();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const headerBgColor = useColorModeValue('gray.50', 'gray.700');
  
  useEffect(() => {
    fetchInsights(timePeriod);
  }, [timePeriod, fetchInsights]);
  
  const handleTimePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimePeriod(e.target.value as InsightTimePeriod);
  };
  
  const handleRefresh = () => {
    fetchInsights(timePeriod);
  };
  
  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    
    // Format the last updated time in a human-readable way
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(lastUpdated);
  };
  
  // Filter and sort insights
  const filteredInsights = useMemo(() => {
    let filtered = [...insights];
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(insight => insight.category === categoryFilter);
    }
    
    // Apply sorting
    if (sortBy === 'relevance') {
      filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'category') {
      filtered.sort((a, b) => a.category.localeCompare(b.category));
    }
    
    return filtered;
  }, [insights, categoryFilter, sortBy]);
  
  return (
    <Box width="100%" height="100%">
      <Flex 
        direction="column"
        height="100%"
        overflow="hidden"
      >
        {/* Header Section */}
        <Flex 
          p={4} 
          bg={headerBgColor} 
          justifyContent="space-between"
          alignItems="center"
          borderBottomWidth="1px"
          borderBottomColor={useColorModeValue('gray.200', 'gray.600')}
          flexWrap={{ base: "wrap", md: "nowrap" }}
          gap={2}
        >
          <Heading as="h1" size="lg">Insights Dashboard</Heading>
          <HStack spacing={4}>
            <Flex alignItems="center">
              <Text mr={2} fontSize="sm" whiteSpace="nowrap">Time Period:</Text>
              <Select 
                value={timePeriod}
                onChange={handleTimePeriodChange}
                aria-label="Select time period"
                size="sm"
                width="auto"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </Flex>
            
            <Tooltip label={`Last updated: ${formatLastUpdated()}`}>
              <Flex alignItems="center" fontSize="sm" color="gray.500">
                <Icon as={FiClock} mr={1} />
                <Text display={{ base: 'none', md: 'block' }}>
                  {formatLastUpdated()}
                </Text>
              </Flex>
            </Tooltip>
            
            <Button 
              leftIcon={<Icon as={FiRefreshCw} />} 
              size="sm"
              onClick={handleRefresh}
              isLoading={loading}
              colorScheme="blue"
              variant="outline"
            >
              Refresh
            </Button>
          </HStack>
        </Flex>
        
        {/* Filters Section - only show when we have insights */}
        {!loading && !error && filteredInsights.length > 0 && (
          <InsightFilters
            selectedCategory={categoryFilter}
            onCategoryChange={setCategoryFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            insightCount={filteredInsights.length}
          />
        )}
        
        {/* Content Section */}
        <Box flex="1" overflowY="auto" p={4}>
          {loading ? (
            <Flex 
              justifyContent="center" 
              alignItems="center" 
              height="100%" 
              data-testid="insights-loading"
            >
              <Spinner size="xl" thickness="4px" color="blue.500" />
              <Text ml={4} fontSize="lg" fontWeight="medium">Loading insights...</Text>
            </Flex>
          ) : error ? (
            <Box textAlign="center" p={8} color="red.500">
              <Text fontSize="lg">Error loading insights: {error}</Text>
              <Button mt={4} colorScheme="blue" onClick={handleRefresh}>
                Try Again
              </Button>
            </Box>
          ) : filteredInsights.length === 0 ? (
            <Box textAlign="center" p={8}>
              <Text fontSize="lg">No insights available for this time period or filter.</Text>
              {categoryFilter !== 'all' && (
                <Button mt={4} variant="outline" onClick={() => setCategoryFilter('all')}>
                  Clear Category Filter
                </Button>
              )}
            </Box>
          ) : (
            <>
              <SimpleGrid 
                columns={{ base: 1, md: 2, lg: 3 }}
                spacing={6}
                autoRows="auto"
              >
                {filteredInsights.map(insight => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </SimpleGrid>
            </>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default InsightsDashboard;