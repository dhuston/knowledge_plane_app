import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Avatar,
  Badge,
  Spinner,
  Button,
  Icon,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  useColorModeValue,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  Divider,
  Tooltip,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tag,
  TagLabel,
  TagLeftIcon,
  Fade
} from '@chakra-ui/react';

import { FiDatabase, FiUser, FiUsers, FiBriefcase, FiTarget, FiLayers, FiInfo, FiThumbsUp, FiThumbsDown, FiHelpCircle, FiRefreshCw, FiFilter, FiChevronRight } from 'react-icons/fi';
import { MapNodeTypeEnum } from '../../../types/map';
import entitySuggestionService from '../../../services/EntitySuggestionService';
import { useFeatureFlags } from '../../../utils/featureFlags';

export interface EntitySuggestion {
  id: string;
  type: MapNodeTypeEnum;
  label: string;
  confidence?: number;
  priority?: 'high' | 'medium' | 'low';
  reason?: string;
  tags?: string[];
  metadata?: any;
  mutualConnections?: number;
}

interface EnhancedEntitySuggestionsProps {
  entityId: string;
  entityType: MapNodeTypeEnum;
  onSuggestionClick?: (id: string, type: MapNodeTypeEnum, label: string) => void;
  maxSuggestions?: number;
  excludeIds?: string[];
  viewMode?: 'compact' | 'detailed' | 'grid';
  title?: string;
  containerStyle?: React.CSSProperties;
}

/**
 * Enhanced entity suggestions component that uses ML-based suggestions
 */
