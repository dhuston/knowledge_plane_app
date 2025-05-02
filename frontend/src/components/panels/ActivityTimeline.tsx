import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  Text,
  Heading,
  Spinner,
  HStack,
  useColorModeValue,
  Icon,
  Divider,
  Badge,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  InputGroup,
  Input,
  InputLeftElement,
  Flex,
  Tooltip,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Tag,
  TagLabel,
  Collapse,
  useDisclosure
} from '@chakra-ui/react';
import { 
  FiMessageSquare, 
  FiEdit, 
  FiLink, 
  FiPlus, 
  FiCheck, 
  FiAlertCircle,
  FiClock,
  FiMoreHorizontal,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiUser,
  FiTrash2
} from 'react-icons/fi';

import { Activity } from '../../types/entities';

interface ActivityTimelineProps {
  activities: Activity[];
  isLoading: boolean;
}

// Activity colors by type
const activityColors: Record<string, string> = {
  comment: 'blue',
  update: 'purple',
  link: 'cyan',
  create: 'green',
  complete: 'teal',
  alert: 'orange',
  delete: 'red'
};

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities, isLoading }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const { isOpen: isFilterOpen, onToggle: onToggleFilter } = useDisclosure();
  
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const timelineBg = useColorModeValue('gray.50', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const timelineIndicatorColor = useColorModeValue('blue.500', 'blue.300');
  
  // Filter and group activities
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      // Apply search filter
      const matchesSearch = !searchQuery || 
        activity.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.user.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply type filter
      const matchesType = selectedTypes.length === 0 || 
        selectedTypes.includes(activity.type.toLowerCase());
      
      return matchesSearch && matchesType;
    });
  }, [activities, searchQuery, selectedTypes]);

  // Group by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    
    filteredActivities.forEach(activity => {
      const date = new Date(activity.timestamp);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });
    
    return Object.entries(groups)
      .sort(([dateKeyA], [dateKeyB]) => dateKeyB.localeCompare(dateKeyA))
      .map(([dateKey, acts]) => ({
        date: new Date(acts[0].timestamp),
        activities: acts.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      }));
  }, [filteredActivities]);
  
  // Available activity types
  const activityTypes = useMemo(() => {
    const types = new Set<string>();
    activities.forEach(activity => {
      types.add(activity.type.toLowerCase());
    });
    return Array.from(types);
  }, [activities]);

  // Toggle a filter in the selected types
  const toggleFilter = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTypes([]);
    setSearchQuery('');
  };
  
  // Get icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'comment':
        return FiMessageSquare;
      case 'update':
        return FiEdit;
      case 'link':
        return FiLink;
      case 'create':
        return FiPlus;
      case 'complete':
        return FiCheck;
      case 'alert':
        return FiAlertCircle;
      case 'delete':
        return FiTrash2;
      default:
        return FiClock;
    }
  };
  
  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
    }
    
    if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    
    if (diffDays === 1) {
      return 'Yesterday';
    }
    
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    
    // Format as date for older activities
    return date.toLocaleDateString();
  };
  
  // Format date for group header
  const formatDateHeader = (date: Date): string => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    
    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Return formatted date
    return date.toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Get color for activity type
  const getActivityColor = (type: string): string => {
    const normalizedType = type.toLowerCase();
    return activityColors[normalizedType] || 'gray';
  };
  
  // Toggle expanded activity details
  const toggleActivityExpansion = (activityId: string) => {
    if (expandedActivity === activityId) {
      setExpandedActivity(null);
    } else {
      setExpandedActivity(activityId);
    }
  };

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch">
        <Box p={3} bg={headerBg} borderRadius="md">
          <Heading size="sm">Activity Timeline</Heading>
        </Box>
        <Box textAlign="center" py={4}>
          <Spinner size="md" thickness="3px" speed="0.65s" color="blue.500" />
        </Box>
      </VStack>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <VStack spacing={4} align="stretch">
        <Box p={3} bg={headerBg} borderRadius="md">
          <Heading size="sm">Activity Timeline</Heading>
        </Box>
        <Box p={8} textAlign="center">
          <Icon as={FiClock} boxSize={8} color="gray.400" mb={3} />
          <Text color="gray.500" fontSize="sm">
            No recent activity
          </Text>
        </Box>
      </VStack>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Box p={3} bg={headerBg} borderRadius="md">
        <HStack justifyContent="space-between">
          <Heading size="sm">Activity Timeline</Heading>
          <HStack spacing={2}>
            <Badge colorScheme="blue" px={2} borderRadius="full">
              {filteredActivities.length}
            </Badge>
            <IconButton
              aria-label="Filter activities"
              icon={<FiFilter />}
              size="xs"
              variant={isFilterOpen ? "solid" : "outline"}
              colorScheme={isFilterOpen ? "blue" : undefined}
              onClick={onToggleFilter}
            />
          </HStack>
        </HStack>
      </Box>
      
      {/* Search and Filter Controls */}
      <Collapse in={isFilterOpen} animateOpacity>
        <Box mb={4} p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor} bg={cardBg}>
          <VStack spacing={3}>
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input 
                placeholder="Search activities" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
            
            <Box width="100%">
              <Text fontSize="xs" fontWeight="medium" mb={2}>
                Filter by type:
              </Text>
              <Flex wrap="wrap" gap={2}>
                {activityTypes.map(type => (
                  <Badge
                    key={type}
                    colorScheme={selectedTypes.includes(type) ? getActivityColor(type) : "gray"}
                    variant={selectedTypes.includes(type) ? "solid" : "subtle"}
                    px={2}
                    py={1}
                    borderRadius="full"
                    cursor="pointer"
                    onClick={() => toggleFilter(type)}
                    opacity={selectedTypes.length > 0 && !selectedTypes.includes(type) ? 0.6 : 1}
                  >
                    <HStack spacing={1}>
                      <Icon as={getActivityIcon(type)} boxSize={3} />
                      <Text fontSize="xs" textTransform="capitalize">{type}</Text>
                    </HStack>
                  </Badge>
                ))}
                
                {(selectedTypes.length > 0 || searchQuery) && (
                  <Button 
                    size="xs" 
                    variant="link" 
                    onClick={clearFilters}
                    ml={1}
                    color="blue.500"
                  >
                    Clear all
                  </Button>
                )}
              </Flex>
            </Box>
          </VStack>
        </Box>
      </Collapse>

      {/* No results message */}
      {filteredActivities.length === 0 ? (
        <Box p={6} textAlign="center">
          <Text color="gray.500" fontSize="sm">
            No activities match your filters
          </Text>
          <Button 
            size="sm" 
            variant="link" 
            onClick={clearFilters}
            mt={2}
          >
            Clear filters
          </Button>
        </Box>
      ) : (
        // Timeline with date groups
        <Box 
          borderWidth="1px" 
          borderRadius="md" 
          borderColor={borderColor} 
          bg={cardBg} 
          overflow="hidden"
        >
          {groupedActivities.map((group, groupIdx) => (
            <Box 
              key={group.date.toISOString()} 
              borderBottomWidth={groupIdx < groupedActivities.length - 1 ? "1px" : "0"}
              borderColor={borderColor}
            >
              {/* Date header */}
              <HStack 
                p={3}
                bg={headerBg}
                borderBottomWidth="1px"
                borderColor={borderColor}
                spacing={2}
              >
                <Icon as={FiCalendar} color="gray.500" boxSize={3} />
                <Text fontSize="sm" fontWeight="medium">
                  {formatDateHeader(group.date)}
                </Text>
              </HStack>
              
              {/* Activities for this date */}
              <Box>
                {group.activities.map((activity, idx) => {
                  const colorScheme = getActivityColor(activity.type);
                  const isExpanded = expandedActivity === activity.id;
                  
                  return (
                    <Box 
                      key={activity.id}
                      position="relative" 
                      p={3}
                      borderBottomWidth={idx < group.activities.length - 1 ? "1px" : "0"}
                      borderColor={borderColor}
                      _hover={{ bg: timelineBg }}
                      transition="background 0.2s"
                    >
                      <HStack spacing={3} align="flex-start">
                        {/* Activity icon */}
                        <Box 
                          p={2} 
                          borderRadius="full" 
                          bg={`${colorScheme}.50`} 
                          color={`${colorScheme}.500`}
                          _dark={{ 
                            bg: `${colorScheme}.900`, 
                            color: `${colorScheme}.200` 
                          }}
                        >
                          <Icon as={getActivityIcon(activity.type)} boxSize={4} />
                        </Box>
                        
                        {/* Activity content */}
                        <VStack align="stretch" spacing={1} flex="1">
                          {/* Header row */}
                          <Flex justify="space-between" align="center">
                            <HStack>
                              <Text fontSize="sm" fontWeight="medium">{activity.user}</Text>
                              <Badge 
                                colorScheme={colorScheme} 
                                fontSize="xs"
                                textTransform="capitalize"
                              >
                                {activity.type}
                              </Badge>
                            </HStack>
                            <Text fontSize="xs" color="gray.500">
                              {formatRelativeTime(activity.timestamp)}
                            </Text>
                          </Flex>
                          
                          {/* Activity message */}
                          <Box>
                            <Text fontSize="sm">{activity.message}</Text>
                          </Box>
                          
                          {/* Activity details (shown when expanded) */}
                          <Collapse in={isExpanded} animateOpacity>
                            <Box 
                              mt={2}
                              p={3}
                              borderRadius="md"
                              borderWidth="1px"
                              borderColor={borderColor}
                              bg={timelineBg}
                            >
                              <VStack align="stretch" spacing={2}>
                                {/* Timestamp */}
                                <HStack justify="space-between">
                                  <Text fontSize="xs" color="gray.500">Full timestamp:</Text>
                                  <Text fontSize="xs">
                                    {new Date(activity.timestamp).toLocaleString()}
                                  </Text>
                                </HStack>
                                
                                {/* Entity information if available */}
                                {activity.entity_id && (
                                  <HStack justify="space-between">
                                    <Text fontSize="xs" color="gray.500">Related entity:</Text>
                                    <Text fontSize="xs">{activity.entity_type || 'Unknown'} ({activity.entity_id})</Text>
                                  </HStack>
                                )}
                                
                                {/* Additional details would go here */}
                              </VStack>
                            </Box>
                          </Collapse>
                          
                          {/* Toggle details button */}
                          <Button
                            size="xs"
                            variant="ghost"
                            rightIcon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                            onClick={() => toggleActivityExpansion(activity.id)}
                            alignSelf="flex-end"
                            mt={1}
                          >
                            {isExpanded ? 'Less details' : 'More details'}
                          </Button>
                        </VStack>
                      </HStack>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Load more button */}
      {filteredActivities.length > 0 && (
        <Button 
          variant="outline" 
          size="sm" 
          leftIcon={<FiMoreHorizontal />}
          alignSelf="center"
          mt={2}
          onClick={() => {
            // In a real implementation, this would load more activities
            window.alert('Loading more activities would be implemented in a real application');
          }}
        >
          Load More Activities
        </Button>
      )}
    </VStack>
  );
};

export default ActivityTimeline;