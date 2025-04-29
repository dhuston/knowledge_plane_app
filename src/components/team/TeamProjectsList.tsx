import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiFolder, FiClock, FiCheckCircle } from 'react-icons/fi';
import { ProjectRead } from '../../types/project';

interface TeamProjectsListProps {
  projects: ProjectRead[];
}

const TeamProjectsList: React.FC<TeamProjectsListProps> = ({ projects }) => {
  const bgHover = useColorModeValue('gray.100', 'gray.700');
  
  // Helper function to determine badge color based on status
  const getStatusColor = (status: string | undefined): string => {
    if (!status) return 'gray';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('on_track')) return 'green';
    if (statusLower.includes('risk') || statusLower.includes('issue')) return 'red';
    if (statusLower.includes('plan') || statusLower.includes('pending')) return 'orange';
    if (statusLower.includes('complete') || statusLower.includes('done')) return 'blue';
    
    return 'gray';
  };
  
  // Helper function to get status icon
  const getStatusIcon = (status: string | undefined) => {
    if (!status) return FiFolder;
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active')) return FiClock;
    if (statusLower.includes('complete') || statusLower.includes('done')) return FiCheckCircle;
    
    return FiFolder;
  };
  
  return (
    <VStack spacing={3} align="stretch">
      {projects.length > 0 ? (
        projects.map((project) => (
          <Box 
            key={project.id} 
            p={3} 
            bg="gray.50" 
            borderRadius="md"
            _hover={{ bg: bgHover, transform: 'translateY(-2px)' }}
            transition="all 0.2s"
            cursor="pointer"
          >
            <HStack mb={1}>
              <Icon as={getStatusIcon(project.status)} color={`${getStatusColor(project.status)}.500`} />
              <Text fontWeight="medium">{project.title}</Text>
              <Badge colorScheme={getStatusColor(project.status)}>
                {project.status || 'Unknown'}
              </Badge>
            </HStack>
            <Text fontSize="sm" noOfLines={2}>{project.description || 'No description available'}</Text>
          </Box>
        ))
      ) : (
        <Box p={4} textAlign="center">
          <Text color="gray.500">No projects found</Text>
        </Box>
      )}
    </VStack>
  );
};

export default TeamProjectsList;
