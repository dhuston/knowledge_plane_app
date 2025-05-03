/**
 * DepartmentPopover.tsx
 * Department-specific popover content
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
  List,
  ListItem,
  Box,
  Flex,
  Progress,
} from '@chakra-ui/react';
import { FiUsers, FiTarget, FiChevronRight } from 'react-icons/fi';

import { OrganizationalUnitEntity, isOrgDepartmentEntity } from '../../../types/hierarchy';
import { useHierarchy } from '../state/HierarchyContext';

interface DepartmentPopoverProps {
  unit: OrganizationalUnitEntity;
}

export const DepartmentPopover: React.FC<DepartmentPopoverProps> = ({ unit }) => {
  // Get hierarchy data
  const { units } = useHierarchy();
  
  // Safely cast to department entity
  const department = isOrgDepartmentEntity(unit) ? unit : null;
  
  // Get leader name if available
  const leaderName = department?.head_id ? units[department.head_id]?.name || 'Unknown Leader' : null;
  
  // Get teams and metrics
  const teams = department?.teamIds || [];
  const teamsWithData = teams
    .filter(id => units[id])
    .map(id => units[id])
    .slice(0, 3);
  
  // Mock goals progress
  const goalsProgress = 68; // Percentage
  
  return (
    <VStack spacing={3} align="stretch">
      {/* Leader info */}
      {leaderName && (
        <HStack spacing={2}>
          <Avatar size="xs" name={leaderName} />
          <Text fontSize="sm" fontWeight="medium">{leaderName}</Text>
          <Badge fontSize="xs" colorScheme="purple">Leader</Badge>
        </HStack>
      )}
      
      {/* Teams count */}
      <HStack spacing={1}>
        <Icon as={FiUsers} boxSize="12px" />
        <Text fontSize="sm">
          {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
        </Text>
      </HStack>
      
      {/* List of teams (first 3) */}
      {teamsWithData.length > 0 && (
        <List spacing={1} fontSize="sm">
          {teamsWithData.map((team) => (
            <ListItem key={team.id}>
              <HStack spacing={1}>
                <Icon as={FiChevronRight} boxSize="12px" />
                <Text>{team.name}</Text>
              </HStack>
            </ListItem>
          ))}
          {teams.length > 3 && (
            <Text fontSize="xs" color="gray.500" mt={1}>
              +{teams.length - 3} more teams
            </Text>
          )}
        </List>
      )}
      
      <Divider />
      
      {/* Goals progress */}
      <Box>
        <Flex justify="space-between" align="center" mb={1}>
          <HStack spacing={1}>
            <Icon as={FiTarget} color="blue.500" boxSize="14px" />
            <Text fontSize="sm" fontWeight="medium">Department Goals</Text>
          </HStack>
          <Text fontSize="sm" fontWeight="bold">{goalsProgress}%</Text>
        </Flex>
        <Progress 
          value={goalsProgress} 
          size="sm" 
          colorScheme={goalsProgress > 66 ? "green" : goalsProgress > 33 ? "orange" : "red"} 
          borderRadius="full"
        />
      </Box>
    </VStack>
  );
};