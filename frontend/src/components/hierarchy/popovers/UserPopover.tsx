/**
 * UserPopover.tsx
 * User-specific popover content
 */
import React from 'react';
import {
  VStack,
  HStack,
  Avatar,
  Badge,
  Text,
  Divider,
  Icon,
  useColorModeValue,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { FiUser, FiMail, FiBriefcase, FiMapPin } from 'react-icons/fi';

import { OrganizationalUnitEntity, isOrgUserEntity } from '../../../types/hierarchy';
import { useHierarchy } from '../state/HierarchyContext';

interface UserPopoverProps {
  unit: OrganizationalUnitEntity;
}

export const UserPopover: React.FC<UserPopoverProps> = ({ unit }) => {
  // Get hierarchy data
  const { units } = useHierarchy();
  
  // Safely cast to user entity
  const user = isOrgUserEntity(unit) ? unit : null;
  
  // Get team name if available
  const teamName = user?.parentId ? units[user.parentId]?.name || 'Unknown Team' : null;
  
  // Mock user data
  const userEmail = user?.email || 'user@example.com';
  const userTitle = user?.title || 'Employee';
  const userLocation = 'San Francisco, CA';
  const userSkills = user?.skills || ['Project Management', 'Research', 'Data Analysis'];
  
  // Colors
  const tagBg = useColorModeValue('blue.50', 'blue.900');
  const tagColor = useColorModeValue('blue.600', 'blue.300');
  
  return (
    <VStack spacing={3} align="stretch">
      {/* User info */}
      <HStack spacing={3}>
        <Avatar size="sm" name={unit.name} />
        <VStack spacing={0} align="start">
          <HStack>
            <Text fontSize="sm" fontWeight="medium">{unit.name}</Text>
            <Badge fontSize="xs" colorScheme="green">Online</Badge>
          </HStack>
          <Text fontSize="xs" color="gray.500">{userTitle}</Text>
        </VStack>
      </HStack>
      
      {/* Contact & team info */}
      <VStack spacing={1} align="start">
        <HStack spacing={1} fontSize="xs">
          <Icon as={FiMail} boxSize="10px" />
          <Text>{userEmail}</Text>
        </HStack>
        
        {teamName && (
          <HStack spacing={1} fontSize="xs">
            <Icon as={FiBriefcase} boxSize="10px" />
            <Text>{teamName}</Text>
          </HStack>
        )}
        
        <HStack spacing={1} fontSize="xs">
          <Icon as={FiMapPin} boxSize="10px" />
          <Text>{userLocation}</Text>
        </HStack>
      </VStack>
      
      {userSkills && userSkills.length > 0 && (
        <>
          <Divider />
          
          <VStack align="flex-start" spacing={2}>
            <Text fontSize="xs" fontWeight="medium" color="gray.500">Skills</Text>
            <Wrap spacing={1}>
              {userSkills.map((skill, i) => (
                <WrapItem key={i}>
                  <Tag size="sm" bg={tagBg} color={tagColor}>
                    <TagLabel fontSize="xs">{skill}</TagLabel>
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </VStack>
        </>
      )}
      
      {user?.description && (
        <>
          <Divider />
          <Text fontSize="xs">{user.description}</Text>
        </>
      )}
    </VStack>
  );
};