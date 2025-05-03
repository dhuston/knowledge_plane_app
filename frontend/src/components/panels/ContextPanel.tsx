/**
 * ContextPanel.tsx
 * Performance-optimized panel that displays details about selected nodes
 * Enhanced with improved modularity, rich content support, and better performance
 */
import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import {
  Box,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Fade,
  SlideFade,
  ScaleFade,
  Collapse,
  useDisclosure,
  usePrefersReducedMotion,
  Center,
  Text,
  Portal,
  useToast,
  Tooltip,
  IconButton,
  HStack,
  Flex,
  Divider
} from '@chakra-ui/react';
import ErrorDisplay from '../common/ErrorDisplay';
import { motion, AnimatePresence, keyframes } from 'framer-motion';
import { useFeatureFlags } from '../../utils/featureFlags';
import { useApiClient } from '../../hooks/useApiClient';
import { MapNode, MapNodeTypeEnum } from '../../types/map';
import { 
  cacheEntity, 
  getCachedEntity, 
  useLazyLoad, 
  useIsMounted, 
  useDelayedExecution,
  areEqual,
  measurePerformance
} from '../../utils/performance';
import { 
  extractErrorMessage, 
  logError, 
  createApiError,
  withErrorBoundary
} from '../../utils/errorHandling';
import { FiExternalLink, FiMaximize2, FiMinimize2, FiInfo } from 'react-icons/fi';

// Import entity panels
import UserPanel from './entity-panels/UserPanel';
import TeamPanel from './entity-panels/TeamPanel';
import ProjectPanel from './entity-panels/ProjectPanel';
import GoalPanel from './entity-panels/GoalPanel';
import EntityDetails from './EntityDetails';
import DepartmentPanel from './entity-panels/DepartmentPanel';
import KnowledgeAssetPanel from './entity-panels/KnowledgeAssetPanel';

// Import common components
import RelationshipList from './RelationshipList';
import ActivityTimeline from './ActivityTimeline';
import ActionButtons from './ActionButtons';
import LazyPanel from '../common/LazyPanel';
import AnimatedTransition from '../common/AnimatedTransition';
import SafeMarkdown from '../common/SafeMarkdown';
import SimpleMarkdown from '../common/SimpleMarkdown';

// Import extracted components
import PanelHeader from './header/PanelHeader';
import PanelTabs, { PanelTabType } from './tabs/PanelTabs';
import { EntitySuggestion } from './suggestions/EntitySuggestions';
import EntitySuggestionsContainer from './suggestions/EntitySuggestionsContainer';
import BreadcrumbNav, { NavHistoryItem } from './header/BreadcrumbNav';
import RecentlyViewedEntities from './suggestions/RecentlyViewedEntities';

// Import entity types from shared types file
import {
  EntityDataType,
  Relationship,
  Activity,
  isUserEntity,
  isTeamEntity,
  isProjectEntity,
  isGoalEntity,
  isDepartmentEntity,
  isKnowledgeAssetEntity
} from '../../types/entities';

// Lazily load heavier components
const LazyEntitySuggestionsContainer = lazy(() => import('./suggestions/EntitySuggestionsContainer'));
const LazyRecentlyViewedEntities = lazy(() => import('./suggestions/RecentlyViewedEntities'));

// Constants for performance tuning
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes
const MAX_VISIBLE_RELATIONSHIPS = 50;
const MAX_HISTORY_ITEMS = 20;

interface ContextPanelProps {
  selectedNode: MapNode | null;
  onClose: () => void;
  projectOverlaps?: Record<string, string[]>;
  getProjectNameById?: (id: string) => string | undefined;
  onNodeClick?: (nodeId: string | null) => void; // Optional callback for node clicks
  initialExpandedState?: boolean; // Whether the panel should start expanded
  onToggleExpand?: (isExpanded: boolean) => void; // Callback when panel is expanded/collapsed
  containerWidth?: number; // Width of the container for responsive layouts
}

// Cache for panel data at component level
const panelCache = new Map<string, {
  data: EntityDataType;
  timestamp: number;
}>();

