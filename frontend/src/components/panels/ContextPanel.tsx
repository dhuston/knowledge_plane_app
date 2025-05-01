import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  CloseButton,
  Heading,
  HStack,
  Text,
  Icon,
  useColorModeValue,
  Fade,
  Button,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { 
  MdOutlinePerson, 
  MdOutlineGroup, 
  MdOutlineFolder, 
  MdOutlineFlag,
  MdOutlineBook,
  MdOutlineBusinessCenter,
  MdOutlineQuestionMark
} from 'react-icons/md';
import { useApiClient } from '../../hooks/useApiClient';
import { MapNode, MapNodeTypeEnum } from '../../types/map';
import UserPanel from './entity-panels/UserPanel';
import TeamPanel from './entity-panels/TeamPanel';
import ProjectPanel from './entity-panels/ProjectPanel';
import GoalPanel from './entity-panels/GoalPanel';
import EntityDetails from './EntityDetails';
import RelationshipList from './RelationshipList';
import ActivityTimeline from './ActivityTimeline';
import ActionButtons from './ActionButtons';

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
  const [entityData, setEntityData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activityHistory, setActivityHistory] = useState<any[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState<boolean>(false);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [isRelationshipsLoading, setIsRelationshipsLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'related'>('details');
  const apiClient = useApiClient();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Get node icon based on type
  const getNodeIcon = (type: MapNodeTypeEnum | undefined) => {
    switch (type) {
      case MapNodeTypeEnum.USER:
        return MdOutlinePerson;
      case MapNodeTypeEnum.TEAM:
        return MdOutlineGroup;
      case MapNodeTypeEnum.PROJECT:
        return MdOutlineFolder;
      case MapNodeTypeEnum.GOAL:
        return MdOutlineFlag;
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return MdOutlineBook;
      case MapNodeTypeEnum.DEPARTMENT:
        return MdOutlineBusinessCenter;
      case MapNodeTypeEnum.TEAM_CLUSTER:
        return MdOutlineGroup;
      default:
        return MdOutlineQuestionMark;
    }
  };

  // Get type label
  const getTypeLabel = (type: MapNodeTypeEnum | undefined): string => {
    if (!type) return 'Unknown';
    // Convert snake_case to Title Case (e.g., "knowledge_asset" to "Knowledge Asset")
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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

        const response = await apiClient.get(apiUrl);
        setEntityData(response.data);
      } catch (err: any) {
        console.error(`Error fetching ${selectedNode.type} data:`, err);
        setError(err.message || `Failed to load ${selectedNode.type} details`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntityData();
  }, [selectedNode, apiClient]);

  // Fetch relationships data when entity data is loaded
  useEffect(() => {
    if (!selectedNode || !entityData) return;

    const fetchRelationships = async () => {
      setIsRelationshipsLoading(true);
      try {
        // For now, we'll use the relationships from the node data if available
        // In the future, this would be a separate API call
        if (selectedNode.data && selectedNode.data.relationships) {
          setRelationships(selectedNode.data.relationships);
        } else {
          // Placeholder for future API call
          // const response = await apiClient.get(`/${selectedNode.type}s/${selectedNode.id}/relationships`);
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
        
        // Enhanced mock data with more activities to demonstrate timeline
        const mockActivities = [
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
  
  // Event handlers for navigation and action events
  const handleNodeNavigation = useCallback((e: Event) => {
    const event = e as CustomEvent;
    if (event.detail && event.detail.nodeId) {
      console.log('Navigate to node:', event.detail);
      // Here you would typically:
      // 1. Fetch the node data
      // 2. Update the selected node
      // 3. You could also emit an event for the parent component to handle
      
      // For now, just log it
      alert(`Navigation to node ${event.detail.label} (${event.detail.nodeId}) would happen here`);
    }
  }, []);
  
  const handleEntityAction = useCallback((e: Event) => {
    const event = e as CustomEvent;
    if (event.detail) {
      console.log('Entity action triggered:', event.detail);
      // Here you would perform the actual action
      // For example, if action is "Edit", you would open an edit modal
    }
  }, []);
  
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

  // Render the appropriate panel based on entity type
  const renderEntityPanel = () => {
    if (!selectedNode || !entityData) return null;

    switch (selectedNode.type) {
      case MapNodeTypeEnum.USER:
        return <UserPanel data={entityData} selectedNode={selectedNode} />;
      case MapNodeTypeEnum.TEAM:
        return <TeamPanel data={entityData} selectedNode={selectedNode} />;
      case MapNodeTypeEnum.PROJECT:
        return (
          <ProjectPanel 
            data={entityData} 
            selectedNode={selectedNode}
            projectOverlaps={projectOverlaps}
            getProjectNameById={getProjectNameById}
          />
        );
      case MapNodeTypeEnum.GOAL:
        return <GoalPanel data={entityData} selectedNode={selectedNode} />;
      default:
        return (
          <EntityDetails 
            data={entityData}
            selectedNode={selectedNode}
          />
        );
    }
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

  // Render suggestions component
  const renderEntitySuggestions = () => {
    if (!suggestions || suggestions.length === 0) return null;
    
    return (
      <Box mt={4} p={3} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
        <Heading size="xs" mb={3}>Suggested Connections</Heading>
        <HStack spacing={2} flexWrap="wrap">
          {suggestions.map(suggestion => (
            <Badge 
              key={suggestion.id}
              px={2} py={1} 
              borderRadius="full"
              variant="subtle"
              colorScheme="blue"
              cursor="pointer"
              onClick={() => {
                // This would navigate to the suggested entity
                console.log('Navigate to suggestion:', suggestion);
                alert(`Navigation to ${suggestion.label} would happen here`);
              }}
            >
              {suggestion.label}
              {suggestion.reason && (
                <Tooltip label={suggestion.reason} hasArrow placement="top">
                  <Icon as={MdOutlineQuestionMark} ml={1} boxSize={3} />
                </Tooltip>
              )}
            </Badge>
          ))}
        </HStack>
      </Box>
    );
  };

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
      >
        {/* Header */}
        <HStack 
          p={4} 
          borderBottom="1px solid" 
          borderColor={borderColor} 
          justifyContent="space-between"
        >
          <HStack>
            <Icon as={getNodeIcon(selectedNode.type)} boxSize={5} />
            <VStack align="flex-start" spacing={0}>
              <Heading size="sm">{selectedNode.label}</Heading>
              <Text color="gray.500" fontSize="sm">{getTypeLabel(selectedNode.type)}</Text>
            </VStack>
          </HStack>
          <CloseButton onClick={onClose} />
        </HStack>

        {/* Tab navigation */}
        <HStack 
          borderBottom="1px solid" 
          borderColor={borderColor} 
          px={4}
          py={2}
          spacing={4}
        >
          <Button 
            variant={activeTab === 'details' ? 'solid' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('details')}
            colorScheme={activeTab === 'details' ? 'blue' : undefined}
          >
            Details
          </Button>
          <Button 
            variant={activeTab === 'related' ? 'solid' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('related')}
            colorScheme={activeTab === 'related' ? 'blue' : undefined}
          >
            Relationships
          </Button>
          <Button 
            variant={activeTab === 'activity' ? 'solid' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('activity')}
            colorScheme={activeTab === 'activity' ? 'blue' : undefined}
          >
            Activity
          </Button>
        </HStack>

        {/* Panel Content */}
        <Box flex="1" overflowY="auto" p={4}>
          {activeTab === 'details' && (
            <VStack spacing={6} align="stretch">
              {/* Entity-specific details */}
              {renderEntityPanel()}
              
              {/* Suggestions only shown in details tab */}
              {renderEntitySuggestions()}

              {/* Action Buttons */}
              <ActionButtons entityType={selectedNode.type} entityId={selectedNode.id} />
            </VStack>
          )}
          
          {activeTab === 'related' && (
            <VStack spacing={6} align="stretch">
              <RelationshipList 
                relationships={relationships} 
                isLoading={isRelationshipsLoading} 
                entityType={selectedNode.type}
              />
            </VStack>
          )}
          
          {activeTab === 'activity' && (
            <VStack spacing={6} align="stretch">
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