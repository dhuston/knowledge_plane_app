import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
  Badge,
  Avatar,
  AvatarGroup,
  Progress,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { FiUser, FiFolder, FiUsers } from 'react-icons/fi';
import { MapNode } from '../../../types/map';
import { TeamRead } from '../../../types/team';

interface TeamPanelProps {
  data: TeamRead;
  selectedNode: MapNode;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ data, selectedNode }) => {
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const sectionBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Function to calculate project status statistics
  const calculateProjectStats = () => {
    // In a real implementation, this would analyze actual project data
    // For now, we'll use dummy data
    return {
      total: data.projects?.length || 0,
      completed: Math.floor(Math.random() * (data.projects?.length || 0)),
      onTrack: Math.floor(Math.random() * (data.projects?.length || 0)),
      atRisk: Math.floor(Math.random() * (data.projects?.length || 0)),
    };
  };
  
  const projectStats = calculateProjectStats();

  return (
    <VStack spacing={4} align="stretch">
      {/* Team Header */}
      <Box p={4} borderRadius="md" bg={headerBg}>
        <VStack align="flex-start" spacing={2}>
          <Heading size="md">{data.name}</Heading>
          {data.description && (
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
              {data.description}
            </Text>
          )}
          <HStack spacing={2}>
            {data.status && (
              <Badge 
                colorScheme={data.status === 'Active' ? 'green' : 'orange'}
              >
                {data.status}
              </Badge>
            )}
            <Badge colorScheme="blue">{data.department?.name || 'No Department'}</Badge>
          </HStack>
        </VStack>
      </Box>

      {/* Team Details */}
      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
        <VStack align="stretch" spacing={3}>
          <Heading size="sm">Team Information</Heading>
          <Divider />
          {data.lead && (
            <HStack justify="space-between">
              <HStack>
                <Icon as={FiUser} color="blue.500" />
                <Text fontSize="sm" color="gray.500">Team Lead</Text>
              </HStack>
              <Text fontSize="sm" fontWeight="medium" color="blue.500">{data.lead.name || 'Not assigned'}</Text>
            </HStack>
          )}
          <HStack justify="space-between">
            <HStack>
              <Icon as={FiUsers} color="blue.500" />
              <Text fontSize="sm" color="gray.500">Members</Text>
            </HStack>
            <Text fontSize="sm">{data.members?.length || 0} members</Text>
          </HStack>
          <HStack justify="space-between">
            <HStack>
              <Icon as={FiFolder} color="blue.500" />
              <Text fontSize="sm" color="gray.500">Active Projects</Text>
            </HStack>
            <Text fontSize="sm">{data.projects?.length || 0} projects</Text>
          </HStack>
        </VStack>
      </Box>

      {/* Team Members Preview */}
      {data.members && data.members.length > 0 && (
        <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <Heading size="sm">Team Members</Heading>
              <Badge>{data.members.length}</Badge>
            </HStack>
            <Divider />
            
            <HStack spacing={3} wrap="wrap">
              <AvatarGroup size="sm" max={5}>
                {data.members.map((member, index) => (
                  <Avatar 
                    key={member.id || index}
                    name={member.name || `Member ${index + 1}`}
                    src={member.avatar_url}
                  />
                ))}
              </AvatarGroup>
              {data.members.length > 5 && (
                <Text fontSize="sm" color="gray.500">
                  +{data.members.length - 5} more
                </Text>
              )}
            </HStack>
            
            {data.members.slice(0, 3).map((member, index) => (
              <HStack key={member.id || index} justify="space-between">
                <Text fontSize="sm">{member.name}</Text>
                <Text fontSize="xs" color="gray.500">{member.title || 'No title'}</Text>
              </HStack>
            ))}
            {data.members.length > 3 && (
              <Text fontSize="xs" color="blue.500" textAlign="center">
                View all members
              </Text>
            )}
          </VStack>
        </Box>
      )}

      {/* Project Stats */}
      {projectStats.total > 0 && (
        <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
          <VStack align="stretch" spacing={3}>
            <Heading size="sm">Project Overview</Heading>
            <Divider />
            
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.500">Completed</Text>
              <Badge colorScheme="green">{projectStats.completed}</Badge>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.500">On Track</Text>
              <Badge colorScheme="blue">{projectStats.onTrack}</Badge>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.500">At Risk</Text>
              <Badge colorScheme="red">{projectStats.atRisk}</Badge>
            </HStack>
            
            <Box pt={2}>
              <Text fontSize="xs" mb={1}>Completion Progress</Text>
              <Progress 
                value={(projectStats.completed / projectStats.total) * 100} 
                size="sm" 
                colorScheme="blue" 
                borderRadius="full"
              />
              <Text fontSize="xs" textAlign="right" mt={1}>
                {Math.round((projectStats.completed / projectStats.total) * 100)}%
              </Text>
            </Box>
          </VStack>
        </Box>
      )}

      {/* Team Focus Areas (if available) */}
      {data.focus_areas && data.focus_areas.length > 0 && (
        <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
          <VStack align="stretch" spacing={3}>
            <Heading size="sm">Focus Areas</Heading>
            <Divider />
            <HStack spacing={2} wrap="wrap">
              {data.focus_areas.map((area, index) => (
                <Badge key={index} colorScheme="purple" variant="subtle">
                  {area}
                </Badge>
              ))}
            </HStack>
          </VStack>
        </Box>
      )}
    </VStack>
  );
};

export default TeamPanel;