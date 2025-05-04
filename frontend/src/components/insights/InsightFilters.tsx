import React from 'react';
import {
  Box,
  Flex,
  Button,
  ButtonGroup,
  Text,
  Select,
  Badge,
  useColorModeValue,
  HStack
} from '@chakra-ui/react';
import { InsightCategory, InsightSortOption } from '../../types/insight';

interface InsightFiltersProps {
  selectedCategory: InsightCategory | 'all';
  onCategoryChange: (category: InsightCategory | 'all') => void;
  sortBy: InsightSortOption;
  onSortChange: (sortField: InsightSortOption) => void;
  insightCount: number;
}

/**
 * Component for filtering and sorting insights
 */
const InsightFilters: React.FC<InsightFiltersProps> = ({
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  insightCount
}) => {
  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: InsightCategory.COLLABORATION, label: 'Collaboration' },
    { value: InsightCategory.PRODUCTIVITY, label: 'Productivity' },
    { value: InsightCategory.KNOWLEDGE, label: 'Knowledge' },
    { value: InsightCategory.PROJECT, label: 'Project' },
    { value: InsightCategory.COMMUNICATION, label: 'Communication' }
  ];
  
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'newest', label: 'Newest' },
    { value: 'category', label: 'Category' }
  ];
  
  const getBgColor = (isSelected: boolean) => {
    return isSelected 
      ? useColorModeValue('blue.500', 'blue.300')
      : useColorModeValue('gray.100', 'gray.700');
  };
  
  const getTextColor = (isSelected: boolean) => {
    return isSelected 
      ? 'white'
      : useColorModeValue('gray.800', 'gray.200');
  };
  
  const getCategoryCount = (category: string) => {
    return 0; // To be implemented with actual counts later
  };
  
  return (
    <Box mb={4} py={3} px={4} borderBottom="1px solid" borderColor={useColorModeValue('gray.200', 'gray.600')}>
      <Flex 
        justifyContent="space-between" 
        alignItems={{ base: 'start', md: 'center' }}
        flexDirection={{ base: 'column', md: 'row' }}
        gap={3}
      >
        <Box>
          <HStack spacing={2} mb={{ base: 2, md: 0 }}>
            <Text fontSize="sm" fontWeight="medium">
              Filter by:
            </Text>
            <ButtonGroup isAttached size="sm" variant="outline" overflow="auto" maxW="100%">
              {categories.map(category => (
                <Button
                  key={category.value}
                  onClick={() => onCategoryChange(category.value as InsightCategory | 'all')}
                  bg={getBgColor(selectedCategory === category.value)}
                  color={getTextColor(selectedCategory === category.value)}
                  _hover={{
                    bg: selectedCategory === category.value 
                      ? useColorModeValue('blue.600', 'blue.400')
                      : useColorModeValue('gray.200', 'gray.600')
                  }}
                  px={3}
                  py={1}
                  height="auto"
                  fontSize="xs"
                  fontWeight="medium"
                  whiteSpace="nowrap"
                >
                  {category.label}
                  {category.value !== 'all' && getCategoryCount(category.value) > 0 && (
                    <Badge ml={2} colorScheme="blue" variant="solid" borderRadius="full" fontSize="2xs">
                      {getCategoryCount(category.value)}
                    </Badge>
                  )}
                </Button>
              ))}
            </ButtonGroup>
          </HStack>
        </Box>
        
        <Flex alignItems="center" gap={2}>
          <Text fontSize="sm" fontWeight="medium">
            {insightCount} {insightCount === 1 ? 'insight' : 'insights'}
          </Text>
          <Text fontSize="sm" fontWeight="medium" mr={2}>
            Sort by:
          </Text>
          <Select 
            size="sm" 
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as InsightSortOption)}
            width="auto"
            borderRadius="md"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Flex>
      </Flex>
    </Box>
  );
};

export default InsightFilters;