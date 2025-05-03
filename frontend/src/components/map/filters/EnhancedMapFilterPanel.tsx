import React, { memo, useCallback } from 'react';
import {
  Box,
  VStack,
  Text,
  Badge,
  FormControl,
  FormLabel,
  Select,
  Switch,
  IconButton,
  Grid,
  Heading,
  HStack,
  Tooltip,
  useColorModeValue,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
} from '@chakra-ui/react';
import { FiRefreshCw, FiSliders, FiFilter, FiX } from 'react-icons/fi';
import { useMapFilters } from '../providers/MapFiltersManager';
import { useMapData } from '../providers/MapDataProvider';
import { MapNodeTypeEnum } from '../../../types/map';

interface EnhancedMapFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * EnhancedMapFilterPanel - A fully context-integrated filter panel for the map
 */
const EnhancedMapFilterPanel: React.FC<EnhancedMapFilterPanelProps> = ({ 
  isOpen,
  onClose
}) => {
  // Get filter context and data
  const { 
    filters, 
    toggleNodeType, 
    toggleStatus, 
    setFilters, 
    resetFilters, 
    availableNodeTypes, 
    availableStatuses, 
    nodeCounts
  } = useMapFilters();
  
  const { mapData, refreshMapData } = useMapData();
  
  // Background and border colors
  const bg = useColorModeValue('white', '#2D3748');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  
  // Color schemes for different node types
  const getNodeTypeColorScheme = (type: MapNodeTypeEnum): string => {
    switch (type) {
      case MapNodeTypeEnum.USER:
        return 'blue';
      case MapNodeTypeEnum.TEAM:
        return 'cyan';
      case MapNodeTypeEnum.PROJECT:
        return 'orange';
      case MapNodeTypeEnum.GOAL:
        return 'green';
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return 'purple';
      case MapNodeTypeEnum.DEPARTMENT:
        return 'teal';
      default:
        return 'gray';
    }
  };
  
  // Color schemes for statuses
  const getStatusColorScheme = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'green';
      case 'planning':
        return 'blue';
      case 'completed':
        return 'purple';
      case 'blocked':
        return 'red';
      case 'archived':
        return 'gray';
      default:
        return 'gray';
    }
  };
  
  // Handle depth change
  const handleDepthChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ depth: parseInt(e.target.value, 10) });
  }, [setFilters]);
  
  // Handle team clustering toggle
  const handleClusterTeamsToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ clusterTeams: e.target.checked });
  }, [setFilters]);
  
  // Number formatting
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  
  // Show or hide the panel
  if (!isOpen) return null;
  
  return (
    <Box
      position="absolute"
      top="55px"
      right="15px"
      bg={bg}
      maxWidth="350px"
      width="90%"
      p={0}
      borderRadius="md"
      boxShadow="lg"
      zIndex={10}
      borderWidth="1px"
      borderColor={borderColor}
      role="dialog"
      aria-label="Map filters"
      aria-modal="true"
    >
      {/* Header */}
      <Flex 
        justify="space-between" 
        align="center" 
        bg={headerBg} 
        p={3}
        borderBottomWidth="1px"
        borderBottomColor={borderColor}
        borderTopRadius="md"
      >
        <HStack>
          <FiFilter />
          <Heading size="sm">Map Filters</Heading>
        </HStack>
        <HStack>
          <Tooltip label="Reset filters" placement="top">
            <IconButton
              aria-label="Reset filters"
              icon={<FiRefreshCw />}
              size="sm"
              variant="ghost"
              onClick={resetFilters}
            />
          </Tooltip>
          <Tooltip label="Close" placement="top">
            <IconButton
              aria-label="Close"
              icon={<FiX />}
              size="sm"
              variant="ghost"
              onClick={onClose}
            />
          </Tooltip>
        </HStack>
      </Flex>
      
      {/* Main Content */}
      <VStack spacing={4} align="stretch" p={4}>
        {/* Entity Type Filter */}
        <FormControl size="sm" aria-labelledby="node-type-label">
          <FormLabel fontSize="sm" fontWeight="medium" id="node-type-label">Entity Types</FormLabel>
          <Box>
            <Grid templateColumns="repeat(3, 1fr)" gap={2}>
              {availableNodeTypes.map(type => (
                <Badge
                  key={type}
                  colorScheme={filters.types.includes(type) ? getNodeTypeColorScheme(type) : 'gray'}
                  variant={filters.types.includes(type) ? 'solid' : 'outline'}
                  py={1}
                  px={2}
                  borderRadius="md"
                  cursor="pointer"
                  textAlign="center"
                  onClick={() => toggleNodeType(type)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      toggleNodeType(type);
                      e.preventDefault();
                    }
                  }}
                  role="checkbox"
                  aria-checked={filters.types.includes(type)}
                  tabIndex={0}
                >
                  {type} {nodeCounts[type] ? `(${nodeCounts[type]})` : ''}
                </Badge>
              ))}
            </Grid>
          </Box>
        </FormControl>
        
        {/* Status Filter */}
        <FormControl size="sm" aria-labelledby="status-label">
          <FormLabel fontSize="sm" fontWeight="medium" id="status-label">Status Filter</FormLabel>
          <Box>
            <Grid templateColumns="repeat(2, 1fr)" gap={2}>
              {availableStatuses.map(status => (
                <Badge
                  key={status}
                  colorScheme={filters.statuses.includes(status) ? getStatusColorScheme(status) : 'gray'}
                  variant={filters.statuses.includes(status) ? 'solid' : 'outline'}
                  py={1}
                  px={2}
                  borderRadius="md"
                  cursor="pointer"
                  textAlign="center"
                  onClick={() => toggleStatus(status)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      toggleStatus(status);
                      e.preventDefault();
                    }
                  }}
                  role="checkbox"
                  aria-checked={filters.statuses.includes(status)}
                  tabIndex={0}
                >
                  {status}
                </Badge>
              ))}
            </Grid>
          </Box>
        </FormControl>
        
        {/* Relationship Depth */}
        <FormControl size="sm">
          <FormLabel fontSize="sm" fontWeight="medium" htmlFor="depth-select">
            Relationship Depth
          </FormLabel>
          <Select
            id="depth-select"
            size="sm"
            value={filters.depth}
            onChange={handleDepthChange}
            aria-label="Select relationship depth"
          >
            <option value={1}>Direct connections (1 level)</option>
            <option value={2}>Extended network (2 levels)</option>
            <option value={3}>Broad network (3 levels)</option>
          </Select>
        </FormControl>
        
        {/* Team Clustering */}
        <FormControl size="sm" display="flex" alignItems="center">
          <FormLabel fontSize="sm" fontWeight="medium" htmlFor="cluster-switch" mb={0}>
            Cluster team members
          </FormLabel>
          <Switch
            id="cluster-switch"
            isChecked={filters.clusterTeams}
            onChange={handleClusterTeamsToggle}
            aria-label="Toggle team clustering"
            colorScheme="blue"
          />
        </FormControl>
        
        {/* Stats */}
        <Box borderTopWidth="1px" borderColor={borderColor} pt={3} mt={2}>
          <StatGroup>
            <Stat>
              <StatLabel fontSize="xs">Nodes</StatLabel>
              <StatNumber fontSize="sm">{formatNumber(mapData.nodes.length)}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel fontSize="xs">Connections</StatLabel>
              <StatNumber fontSize="sm">{formatNumber(mapData.edges.length)}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel fontSize="xs">Entity Types</StatLabel>
              <StatNumber fontSize="sm">{formatNumber(availableNodeTypes.length)}</StatNumber>
            </Stat>
          </StatGroup>
        </Box>
      </VStack>
    </Box>
  );
};

// Use memoization to prevent unnecessary re-renders
export default memo(EnhancedMapFilterPanel);