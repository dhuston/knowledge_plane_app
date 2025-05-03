/**
 * TeamPopover.tsx
 * Team-specific popover content
 */
import React from 'react';
import {
  VStack,
  HStack,
  Avatar,
  AvatarGroup,
  Badge,
  Divider,
  Flex,
  Text,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiUsers, FiCalendar, FiTarget } from 'react-icons/fi';

import { OrganizationalUnitEntity, isOrgTeamEntity } from '../../../types/hierarchy';
import { useHierarchy } from '../state/HierarchyContext';

interface TeamPopoverProps {
  unit: OrganizationalUnitEntity;
}

export const TeamPopover: React.FC<TeamPopoverProps> = ({ unit }) => {
  // Get hierarchy data
  const { units } = useHierarchy();
  
  // Safely cast to team entity
  const team = isOrgTeamEntity(unit) ? unit : null;
  
  // Get manager name if available
  const managerName = team?.leaderId ? units[team.leaderId]?.name || 'Unknown Manager' : null;
  
  // Placeholder for active projects count
  const activeProjectsCount = 3; // This would come from API or manager entity
  
  // Mock deadlines count
  const upcomingDeadlinesCount = 2;
  
  // Avatar border color
  const avatarBorderColor = useColorModeValue('white', 'gray.800');
  
  return (
    <VStack spacing={3} align="stretch">
      {/* Manager info */}
      {managerName && (
        <HStack spacing={2}>
          <Avatar size="xs" name={managerName} />
          <Text fontSize="sm" fontWeight="medium">{managerName}</Text>
          <Badge fontSize="xs" colorScheme="blue">Manager</Badge>
        </HStack>
      )}
      
      {/* Member count */}
      <Flex align="center" justify="space-between">
        <HStack spacing={1}>
          <Icon as={FiUsers} boxSize="12px" />
          <Text fontSize="sm">{team?.memberCount || 0} Members</Text>
        </HStack>
        
        {team && team.memberCount > 0 && (
          <Text fontSize="xs" color="gray.500">
            {team.memberCount > 5 ? `+${team.memberCount - 5} more` : ''}
          </Text>
        )}
      </Flex>
      
      {/* Avatar stack for members */}
      <AvatarGroup size="xs" max={5} spacing="-0.5rem">
        <Avatar name="John Doe" src="" borderColor={avatarBorderColor} />
        <Avatar name="Jane Smith" src="" borderColor={avatarBorderColor} />
        <Avatar name="Robert Johnson" src="" borderColor={avatarBorderColor} />
      </AvatarGroup>
      
      <Divider />
      
      {/* Project and deadline counts */}
      <HStack justify="space-between" spacing={3}>
        <HStack spacing={1}>
          <Icon as={FiTarget} color="blue.500" boxSize="14px" />
          <Text fontSize="sm">{activeProjectsCount} Projects</Text>
        </HStack>
        <HStack spacing={1}>
          <Icon as={FiCalendar} color="orange.500" boxSize="14px" />
          <Text fontSize="sm">{upcomingDeadlinesCount} Deadlines</Text>
        </HStack>
      </HStack>
    </VStack>
  );
};