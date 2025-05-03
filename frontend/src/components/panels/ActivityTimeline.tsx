import React, { useState, useMemo, useRef, useCallback } from 'react';
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
  TagCloseButton,
  Collapse,
  useDisclosure,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Switch,
  FormLabel,
  FormControl,
  Select,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Stack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Portal,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Grid,
  GridItem,
  ThemingProps
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
  FiTrash2,
  FiSliders,
  FiStar,
  FiBarChart2,
  FiList,
  FiGrid,
  FiSave,
  FiX,
  FiDownload,
  FiArrowUp,
  FiArrowDown,
  FiSettings,
  FiBell,
  FiBookmark,
  FiTag,
  FiActivity,
  FiShare2,
  FiExternalLink
} from 'react-icons/fi';
import { MapNodeTypeEnum } from '../../types/map';
import { Activity } from '../../types/entities';

// Date range filter type
interface DateRange {
  start?: Date;
  end?: Date;
}

// Activity filter configuration
interface ActivityFilter {
  searchQuery: string;
  types: string[];
  dateRange: DateRange;
  users: string[];
  entities: Array<{
    id: string;
    type: MapNodeTypeEnum | string;
  }>;
  importance: [number, number]; // [min, max] in range 0-10
  sortBy: 'newest' | 'oldest' | 'importance' | 'activity';
  showRead: boolean;
}

// Available view modes
type ViewMode = 'list' | 'compact' | 'detailed' | 'calendar';

