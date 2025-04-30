import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Box,
  Badge,
  Icon,
  Flex,
  Progress,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiFolder, FiClock, FiCheckCircle, FiAlertTriangle, FiCalendar } from 'react-icons/fi';
import { ProjectRead } from '../../types/project';

interface TeamProjectsListProps {
  projects: ProjectRead[];
}

const TeamProjectsList: React.FC<TeamProjectsListProps> = ({ projects }) => {
  const bgHover = useColorModeValue('gray.100', 'gray.700');
  const sectionBg = useColorModeValue('gray.50', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = useColorModeValue('primary.600', 'primary.300');

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
    if (statusLower.includes('risk') || statusLower.includes('issue')) return FiAlertTriangle;
    if (statusLower.includes('complete') || statusLower.includes('done')) return FiCheckCircle;
    if (statusLower.includes('plan') || statusLower.includes('pending')) return FiCalendar;

    return FiFolder;
  };

  // Helper function to get progress percentage based on status
  const getProgressPercentage = (status: string | undefined): number => {
    if (!status) return 0;

    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete') || statusLower.includes('done')) return 100;
    if (statusLower.includes('active')) return 60;
    if (statusLower.includes('risk') || statusLower.includes('issue')) return 40;
    if (statusLower.includes('plan') || statusLower.includes('pending')) return 10;

    return 0;
  };

  return (
    <VStack spacing={4} align="stretch">
      {projects.length > 0 ? (
        projects.map((project) => (
          <Box
            key={project.id}
            p={4}
            bg={sectionBg}
            borderRadius="md"
            borderLeft="3px solid"
            borderColor={`${getStatusColor(project.status)}.500`}
            _hover={{
              bg: bgHover,
              transform: 'translateY(-2px)',
              boxShadow: 'sm'
            }}
            transition="all 0.2s"
            cursor="pointer"
          >
            <Flex justify="space-between" align="flex-start" mb={2}>
              <HStack>
                <Icon
                  as={getStatusIcon(project.status)}
                  color={`${getStatusColor(project.status)}.500`}
                  boxSize={5}
                />
                <Text fontWeight="bold" fontSize="md">{project.title || project.name}</Text>
              </HStack>
              <Badge
                colorScheme={getStatusColor(project.status)}
                px={2}
                py={1}
                borderRadius="full"
              >
                {project.status || 'Unknown'}
              </Badge>
            </Flex>

            <Text fontSize="sm" color={textColor} mb={3} noOfLines={2}>
              {project.description || 'No description available'}
            </Text>

            {/* Progress bar */}
            <Box>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="xs" fontWeight="medium">Progress</Text>
                <Text fontSize="xs" fontWeight="medium">
                  {getProgressPercentage(project.status)}%
                </Text>
              </Flex>
              <Progress
                value={getProgressPercentage(project.status)}
                size="sm"
                colorScheme={getStatusColor(project.status)}
                borderRadius="full"
              />
            </Box>

            {/* Project metadata */}
            <HStack mt={3} fontSize="xs" color={textColor} spacing={4}>
              <HStack>
                <Icon as={FiCalendar} />
                <Text>Updated: {new Date().toLocaleDateString()}</Text>
              </HStack>
              <HStack>
                <Icon as={FiFolder} />
                <Text>3 Documents</Text>
              </HStack>
            </HStack>
          </Box>
        ))
      ) : (
        <Box p={4} textAlign="center" bg={sectionBg} borderRadius="md">
          <Text color={textColor}>No projects found</Text>
        </Box>
      )}
    </VStack>
  );
};

export default TeamProjectsList;
