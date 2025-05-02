/**
 * MapFilterPanel.tsx
 * Filter controls for the LivingMap
 */
import React, { memo, useCallback, useMemo } from 'react';
import {
  Box,
  VStack,
  Text,
  Badge,
  FormControl,
  FormLabel,
  Select,
  Switch,
  IconButton
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import { MapNodeTypeEnum } from '../../../types/map';
import { useFeatureFlags } from '../../../utils/featureFlags';

// Define filter options
export interface MapFilters {
  types: MapNodeTypeEnum[];
  statuses: string[];
  depth: number;
  clusterTeams: boolean;
  centerNodeId?: string | null;
}

// Define available statuses
export const AVAILABLE_STATUSES = ['active', 'planning', 'completed', 'blocked', 'archived'];

interface MapFilterPanelProps {
  filters: MapFilters;
  updateFilters: (newFilters: Partial<MapFilters>) => void;
  nodeCounts: Record<string, number>;
  nodeCount: number;
  edgeCount: number;
  hasMoreData: boolean;
  loadMoreData: () => void;
}

const MapFilterPanel: React.FC<MapFilterPanelProps> = ({
  filters,
  updateFilters,
  nodeCounts,
  nodeCount,
  edgeCount,
  hasMoreData,
  loadMoreData
}) => {
  // Use feature flags to control feature visibility
  const { flags } = useFeatureFlags();
  // Memoize the type filter handlers to prevent recreating them on every render
  const handleTypeFilterChange = useCallback((type: MapNodeTypeEnum) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    updateFilters({ types: newTypes });
  }, [filters.types, updateFilters]);

  // Memoize the status filter handlers to prevent recreating them on every render
  const handleStatusFilterChange = useCallback((status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    updateFilters({ statuses: newStatuses });
  }, [filters.statuses, updateFilters]);

  // Memoize reset handler
  const handleReset = useCallback(() => {
    updateFilters({
      types: Object.values(MapNodeTypeEnum),
      statuses: ['active', 'planning'],
      depth: 1,
      clusterTeams: true,
      centerNodeId: null
    });
  }, [updateFilters]);

  // Memoize node type badges for better rendering performance with accessibility
  const nodeTypeBadges = useMemo(() => {
    return Object.values(MapNodeTypeEnum).map(type => (
      <Box key={type} display="inline-block" mr={2} mb={2}>
        <Badge 
          colorScheme={filters.types.includes(type) ? 'blue' : 'gray'} 
          cursor="pointer"
          onClick={() => handleTypeFilterChange(type)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleTypeFilterChange(type);
              e.preventDefault();
            }
          }}
          px={2}
          py={1}
          role="checkbox"
          aria-checked={filters.types.includes(type)}
          tabIndex={0}
          aria-label={`Filter by ${type} nodes: ${nodeCounts[type] || 0} available`}
        >
          {type} {nodeCounts[type] ? `(${nodeCounts[type]})` : ''}
        </Badge>
      </Box>
    ));
  }, [filters.types, nodeCounts, handleTypeFilterChange]);

  // Memoize status badges for better rendering performance with accessibility
  const statusBadges = useMemo(() => {
    return AVAILABLE_STATUSES.map(status => (
      <Box key={status} display="inline-block" mr={2} mb={2}>
        <Badge 
          colorScheme={filters.statuses.includes(status) ? 'green' : 'gray'} 
          cursor="pointer"
          onClick={() => handleStatusFilterChange(status)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleStatusFilterChange(status);
              e.preventDefault();
            }
          }}
          px={2}
          py={1}
          role="checkbox"
          aria-checked={filters.statuses.includes(status)}
          tabIndex={0}
          aria-label={`Filter by ${status} status`}
        >
          {status}
        </Badge>
      </Box>
    ));
  }, [filters.statuses, handleStatusFilterChange]);

  return (
    <Box
      position="absolute"
      top="55px"
      right="15px"
      bg="white"
      p={4}
      borderRadius="md"
      boxShadow="md"
      zIndex={4}
      borderWidth="1px"
      borderColor="gray.200"
      minWidth="250px"
      role="dialog"
      id="filter-panel"
      aria-label="Map filters"
      aria-modal="true"
      _dark={{
        bg: '#363636',
        borderColor: 'gray.600',
        color: 'gray.200',
      }}
    >
      <VStack spacing={3} align="stretch">
        <Text fontWeight="bold" as="h3" id="filter-heading">Map Filters</Text>
        
        {/* Node Type Filter */}
        <FormControl size="sm" aria-labelledby="filter-heading node-type-label">
          <FormLabel fontSize="sm" id="node-type-label">Node Types</FormLabel>
          <Box role="group" aria-labelledby="node-type-label">
            {nodeTypeBadges}
          </Box>
        </FormControl>
        
        {/* Status Filter */}
        <FormControl size="sm" aria-labelledby="filter-heading status-label">
          <FormLabel fontSize="sm" id="status-label">Status Filter</FormLabel>
          <Box role="group" aria-labelledby="status-label">
            {statusBadges}
          </Box>
        </FormControl>
        
        {/* Depth Filter */}
        <FormControl size="sm" aria-labelledby="filter-heading">
          <FormLabel fontSize="sm" htmlFor="depth-select">Relationship Depth</FormLabel>
          <Select 
            size="sm" 
            id="depth-select"
            value={filters.depth} 
            onChange={(e) => updateFilters({ depth: parseInt(e.target.value) })}
            aria-label="Select relationship depth"
          >
            <option value={1}>Direct connections (1 level)</option>
            <option value={2}>Extended network (2 levels)</option>
          </Select>
        </FormControl>
        
        {/* Team Clustering - only show if feature flag is enabled */}
        {flags.enableTeamClustering && (
          <FormControl size="sm" display="flex" alignItems="center" aria-labelledby="filter-heading">
            <FormLabel fontSize="sm" mb="0" htmlFor="cluster-switch">
              Cluster team members
            </FormLabel>
            <Switch 
              id="cluster-switch"
              isChecked={filters.clusterTeams} 
              onChange={(e) => updateFilters({ clusterTeams: e.target.checked })}
              aria-label="Toggle team clustering"
              colorScheme="blue"
            />
          </FormControl>
        )}
        
        {/* Reset Filter Button */}
        <IconButton
          aria-label="Reset all filters to default values"
          icon={<FiRefreshCw />}
          size="sm"
          onClick={handleReset}
        />
        
        {/* Stats */}
        <Box fontSize="xs" mt={2} pt={2} borderTopWidth="1px" borderColor="gray.200">
          <Text>Showing {nodeCount} nodes, {edgeCount} connections</Text>
          {hasMoreData && (
            <Text 
              color="blue.500" 
              cursor="pointer" 
              onClick={loadMoreData}
              _dark={{ color: 'blue.300' }}
            >
              Load more data...
            </Text>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default memo(MapFilterPanel);