// Timeline props with enhanced options
interface ActivityTimelineProps {
  activities: Activity[];
  isLoading: boolean;
  onLoadMore?: () => Promise<void>;
  hasMoreActivities?: boolean;
  initialFilter?: Partial<ActivityFilter>;
  onFilterChange?: (filter: ActivityFilter) => void;
  maxHeight?: string | number;
  viewOptions?: ViewMode[];
  defaultViewMode?: ViewMode;
  showViewSelector?: boolean;
  enableAdvancedFiltering?: boolean;
  onActivitySelect?: (activity: Activity) => void;
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

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  isLoading,
  onLoadMore,
  hasMoreActivities = false,
  initialFilter,
  onFilterChange,
  maxHeight,
  viewOptions = ['list', 'compact', 'detailed'],
  defaultViewMode = 'list',
  showViewSelector = true,
  enableAdvancedFiltering = false,
  onActivitySelect
}) => {
  // Advanced filter drawer state
  const { isOpen: isAdvancedFilterOpen, onOpen: onOpenAdvancedFilter, onClose: onCloseAdvancedFilter } = useDisclosure();
  
  // Filter UI visibility
  const { isOpen: isFilterOpen, onToggle: onToggleFilter } = useDisclosure();
  
  // Current view mode
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  
  // Selected calendar date when in calendar view
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Loading state for "load more" functionality
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Expanded activity detail
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  
  // Selected activities (for multi-select operations)
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());
  
  // Filter state
  const [filter, setFilter] = useState<ActivityFilter>({
    searchQuery: '',
    types: [],
    dateRange: {},
    users: [],
    entities: [],
    importance: [0, 10],
    sortBy: 'newest',
    showRead: true,
    ...initialFilter
  });
  
  // Saved filter preset state
  const [savedFilters, setSavedFilters] = useState<Record<string, ActivityFilter>>({});
  
  // Observer ref for infinite scrolling
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Theme values
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const timelineBg = useColorModeValue('gray.50', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const timelineIndicatorColor = useColorModeValue('blue.500', 'blue.300');
  const highlightColor = useColorModeValue('blue.50', 'blue.900');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const successColor = useColorModeValue('green.500', 'green.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Get available activity types
  const activityTypes = useMemo(() => {
    const types = new Set<string>();
    activities.forEach(activity => {
      types.add(activity.type.toLowerCase());
    });
    return Array.from(types);
  }, [activities]);
  
  // Get available users
  const availableUsers = useMemo(() => {
    const users = new Set<string>();
    activities.forEach(activity => {
      users.add(activity.user);
    });
    return Array.from(users);
  }, [activities]);
  
  // Get available entities
  const availableEntities = useMemo(() => {
    const entities = new Map<string, { id: string, type: string }>();
    
    activities.forEach(activity => {
      if (activity.entity_id && activity.entity_type) {
        const key = `${activity.entity_type}-${activity.entity_id}`;
        entities.set(key, {
          id: activity.entity_id,
          type: activity.entity_type
        });
      }
    });
    
    return Array.from(entities.values());
  }, [activities]);
  
  // Apply filters to activities
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      // Search query filter
      const matchesSearch = !filter.searchQuery || 
        activity.message.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
        activity.user.toLowerCase().includes(filter.searchQuery.toLowerCase()) ||
        (activity.entity_type && activity.entity_type.toLowerCase().includes(filter.searchQuery.toLowerCase()));
      
      // Activity type filter
      const matchesType = filter.types.length === 0 || 
        filter.types.includes(activity.type.toLowerCase());
      
      // User filter
      const matchesUser = filter.users.length === 0 ||
        filter.users.includes(activity.user);
        
      // Entity filter
      const matchesEntity = filter.entities.length === 0 ||
        (activity.entity_id && activity.entity_type && filter.entities.some(
          entity => entity.id === activity.entity_id && entity.type === activity.entity_type
        ));
      
      // Date range filter
      let matchesDateRange = true;
      if (filter.dateRange.start || filter.dateRange.end) {
        const activityDate = new Date(activity.timestamp);
        
        if (filter.dateRange.start) {
          matchesDateRange = matchesDateRange && activityDate >= filter.dateRange.start;
        }
        
        if (filter.dateRange.end) {
          // Include the entire end day
          const endDate = new Date(filter.dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && activityDate <= endDate;
        }
      }
      
      // Calendar date filter
      let matchesCalendarDate = true;
      if (selectedDate && viewMode === 'calendar') {
        const activityDate = new Date(activity.timestamp);
        matchesCalendarDate = 
          activityDate.getFullYear() === selectedDate.getFullYear() &&
          activityDate.getMonth() === selectedDate.getMonth() &&
          activityDate.getDate() === selectedDate.getDate();
      }
      
      return matchesSearch && 
             matchesType && 
             matchesUser && 
             matchesEntity && 
             matchesDateRange && 
             matchesCalendarDate;
    });
  }, [activities, filter, selectedDate, viewMode]);
  
  // Apply sorting to filtered activities
  const sortedActivities = useMemo(() => {
    let sorted = [...filteredActivities];
    
    switch (filter.sortBy) {
      case 'newest':
        sorted.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        break;
      case 'oldest':
        sorted.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        break;
      case 'importance':
        // Sort by importance (mock implementation - would use actual importance value)
        sorted.sort((a, b) => {
          // Use type as a proxy for importance
          const importanceA = a.type === 'alert' ? 10 : 
                              a.type === 'create' ? 8 : 
                              a.type === 'complete' ? 7 : 5;
          const importanceB = b.type === 'alert' ? 10 : 
                              b.type === 'create' ? 8 : 
                              b.type === 'complete' ? 7 : 5;
          return importanceB - importanceA;
        });
        break;
      case 'activity':
        // Sort by activity type alphabetically
        sorted.sort((a, b) => a.type.localeCompare(b.type));
        break;
    }
    
    return sorted;
  }, [filteredActivities, filter.sortBy]);
  
  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    
    sortedActivities.forEach(activity => {
      const date = new Date(activity.timestamp);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });
    
    // Sort groups by date (newest first)
    return Object.entries(groups)
      .sort(([dateKeyA], [dateKeyB]) => {
        if (filter.sortBy === 'oldest') {
          return dateKeyA.localeCompare(dateKeyB);
        }
        return dateKeyB.localeCompare(dateKeyA);
      })
      .map(([dateKey, acts]) => ({
        date: new Date(acts[0].timestamp),
        activities: acts
      }));
  }, [sortedActivities, filter.sortBy]);
  
  // Generate calendar data for calendar view
  const calendarData = useMemo(() => {
    // Calendar data structure will be generated here
    // This is a placeholder for the real implementation
    return {
      months: [] as any[],
      activityCountByDate: {} as Record<string, number>
    };
  }, [activities]);
  
  // Update filter and notify parent if needed
  const updateFilter = useCallback((updates: Partial<ActivityFilter>) => {
    setFilter(prev => {
      const newFilter = { ...prev, ...updates };
      // Notify parent component if callback exists
      if (onFilterChange) {
        onFilterChange(newFilter);
      }
      return newFilter;
    });
  }, [onFilterChange]);
  
  // Reset filter to defaults
  const resetFilter = useCallback(() => {
    const defaultFilter: ActivityFilter = {
      searchQuery: '',
      types: [],
      dateRange: {},
      users: [],
      entities: [],
      importance: [0, 10],
      sortBy: 'newest',
      showRead: true,
      ...initialFilter
    };
    
    setFilter(defaultFilter);
    if (onFilterChange) {
      onFilterChange(defaultFilter);
    }
  }, [initialFilter, onFilterChange]);
  
  // Toggle activity type filter
  const toggleTypeFilter = useCallback((type: string) => {
    updateFilter({
      types: filter.types.includes(type)
        ? filter.types.filter(t => t !== type)
        : [...filter.types, type]
    });
  }, [filter.types, updateFilter]);
  
  // Toggle user filter
  const toggleUserFilter = useCallback((user: string) => {
    updateFilter({
      users: filter.users.includes(user)
        ? filter.users.filter(u => u !== user)
        : [...filter.users, user]
    });
  }, [filter.users, updateFilter]);
  
  // Toggle entity filter
  const toggleEntityFilter = useCallback((entity: { id: string, type: string }) => {
    const entityExists = filter.entities.some(
      e => e.id === entity.id && e.type === entity.type
    );
    
    updateFilter({
      entities: entityExists
        ? filter.entities.filter(e => !(e.id === entity.id && e.type === entity.type))
        : [...filter.entities, entity]
    });
  }, [filter.entities, updateFilter]);
  
  // Handle search input
  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilter({ searchQuery: e.target.value });
  }, [updateFilter]);
  
  // Save current filter as preset
  const saveFilterPreset = useCallback((name: string) => {
    if (!name.trim()) return;
    
    setSavedFilters(prev => ({
      ...prev,
      [name]: { ...filter }
    }));
  }, [filter]);
  
  // Load a saved filter preset
  const loadFilterPreset = useCallback((name: string) => {
    const savedFilter = savedFilters[name];
    if (savedFilter) {
      setFilter(savedFilter);
      if (onFilterChange) {
        onFilterChange(savedFilter);
      }
    }
  }, [savedFilters, onFilterChange]);
  
  // Toggle activity selection (for multi-select operations)
  const toggleActivitySelection = useCallback((activityId: string) => {
    setSelectedActivities(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(activityId)) {
        newSelection.delete(activityId);
      } else {
        newSelection.add(activityId);
      }
      return newSelection;
    });
  }, []);
  
  // Clear all activity selections
  const clearActivitySelection = useCallback(() => {
    setSelectedActivities(new Set());
  }, []);
  
  // Select all currently visible activities
  const selectAllActivities = useCallback(() => {
    const newSelection = new Set<string>();
    sortedActivities.forEach(activity => {
      newSelection.add(activity.id);
    });
    setSelectedActivities(newSelection);
  }, [sortedActivities]);
  
  // Handle load more button click
  const handleLoadMore = useCallback(async () => {
    if (onLoadMore && !isLoadingMore) {
      setIsLoadingMore(true);
      try {
        await onLoadMore();
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [onLoadMore, isLoadingMore]);
  
  // Setup intersection observer for infinite scrolling
  React.useEffect(() => {
    if (!onLoadMore || !hasMoreActivities) return;
    
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoadingMore) {
        handleLoadMore();
      }
    }, options);
    
    observerRef.current = observer;
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observer && loadMoreRef.current) {
        observer.disconnect();
      }
    };
  }, [hasMoreActivities, onLoadMore, isLoadingMore, handleLoadMore]);
  
  // Clear all filters
  const clearAllFilters = () => {
    resetFilter();
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

  // Activity panel for displaying detailed info
  const ActivityDetailPanel = ({ activity }: { activity: Activity }) => {
    const colorScheme = getActivityColor(activity.type);
    
    return (
      <Box 
        p={4}
        borderRadius="md"
        borderWidth="1px"
        borderColor={borderColor}
        bg={timelineBg}
      >
        <VStack align="stretch" spacing={3}>
          <HStack justify="space-between">
            <Badge colorScheme={colorScheme} px={2} py={1} borderRadius="full">
              {activity.type}
            </Badge>
            <Text fontSize="xs" color="gray.500">
              {new Date(activity.timestamp).toLocaleString()}
            </Text>
          </HStack>
          
          <Box>
            <Text fontWeight="medium" mb={1}>Message</Text>
            <Text>{activity.message}</Text>
          </Box>
          
          <Divider />
          
          <Grid templateColumns="1fr 2fr" gap={2}>
            <Text fontSize="sm" color="gray.500">User:</Text>
            <Text fontSize="sm" fontWeight="medium">{activity.user}</Text>
            
            {activity.entity_id && activity.entity_type && (
              <>
                <Text fontSize="sm" color="gray.500">Related entity:</Text>
                <Button
                  size="xs"
                  variant="link"
                  onClick={() => {
                    if (onActivitySelect) {
                      onActivitySelect(activity);
                    }
                  }}
                  justifyContent="flex-start"
                >
                  {activity.entity_type}: {activity.entity_id}
                </Button>
              </>
            )}
          </Grid>
          
          <HStack spacing={2} justifyContent="flex-end">
            <Button size="xs" leftIcon={<FiShare2 />} variant="ghost">
              Share
            </Button>
            <Button size="xs" leftIcon={<FiBookmark />} variant="ghost">
              Save
            </Button>
          </HStack>
        </VStack>
      </Box>
    );
  };
  
  // Basic multi-day calendar for calendar view
  const SimpleCalendarView = () => {
    return (
      <Box p={4} textAlign="center">
        <Text color="gray.500">
          Calendar view is under development
        </Text>
      </Box>
    );
  };
  
  // Filter tag component
  const FilterTag = ({ 
    label, 
    onRemove,
    colorScheme = "blue" 
  }: {
    label: string;
    onRemove: () => void;
    colorScheme?: string;
  }) => {
    return (
      <Tag size="sm" borderRadius="full" variant="subtle" colorScheme={colorScheme}>
        <TagLabel>{label}</TagLabel>
        <TagCloseButton onClick={onRemove} />
      </Tag>
    );
  };
  
  // Active filters display
  const ActiveFilterDisplay = () => {
    if (filter.searchQuery.length === 0 && 
        filter.types.length === 0 && 
        filter.users.length === 0 && 
        filter.entities.length === 0 && 
        !filter.dateRange.start && 
        !filter.dateRange.end) {
      return null;
    }
    
    return (
      <Flex wrap="wrap" gap={2} mb={3}>
        {filter.searchQuery && (
          <FilterTag 
            label={`Search: ${filter.searchQuery}`}
            onRemove={() => updateFilter({ searchQuery: '' })}
          />
        )}
        
        {filter.types.map(type => (
          <FilterTag
            key={`type-${type}`}
            label={`Type: ${type}`}
            colorScheme={getActivityColor(type)}
            onRemove={() => toggleTypeFilter(type)}
          />
        ))}
        
        {filter.users.map(user => (
          <FilterTag
            key={`user-${user}`}
            label={`User: ${user}`}
            colorScheme="purple"
            onRemove={() => toggleUserFilter(user)}
          />
        ))}
        
        {filter.entities.map(entity => (
          <FilterTag
            key={`entity-${entity.type}-${entity.id}`}
            label={`${entity.type}: ${entity.id}`}
            colorScheme="teal"
            onRemove={() => toggleEntityFilter(entity)}
          />
        ))}
        
        {(filter.dateRange.start || filter.dateRange.end) && (
          <FilterTag
            label={`Date: ${filter.dateRange.start ? new Date(filter.dateRange.start).toLocaleDateString() : ''} - ${filter.dateRange.end ? new Date(filter.dateRange.end).toLocaleDateString() : ''}`}
            colorScheme="orange"
            onRemove={() => updateFilter({ dateRange: {} })}
          />
        )}
        
        {/* Clear all button */}
        <Button 
          size="xs" 
          variant="link" 
          leftIcon={<FiX />}
          onClick={clearAllFilters}
        >
          Clear all
        </Button>
      </Flex>
    );
  };
  
  // Advanced Filter Drawer component
  const AdvancedFilterDrawer = () => {
    return (
      <Drawer
        isOpen={isAdvancedFilterOpen}
        placement="right"
        onClose={onCloseAdvancedFilter}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            Advanced Filtering
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={6} align="stretch" pt={4}>
              {/* Search */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Search</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search activities"
                    value={filter.searchQuery}
                    onChange={handleSearchInput}
                  />
                </InputGroup>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Search in message content, users, or entity types
                </Text>
              </FormControl>
              
              {/* Activity Types */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Activity Types</FormLabel>
                <Box maxH="200px" overflowY="auto">
                  <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                    {activityTypes.map(type => (
                      <Button
                        key={type}
                        size="sm"
                        variant={filter.types.includes(type) ? "solid" : "outline"}
                        colorScheme={filter.types.includes(type) ? getActivityColor(type) : undefined}
                        leftIcon={<Icon as={getActivityIcon(type)} />}
                        justifyContent="flex-start"
                        onClick={() => toggleTypeFilter(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </Grid>
                </Box>
              </FormControl>
              
              {/* Users */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Users</FormLabel>
                <Select 
                  placeholder="Filter by user" 
                  variant="outline"
                  onChange={(e) => {
                    if (e.target.value) {
                      toggleUserFilter(e.target.value);
                    }
                  }}
                >
                  {availableUsers.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </Select>
                
                {/* Selected users */}
                {filter.users.length > 0 && (
                  <Flex mt={2} wrap="wrap" gap={2}>
                    {filter.users.map(user => (
                      <Tag 
                        key={user} 
                        size="md" 
                        borderRadius="full" 
                        variant="subtle" 
                        colorScheme="purple"
                      >
                        <TagLabel>{user}</TagLabel>
                        <TagCloseButton onClick={() => toggleUserFilter(user)} />
                      </Tag>
                    ))}
                  </Flex>
                )}
              </FormControl>
              
              {/* Date Range */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Date Range</FormLabel>
                <Grid templateColumns="1fr 1fr" gap={4}>
                  <Box>
                    <Text fontSize="xs" mb={1}>Start Date</Text>
                    <Input 
                      type="date"
                      value={filter.dateRange.start ? new Date(filter.dateRange.start).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const start = e.target.value ? new Date(e.target.value) : undefined;
                        updateFilter({
                          dateRange: { ...filter.dateRange, start }
                        });
                      }}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="xs" mb={1}>End Date</Text>
                    <Input 
                      type="date"
                      value={filter.dateRange.end ? new Date(filter.dateRange.end).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const end = e.target.value ? new Date(e.target.value) : undefined;
                        updateFilter({
                          dateRange: { ...filter.dateRange, end }
                        });
                      }}
                    />
                  </Box>
                </Grid>
                
                {/* Quick date ranges */}
                <HStack mt={3} spacing={2}>
                  <Button 
                    size="xs" 
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date();
                      weekAgo.setDate(today.getDate() - 7);
                      updateFilter({
                        dateRange: { start: weekAgo, end: today }
                      });
                    }}
                  >
                    Last 7 days
                  </Button>
                  <Button 
                    size="xs" 
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date();
                      monthAgo.setMonth(today.getMonth() - 1);
                      updateFilter({
                        dateRange: { start: monthAgo, end: today }
                      });
                    }}
                  >
                    Last 30 days
                  </Button>
                  <Button 
                    size="xs" 
                    variant="outline" 
                    onClick={() => updateFilter({ dateRange: {} })}
                  >
                    Clear
                  </Button>
                </HStack>
              </FormControl>
              
              {/* Importance filter */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">
                  Importance Level ({filter.importance[0]}-{filter.importance[1]})
                </FormLabel>
                <RangeSlider
                  min={0}
                  max={10}
                  step={1}
                  value={filter.importance}
                  onChange={(values) => updateFilter({ importance: values as [number, number] })}
                  colorScheme="blue"
                >
                  <RangeSliderTrack>
                    <RangeSliderFilledTrack />
                  </RangeSliderTrack>
                  <RangeSliderThumb index={0} />
                  <RangeSliderThumb index={1} />
                </RangeSlider>
                <HStack justifyContent="space-between">
                  <Text fontSize="xs">Low</Text>
                  <Text fontSize="xs">High</Text>
                </HStack>
              </FormControl>
              
              {/* Sort options */}
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium">Sort By</FormLabel>
                <Select
                  value={filter.sortBy}
                  onChange={(e) => updateFilter({ sortBy: e.target.value as any })}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="importance">Importance</option>
                  <option value="activity">Activity Type</option>
                </Select>
              </FormControl>
              
              {/* Save this filter */}
              <Box>
                <FormLabel fontSize="sm" fontWeight="medium">Save Filter Preset</FormLabel>
                <HStack>
                  <Input placeholder="Name this filter" size="sm" id="filter-name" />
                  <Button 
                    size="sm" 
                    colorScheme="blue"
                    leftIcon={<FiSave />}
                    onClick={() => {
                      const input = document.getElementById('filter-name') as HTMLInputElement;
                      if (input && input.value) {
                        saveFilterPreset(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Save
                  </Button>
                </HStack>
              </Box>
              
              {/* Saved filters */}
              {Object.keys(savedFilters).length > 0 && (
                <Box>
                  <FormLabel fontSize="sm" fontWeight="medium">Saved Filters</FormLabel>
                  <VStack align="stretch" spacing={1}>
                    {Object.entries(savedFilters).map(([name, _]) => (
                      <HStack key={name} justify="space-between">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          justifyContent="flex-start"
                          onClick={() => loadFilterPreset(name)}
                          leftIcon={<FiBookmark />}
                        >
                          {name}
                        </Button>
                        <IconButton
                          aria-label="Delete filter preset"
                          icon={<FiTrash2 />}
                          size="xs"
                          variant="ghost"
                          onClick={() => {
                            setSavedFilters(prev => {
                              const copy = { ...prev };
                              delete copy[name];
                              return copy;
                            });
                          }}
                        />
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  };

  // Loading state
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

  // Empty state
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
    <VStack spacing={4} align="stretch" maxH={maxHeight} overflow={maxHeight ? "auto" : undefined}>
      {/* Header with controls */}
      <Box p={3} bg={headerBg} borderRadius="md">
        <HStack justifyContent="space-between">
          <Heading size="sm">Activity Timeline</Heading>
          <HStack spacing={2}>
            <Badge colorScheme="blue" px={2} borderRadius="full">
              {filteredActivities.length}
            </Badge>
            
            {/* Basic filter toggle */}
            <IconButton
              aria-label="Toggle basic filters"
              icon={<FiFilter />}
              size="xs"
              variant={isFilterOpen ? "solid" : "outline"}
              colorScheme={isFilterOpen ? "blue" : undefined}
              onClick={onToggleFilter}
            />
            
            {/* Advanced filter button */}
            {enableAdvancedFiltering && (
              <IconButton
                aria-label="Advanced filters"
                icon={<FiSliders />}
                size="xs"
                variant={isAdvancedFilterOpen ? "solid" : "outline"}
                colorScheme={isAdvancedFilterOpen ? "green" : undefined}
                onClick={onOpenAdvancedFilter}
              />
            )}
            
            {/* View selector */}
            {showViewSelector && viewOptions.length > 1 && (
              <Menu closeOnSelect>
                <MenuButton
                  as={IconButton}
                  size="xs"
                  aria-label="Change view"
                  icon={
                    viewMode === 'list' ? <FiList /> :
                    viewMode === 'compact' ? <FiMoreHorizontal /> :
                    viewMode === 'calendar' ? <FiCalendar /> : 
                    <FiGrid />
                  }
                />
                <MenuList zIndex={10} minW="120px">
                  {viewOptions.includes('list') && (
                    <MenuItem 
                      icon={<FiList />}
                      onClick={() => setViewMode('list')}
                      fontWeight={viewMode === 'list' ? 'medium' : 'normal'}
                    >
                      List view
                    </MenuItem>
                  )}
                  {viewOptions.includes('compact') && (
                    <MenuItem 
                      icon={<FiMoreHorizontal />}
                      onClick={() => setViewMode('compact')}
                      fontWeight={viewMode === 'compact' ? 'medium' : 'normal'}
                    >
                      Compact view
                    </MenuItem>
                  )}
                  {viewOptions.includes('detailed') && (
                    <MenuItem 
                      icon={<FiGrid />}
                      onClick={() => setViewMode('detailed')}
                      fontWeight={viewMode === 'detailed' ? 'medium' : 'normal'}
                    >
                      Detailed view
                    </MenuItem>
                  )}
                  {viewOptions.includes('calendar') && (
                    <MenuItem 
                      icon={<FiCalendar />}
                      onClick={() => setViewMode('calendar')}
                      fontWeight={viewMode === 'calendar' ? 'medium' : 'normal'}
                    >
                      Calendar view
                    </MenuItem>
                  )}
                </MenuList>
              </Menu>
            )}
            
            {/* Selection tools when items are selected */}
            {selectedActivities.size > 0 && (
              <HStack spacing={1}>
                <Badge colorScheme="green" px={2} borderRadius="full">
                  {selectedActivities.size}
                </Badge>
                <IconButton
                  aria-label="Clear selection"
                  icon={<FiX />}
                  size="xs"
                  onClick={clearActivitySelection}
                />
              </HStack>
            )}
          </HStack>
        </HStack>
      </Box>
      
      {/* Basic Search and Filter Controls */}
      <Collapse in={isFilterOpen} animateOpacity>
        <Box mb={4} p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor} bg={cardBg}>
          <VStack spacing={3}>
            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <Icon as={FiSearch} color="gray.400" />
              </InputLeftElement>
              <Input 
                placeholder="Search activities" 
                value={filter.searchQuery}
                onChange={handleSearchInput}
                aria-label="Search activities"
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
                    colorScheme={filter.types.includes(type) ? getActivityColor(type) : "gray"}
                    variant={filter.types.includes(type) ? "solid" : "subtle"}
                    px={2}
                    py={1}
                    borderRadius="full"
                    cursor="pointer"
                    onClick={() => toggleTypeFilter(type)}
                    opacity={filter.types.length > 0 && !filter.types.includes(type) ? 0.6 : 1}
                    aria-label={`Filter by ${type}`}
                    role="checkbox"
                    aria-checked={filter.types.includes(type)}
                  >
                    <HStack spacing={1}>
                      <Icon as={getActivityIcon(type)} boxSize={3} />
                      <Text fontSize="xs" textTransform="capitalize">{type}</Text>
                    </HStack>
                  </Badge>
                ))}
              </Flex>
            </Box>
            
            <HStack width="100%" justifyContent="space-between">
              <Button 
                size="xs" 
                leftIcon={<FiSave />}
                onClick={() => {
                  const name = prompt("Name this filter preset:");
                  if (name) saveFilterPreset(name);
                }}
              >
                Save Filter
              </Button>
              
              <Menu>
                <MenuButton as={Button} size="xs" rightIcon={<FiChevronDown />}>
                  Sort: {filter.sortBy.charAt(0).toUpperCase() + filter.sortBy.slice(1)}
                </MenuButton>
                <MenuList>
                  <MenuItem 
                    onClick={() => updateFilter({ sortBy: 'newest' })}
                    icon={<FiArrowDown />}
                  >
                    Newest First
                  </MenuItem>
                  <MenuItem 
                    onClick={() => updateFilter({ sortBy: 'oldest' })}
                    icon={<FiArrowUp />}
                  >
                    Oldest First
                  </MenuItem>
                  <MenuItem 
                    onClick={() => updateFilter({ sortBy: 'importance' })}
                    icon={<FiStar />}
                  >
                    By Importance
                  </MenuItem>
                  <MenuItem 
                    onClick={() => updateFilter({ sortBy: 'activity' })}
                    icon={<FiActivity />}
                  >
                    By Activity Type
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </VStack>
        </Box>
      </Collapse>
      
      {/* Active Filters Display */}
      <ActiveFilterDisplay />

      {/* Advanced Filter Drawer */}
      {enableAdvancedFiltering && <AdvancedFilterDrawer />}
      
      {/* No results message */}
      {filteredActivities.length === 0 ? (
        <Box p={6} textAlign="center" borderWidth="1px" borderRadius="md" borderStyle="dashed">
          <VStack spacing={3}>
            <Icon as={FiSearch} boxSize={8} color="gray.400" />
            <Text color="gray.500" fontSize="sm">
              No activities match your filters
            </Text>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={clearAllFilters}
            >
              Clear filters
            </Button>
          </VStack>
        </Box>
      ) : viewMode === 'calendar' ? (
        // Calendar view
        <SimpleCalendarView />
      ) : (
        // List-based views (list, compact, detailed)
        <Box>
          {/* Activity list with date groups */}
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
                  <Badge ml={1} colorScheme="blue" variant="outline">
                    {group.activities.length}
                  </Badge>
                </HStack>
                
                {/* Activities for this date */}
                <Box>
                  {group.activities.map((activity, idx) => {
                    const colorScheme = getActivityColor(activity.type);
                    const isExpanded = expandedActivity === activity.id;
                    const isSelected = selectedActivities.has(activity.id);
                    
                    // Compact view
                    if (viewMode === 'compact') {
                      return (
                        <HStack 
                          key={activity.id}
                          p={2}
                          borderBottomWidth={idx < group.activities.length - 1 ? "1px" : "0"}
                          borderColor={borderColor}
                          _hover={{ bg: hoverBg }}
                          transition="background 0.2s"
                          cursor="pointer"
                          onClick={() => toggleActivitySelection(activity.id)}
                          bg={isSelected ? selectedBg : undefined}
                          role="button"
                          aria-selected={isSelected}
                          borderLeftWidth="3px"
                          borderLeftColor={isSelected ? `${colorScheme}.500` : "transparent"}
                        >
                          <Icon 
                            as={getActivityIcon(activity.type)} 
                            color={`${colorScheme}.500`}
                            boxSize={3}
                            mr={2}
                          />
                          <Text fontSize="xs" fontWeight="medium" mr={1}>{activity.user}</Text>
                          <Text fontSize="xs" noOfLines={1} flex="1">
                            {activity.message}
                          </Text>
                          <Text fontSize="xs" color="gray.500" ml={2}>
                            {formatRelativeTime(activity.timestamp)}
                          </Text>
                        </HStack>
                      );
                    }
                    
                    // Detailed view
                    if (viewMode === 'detailed') {
                      return (
                        <Box 
                          key={activity.id}
                          p={4}
                          borderBottomWidth={idx < group.activities.length - 1 ? "1px" : "0"}
                          borderColor={borderColor}
                          _hover={{ bg: hoverBg }}
                          onClick={() => onActivitySelect && onActivitySelect(activity)}
                          cursor={onActivitySelect ? "pointer" : "default"}
                        >
                          <ActivityDetailPanel activity={activity} />
                        </Box>
                      );
                    }
                    
                    // Default list view
                    return (
                      <Box 
                        key={activity.id}
                        position="relative" 
                        p={3}
                        borderBottomWidth={idx < group.activities.length - 1 ? "1px" : "0"}
                        borderColor={borderColor}
                        _hover={{ bg: hoverBg }}
                        transition="background 0.2s"
                        bg={isSelected ? selectedBg : undefined}
                      >
                        <HStack spacing={3} align="flex-start">
                          {/* Checkbox for selection */}
                          <Box 
                            p={2}
                            borderRadius="full" 
                            borderWidth="1px"
                            borderColor={isSelected ? `${colorScheme}.500` : borderColor}
                            bg={isSelected ? `${colorScheme}.50` : "transparent"}
                            cursor="pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActivitySelection(activity.id);
                            }}
                            _dark={{
                              bg: isSelected ? `${colorScheme}.900` : "transparent",
                            }}
                          >
                            {isSelected ? (
                              <Icon as={FiCheck} boxSize={3} color={`${colorScheme}.500`} />
                            ) : (
                              <Box w="12px" h="12px" />
                            )}
                          </Box>
                          
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
                                
                                {/* Entity badge if available */}
                                {activity.entity_type && (
                                  <Badge 
                                    colorScheme="gray" 
                                    variant="outline"
                                    fontSize="xs"
                                  >
                                    {activity.entity_type}
                                  </Badge>
                                )}
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
                                <VStack align="stretch" spacing={3}>
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
                                      <Button
                                        size="xs"
                                        variant="link"
                                        onClick={() => {
                                          if (onActivitySelect) {
                                            onActivitySelect(activity);
                                          }
                                        }}
                                        isDisabled={!onActivitySelect}
                                      >
                                        {activity.entity_type || 'Unknown'} ({activity.entity_id})
                                      </Button>
                                    </HStack>
                                  )}
                                  
                                  {/* Action buttons */}
                                  <HStack justify="flex-end" spacing={2} mt={1}>
                                    <Button size="xs" leftIcon={<FiShare2 />} variant="ghost">
                                      Share
                                    </Button>
                                    
                                    <Button size="xs" leftIcon={<FiBookmark />} variant="ghost">
                                      Save
                                    </Button>
                                  </HStack>
                                </VStack>
                              </Box>
                            </Collapse>
                            
                            {/* Action row */}
                            <HStack justifyContent="flex-end" mt={1} spacing={2}>
                              {activity.entity_id && activity.entity_type && onActivitySelect && (
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  leftIcon={<FiExternalLink />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onActivitySelect(activity);
                                  }}
                                >
                                  View Entity
                                </Button>
                              )}
                              
                              <Button
                                size="xs"
                                variant="ghost"
                                rightIcon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleActivityExpansion(activity.id);
                                }}
                              >
                                {isExpanded ? 'Less details' : 'More details'}
                              </Button>
                            </HStack>
                          </VStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Box>
          
          {/* Load more section */}
          {hasMoreActivities && (
            <Box
              ref={loadMoreRef}
              textAlign="center"
              py={4}
            >
              {isLoadingMore ? (
                <Spinner size="sm" />
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={<FiMoreHorizontal />}
                  onClick={handleLoadMore}
                >
                  Load More Activities
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}
      
      {/* Selection actions panel (when items selected) */}
      {selectedActivities.size > 0 && (
        <HStack 
          position="sticky" 
          bottom="0" 
          p={3} 
          bg={cardBg} 
          borderTopWidth="1px" 
          borderColor={borderColor}
          boxShadow="md"
          justifyContent="space-between"
          zIndex={2}
        >
          <Text fontSize="sm" fontWeight="medium">
            {selectedActivities.size} activities selected
          </Text>
          <HStack spacing={2}>
            <Button size="sm" leftIcon={<FiDownload />} variant="ghost">
              Export
            </Button>
            <Button size="sm" leftIcon={<FiBookmark />} variant="ghost">
              Save
            </Button>
            <Button size="sm" colorScheme="blue">
              View Selected
            </Button>
          </HStack>
        </HStack>
      )}
    </VStack>
  );
};

export default ActivityTimeline;