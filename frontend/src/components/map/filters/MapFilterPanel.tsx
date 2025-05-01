/**
 * MapFilterPanel.tsx
 * Filter controls for the LivingMap
 */
import React from 'react';
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
      _dark={{
        bg: '#363636',
        borderColor: 'gray.600',
        color: 'gray.200',
      }}
    >
      <VStack spacing={3} align="stretch">
        <Text fontWeight="bold">Map Filters</Text>
        
        {/* Node Type Filter */}
        <FormControl size="sm">
          <FormLabel fontSize="sm">Node Types</FormLabel>
          {Object.values(MapNodeTypeEnum).map(type => (
            <Box key={type} display="inline-block" mr={2} mb={2}>
              <Badge 
                colorScheme={filters.types.includes(type) ? 'blue' : 'gray'} 
                cursor="pointer"
                onClick={() => {
                  const newTypes = filters.types.includes(type)
                    ? filters.types.filter(t => t !== type)
                    : [...filters.types, type];
                  updateFilters({ types: newTypes });
                }}
                px={2}
                py={1}
              >
                {type} {nodeCounts[type] ? `(${nodeCounts[type]})` : ''}
              </Badge>
            </Box>
          ))}
        </FormControl>
        
        {/* Status Filter */}
        <FormControl size="sm">
          <FormLabel fontSize="sm">Status Filter</FormLabel>
          {AVAILABLE_STATUSES.map(status => (
            <Box key={status} display="inline-block" mr={2} mb={2}>
              <Badge 
                colorScheme={filters.statuses.includes(status) ? 'green' : 'gray'} 
                cursor="pointer"
                onClick={() => {
                  const newStatuses = filters.statuses.includes(status)
                    ? filters.statuses.filter(s => s !== status)
                    : [...filters.statuses, status];
                  updateFilters({ statuses: newStatuses });
                }}
                px={2}
                py={1}
              >
                {status}
              </Badge>
            </Box>
          ))}
        </FormControl>
        
        {/* Depth Filter */}
        <FormControl size="sm">
          <FormLabel fontSize="sm">Relationship Depth</FormLabel>
          <Select 
            size="sm" 
            value={filters.depth} 
            onChange={(e) => updateFilters({ depth: parseInt(e.target.value) })}
          >
            <option value={1}>Direct connections (1 level)</option>
            <option value={2}>Extended network (2 levels)</option>
          </Select>
        </FormControl>
        
        {/* Team Clustering */}
        <FormControl size="sm" display="flex" alignItems="center">
          <FormLabel fontSize="sm" mb="0">
            Cluster team members
          </FormLabel>
          <Switch 
            isChecked={filters.clusterTeams} 
            onChange={(e) => updateFilters({ clusterTeams: e.target.checked })}
          />
        </FormControl>
        
        {/* Reset Filter Button */}
        <IconButton
          aria-label="Reset filters"
          icon={<FiRefreshCw />}
          size="sm"
          onClick={() => updateFilters({
            types: Object.values(MapNodeTypeEnum),
            statuses: ['active', 'planning'],
            depth: 1,
            clusterTeams: true,
            centerNodeId: null
          })}
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

export default MapFilterPanel;