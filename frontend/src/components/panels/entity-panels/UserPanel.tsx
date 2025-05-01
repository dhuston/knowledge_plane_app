import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Avatar,
  Badge,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { MapNode } from '../../../types/map';
import { UserEntity } from '../../../types/entities';

interface UserPanelProps {
  data: UserEntity;
  selectedNode: MapNode;
}

const UserPanel: React.FC<UserPanelProps> = ({ data, selectedNode }) => {
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const sectionBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <VStack spacing={4} align="stretch">
      {/* User Profile Header */}
      <Box p={4} borderRadius="md" bg={headerBg}>
        <HStack spacing={4} align="flex-start">
          <Avatar 
            size="lg" 
            name={data.name || data.email || 'User'} 
            src={data.avatar_url} 
          />
          <VStack align="flex-start" spacing={0}>
            <Heading size="md">{data.name || 'User'}</Heading>
            <Text color="gray.500">{data.title || 'No title'}</Text>
            <Text fontSize="sm" color="blue.500">{data.email}</Text>
            {data.status && (
              <Badge 
                mt={1}
                colorScheme={data.status === 'Active' ? 'green' : 'orange'}
              >
                {data.status}
              </Badge>
            )}
          </VStack>
        </HStack>
      </Box>

      {/* User Details */}
      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
        <VStack align="stretch" spacing={3}>
          <Heading size="sm">Contact Information</Heading>
          <Divider />
          <SimpleDetail label="Department" value={data.department || 'Not assigned'} />
          <SimpleDetail label="Location" value={data.location || 'Not specified'} />
          <SimpleDetail label="Phone" value={data.phone || 'Not provided'} />
          {data.employee_id && (
            <SimpleDetail label="Employee ID" value={data.employee_id} />
          )}
        </VStack>
      </Box>

      {/* Professional Information */}
      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
        <VStack align="stretch" spacing={3}>
          <Heading size="sm">Professional Information</Heading>
          <Divider />
          <SimpleDetail 
            label="Manager" 
            value={data.manager?.name || 'Not assigned'} 
            isHighlighted={true}
          />
          <SimpleDetail 
            label="Primary Team" 
            value={data.primary_team?.name || 'Not assigned'} 
            isHighlighted={true}
          />
          <SimpleDetail 
            label="Role" 
            value={data.role || 'Not specified'} 
          />
          <SimpleDetail 
            label="Join Date" 
            value={data.hire_date ? new Date(data.hire_date).toLocaleDateString() : 'Not specified'} 
          />
        </VStack>
      </Box>

      {/* Skills/Bio Section */}
      {data.bio && (
        <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
          <VStack align="stretch" spacing={3}>
            <Heading size="sm">About</Heading>
            <Divider />
            <Text fontSize="sm" whiteSpace="pre-wrap">
              {data.bio}
            </Text>
          </VStack>
        </Box>
      )}

      {/* Skills Section (if available) */}
      {data.skills && data.skills.length > 0 && (
        <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
          <VStack align="stretch" spacing={3}>
            <Heading size="sm">Skills</Heading>
            <Divider />
            <HStack spacing={2} wrap="wrap">
              {data.skills.map((skill, index) => (
                <Badge key={index} colorScheme="blue" variant="subtle">
                  {skill}
                </Badge>
              ))}
            </HStack>
          </VStack>
        </Box>
      )}
    </VStack>
  );
};

// Helper component for simple label/value pairs
const SimpleDetail: React.FC<{ 
  label: string; 
  value: string;
  isHighlighted?: boolean;
}> = ({ label, value, isHighlighted }) => {
  const highlightedColor = useColorModeValue('blue.600', 'blue.300');
  const textColor = isHighlighted ? highlightedColor : undefined;
  
  return (
    <HStack justify="space-between">
      <Text fontSize="sm" color="gray.500">{label}</Text>
      <Text fontSize="sm" fontWeight={isHighlighted ? 'medium' : 'normal'} color={textColor}>
        {value}
      </Text>
    </HStack>
  );
};

export default UserPanel;