export const EnhancedEntitySuggestions: React.FC<EnhancedEntitySuggestionsProps> = ({
  entityId,
  entityType,
  onSuggestionClick,
  maxSuggestions = 5,
  excludeIds = [],
  viewMode = 'detailed',
  title = 'ML-Powered Suggestions',
  containerStyle = {}
}) => {
  const [suggestions, setSuggestions] = useState<EntitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, boolean>>({});
  const [activeTypeFilter, setActiveTypeFilter] = useState<MapNodeTypeEnum | 'all'>('all');
  const { flags } = useFeatureFlags();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const highlightColor = useColorModeValue('blue.50', 'blue.900');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  
  // Fetch suggestions using the ML-based algorithm
  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let entitySuggestions: EntitySuggestion[] = [];
      
      // Use ML-based suggestions if the flag is enabled
      if (flags.enableMachineLearning) {
        // Use the new ML-powered suggestions
        entitySuggestions = await entitySuggestionService.getSmartSuggestions(
          entityId,
          entityType,
          {
            maxResults: maxSuggestions * 2, // Request more to account for filtering
            excludeIds: [...excludeIds, entityId], // Exclude the current entity
            minConfidenceScore: 0.3 // Lower threshold to get more results
          }
        );
      } else {
        // Fall back to traditional suggestions
        entitySuggestions = await entitySuggestionService.getEntitySuggestions(
          entityId,
          {
            maxResults: maxSuggestions * 2,
            excludeIds: [...excludeIds, entityId],
            includeReason: true,
            includeTags: true
          }
        );
      }
      
      setSuggestions(entitySuggestions.slice(0, maxSuggestions));
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setError('Unable to load suggestions at this time.');
    } finally {
      setIsLoading(false);
    }
  }, [entityId, entityType, excludeIds, maxSuggestions, flags.enableMachineLearning]);
  
  // Load suggestions on mount and when entity changes
  useEffect(() => {
    fetchSuggestions();
    // Reset feedback when entity changes
    setFeedbackGiven({});
  }, [entityId, entityType, fetchSuggestions]);
  
  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: EntitySuggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion.id, suggestion.type, suggestion.label);
      
      // Record this interaction to improve future suggestions
      entitySuggestionService.recordEntityInteraction(entityId, suggestion.id);
    }
  }, [entityId, onSuggestionClick]);
  
  // Handle feedback for suggestions
  const handleFeedback = useCallback(async (suggestionId: string, isHelpful: boolean) => {
    // Record feedback both locally and to API
    if (flags.enableMachineLearning) {
      await entitySuggestionService.recordFeedback(entityId, suggestionId, isHelpful);
    } else {
      entitySuggestionService.recordSuggestionFeedback(suggestionId, isHelpful);
    }
    
    // Update local state to show feedback was given
    setFeedbackGiven(prev => ({
      ...prev,
      [suggestionId]: isHelpful
    }));
  }, [entityId, flags.enableMachineLearning]);
  
  // Filter suggestions by type
  const filteredSuggestions = activeTypeFilter === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.type === activeTypeFilter);
  
  // Get available entity types for filtering
  const availableTypes = [...new Set(suggestions.map(s => s.type))];
  
  // Get entity type icon
  const getEntityTypeIcon = (type: MapNodeTypeEnum) => {
    switch (type) {
      case MapNodeTypeEnum.USER:
        return FiUser;
      case MapNodeTypeEnum.TEAM:
        return FiUsers;
      case MapNodeTypeEnum.PROJECT:
        return FiBriefcase;
      case MapNodeTypeEnum.GOAL:
        return FiTarget;
      case MapNodeTypeEnum.DEPARTMENT:
        return FiLayers;
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return FiDatabase;
      default:
        return FiInfo;
    }
  };
  
  // Determine badge color by type
  const getTypeColor = (type: MapNodeTypeEnum) => {
    switch (type) {
      case MapNodeTypeEnum.USER: return 'blue';
      case MapNodeTypeEnum.TEAM: return 'green';
      case MapNodeTypeEnum.PROJECT: return 'purple';
      case MapNodeTypeEnum.GOAL: return 'orange';
      case MapNodeTypeEnum.DEPARTMENT: return 'cyan';
      case MapNodeTypeEnum.KNOWLEDGE_ASSET: return 'yellow';
      default: return 'gray';
    }
  };
  
  // Format confidence score for display
  const formatConfidence = (confidence?: number): string => {
    if (confidence === undefined) return '';
    return `${Math.round(confidence * 100)}%`;
  };
  
  // Determine confidence color
  const getConfidenceColor = (confidence?: number): string => {
    if (confidence === undefined) return 'gray';
    if (confidence > 0.8) return 'green';
    if (confidence > 0.6) return 'blue';
    if (confidence > 0.4) return 'yellow';
    return 'orange';
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Box 
        p={4} 
        borderWidth="1px" 
        borderRadius="md" 
        borderColor={borderColor}
        bg={bgColor}
        style={containerStyle}
      >
        <Heading size="sm" mb={4}>{title}</Heading>
        <VStack spacing={4} align="stretch">
          {[...Array(3)].map((_, i) => (
            <HStack key={i} spacing={4} p={2}>
              <SkeletonCircle size="10" />
              <Box flex="1">
                <SkeletonText noOfLines={2} spacing="2" />
              </Box>
            </HStack>
          ))}
        </VStack>
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box 
        p={4} 
        borderWidth="1px" 
        borderRadius="md" 
        borderColor="red.300"
        bg="red.50"
        color="red.800"
        style={containerStyle}
      >
        <Heading size="sm" mb={2}>Unable to load suggestions</Heading>
        <Text fontSize="sm">{error}</Text>
        <Button 
          leftIcon={<FiRefreshCw />} 
          size="sm" 
          variant="outline" 
          colorScheme="red" 
          mt={2}
          onClick={fetchSuggestions}
        >
          Try Again
        </Button>
      </Box>
    );
  }
  
  // Render empty state
  if (suggestions.length === 0) {
    return (
      <Box 
        p={4} 
        borderWidth="1px" 
        borderRadius="md" 
        borderColor={borderColor}
        bg={bgColor}
        style={containerStyle}
      >
        <Heading size="sm" mb={2}>{title}</Heading>
        <Text fontSize="sm" color={mutedColor}>
          No suggestions available for this entity at this time.
        </Text>
      </Box>
    );
  }
  
  // Render compact view mode
  if (viewMode === 'compact') {
    return (
      <Box 
        p={4} 
        borderWidth="1px" 
        borderRadius="md" 
        borderColor={borderColor}
        bg={bgColor}
        style={containerStyle}
      >
        <Flex justify="space-between" align="center" mb={3}>
          <Heading size="sm">{title}</Heading>
          {availableTypes.length > 1 && (
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiFilter />}
                variant="ghost"
                size="xs"
                aria-label="Filter suggestions"
              />
              <MenuList>
                <MenuItem 
                  onClick={() => setActiveTypeFilter('all')}
                  fontWeight={activeTypeFilter === 'all' ? 'bold' : 'normal'}
                >
                  All types
                </MenuItem>
                {availableTypes.map(type => (
                  <MenuItem 
                    key={type} 
                    onClick={() => setActiveTypeFilter(type)}
                    fontWeight={activeTypeFilter === type ? 'bold' : 'normal'}
                  >
                    <Icon as={getEntityTypeIcon(type)} mr={2} />
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          )}
        </Flex>
        
        <VStack spacing={1} align="stretch">
          {filteredSuggestions.map(suggestion => (
            <HStack 
              key={suggestion.id} 
              py={1} 
              px={2}
              borderRadius="md"
              _hover={{ 
                bg: highlightColor,
                cursor: 'pointer'
              }}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <Icon as={getEntityTypeIcon(suggestion.type)} color={`${getTypeColor(suggestion.type)}.500`} boxSize={4} />
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                {suggestion.label}
              </Text>
              <Badge 
                ml="auto" 
                colorScheme={getConfidenceColor(suggestion.confidence)}
                fontSize="xs"
              >
                {formatConfidence(suggestion.confidence)}
              </Badge>
            </HStack>
          ))}
        </VStack>
      </Box>
    );
  }
  
  // Render grid view mode
  if (viewMode === 'grid') {
    return (
      <Box 
        p={4} 
        borderWidth="1px" 
        borderRadius="md" 
        borderColor={borderColor}
        bg={bgColor}
        style={containerStyle}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="sm">{title}</Heading>
          
          {availableTypes.length > 1 && (
            <HStack spacing={1}>
              <IconButton 
                icon={<FiFilter />}
                variant="ghost"
                size="xs" 
                aria-label="Filter by all types"
                isActive={activeTypeFilter === 'all'}
                onClick={() => setActiveTypeFilter('all')}
              />
              {availableTypes.map(type => (
                <IconButton 
                  key={type}
                  icon={<Icon as={getEntityTypeIcon(type)} />}
                  variant="ghost"
                  size="xs"
                  aria-label={`Filter by ${type}`}
                  isActive={activeTypeFilter === type}
                  onClick={() => setActiveTypeFilter(type)}
                />
              ))}
            </HStack>
          )}
        </Flex>
        
        <Flex flexWrap="wrap" gap={3}>
          {filteredSuggestions.map(suggestion => (
            <Card 
              key={suggestion.id} 
              maxW="150px" 
              minW="130px" 
              bg={cardBg}
              borderRadius="md"
              overflow="hidden"
              cursor="pointer"
              onClick={() => handleSuggestionClick(suggestion)}
              _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
              transition="all 0.2s"
            >
              <CardHeader p={3} pb={1}>
                <Badge 
                  colorScheme={getTypeColor(suggestion.type)}
                  fontSize="xs"
                  px={2}
                  mb={2}
                >
                  <Icon as={getEntityTypeIcon(suggestion.type)} mr={1} />
                  {suggestion.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </Badge>
                <Heading size="xs" noOfLines={2}>
                  {suggestion.label}
                </Heading>
              </CardHeader>
              
              <CardBody py={1} px={3}>
                <Text fontSize="xs" color={mutedColor} noOfLines={2}>
                  {suggestion.reason || 'Suggested based on analysis'}
                </Text>
              </CardBody>
              
              <CardFooter p={3} pt={1}>
                <Badge 
                  colorScheme={getConfidenceColor(suggestion.confidence)}
                  fontSize="xs"
                  px={2}
                >
                  {formatConfidence(suggestion.confidence)} match
                </Badge>
              </CardFooter>
            </Card>
          ))}
        </Flex>
      </Box>
    );
  }
  
  // Default detailed view mode
  return (
    <Box 
      p={4} 
      borderWidth="1px" 
      borderRadius="md" 
      borderColor={borderColor}
      bg={bgColor}
      style={containerStyle}
    >
      <Flex justify="space-between" align="center" mb={4}>
        <HStack>
          <Heading size="sm">{title}</Heading>
          {flags.enableMachineLearning && (
            <Tooltip label="Using machine learning to find relevant connections">
              <Badge colorScheme="purple" variant="subtle">ML</Badge>
            </Tooltip>
          )}
        </HStack>
        
        <HStack>
          <IconButton
            icon={<FiRefreshCw />}
            size="sm"
            variant="ghost"
            aria-label="Refresh suggestions"
            onClick={fetchSuggestions}
          />
          
          {availableTypes.length > 1 && (
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiFilter />}
                variant="ghost"
                size="sm"
                aria-label="Filter suggestions"
              />
              <MenuList>
                <MenuItem 
                  onClick={() => setActiveTypeFilter('all')}
                  fontWeight={activeTypeFilter === 'all' ? 'bold' : 'normal'}
                >
                  All types
                </MenuItem>
                {availableTypes.map(type => (
                  <MenuItem 
                    key={type} 
                    onClick={() => setActiveTypeFilter(type)}
                    fontWeight={activeTypeFilter === type ? 'bold' : 'normal'}
                  >
                    <Icon as={getEntityTypeIcon(type)} mr={2} />
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>
          )}
        </HStack>
      </Flex>
      
      <VStack spacing={3} align="stretch">
        {filteredSuggestions.map(suggestion => (
          <Box 
            key={suggestion.id} 
            p={3}
            borderRadius="md"
            borderWidth="1px"
            borderColor={borderColor}
            bg={useColorModeValue('white', 'gray.800')}
            transition="all 0.2s"
            _hover={{ 
              borderColor: `${getTypeColor(suggestion.type)}.300`,
              boxShadow: 'sm'
            }}
          >
            {/* Entity Header with Confidence */}
            <HStack justify="space-between" mb={2}>
              <HStack spacing={3} onClick={() => handleSuggestionClick(suggestion)} cursor="pointer">
                <Avatar 
                  size="sm"
                  name={suggestion.label}
                  icon={<Icon as={getEntityTypeIcon(suggestion.type)} fontSize="1.5rem" />}
                  bg={`${getTypeColor(suggestion.type)}.100`}
                  color={`${getTypeColor(suggestion.type)}.700`}
                />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="medium">
                    {suggestion.label}
                  </Text>
                  <HStack>
                    <Badge 
                      size="sm" 
                      colorScheme={getTypeColor(suggestion.type)}
                      variant="subtle"
                    >
                      {suggestion.type.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Badge>
                    {suggestion.confidence !== undefined && (
                      <Badge 
                        colorScheme={getConfidenceColor(suggestion.confidence)} 
                        variant="subtle"
                      >
                        {formatConfidence(suggestion.confidence)}
                      </Badge>
                    )}
                  </HStack>
                </VStack>
              </HStack>
              
              <IconButton
                icon={<FiChevronRight />}
                variant="ghost"
                size="sm"
                aria-label="View entity"
                onClick={() => handleSuggestionClick(suggestion)}
              />
            </HStack>
            
            {/* Suggestion Reason */}
            {suggestion.reason && (
              <Text fontSize="sm" color={mutedColor} mb={2}>
                {suggestion.reason}
              </Text>
            )}
            
            {/* Tags */}
            {suggestion.tags && suggestion.tags.length > 0 && (
              <HStack mt={2} flexWrap="wrap">
                {suggestion.tags.slice(0, 3).map(tag => (
                  <Tag key={tag} size="sm" colorScheme={getTypeColor(suggestion.type)} variant="subtle">
                    <TagLabel>{tag}</TagLabel>
                  </Tag>
                ))}
                {suggestion.tags.length > 3 && (
                  <Tag size="sm" variant="subtle">
                    <TagLabel>+{suggestion.tags.length - 3} more</TagLabel>
                  </Tag>
                )}
              </HStack>
            )}
            
            {/* Feedback Section */}
            {!feedbackGiven[suggestion.id] ? (
              <Flex mt={2} justify="flex-end">
                <HStack spacing={1}>
                  <Text fontSize="xs" color={mutedColor}>Was this helpful?</Text>
                  <IconButton
                    icon={<FiThumbsUp />}
                    variant="ghost"
                    size="xs"
                    aria-label="Helpful suggestion"
                    onClick={() => handleFeedback(suggestion.id, true)}
                  />
                  <IconButton
                    icon={<FiThumbsDown />}
                    variant="ghost"
                    size="xs"
                    aria-label="Not helpful suggestion"
                    onClick={() => handleFeedback(suggestion.id, false)}
                  />
                </HStack>
              </Flex>
            ) : (
              <Flex mt={2} justify="flex-end">
                <Fade in>
                  <Text fontSize="xs" color="green.500">
                    Thanks for your feedback!
                  </Text>
                </Fade>
              </Flex>
            )}
          </Box>
        ))}
      </VStack>
      
      {/* Help Text */}
      <HStack mt={3} justify="center" spacing={1}>
        <Icon as={FiHelpCircle} color={mutedColor} boxSize={3} />
        <Text fontSize="xs" color={mutedColor}>
          These suggestions are personalized based on organizational patterns
        </Text>
      </HStack>
    </Box>
  );
};

export default EnhancedEntitySuggestions;