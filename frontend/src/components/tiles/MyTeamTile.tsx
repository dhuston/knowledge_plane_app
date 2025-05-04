import React from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  Icon,
  HStack,
  VStack,
  Button,
  useColorModeValue,
  Avatar,
  AvatarGroup,
  Badge,
  Grid,
  GridItem,
  Divider,
  Spinner,
  Center,
  Code,
} from '@chakra-ui/react';
import { FiUsers, FiArrowRight, FiFileText, FiBarChart2, FiTarget, FiAlertTriangle } from 'react-icons/fi';
import { useTeamData, TeamActivity } from '../../hooks/useTeamData';

interface MyTeamTileProps {
  teamName?: string;
  teamId?: string;
  onClick: () => void;
}

const MyTeamTile: React.FC<MyTeamTileProps> = ({
  teamName = "Your Team",
  teamId,
  onClick
}) => {
  // Get team data using our custom hook
  const { teamData, isLoading, error } = useTeamData(teamId);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('primary.600', 'primary.300');
  const sectionBg = useColorModeValue('gray.50', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Statistics for the team
  const teamStats = [
    { label: 'Projects', value: teamData?.projects?.length.toString() || '0', icon: FiFileText, color: 'blue.500' },
    { label: 'Research', value: teamData?.researchCount.toString() || '0', icon: FiBarChart2, color: 'purple.500' },
    { label: 'Goals', value: teamData?.goals?.length.toString() || '0', icon: FiTarget, color: 'green.500' },
  ];

  // Get badge color for activity type
  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'new': return 'green';
      case 'update': return 'blue';
      case 'research': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <Card
      shadow="md"
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      h="100%"
      borderRadius="xl"
      transition="all 0.2s"
      _hover={{ boxShadow: "lg" }}
      cursor="pointer"
      overflow="hidden"
    >
      <CardBody p={0}>
        {isLoading ? (
          <Center h="300px">
            <Spinner size="xl" color="primary.500" thickness="4px" />
          </Center>
        ) : error ? (
          <Center h="300px" p={6}>
            <VStack spacing={4}>
              <Icon as={FiAlertTriangle} boxSize={12} color="red.400" />
              <Heading size="md" textAlign="center">API Error</Heading>
              <Text align="center" color="red.500">
                {error.message || 'Error loading team data'}
              </Text>
              <Code p={2} fontSize="sm" variant="subtle">{teamId ? `/teams/${teamId}` : 'No team ID'}</Code>
              <Button size="sm" colorScheme="primary" onClick={() => onClick()}>
                Continue Anyway
              </Button>
            </VStack>
          </Center>
        ) : (
          <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} h="100%">
            {/* Team Info Section */}
            <GridItem p={{ base: 6, md: 8 }} borderRightWidth={{ md: "1px" }} borderColor={borderColor}>
              <VStack align="start" spacing={4}>
                <HStack spacing={3} width="full">
                  <Box
                    bg={accentColor}
                    color="white"
                    p={3}
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FiUsers} boxSize={6} />
                  </Box>
                  <VStack align="start" spacing={0} flex={1}>
                    <Heading size="md">{teamData?.name || teamName}</Heading>
                    <Text fontSize="sm" color={textColor}>
                      {teamData?.members?.length ? `${teamData.members.length} team members` : "View your team"}
                    </Text>
                  </VStack>
                </HStack>

                <Divider />

                {/* Team Members */}
                <Box width="full">
                  <Text fontWeight="medium" mb={2}>Team Members</Text>
                  <AvatarGroup size="md" max={5} mb={3}>
                    {teamData?.members?.map((member) => (
                      <Avatar 
                        key={member.id}
                        name={member.name} 
                        src={member.avatar_url}
                      />
                    ))}
                  </AvatarGroup>
                </Box>

                <Button
                  rightIcon={<FiArrowRight />}
                  colorScheme="primary"
                  size="md"
                  width="full"
                  onClick={onClick}
                >
                  View Team Page
                </Button>
              </VStack>
            </GridItem>

            {/* Team Activity Section */}
            <GridItem p={{ base: 6, md: 8 }}>
              <VStack align="stretch" spacing={4}>
                <Heading size="md">Team Activity</Heading>

                {/* Team Stats */}
                <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                  {teamStats.map((stat, index) => (
                    <GridItem key={index}>
                      <Box
                        p={4}
                        bg={sectionBg}
                        borderRadius="lg"
                        textAlign="center"
                      >
                        <Icon as={stat.icon} color={stat.color} boxSize={6} mb={2} />
                        <Text fontWeight="bold" fontSize="xl">{stat.value}</Text>
                        <Text fontSize="sm" color={textColor}>{stat.label}</Text>
                      </Box>
                    </GridItem>
                  ))}
                </Grid>

                {/* Recent Activity */}
                <Box>
                  <Text fontWeight="medium" mb={2}>Recent Updates</Text>
                  <VStack align="stretch" spacing={2}>
                    {teamData?.activities?.map((activity: TeamActivity, index: number) => (
                      <HStack key={index} p={2} bg={sectionBg} borderRadius="lg">
                        <Badge colorScheme={getActivityBadgeColor(activity.type)}>
                          {activity.type === 'new' ? 'New' : 
                           activity.type === 'update' ? 'Update' : 'Research'}
                        </Badge>
                        <Text fontSize="sm">{activity.description}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </GridItem>
          </Grid>
        )}
      </CardBody>
    </Card>
  );
};

export default MyTeamTile;