/**
 * Loading fallback component
 */
const LoadingFallback = React.memo(() => {
  const spinnerColor = useColorModeValue('blue.500', 'blue.300');
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  // Define loading animation using framer-motion
  const pulseAnimation = {
    animate: {
      opacity: [0.6, 1, 0.6],
      scale: [0.98, 1, 0.98],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity
      }
    }
  };
  
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <Center 
      height="100%" 
      width="100%" 
      flexDirection="column" 
      gap={4}
      bg={bgColor}
    >
      {!prefersReducedMotion ? (
        <>
          <motion.div animate={pulseAnimation.animate}>
            <Spinner 
              size="md" 
              color={spinnerColor} 
              thickness="3px"
            />
          </motion.div>
          <motion.div animate={pulseAnimation.animate}>
            <Text fontSize="sm" color={textColor} fontStyle="italic">
              Loading content...
            </Text>
          </motion.div>
        </>
      ) : (
        <>
          <Spinner size="md" color={spinnerColor} thickness="3px" />
          <Text fontSize="sm" color={textColor} fontStyle="italic">
            Loading content...
          </Text>
        </>
      )}
    </Center>
  );
});

/**
 * Main ContextPanel component
 */
const ContextPanel: React.FC<ContextPanelProps> = ({
  selectedNode,
  onClose,
  projectOverlaps = {},
  getProjectNameById = () => undefined,
  initialExpandedState = false,
  onToggleExpand,
  containerWidth = 400
}) => {
  const [entityData, setEntityData] = useState<EntityDataType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activityHistory, setActivityHistory] = useState<Activity[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState<boolean>(false);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isRelationshipsLoading, setIsRelationshipsLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(initialExpandedState);
  // Suggestions are now handled directly by the EntitySuggestionsContainer component
  const [activeTab, setActiveTab] = useState<PanelTabType>('details');
  const [navHistory, setNavHistory] = useState<NavHistoryItem[]>([]);
  const [previousNodes, setPreviousNodes] = useState<Map<string, EntityDataType>>(new Map());
  const apiClient = useApiClient();
  const { flags } = useFeatureFlags();
  const isMounted = useIsMounted();
  const toast = useToast();
  
  // Track which tabs have been viewed for optimization
  const viewedTabsRef = useRef<Set<PanelTabType>>(new Set(['details']));

  // Define memoized colors to prevent unnecessary recalculations
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Memoize projectOverlaps to prevent unnecessary re-renders
  const memoizedOverlaps = useMemo(() => projectOverlaps, [JSON.stringify(projectOverlaps)]);
  // Memoize the getProjectNameById function to prevent unnecessary re-renders
  const memoizedGetProjectName = useCallback((id: string) => {
    return getProjectNameById ? getProjectNameById(id) : undefined;
  }, [getProjectNameById]);
  
  // Delayed execution for non-critical UI elements
  const shouldLoadSecondary = useDelayedExecution(300);
  const shouldLoadTertiary = useDelayedExecution(800);

  // Fetch entity data with caching
  useEffect(() => {
    if (!selectedNode) {
      setEntityData(null);
      setError(null);
      setActivityHistory([]);
      setRelationships([]);
      return;
    }

    const fetchEntityData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Generate cache key
        const cacheKey = `${selectedNode.type}:${selectedNode.id}`;
        
        // Check component-level cache for faster access
        const panelCachedData = panelCache.get(cacheKey);
        if (panelCachedData && (Date.now() - panelCachedData.timestamp < CACHE_EXPIRATION)) {
          setEntityData(panelCachedData.data);
          setIsLoading(false);
          return;
        }
        
        // Check global cache
        const cachedData = getCachedEntity(cacheKey);
        if (cachedData) {
          setEntityData(cachedData);
          // Update component-level cache too
          panelCache.set(cacheKey, {
            data: cachedData,
            timestamp: Date.now()
          });
          setIsLoading(false);
          return;
        }
        
        // Check if we already have cached data for this node
        if (previousNodes.has(selectedNode.id)) {
          const nodeData = previousNodes.get(selectedNode.id)!;
          setEntityData(nodeData);
          
          // Also update global cache
          cacheEntity(cacheKey, nodeData);
          
          panelCache.set(cacheKey, {
            data: nodeData,
            timestamp: Date.now()
          });
          
          setIsLoading(false);
        } else {
          // Determine API URL based on entity type
          let apiUrl = '';
          switch (selectedNode.type) {
            case MapNodeTypeEnum.USER:
              apiUrl = `/users/${selectedNode.id}`;
              break;
            case MapNodeTypeEnum.TEAM:
              apiUrl = `/teams/${selectedNode.id}`;
              break;
            case MapNodeTypeEnum.PROJECT:
              apiUrl = `/projects/${selectedNode.id}`;
              break;
            case MapNodeTypeEnum.GOAL:
              apiUrl = `/goals/${selectedNode.id}`;
              break;
            case MapNodeTypeEnum.DEPARTMENT:
              apiUrl = `/departments/${selectedNode.id}`;
              break;
            case MapNodeTypeEnum.KNOWLEDGE_ASSET:
              apiUrl = `/knowledge-assets/${selectedNode.id}`;
              break;
            default:
              throw new Error(`No API endpoint for type: ${selectedNode.type}`);
          }

          // Fetch from API if not cached
          const response = await apiClient.get<EntityDataType>(apiUrl);
          
          if (!isMounted()) return;
          
          setEntityData(response.data);
          
          // Cache the result for future use
          setPreviousNodes(prev => {
            const updated = new Map(prev);
            updated.set(selectedNode.id, response.data);
            return updated;
          });
          
          // Update both caches
          cacheEntity(cacheKey, response.data);
          panelCache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
          });
        }
        
        // Update navigation history
        setNavHistory(prev => {
          // Check if this node is already in the history (for back navigation)
          const existingIndex = prev.findIndex(item => item.nodeId === selectedNode.id);
          
          if (existingIndex >= 0) {
            // Node exists in history - trim to this point (back navigation)
            return prev.slice(0, existingIndex + 1);
          } else {
            // Add new node to history
            const newHistory = [...prev];
            
            // Limit history length to prevent excessive growth
            if (newHistory.length > MAX_HISTORY_ITEMS) {
              newHistory.shift();
            }
            
            newHistory.push({
              nodeId: selectedNode.id,
              nodeType: selectedNode.type,
              label: selectedNode.label
            });
            
            return newHistory;
          }
        });
      } catch (err: any) {
        console.error(`Error fetching ${selectedNode.type} data:`, err);
        if (isMounted()) {
          // Log the error with context
          logError(err, `ContextPanel-${selectedNode.type}`);
          
          // Set friendly error message
          setError(extractErrorMessage(
            err, 
            `Failed to load ${selectedNode.type} details. Please try again later.`
          ));
        }
      } finally {
        if (isMounted()) {
          setIsLoading(false);
        }
      }
    };

    fetchEntityData();
  }, [selectedNode, apiClient, previousNodes, isMounted]);

  // Optimized fetch for relationships data
  useEffect(() => {
    if (!selectedNode || !entityData) return;
    
    // Only fetch relationships if related tab has been viewed or is active
    if (!viewedTabsRef.current.has('related') && activeTab !== 'related') {
      return;
    }
    
    const fetchRelationships = async () => {
      setIsRelationshipsLoading(true);
      try {
        // Check cache first
        const cacheKey = `relationships:${selectedNode.type}:${selectedNode.id}`;
        const cachedRelations = getCachedEntity(cacheKey);
        
        if (cachedRelations) {
          setRelationships(cachedRelations);
          setIsRelationshipsLoading(false);
          return;
        }
        
        // For now, we'll use the relationships from the node data if available
        if (selectedNode.data && selectedNode.data.relationships) {
          // Cast the relationships to the proper type
          const relationships = selectedNode.data.relationships as Relationship[];
          setRelationships(relationships);
          
          // Cache the result
          cacheEntity(cacheKey, relationships);
        } else {
          // Make API call to fetch relationships
          try {
            const response = await apiClient.get<Relationship[]>(`/${selectedNode.type.toLowerCase()}s/${selectedNode.id}/relationships`);
            const relationshipsData = response.data || [];
            setRelationships(relationshipsData);
            
            // Cache the result
            cacheEntity(cacheKey, relationshipsData);
          } catch (error) {
            // Use our error handling utilities for better logging
            logError(error, `ContextPanel-Relationships-${selectedNode.type}`);
            
            setRelationships([]);
            
            // Cache empty result when there's an error
            cacheEntity(cacheKey, []);
          }
        }
      } catch (err) {
        logError(err, 'ContextPanel-Relationships');
        setRelationships([]);
      } finally {
        if (isMounted()) {
          setIsRelationshipsLoading(false);
        }
      }
    };

    fetchRelationships();
  }, [selectedNode, entityData, activeTab, apiClient, isMounted]);

  // Optimized fetch for activity history
  useEffect(() => {
    // Skip activity history if feature flag is disabled
    // or if activity tab has never been viewed and isn't active
    if (
      !selectedNode || 
      !entityData || 
      !flags.enableActivityTimeline ||
      (!viewedTabsRef.current.has('activity') && activeTab !== 'activity')
    ) {
      return;
    }

    const fetchActivityHistory = async () => {
      setIsActivityLoading(true);
      try {
        // Check cache first
        const cacheKey = `activity:${selectedNode.type}:${selectedNode.id}`;
        const cachedActivities = getCachedEntity(cacheKey);
        
        if (cachedActivities) {
          setActivityHistory(cachedActivities);
          setIsActivityLoading(false);
          return;
        }
        
        // Try to use real API
        try {
          const response = await apiClient.get(`/activities?entityType=${selectedNode.type.toLowerCase()}&entityId=${selectedNode.id}`);
          if (response && response.data) {
            setActivityHistory(response.data);
            
            // Cache the result
            cacheEntity(cacheKey, response.data);
            
            setIsActivityLoading(false);
            return;
          }
        } catch (apiErr) {
          logError(apiErr, `ContextPanel-ActivityHistory-${selectedNode.type}`);
          
          // Do not fall back to mock data - return empty array instead
          setActivityHistory([]);
          cacheEntity(cacheKey, []);
          setIsActivityLoading(false);
          return;
        }
        
        // If API doesn't return data (but no error), set empty activities
        setActivityHistory([]);
        cacheEntity(cacheKey, []);
      } catch (err) {
        logError(err, 'ContextPanel-ActivityHistory');
        setActivityHistory([]);
      } finally {
        if (isMounted()) {
          setIsActivityLoading(false);
        }
      }
    };

    fetchActivityHistory();
  }, [selectedNode, entityData, apiClient, flags.enableActivityTimeline, activeTab, isMounted]);

  // ML-based Entity suggestions are now handled directly by the EntitySuggestionsContainer component
  // which uses the useEntitySuggestions hook internally
  
  // Handle breadcrumb navigation
  const handleBreadcrumbNavigation = useCallback((item: NavHistoryItem) => {
    // Create a synthetic MapNode to pass to onNodeClick
    const syntheticNode = {
      id: item.nodeId,
      type: item.nodeType,
      label: item.label,
      data: {} // The data will be loaded from the cache
    };
    
    // Navigate to the selected node - with null check
    if (onNodeClick) {
      onNodeClick(item.nodeId);
    }
    
    // Note: We don't need to update navHistory here as that will
    // happen automatically when the selectedNode changes
  }, [onNodeClick]);

  // Event handlers for navigation and action events (memoized)
  const handleNodeNavigation = useCallback((e: Event) => {
    const event = e as CustomEvent;
    if (event.detail && event.detail.nodeId) {
      // Navigate to the node - with null check
      if (onNodeClick) {
        onNodeClick(event.detail.nodeId);
      }
      
      // Navigation history is updated in the useEffect that depends on selectedNode
    }
  }, [onNodeClick]);
  
  const handleEntityAction = useCallback((e: Event) => {
    const event = e as CustomEvent;
    // Here you would perform the actual action
    // For example, if action is "Edit", you would open an edit modal
  }, []);

  const handleSuggestionClick = useCallback((suggestionId: string, label: string) => {
    // Navigate to the suggested entity - with null check
    if (onNodeClick) {
      onNodeClick(suggestionId);
    }
  }, [onNodeClick]);
  
  // Track tab changes
  const handleTabChange = useCallback((tab: PanelTabType) => {
    setActiveTab(tab);
    viewedTabsRef.current.add(tab);
  }, []);
  
  // Handle expanding/collapsing the panel
  const handleToggleExpand = useCallback(() => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Call the parent callback if provided
    if (onToggleExpand) {
      onToggleExpand(newExpandedState);
    }
    
    // Show a toast notification for better UX
    if (process.env.NODE_ENV === 'development') {
      toast({
        title: newExpandedState ? 'Panel expanded' : 'Panel collapsed',
        status: 'info',
        duration: 1500,
        isClosable: true,
        position: 'bottom-right',
        variant: 'subtle',
      });
    }
  }, [isExpanded, onToggleExpand, toast]);
  
  // Set up event listeners
  useEffect(() => {
    // Add event listeners for custom events
    document.addEventListener('navigate-to-node', handleNodeNavigation);
    document.addEventListener('entity-action', handleEntityAction);
    
    // Clean up
    return () => {
      document.removeEventListener('navigate-to-node', handleNodeNavigation);
      document.removeEventListener('entity-action', handleEntityAction);
    };
  }, [handleNodeNavigation, handleEntityAction]);

  // Render the appropriate panel based on entity type using memoization
  const renderEntityPanel = useCallback(() => {
    if (!selectedNode || !entityData) return null;

    // Use Profiler for performance tracking in development
    const withProfiler = (id: string, component: JSX.Element): JSX.Element => {
      if (process.env.NODE_ENV === 'development') {
        return (
          <React.Profiler id={id} onRender={(id, phase, actualDuration) => {
            if (actualDuration > 10) console.debug(`Slow render (${actualDuration.toFixed(1)}ms): ${id}, ${phase}`);
          }}>
            {component}
          </React.Profiler>
        );
      }
      return component;
    };

    // Using type guards to ensure proper typing with memoization
    if (isUserEntity(entityData) && selectedNode.type === MapNodeTypeEnum.USER) {
      return withProfiler("UserPanel", 
        <UserPanel data={entityData} selectedNode={selectedNode} />
      );
    } 
    
    if (isTeamEntity(entityData) && selectedNode.type === MapNodeTypeEnum.TEAM) {
      return withProfiler("TeamPanel",
        <TeamPanel data={entityData} selectedNode={selectedNode} />
      );
    }
    
    if (isProjectEntity(entityData) && selectedNode.type === MapNodeTypeEnum.PROJECT) {
      return withProfiler("ProjectPanel",
        <ProjectPanel 
          data={entityData} 
          selectedNode={selectedNode}
          projectOverlaps={memoizedOverlaps}
          getProjectNameById={memoizedGetProjectName}
        />
      );
    }
    
    if (isGoalEntity(entityData) && selectedNode.type === MapNodeTypeEnum.GOAL) {
      return withProfiler("GoalPanel",
        <GoalPanel data={entityData} selectedNode={selectedNode} />
      );
    }
    
    if (isDepartmentEntity(entityData) && selectedNode.type === MapNodeTypeEnum.DEPARTMENT) {
      return withProfiler("DepartmentPanel",
        <DepartmentPanel data={entityData} selectedNode={selectedNode} />
      );
    }
    
    if (isKnowledgeAssetEntity(entityData) && selectedNode.type === MapNodeTypeEnum.KNOWLEDGE_ASSET) {
      return withProfiler("KnowledgeAssetPanel",
        <KnowledgeAssetPanel data={entityData} selectedNode={selectedNode} />
      );
    }
    
    // Default fallback for other entity types
    return withProfiler("EntityDetails",
      <EntityDetails 
        data={entityData}
        selectedNode={selectedNode}
      />
    );
  }, [entityData, selectedNode, memoizedOverlaps, memoizedGetProjectName]);

  // Define loading animation using framer-motion
  const pulseAnimation = {
    animate: {
      opacity: [0.6, 1, 0.6],
      scale: [0.98, 1, 0.98],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity
      }
    }
  };
  const prefersReducedMotion = usePrefersReducedMotion();

  // Render loading state
  if (isLoading) {
    return (
      <ScaleFade in={true} initialScale={0.96}>
        <Box 
          width="100%" 
          height="100%" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          flexDirection="column"
          gap={4}
          bg={bgColor}
          borderLeft="1px solid"
          borderColor={borderColor}
        >
          {!prefersReducedMotion ? (
            <>
              <motion.div animate={pulseAnimation.animate}>
                <Spinner 
                  size="xl" 
                  thickness="4px"
                  speed="0.8s"
                  color="blue.500" 
                />
              </motion.div>
              <motion.div animate={pulseAnimation.animate}>
                <Box fontSize="sm" color="gray.500" fontWeight="medium">
                  Loading details...
                </Box>
              </motion.div>
            </>
          ) : (
            <>
              <Spinner 
                size="xl" 
                thickness="4px"
                speed="0.8s"
                color="blue.500" 
              />
              <Box fontSize="sm" color="gray.500" fontWeight="medium">
                Loading details...
              </Box>
            </>
          )}
        </Box>
      </ScaleFade>
    );
  }

  // Render error state
  if (error) {
    return (
      <SlideFade in={true} offsetY={20}>
        <Box 
          width="100%" 
          height="100%"
          p={4}
          bg={bgColor}
          borderLeft="1px solid"
          borderColor={borderColor}
        >
          <ErrorDisplay 
            error={error}
            onRetry={() => {
              if (selectedNode) {
                // Trigger a refresh by temporarily clearing and then re-selecting the node
                const nodeToRefresh = {...selectedNode};
                setEntityData(null);
                setError(null);
                setTimeout(() => {
                  if (onNodeClick) {
                    onNodeClick(nodeToRefresh.id);
                  }
                }, 100);
              }
            }}
            variant="left-accent"
          />
        </Box>
      </SlideFade>
    );
  }

  // Render empty state
  if (!selectedNode) {
    return null;
  }

  // Reference for focus management
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus the panel when it opens
  useEffect(() => {
    if (selectedNode && panelRef.current) {
      // Focus the panel or the first focusable element inside it
      panelRef.current.focus();

      // Set up focus trap inside panel
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
          e.preventDefault();
        }
      };

      // Add keyboard listener
      document.addEventListener('keydown', handleKeyDown);
      
      // Clean up
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [selectedNode, onClose]);

  // Define animations for entity transitions
  const entityTransitionVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  // Animation variants for content sections
  const contentVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { 
        delay: custom * 0.1,
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };
  
  // Track when the panel has fully loaded for smoother animations
  const [isPanelMounted, setIsPanelMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsPanelMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Get entity-specific background accent color - memoized for performance
  const getEntityAccentColor = useMemo(() => {
    if (!selectedNode) return useColorModeValue('gray.50', 'gray.800');
    
    switch(selectedNode.type) {
      case MapNodeTypeEnum.USER: return useColorModeValue('blue.50', 'blue.900');
      case MapNodeTypeEnum.TEAM: return useColorModeValue('green.50', 'green.900');
      case MapNodeTypeEnum.PROJECT: return useColorModeValue('purple.50', 'purple.900');
      case MapNodeTypeEnum.GOAL: return useColorModeValue('orange.50', 'orange.900');
      case MapNodeTypeEnum.DEPARTMENT: return useColorModeValue('cyan.50', 'cyan.900');
      case MapNodeTypeEnum.KNOWLEDGE_ASSET: return useColorModeValue('yellow.50', 'yellow.900');
      default: return useColorModeValue('gray.50', 'gray.800');
    }
  }, [selectedNode]);

  // Track previous node for transitions
  const prevNodeRef = useRef<MapNode | null>(null);
  const isNewEntityType = prevNodeRef.current?.type !== selectedNode?.type;
  
  useEffect(() => {
    prevNodeRef.current = selectedNode;
  }, [selectedNode]);

  // Track tab changes for animations
  const [prevTab, setPrevTab] = useState<PanelTabType>(activeTab);
  useEffect(() => {
    setPrevTab(activeTab);
  }, [activeTab]);
  
  // Optimized relationships rendering - limit to prevent slowdowns with large datasets
  const optimizedRelationships = useMemo(() => {
    return relationships.slice(0, MAX_VISIBLE_RELATIONSHIPS);
  }, [relationships]);
  
  return (
    <ScaleFade 
      in={true} 
      initialScale={0.92}
      transition={{ enter: { duration: 0.3, ease: "easeOut" } }}
    >
      <Box
        width={isExpanded ? "100%" : `${containerWidth}px`}
        height="100%"
        bg={bgColor}
        borderLeft="1px solid"
        borderColor={borderColor}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        ref={panelRef}
        tabIndex={-1} // Make focusable but not in tab order
        role="region"
        aria-label={`Details for ${selectedNode?.label || 'selected entity'}`}
        // Add focus styling but make it subtle
        _focus={{ 
          outline: "none", 
          boxShadow: "none"
        }}
        position="relative"
        transition="all 0.3s ease-in-out"
        maxW={isExpanded ? "100%" : `${Math.min(containerWidth, 600)}px`}
        boxShadow={isExpanded ? "lg" : "sm"}
      >
        {/* Entity type accent background */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          height="8px"
          bg={getEntityAccentColor}
          transition="background-color 0.5s ease"
          opacity={0.7}
        />
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Box>
            <HStack justify="space-between" alignItems="center">
              <PanelHeader 
                label={selectedNode.label}
                type={selectedNode.type}
                onClose={onClose}
              />
              
              <Tooltip 
                label={isExpanded ? "Collapse panel" : "Expand panel"} 
                placement="top"
                hasArrow
              >
                <IconButton
                  aria-label={isExpanded ? "Collapse panel" : "Expand panel"}
                  icon={isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
                  size="sm"
                  variant="ghost"
                  onClick={handleToggleExpand}
                  mr={2}
                />
              </Tooltip>
            </HStack>
            
            {/* Navigation breadcrumb - only show if we have navigation history */}
            {navHistory.length > 1 && (
              <SlideFade in={true} offsetY={-10}>
                <Box px={4} py={2} borderBottomWidth="1px" borderColor={borderColor}>
                  <BreadcrumbNav 
                    history={navHistory}
                    onNavigate={handleBreadcrumbNavigation}
                    maxDisplayed={4}
                    fontSize="xs"
                  />
                </Box>
              </SlideFade>
            )}
          </Box>
        </motion.div>

        {/* Tab navigation with animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <PanelTabs 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            animationVariant="enhanced"
            indicatorStyle="bar"
            dataTestId="context-panel-tabs"
          />
        </motion.div>

        {/* Panel Content - optimized with lazy loading */}
        <Box 
          flex="1" 
          overflowY="auto" 
          p={4}
          position="relative"
        >
          <AnimatePresence mode="wait">
            {/* Details Tab Content - lazy loaded */}
            <LazyPanel
              active={activeTab === 'details'}
              tabId="details"
              key="details-panel"
              keepMounted={true}
              animationVariant="fade"
              transitionDuration={0.4}
              maintainHeight={false}
              data-testid="details-panel"
            >
              <AnimatedTransition
                in={isPanelMounted && activeTab === 'details'}
                variant="panelEntry"
                unmountOnExit={false}
                transitionKey={`details-${selectedNode.id}`}
              >
                <VStack 
                  spacing={6} 
                  align="stretch"
                  id="panel-details"
                >
                  {/* Entity-specific details */}
                  <AnimatedTransition 
                    in={true}
                    variant="staggerItems"
                    customIndex={0}
                    key={`entity-panel-${selectedNode.id}`}
                  >
                    {renderEntityPanel()}
                  </AnimatedTransition>
                  
                  {/* ML-based entity suggestions only shown in details tab if feature flag is enabled */}
                  {flags.enableSuggestions && shouldLoadSecondary && (
                    <AnimatedTransition in={true} variant="staggerItems" customIndex={1}>
                      <Suspense fallback={<LoadingFallback />}>
                        <LazyEntitySuggestionsContainer
                          entityId={selectedNode.id}
                          onSuggestionClick={handleSuggestionClick}
                          viewMode="compact"
                          options={{
                            maxResults: 8,
                            excludeIds: navHistory.map(item => item.nodeId),
                            refreshOnFeedback: true
                          }}
                        />
                      </Suspense>
                    </AnimatedTransition>
                  )}
                  
                  {/* Recently viewed entities - only shown when we have navigation history */}
                  {navHistory.length > 1 && shouldLoadTertiary && (
                    <AnimatedTransition in={true} variant="staggerItems" customIndex={2}>
                      <Suspense fallback={<LoadingFallback />}>
                        <LazyRecentlyViewedEntities 
                          items={navHistory} 
                          onEntityClick={handleBreadcrumbNavigation}
                          maxItems={4}
                          currentEntityId={selectedNode.id}
                        />
                      </Suspense>
                    </AnimatedTransition>
                  )}

                  {/* Action Buttons */}
                  <AnimatedTransition 
                    in={true}
                    variant="staggerItems" 
                    customIndex={3}
                  >
                    <ActionButtons 
                      entityType={selectedNode.type} 
                      entityId={selectedNode.id} 
                    />
                  </AnimatedTransition>
                </VStack>
              </AnimatedTransition>
            </LazyPanel>
            
            {/* Related Tab Content - lazily loaded */}
            <LazyPanel
              active={activeTab === 'related'}
              tabId="related"
              key="related-panel"
              animationVariant="fade"
              transitionDuration={0.4}
              data-testid="related-panel"
            >
              <AnimatedTransition
                in={activeTab === 'related'}
                variant="contentFade"
                unmountOnExit={false}
                transitionKey={`related-${selectedNode.id}`}
              >
                <VStack 
                  spacing={6} 
                  align="stretch"
                  id="panel-related"
                >
                  <RelationshipList 
                    relationships={optimizedRelationships} 
                    isLoading={isRelationshipsLoading} 
                    entityType={selectedNode.type}
                  />
                </VStack>
              </AnimatedTransition>
            </LazyPanel>
            
            {/* Activity Tab Content - lazily loaded */}
            <LazyPanel
              active={activeTab === 'activity'}
              tabId="activity"
              key="activity-panel"
              animationVariant="fade"
              transitionDuration={0.4}
              data-testid="activity-panel"
            >
              <AnimatedTransition
                in={activeTab === 'activity'}
                variant="contentFade"
                unmountOnExit={false}
                transitionKey={`activity-${selectedNode.id}`}
              >
                <VStack 
                  spacing={6} 
                  align="stretch"
                  id="panel-activity"
                >
                  <ActivityTimeline 
                    activities={activityHistory} 
                    isLoading={isActivityLoading} 
                  />
                </VStack>
              </AnimatedTransition>
            </LazyPanel>
          </AnimatePresence>
        </Box>
      </Box>
    </ScaleFade>
  );
};

// Use React.memo with custom comparison function for optimal re-rendering
export default React.memo(ContextPanel, (prevProps, nextProps) => {
  // Only re-render if the selected node has changed
  if (!prevProps.selectedNode && !nextProps.selectedNode) return true;
  if (!prevProps.selectedNode || !nextProps.selectedNode) return false;
  return prevProps.selectedNode.id === nextProps.selectedNode.id;
});