/**
 * EntitySuggestions.tsx
 * Enhanced component that displays AI-generated entity connection suggestions
 * with improved visualization and interaction
 */
import React, { useState } from 'react';
import { 
  Box, 
  Heading, 
  HStack, 
  VStack,
  Badge, 
  Icon, 
  Tooltip, 
  useColorModeValue,
  Text,
  Flex,
  Button,
  Avatar,
  Card,
  CardBody,
  CardFooter,
  Divider,
  useDisclosure,
  Collapse,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagLeftIcon,
  SimpleGrid,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton
} from '@chakra-ui/react';
import { 
  FiHelpCircle, 
  FiUsers, 
  FiUser,
  FiTarget, 
  FiFolder, 
  FiChevronDown, 
  FiChevronUp,
  FiInfo,
  FiBriefcase,
  FiBook,
  FiFlag,
  FiCheck,
  FiPlus,
  FiX,
  FiArrowRight,
  FiThumbsUp,
  FiThumbsDown,
  FiFilter
} from 'react-icons/fi';
import { MapNodeTypeEnum } from '../../../types/map';

export interface EntitySuggestion {
  id: string;
  type: MapNodeTypeEnum;
  label: string;
  reason?: string;
  confidence?: number; // 0 to 1 value representing ML confidence
  priority?: 'high' | 'medium' | 'low';
  similarity?: number; // 0 to 1 value representing similarity score
  tags?: string[]; // Associated tags
  recentInteraction?: boolean; // Flag if there was a recent interaction
  mutualConnections?: number; // Number of mutual connections
  description?: string; // Optional description of the entity
}

interface EntitySuggestionsProps {
  suggestions: EntitySuggestion[];
  onSuggestionClick: (suggestionId: string, label: string) => void;
  title?: string;
  isLoading?: boolean;
  maxShown?: number;
  viewMode?: 'compact' | 'cards' | 'list';
  onFeedback?: (suggestionId: string, isHelpful: boolean) => void;
  highlightPriority?: boolean;
}

// Get icon for node type
const getNodeIcon = (type: MapNodeTypeEnum) => {
  switch (type) {
    case MapNodeTypeEnum.USER:
      return FiUser;
    case MapNodeTypeEnum.TEAM:
      return FiUsers;
    case MapNodeTypeEnum.PROJECT:
      return FiFolder;
    case MapNodeTypeEnum.GOAL:
      return FiTarget;
    case MapNodeTypeEnum.KNOWLEDGE_ASSET:
      return FiBook;
    case MapNodeTypeEnum.DEPARTMENT:
      return FiBriefcase;
    default:
      return FiFlag;
  }
};

// Get color for node type
const getNodeColor = (type: MapNodeTypeEnum): string => {
  switch (type) {
    case MapNodeTypeEnum.USER:
      return 'blue';
    case MapNodeTypeEnum.TEAM:
      return 'green';
    case MapNodeTypeEnum.PROJECT:
      return 'purple';
    case MapNodeTypeEnum.GOAL:
      return 'orange';
    case MapNodeTypeEnum.KNOWLEDGE_ASSET:
      return 'cyan';
    case MapNodeTypeEnum.DEPARTMENT:
      return 'teal';
    default:
      return 'gray';
  }
};

