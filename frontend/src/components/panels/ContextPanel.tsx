import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Fade
} from '@chakra-ui/react';
import { useFeatureFlags } from '../../utils/featureFlags';
import { useApiClient } from '../../hooks/useApiClient';
import { MapNode, MapNodeTypeEnum } from '../../types/map';

// Import entity panels
import UserPanel from './entity-panels/UserPanel';
import TeamPanel from './entity-panels/TeamPanel';
import ProjectPanel from './entity-panels/ProjectPanel';
import GoalPanel from './entity-panels/GoalPanel';
import EntityDetails from './EntityDetails';

// Import common components
import RelationshipList from './RelationshipList';
import ActivityTimeline from './ActivityTimeline';
import ActionButtons from './ActionButtons';

// Import extracted components
import PanelHeader from './header/PanelHeader';
import PanelTabs, { PanelTabType } from './tabs/PanelTabs';
import EntitySuggestions, { EntitySuggestion } from './suggestions/EntitySuggestions';
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

interface ContextPanelProps {
  selectedNode: MapNode | null;
  onClose: () => void;
  projectOverlaps?: Record<string, string[]>;
  getProjectNameById?: (id: string) => string | undefined;
}

const ContextPanel: React.FC<ContextPanelProps> = ({
  selectedNode,
  onClose,
  projectOverlaps = {},
  getProjectNameById = () => undefined
}) => {
  const [entityData, setEntityData] = useState<EntityDataType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activityHistory, setActivityHistory] = useState<Activity[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState<boolean>(false);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isRelationshipsLoading, setIsRelationshipsLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<EntitySuggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<PanelTabType>('details');
  const [navHistory, setNavHistory] = useState<NavHistoryItem[]>([]);
  const [previousNodes, setPreviousNodes] = useState<Map<string, EntityDataType>>(new Map());
  const apiClient = useApiClient();
  const { flags } = useFeatureFlags();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Fetch entity data
  useEffect(() => {
    if (!selectedNode) {
      setEntityData(null);
      setError(null);
      setActivityHistory([]);
      setRelationships([]);
      setSuggestions([]);
      return;
    }

    const fetchEntityData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
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

        // Check if we already have cached data for this node
        if (previousNodes.has(selectedNode.id)) {
          setEntityData(previousNodes.get(selectedNode.id)!);
          setIsLoading(false);
        } else {
          // Fetch from API if not cached
          const response = await apiClient.get<EntityDataType>(apiUrl);
          setEntityData(response.data);
          
          // Cache the result for future use
          setPreviousNodes(prev => {
            const updated = new Map(prev);
            updated.set(selectedNode.id, response.data);
            return updated;
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
            if (newHistory.length > 20) {
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
        setError(err.message || `Failed to load ${selectedNode.type} details`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntityData();
  }, [selectedNode, apiClient, previousNodes]);

  // Fetch relationships data when entity data is loaded
  useEffect(() => {
    if (!selectedNode || !entityData) return;

    const fetchRelationships = async () => {
      setIsRelationshipsLoading(true);
      try {
        // For now, we'll use the relationships from the node data if available
        // In the future, this would be a separate API call
        if (selectedNode.data && selectedNode.data.relationships) {
          // Cast the relationships to the proper type
          setRelationships(selectedNode.data.relationships as Relationship[]);
        } else {
          // Placeholder for future API call
          // const response = await apiClient.get<Relationship[]>(`/${selectedNode.type}s/${selectedNode.id}/relationships`);
          // setRelationships(response.data || []);
          setRelationships([]);
        }
      } catch (err) {
        console.error('Error fetching relationships:', err);
        setRelationships([]);
      } finally {
        setIsRelationshipsLoading(false);
      }
    };

    fetchRelationships();
  }, [selectedNode, entityData, apiClient]);

  // Fetch activity history when entity data is loaded
  useEffect(() => {
    if (!selectedNode || !entityData) return;

    const fetchActivityHistory = async () => {
      setIsActivityLoading(true);
      try {
        // Placeholder for future API call
        // This would be a real API call in the future
        // const response = await apiClient.get(`/activities?entityType=${selectedNode.type}&entityId=${selectedNode.id}`);
        // setActivityHistory(response.data || []);
        
        // Enhanced mock data with more activities to demonstrate timeline - now properly typed
        const mockActivities: Activity[] = [
          { 
            id: '1', 
            type: 'update', 
            message: 'Updated status to Active', 
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
            user: 'John Doe' 
          },
          { 
            id: '2', 
            type: 'comment', 
            message: 'Added a new comment about implementation approach', 
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
            user: 'Jane Smith' 
          },
          { 
            id: '3', 
            type: 'link', 
            message: 'Linked to Project X for alignment', 
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
            user: 'Alex Johnson' 
          },
          { 
            id: '4', 
            type: 'create', 
            message: 'Created entity', 
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            user: 'System' 
          }
        ];
        
        // Add entity-specific mock activities based on node type
        if (selectedNode.type === MapNodeTypeEnum.PROJECT) {
          mockActivities.push(
            { 
              id: '5', 
              type: 'update', 
              message: 'Updated project timeline', 
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), 
              user: 'Project Manager' 
            }
          );
        } else if (selectedNode.type === MapNodeTypeEnum.TEAM) {
          mockActivities.push(
            { 
              id: '6', 
              type: 'update', 
              message: 'Added new team member', 
              timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), 
              user: 'Team Lead' 
            }
          );
        }
        
        setActivityHistory(mockActivities);
      } catch (err) {
        console.error('Error fetching activity history:', err);
        setActivityHistory([]);
      } finally {
        setIsActivityLoading(false);
      }
    };

    fetchActivityHistory();
  }, [selectedNode, entityData, apiClient]);

  // Fetch entity suggestions when entity data is loaded
  useEffect(() => {
    if (!selectedNode || !entityData) return;

    const fetchSuggestions = async () => {
      setIsSuggestionsLoading(true);
      try {
        // Placeholder for future API call
        // This would be a real API call in the future
        // const response = await apiClient.get(`/${selectedNode.type}s/${selectedNode.id}/suggestions`);
        // setSuggestions(response.data || []);
        
        // Enhanced mock data with sample suggestions
        const mockSuggestions = [
          {
            id: 'sugg-1',
            type: MapNodeTypeEnum.USER,
            label: 'Emily Chen',
            reason: 'Frequently collaborates on similar projects'
          },
          {
            id: 'sugg-2',
            type: MapNodeTypeEnum.PROJECT,
            label: 'Q3 Platform Update',
            reason: 'Aligned to same strategic goals'
          },
          {
            id: 'sugg-3',
            type: MapNodeTypeEnum.TEAM,
            label: 'Research Team',
            reason: 'Shares multiple team members'
          }
        ];
        
        // Only show suggestions for certain entity types
        if (['USER', 'PROJECT', 'TEAM'].includes(selectedNode.type)) {
          setSuggestions(mockSuggestions);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestions([]);
      } finally {
        setIsSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, [selectedNode, entityData, apiClient]);
  
  // Handle breadcrumb navigation
  const handleBreadcrumbNavigation = useCallback((item: NavHistoryItem) => {
    // Create a synthetic MapNode to pass to onNodeClick
    const syntheticNode = {
      id: item.nodeId,
      type: item.nodeType,
      label: item.label,
      data: {} // The data will be loaded from the cache
    };
    
    // Navigate to the selected node
    onNodeClick(item.nodeId);
    
    // Note: We don't need to update navHistory here as that will
    // happen automatically when the selectedNode changes
  }, [onNodeClick]);

  // Event handlers for navigation and action events
  const handleNodeNavigation = useCallback((e: Event) => {
    const event = e as CustomEvent;
    if (event.detail && event.detail.nodeId) {
      console.log('Navigate to node:', event.detail);
      
      // Navigate to the node
      onNodeClick(event.detail.nodeId);
      
      // Navigation history is updated in the useEffect that depends on selectedNode
    }
  }, [onNodeClick]);
  
  const handleEntityAction = useCallback((e: Event) => {
    const event = e as CustomEvent;
    if (event.detail) {
      console.log('Entity action triggered:', event.detail);
      // Here you would perform the actual action
      // For example, if action is "Edit", you would open an edit modal
    }
  }, []);

  const handleSuggestionClick = useCallback((suggestionId: string, label: string) => {
    // Navigate to the suggested entity
    console.log('Navigate to suggestion:', suggestionId);
    onNodeClick(suggestionId);
  }, [onNodeClick]);
  
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

  // Render the appropriate panel based on entity type using type guards
  const renderEntityPanel = () => {
    if (!selectedNode || !entityData) return null;

    // Using type guards to ensure proper typing
    if (isUserEntity(entityData) && selectedNode.type === MapNodeTypeEnum.USER) {
      return <UserPanel data={entityData} selectedNode={selectedNode} />;
    } 
    
    if (isTeamEntity(entityData) && selectedNode.type === MapNodeTypeEnum.TEAM) {
      return <TeamPanel data={entityData} selectedNode={selectedNode} />;
    }
    
    if (isProjectEntity(entityData) && selectedNode.type === MapNodeTypeEnum.PROJECT) {
      return (
        <ProjectPanel 
          data={entityData} 
          selectedNode={selectedNode}
          projectOverlaps={projectOverlaps}
          getProjectNameById={getProjectNameById}
        />
      );
    }
    
    if (isGoalEntity(entityData) && selectedNode.type === MapNodeTypeEnum.GOAL) {
      return <GoalPanel data={entityData} selectedNode={selectedNode} />;
    }
    
    // Default fallback for other entity types
    return (
      <EntityDetails 
        data={entityData}
        selectedNode={selectedNode}
      />
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <Box 
        width="100%" 
        height="100%" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
        bg={bgColor}
        borderLeft="1px solid"
        borderColor={borderColor}
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box 
        width="100%" 
        height="100%"
        p={4}
        bg={bgColor}
        borderLeft="1px solid"
        borderColor={borderColor}
      >
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Box>
    );
  }

  // Render empty state
  if (!selectedNode) {
    return null;
  }

  // Reference for focus management
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Focus the panel when it opens
  React.useEffect(() => {
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

  return (
    <Fade in={true}>
      <Box
        width="100%"
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
      >
        {/* Header */}
        <Box>
          <PanelHeader 
            label={selectedNode.label}
            type={selectedNode.type}
            onClose={onClose}
          />
          
          {/* Navigation breadcrumb - only show if we have navigation history */}
          {navHistory.length > 1 && (
            <Box px={4} py={2} borderBottomWidth="1px" borderColor={borderColor}>
              <BreadcrumbNav 
                history={navHistory}
                onNavigate={handleBreadcrumbNavigation}
                maxDisplayed={4}
                fontSize="xs"
              />
            </Box>
          )}
        </Box>

        {/* Tab navigation */}
        <PanelTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {/* Panel Content */}
        <Box 
          flex="1" 
          overflowY="auto" 
          p={4}
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === 'details' && (
            <VStack 
              spacing={6} 
              align="stretch"
              id="panel-details"
            >
              {/* Entity-specific details */}
              {renderEntityPanel()}
              
              {/* Suggestions only shown in details tab */}
              <EntitySuggestions 
                suggestions={suggestions}
                onSuggestionClick={handleSuggestionClick}
              />
              
              {/* Recently viewed entities - only shown when we have navigation history */}
              {navHistory.length > 1 && (
                <RecentlyViewedEntities 
                  items={navHistory} 
                  onEntityClick={handleBreadcrumbNavigation}
                  maxItems={4}
                  currentEntityId={selectedNode.id}
                />
              )}

              {/* Action Buttons */}
              <ActionButtons entityType={selectedNode.type} entityId={selectedNode.id} />
            </VStack>
          )}
          
          {activeTab === 'related' && (
            <VStack 
              spacing={6} 
              align="stretch"
              id="panel-related"
            >
              <RelationshipList 
                relationships={relationships} 
                isLoading={isRelationshipsLoading} 
                entityType={selectedNode.type}
              />
            </VStack>
          )}
          
          {activeTab === 'activity' && (
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
          )}
        </Box>
      </Box>
    </Fade>
  );
};

export default ContextPanel;