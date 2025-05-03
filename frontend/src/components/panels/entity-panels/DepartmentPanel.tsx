import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Divider,
  useColorModeValue,
  Icon,
  SimpleGrid,
  Tag,
  Avatar,
  AvatarGroup,
  Button,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { FiUsers, FiFolder, FiBriefcase, FiChevronRight } from 'react-icons/fi';
import { MapNode } from '../../../types/map';
import SimpleMarkdown from '../../common/SimpleMarkdown';

interface DepartmentPanelProps {
  data: any; // DepartmentEntity - we'll use any for now until we define the proper type
  selectedNode: MapNode;
}

const DepartmentPanel: React.FC<DepartmentPanelProps> = ({ data, selectedNode }) => {
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const sectionBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Format status for display
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    let colorScheme = 'gray';
    if (status.toLowerCase().includes('active')) colorScheme = 'green';
    if (status.toLowerCase().includes('new')) colorScheme = 'blue';
    if (status.toLowerCase().includes('reorg')) colorScheme = 'orange';
    
    return (
      <Badge colorScheme={colorScheme} fontSize="sm">
        {status}
      </Badge>
    );
  };

  // Prepare department statistics
  const stats = [
    {
      label: 'Teams',
      value: data.teams?.length || 0,
      icon: FiUsers,
      color: 'blue',
    },
    {
      label: 'Projects',
      value: data.projects?.length || 0,
      icon: FiFolder,
      color: 'purple',
    },
    {
      label: 'Members',
      value: data.member_count || 0,
      icon: FiUsers,
      color: 'green',
    },
  ];

  return (
    <VStack spacing={4} align="stretch">
      {/* Department Header */}
      <Box p={4} borderRadius="md" bg={headerBg} borderWidth="1px" borderColor={borderColor}>
        <HStack spacing={4} align="flex-start" justifyContent="space-between">
          <VStack align="flex-start" spacing={1}>
            <Heading size="md">{data.name || 'Department'}</Heading>
            <Text color="gray.500">{data.code || ''}</Text>
            {data.parent_department && (
              <HStack fontSize="sm">
                <Text color="gray.500">Part of:</Text>
                <Text fontWeight="medium" color="blue.500">
                  {data.parent_department.name}
                </Text>
              </HStack>
            )}
          </VStack>
          {getStatusBadge(data.status)}
        </HStack>
      </Box>

      {/* Department Statistics */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {stats.map((stat) => (
          <Box 
            key={stat.label}
            p={4} 
            borderRadius="md" 
            borderWidth="1px" 
            borderColor={borderColor}
            bg={sectionBg}
            _hover={{ 
              boxShadow: 'sm',
              borderColor: `${stat.color}.500`
            }}
            transition="all 0.2s"
          >
            <Stat>
              <StatLabel color="gray.500" fontSize="sm">{stat.label}</StatLabel>
              <Flex alignItems="center" mt={1}>
                <Icon as={stat.icon} boxSize={5} mr={2} color={`${stat.color}.500`} />
                <StatNumber>{stat.value}</StatNumber>
              </Flex>
              <StatHelpText>
                {stat.label === 'Teams' ? 'Click for details' : ''}
              </StatHelpText>
            </Stat>
          </Box>
        ))}
      </SimpleGrid>

      {/* Department Description */}
      {data.description && (
        <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
          <VStack align="stretch" spacing={3}>
            <Heading size="sm">About</Heading>
            <Divider />
            <Box>
              <SimpleMarkdown content={data.description} />
            </Box>
          </VStack>
        </Box>
      )}

      {/* Leadership Team */}
      {data.leadership && data.leadership.length > 0 && (
        <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
          <VStack align="stretch" spacing={3}>
            <Heading size="sm">Leadership</Heading>
            <Divider />
            <VStack align="stretch" spacing={2}>
              {data.leadership.slice(0, 3).map((leader: any) => (
                <HStack 
                  key={leader.id}
                  p={2}
                  borderRadius="md"
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                  transition="all 0.2s"
                >
                  <Avatar size="sm" name={leader.name} src={leader.avatar_url} />
                  <VStack align="flex-start" spacing={0} flex={1}>
                    <Text fontWeight="medium" fontSize="sm">{leader.name}</Text>
                    <Text fontSize="xs" color="gray.500">{leader.title}</Text>
                  </VStack>
                  <Icon as={FiChevronRight} boxSize={4} color="gray.400" />
                </HStack>
              ))}
              {data.leadership.length > 3 && (
                <Button size="sm" variant="ghost" rightIcon={<FiChevronRight />} alignSelf="center">
                  View all {data.leadership.length} leadership members
                </Button>
              )}
            </VStack>
          </VStack>
        </Box>
      )}

      {/* Teams Preview */}
      {data.teams && data.teams.length > 0 && (
        <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
          <VStack align="stretch" spacing={3}>
            <Heading size="sm">Teams</Heading>
            <Divider />
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {data.teams.slice(0, 4).map((team: any) => (
                <Box 
                  key={team.id}
                  p={3}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={borderColor}
                  _hover={{ bg: hoverBg, borderColor: 'blue.300' }}
                  cursor="pointer"
                  transition="all 0.2s"
                >
                  <Flex justify="space-between" align="center" mb={2}>
                    <HStack>
                      <Icon as={FiUsers} color="blue.500" />
                      <Text fontWeight="medium">{team.name}</Text>
                    </HStack>
                    {team.member_count && (
                      <Badge colorScheme="blue" variant="outline">
                        {team.member_count} members
                      </Badge>
                    )}
                  </Flex>
                  {team.focus_area && (
                    <Text fontSize="sm" color="gray.500" noOfLines={1}>
                      {team.focus_area}
                    </Text>
                  )}
                  {team.members && team.members.length > 0 && (
                    <AvatarGroup size="xs" max={5} mt={2}>
                      {team.members.map((member: any) => (
                        <Avatar 
                          key={member.id} 
                          name={member.name} 
                          src={member.avatar_url} 
                        />
                      ))}
                    </AvatarGroup>
                  )}
                </Box>
              ))}
            </SimpleGrid>
            {data.teams.length > 4 && (
              <Button 
                size="sm" 
                variant="outline" 
                rightIcon={<FiChevronRight />}
                alignSelf="center"
                mt={2}
              >
                View all {data.teams.length} teams
              </Button>
            )}
          </VStack>
        </Box>
      )}

      {/* Department Details */}
      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
        <VStack align="stretch" spacing={3}>
          <Heading size="sm">Department Details</Heading>
          <Divider />
          <SimpleDetail label="Division" value={data.division || 'Not specified'} />
          <SimpleDetail label="Location" value={data.location || 'Not specified'} />
          <SimpleDetail label="Budget Center" value={data.budget_center || 'Not specified'} />
          {data.established_date && (
            <SimpleDetail 
              label="Established" 
              value={new Date(data.established_date).toLocaleDateString()} 
            />
          )}
        </VStack>
      </Box>
      
      {/* Department Tags */}
      {data.tags && data.tags.length > 0 && (
        <Box mt={2}>
          <HStack spacing={2} flexWrap="wrap">
            {data.tags.map((tag: string, index: number) => (
              <Tag 
                key={index} 
                size="sm" 
                borderRadius="full" 
                variant="subtle"
                colorScheme="blue"
                mb={1}
              >
                {tag}
              </Tag>
            ))}
          </HStack>
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

export default DepartmentPanel;