const EntitySuggestions: React.FC<EntitySuggestionsProps> = ({
  suggestions,
  onSuggestionClick,
  title = "Suggested Connections",
  isLoading = false,
  maxShown = 5,
  viewMode = 'compact',
  onFeedback,
  highlightPriority = true
}) => {
  const [showAll, setShowAll] = useState(false);
  const [activeFilters, setActiveFilters] = useState<MapNodeTypeEnum[]>([]);
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  
  // Theme colors
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const highlightBg = useColorModeValue('yellow.50', 'yellow.900');
  const confidenceGood = useColorModeValue('green.50', 'green.900');
  const confidenceMed = useColorModeValue('orange.50', 'orange.900');
  const confidenceLow = useColorModeValue('red.50', 'red.900');
  
  if (!suggestions || suggestions.length === 0) return null;
  
  // Apply filters
  const filteredSuggestions = activeFilters.length > 0
    ? suggestions.filter(s => activeFilters.includes(s.type))
    : suggestions;
  
  // Get available entity types for filtering
  const availableTypes = Array.from(new Set(suggestions.map(s => s.type)));
  
  // Determine how many suggestions to show
  const visibleSuggestions = showAll 
    ? filteredSuggestions 
    : filteredSuggestions.slice(0, maxShown);
  
  // Handle filter toggle
  const toggleFilter = (type: MapNodeTypeEnum) => {
    if (activeFilters.includes(type)) {
      setActiveFilters(activeFilters.filter(t => t !== type));
    } else {
      setActiveFilters([...activeFilters, type]);
    }
  };
  
  // Compact view (badges)
  const renderCompactView = () => (
    <Wrap spacing={2}>
      {visibleSuggestions.map(suggestion => {
        const colorScheme = getNodeColor(suggestion.type);
        const Icon = getNodeIcon(suggestion.type);
        
        return (
          <WrapItem key={suggestion.id}>
            <Tag
              size="md"
              borderRadius="full"
              variant={highlightPriority && suggestion.priority === 'high' ? "solid" : "subtle"}
              colorScheme={colorScheme}
              cursor="pointer"
              onClick={() => onSuggestionClick(suggestion.id, suggestion.label)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSuggestionClick(suggestion.id, suggestion.label);
                  e.preventDefault();
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Connect to ${suggestion.label}${suggestion.reason ? `: ${suggestion.reason}` : ''}`}
              boxShadow={suggestion.priority === 'high' ? 'sm' : undefined}
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-1px)', boxShadow: 'sm' }}
            >
              <TagLeftIcon boxSize="12px" as={Icon} />
              <TagLabel>{suggestion.label}</TagLabel>
              {suggestion.reason && (
                <Popover trigger="hover" placement="top">
                  <PopoverTrigger>
                    <Box display="inline-flex" ml={1} alignItems="center">
                      <Icon as={FiHelpCircle} boxSize={3} />
                    </Box>
                  </PopoverTrigger>
                  <PopoverContent width="200px">
                    <PopoverArrow />
                    <PopoverBody fontSize="xs">{suggestion.reason}</PopoverBody>
                  </PopoverContent>
                </Popover>
              )}
            </Tag>
          </WrapItem>
        );
      })}
    </Wrap>
  );
  
  // Card view (detailed cards)
  const renderCardView = () => (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 3 }} spacing={3}>
      {visibleSuggestions.map(suggestion => {
        const colorScheme = getNodeColor(suggestion.type);
        const Icon = getNodeIcon(suggestion.type);
        
        // Determine background based on priority or confidence
        let bgColor = cardBg;
        if (highlightPriority && suggestion.priority) {
          if (suggestion.priority === 'high') bgColor = confidenceGood;
          else if (suggestion.priority === 'medium') bgColor = confidenceMed;
          else if (suggestion.priority === 'low') bgColor = confidenceLow;
        } else if (suggestion.confidence) {
          if (suggestion.confidence > 0.8) bgColor = confidenceGood;
          else if (suggestion.confidence > 0.4) bgColor = confidenceMed;
          else bgColor = confidenceLow;
        }
        
        return (
          <Card 
            key={suggestion.id}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="md"
            overflow="hidden"
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
            size="sm"
          >
            <CardBody p={3}>
              <HStack spacing={3} align="center" mb={2}>
                {suggestion.type === MapNodeTypeEnum.USER ? (
                  <Avatar name={suggestion.label} size="sm" bg={`${colorScheme}.500`} />
                ) : (
                  <Box 
                    borderRadius="full" 
                    bg={`${colorScheme}.100`} 
                    color={`${colorScheme}.700`}
                    p={2}
                    _dark={{
                      bg: `${colorScheme}.900`,
                      color: `${colorScheme}.200`
                    }}
                  >
                    <Icon as={Icon} />
                  </Box>
                )}
                <VStack spacing={0} align="flex-start">
                  <Text fontWeight="medium" fontSize="sm">{suggestion.label}</Text>
                  <Text fontSize="xs" color={textSecondary}>
                    {suggestion.type.replace('_', ' ').toLowerCase()}
                    {suggestion.mutualConnections && suggestion.mutualConnections > 0 && 
                      ` • ${suggestion.mutualConnections} mutual`}
                  </Text>
                </VStack>
              </HStack>
              
              {suggestion.reason && (
                <Text fontSize="xs" color={textSecondary} noOfLines={2} pl={1}>{suggestion.reason}</Text>
              )}
              
              {suggestion.tags && suggestion.tags.length > 0 && (
                <Wrap mt={2} spacing={1}>
                  {suggestion.tags.slice(0, 2).map((tag, i) => (
                    <Tag size="sm" key={i} colorScheme={colorScheme} variant="subtle">
                      {tag}
                    </Tag>
                  ))}
                  {suggestion.tags.length > 2 && <Text fontSize="xs">+{suggestion.tags.length - 2}</Text>}
                </Wrap>
              )}
            </CardBody>
            <Divider />
            <CardFooter pt={2} pb={2} px={3} display="flex" justifyContent="space-between">
              <Button 
                size="xs" 
                leftIcon={<FiArrowRight />}
                variant="ghost" 
                onClick={() => onSuggestionClick(suggestion.id, suggestion.label)}
              >
                View
              </Button>
              
              {onFeedback && (
                <HStack spacing={1}>
                  <Tooltip label="This suggestion is helpful">
                    <IconButton
                      aria-label="This suggestion is helpful"
                      icon={<FiThumbsUp />}
                      size="xs"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFeedback(suggestion.id, true);
                      }}
                    />
                  </Tooltip>
                  <Tooltip label="This suggestion is not helpful">
                    <IconButton
                      aria-label="This suggestion is not helpful"
                      icon={<FiThumbsDown />}
                      size="xs"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFeedback(suggestion.id, false);
                      }}
                    />
                  </Tooltip>
                </HStack>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </SimpleGrid>
  );
  
  // List view
  const renderListView = () => (
    <VStack spacing={1} align="stretch">
      {visibleSuggestions.map(suggestion => {
        const colorScheme = getNodeColor(suggestion.type);
        const Icon = getNodeIcon(suggestion.type);
        
        return (
          <Flex
            key={suggestion.id}
            p={2}
            borderRadius="md"
            cursor="pointer"
            alignItems="center"
            _hover={{ bg: hoverBg }}
            onClick={() => onSuggestionClick(suggestion.id, suggestion.label)}
            bgColor={highlightPriority && suggestion.priority === 'high' ? highlightBg : undefined}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSuggestionClick(suggestion.id, suggestion.label);
                e.preventDefault();
              }
            }}
          >
            <Box 
              borderRadius="full" 
              bg={`${colorScheme}.100`} 
              color={`${colorScheme}.700`}
              p={1}
              mr={3}
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxSize="24px"
              flexShrink={0}
              _dark={{
                bg: `${colorScheme}.900`,
                color: `${colorScheme}.200`
              }}
            >
              <Icon as={Icon} boxSize="14px" />
            </Box>
            
            <Box flex="1">
              <Text fontSize="sm" fontWeight="medium">{suggestion.label}</Text>
              {suggestion.reason && <Text fontSize="xs" color={textSecondary}>{suggestion.reason}</Text>}
            </Box>
            
            <IconButton
              aria-label={`Connect to ${suggestion.label}`}
              icon={<FiArrowRight />}
              size="xs"
              variant="ghost"
            />
          </Flex>
        );
      })}
    </VStack>
  );
  
  return (
    <Box 
      mt={4} 
      borderWidth="1px" 
      borderRadius="md" 
      borderColor={borderColor}
      aria-labelledby="suggestions-heading"
      overflow="hidden"
    >
      {/* Header */}
      <Flex 
        p={3} 
        bg={headerBg} 
        justifyContent="space-between" 
        alignItems="center" 
        onClick={onToggle} 
        cursor="pointer"
      >
        <HStack>
          <Icon as={isOpen ? FiChevronUp : FiChevronDown} />
          <Heading size="xs" id="suggestions-heading">{title}</Heading>
          <Badge colorScheme="blue" ml={1}>{filteredSuggestions.length}</Badge>
        </HStack>
        
        {availableTypes.length > 1 && (
          <Popover closeOnBlur={true} placement="bottom-end">
            <PopoverTrigger>
              <IconButton
                aria-label="Filter suggestions"
                icon={<FiFilter />}
                size="xs"
                variant="ghost"
                onClick={(e) => e.stopPropagation()}
                colorScheme={activeFilters.length > 0 ? "blue" : undefined}
              />
            </PopoverTrigger>
            <PopoverContent width="200px">
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader fontSize="sm">Filter by type</PopoverHeader>
              <PopoverBody>
                <VStack align="stretch" spacing={1}>
                  {availableTypes.map(type => (
                    <Flex 
                      key={type} 
                      alignItems="center" 
                      p={1} 
                      borderRadius="md"
                      cursor="pointer"
                      onClick={() => toggleFilter(type)}
                      bg={activeFilters.includes(type) ? `${getNodeColor(type)}.50` : undefined}
                      _hover={{ bg: hoverBg }}
                      _dark={{
                        bg: activeFilters.includes(type) ? `${getNodeColor(type)}.900` : undefined,
                      }}
                    >
                      <Icon 
                        as={getNodeIcon(type)} 
                        color={`${getNodeColor(type)}.500`} 
                        mr={2} 
                      />
                      <Text fontSize="sm">{type.replace('_', ' ').toLowerCase()}</Text>
                      <Box flex="1" />
                      <Icon 
                        as={activeFilters.includes(type) ? FiCheck : undefined} 
                        color={`${getNodeColor(type)}.500`} 
                      />
                    </Flex>
                  ))}
                  
                  {activeFilters.length > 0 && (
                    <>
                      <Divider my={1} />
                      <Button 
                        size="xs" 
                        variant="ghost" 
                        leftIcon={<FiX />}
                        onClick={() => setActiveFilters([])}
                      >
                        Clear filters
                      </Button>
                    </>
                  )}
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        )}
      </Flex>
      
      <Collapse in={isOpen} animateOpacity>
        <Box p={3}>
          {/* Info text about suggestions */}
          <Box mb={3}>
            <Flex alignItems="center">
              <Icon as={FiInfo} color={textSecondary} mr={1} />
              <Text fontSize="xs" color={textSecondary} fontStyle="italic">
                These suggestions are based on your activity and organizational patterns.
              </Text>
            </Flex>
          </Box>
          
          {/* Suggestions based on view mode */}
          {viewMode === 'cards' ? renderCardView() : 
           viewMode === 'list' ? renderListView() : 
           renderCompactView()}
          
          {/* Show more/less button */}
          {filteredSuggestions.length > maxShown && (
            <Button 
              size="xs" 
              width="full" 
              variant="ghost" 
              mt={3}
              leftIcon={showAll ? <FiChevronUp /> : <FiChevronDown />}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show All (${filteredSuggestions.length})`}
            </Button>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default EntitySuggestions;