/**
 * OrganizationPopover.tsx
 * Organization-specific popover content
 */
import React from 'react';
import {
  VStack,
  HStack,
  Avatar,
  Badge,
  Divider,
  Text,
  Icon,
  Box,
  Flex,
  Progress,
} from '@chakra-ui/react';
import { FiBriefcase, FiTarget } from 'react-icons/fi';

import { 
  OrganizationalUnitEntity, 
  isOrganizationEntity, 
  isDivisionEntity 
} from '../../../types/hierarchy';
import { useHierarchy } from '../state/HierarchyContext';

interface OrganizationPopoverProps {
  unit: OrganizationalUnitEntity;
}

export const OrganizationPopover: React.FC<OrganizationPopoverProps> = ({ unit }) => {
  // Get hierarchy data
  const { units } = useHierarchy();
  
  // Check if this is an organization or division
  const isOrg = isOrganizationEntity(unit);
  const isDiv = isDivisionEntity(unit);
  
  // Get executive name if available
  const executiveId = isOrg ? unit.executiveId : isDiv ? unit.leaderId : undefined;
  const executiveName = executiveId ? units[executiveId]?.name || 'Unknown Executive' : null;
  
  // Count departments
  const departmentIds = isOrg ? unit.departmentIds : isDiv ? unit.departmentIds : [];
  const departmentsCount = departmentIds?.length || 0;
  
  // Mock KPIs 
  const performanceKpi = 87; // %
  const growthKpi = 24; // %
  
  return (
    <VStack spacing={3} align="stretch">
      {/* Executive info */}
      {executiveName && (
        <HStack spacing={2}>
          <Avatar size="xs" name={executiveName} />
          <Text fontSize="sm" fontWeight="medium">{executiveName}</Text>
          <Badge fontSize="xs" colorScheme="red">
            {isOrg ? 'Executive' : 'Director'}
          </Badge>
        </HStack>
      )}
      
      {/* Departments count */}
      <HStack spacing={1}>
        <Icon as={FiBriefcase} boxSize="12px" />
        <Text fontSize="sm">
          {departmentsCount} {departmentsCount === 1 ? 'Department' : 'Departments'}
        </Text>
      </HStack>
      
      <Divider />
      
      {/* Organization-wide KPIs */}
      <VStack spacing={2} align="stretch">
        {/* Mini KPI progress indicators */}
        <Box>
          <Flex justify="space-between" align="center" mb={1}>
            <Text fontSize="sm" fontWeight="medium">Performance</Text>
            <Text fontSize="sm" fontWeight="bold">{performanceKpi}%</Text>
          </Flex>
          <Progress 
            value={performanceKpi} 
            size="xs" 
            colorScheme="green" 
            borderRadius="full"
          />
        </Box>
        
        <Box>
          <Flex justify="space-between" align="center" mb={1}>
            <Text fontSize="sm" fontWeight="medium">Growth</Text>
            <Text fontSize="sm" fontWeight="bold">+{growthKpi}%</Text>
          </Flex>
          <Progress 
            value={growthKpi} 
            size="xs" 
            colorScheme="blue" 
            borderRadius="full"
          />
        </Box>
      </VStack>
    </VStack>
  );
};