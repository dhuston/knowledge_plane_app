import React from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Card, 
  CardBody, 
  CardHeader, 
  Icon, 
  Link, 
  Avatar, 
  SimpleGrid,
  Flex,
  Button,
  Progress,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  useColorModeValue,
  IconButton,
  Tooltip
} from "@chakra-ui/react";
import { 
  CheckCircleIcon, 
  SettingsIcon, 
  AddIcon, 
  EmailIcon, 
  ChatIcon,
  CalendarIcon,
  StarIcon,
  TimeIcon
} from '@chakra-ui/icons';
import { TbUsers, TbTargetArrow, TbRocket } from 'react-icons/tb';
// Import shared mock data
import { mockDepartments, mockTeams, mockUsers, mockGoals, mockProjects, findGoalById } from '../mockData'; // Ensure mockGoals is imported
// Import type
import type { MockGoal } from '../mockData'; // Use exported type

// Additional mock data for enhanced features
const teamMetrics = {
  'team-platform': {
    projectsCompleted: 12,
    projectsInProgress: 3,
    teamVelocity: 85,
    teamHealth: 92,
    recentMilestones: [
      { title: "Platform V2 Alpha Release", date: "2024-03-15", status: "completed" },
      { title: "Performance Optimization", date: "2024-03-30", status: "in-progress" }
    ],
    upcomingEvents: [
      { title: "Weekly Sync", date: "2024-03-20 10:00 AM", type: "meeting" },
      { title: "Sprint Planning", date: "2024-03-22 2:00 PM", type: "planning" },
      { title: "Tech Review", date: "2024-03-25 11:00 AM", type: "review" }
    ]
  }
};

export default function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const team = teamId ? mockTeams[teamId] : null;
  const department = team?.deptId ? mockDepartments[team.deptId] : null;
  const teamMembers = Object.values(mockUsers).filter(user => user.teamId === teamId);
  const teamProjects = Object.values(mockProjects).filter(hub => hub.teamId === teamId);
  const teamGoal = teamId ? findGoalById(teamId, mockGoals as MockGoal) : null;
  const metrics = teamId ? teamMetrics[teamId as keyof typeof teamMetrics] : null;

  const textColor = useColorModeValue('gray.600', 'gray.300');
  const statBg = useColorModeValue('gray.50', 'gray.700');

  if (!team) {
    return <Box>Team not found.</Box>;
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header Section */}
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
        <Box>
          <HStack mb={2}>
            <Icon as={TbUsers} boxSize={6} color="brand.500" />
            <Heading size="lg">{team.name}</Heading>
          </HStack>
          <HStack spacing={4} color={textColor}>
            <HStack>
              <Avatar size="sm" name={team.lead} />
              <Link as={RouterLink} to={`/profile/${team.lead.toLowerCase()}`} fontWeight="medium">
                {team.lead}
                <Text as="span" fontSize="sm" color={textColor}> (Lead)</Text>
              </Link>
            </HStack>
            {department && (
              <HStack>
                <Text>|</Text>
                <Link as={RouterLink} to={`/department/${team.deptId}`}>
                  {department.name}
                </Link>
              </HStack>
            )}
          </HStack>
        </Box>
        <HStack spacing={2}>
          <Tooltip label="Team Chat">
            <IconButton
              aria-label="Team Chat"
              icon={<ChatIcon />}
              variant="ghost"
              colorScheme="brand"
            />
          </Tooltip>
          <Tooltip label="Schedule Team Meeting">
            <IconButton
              aria-label="Schedule Team Meeting"
              icon={<CalendarIcon />}
              variant="ghost"
              colorScheme="brand"
            />
          </Tooltip>
          <Button leftIcon={<SettingsIcon />} colorScheme="brand">
            Team Settings
          </Button>
        </HStack>
      </Flex>

      {/* Team Stats */}
      {metrics && (
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Card bg={statBg}>
            <CardBody>
              <Stat>
                <StatLabel>Projects Completed</StatLabel>
                <StatNumber>{metrics.projectsCompleted}</StatNumber>
                <StatHelpText>
                  {metrics.projectsInProgress} in progress
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={statBg}>
            <CardBody>
              <Stat>
                <StatLabel>Team Velocity</StatLabel>
                <StatNumber>{metrics.teamVelocity}%</StatNumber>
                <StatHelpText color="green.500">↑ 12% from last month</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={statBg}>
            <CardBody>
              <Stat>
                <StatLabel>Team Health</StatLabel>
                <StatNumber>{metrics.teamHealth}%</StatNumber>
                <Progress 
                  value={metrics.teamHealth} 
                  size="xs" 
                  colorScheme="green" 
                  mt={2}
                />
              </Stat>
            </CardBody>
          </Card>
          <Card bg={statBg}>
            <CardBody>
              <Stat>
                <StatLabel>Team Size</StatLabel>
                <StatNumber>{teamMembers.length}</StatNumber>
                <StatHelpText>
                  {teamMembers.filter(m => m.manager === team.lead).length} direct reports
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        {/* Main Content */}
        <GridItem>
          <VStack spacing={6} align="stretch">
            {/* Team Members */}
            <Card>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Icon as={TbUsers} color="brand.500" />
                    <Heading size="md">Team Members</Heading>
                  </HStack>
                  <Button leftIcon={<AddIcon />} size="sm" colorScheme="brand">
                    Add Member
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {teamMembers.map(member => (
                    <Flex
                      key={member.id}
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      justify="space-between"
                      align="center"
                    >
                      <HStack spacing={3}>
                        <Avatar size="sm" name={member.name} src={member.avatar} />
                        <Box>
                          <Link as={RouterLink} to={`/profile/${member.id}`} fontWeight="medium">
                            {member.name}
                          </Link>
                          <Text fontSize="sm" color={textColor}>{member.title}</Text>
                        </Box>
                      </HStack>
                      <HStack>
                        <Tooltip label="Send Email">
                          <IconButton
                            aria-label="Send Email"
                            icon={<EmailIcon />}
                            variant="ghost"
                            size="sm"
                          />
                        </Tooltip>
                        <Tooltip label="Chat">
                          <IconButton
                            aria-label="Chat"
                            icon={<ChatIcon />}
                            variant="ghost"
                            size="sm"
                          />
                        </Tooltip>
                      </HStack>
                    </Flex>
                  ))}
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Active Projects */}
            <Card>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <HStack>
                    <Icon as={TbRocket} color="brand.500" />
                    <Heading size="md">Active Projects</Heading>
                  </HStack>
                  <Button leftIcon={<AddIcon />} size="sm" colorScheme="brand">
                    New Project
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody>
                {teamProjects.length > 0 ? (
                  <VStack spacing={4} align="stretch">
                    {teamProjects.map(project => (
                      <Box
                        key={project.id}
                        p={4}
                        borderWidth="1px"
                        borderRadius="md"
                        _hover={{ borderColor: 'brand.500' }}
                      >
                        <Flex justify="space-between" align="center">
                          <HStack>
                            <Icon 
                              as={CheckCircleIcon} 
                              color={project.status === 'In Progress' ? 'blue.500' : 'orange.500'} 
                            />
                            <Box>
                              <Link 
                                as={RouterLink} 
                                to={`/hub/${project.id}`} 
                                fontWeight="medium"
                                fontSize="md"
                              >
                                {project.name}
                              </Link>
                              <HStack spacing={2} mt={1}>
                                <Badge colorScheme={project.status === 'In Progress' ? 'blue' : 'orange'}>
                                  {project.status}
                                </Badge>
                                <Text fontSize="sm" color={textColor}>Updated 2h ago</Text>
                              </HStack>
                            </Box>
                          </HStack>
                          <HStack spacing={2}>
                            <Avatar size="sm" name="Project Lead" />
                            <Text fontSize="sm" color={textColor}>3 members</Text>
                          </HStack>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                ) : (
                  <Text fontSize="sm" color={textColor}>No projects directly assigned to this team.</Text>
                )}
              </CardBody>
            </Card>
          </VStack>
        </GridItem>

        {/* Sidebar */}
        <GridItem>
          <VStack spacing={6} align="stretch">
            {/* Team Goals */}
            <Card>
              <CardHeader>
                <HStack>
                  <Icon as={TbTargetArrow} color="brand.500" />
                  <Heading size="md">Team Goals</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                {teamGoal ? (
                  <VStack align="stretch" spacing={4}>
                    <Box p={3} borderWidth="1px" borderRadius="md">
                      <HStack mb={2}>
                        <Icon as={StarIcon} color="yellow.500" />
                        <Link 
                          as={RouterLink} 
                          to="/goals" 
                          fontWeight="medium"
                        >
                          {teamGoal.title}
                        </Link>
                      </HStack>
                      <Progress value={75} size="sm" colorScheme="yellow" />
                    </Box>
                  </VStack>
                ) : (
                  <Text fontSize="sm" color={textColor}>No specific team goals defined.</Text>
                )}
              </CardBody>
            </Card>

            {/* Recent Milestones */}
            {metrics && (
              <Card>
                <CardHeader>
                  <Heading size="md">Recent Milestones</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    {metrics.recentMilestones.map((milestone, idx) => (
                      <Box key={idx} p={3} borderWidth="1px" borderRadius="md">
                        <HStack mb={1}>
                          <Icon 
                            as={CheckCircleIcon} 
                            color={milestone.status === 'completed' ? 'green.500' : 'blue.500'} 
                          />
                          <Text fontWeight="medium">{milestone.title}</Text>
                        </HStack>
                        <Text fontSize="sm" color={textColor}>{milestone.date}</Text>
                      </Box>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Upcoming Events */}
            {metrics && (
              <Card>
                <CardHeader>
                  <Heading size="md">Upcoming Events</Heading>
                </CardHeader>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    {metrics.upcomingEvents.map((event, idx) => (
                      <HStack key={idx} spacing={3}>
                        <Icon as={TimeIcon} color="brand.500" />
                        <Box>
                          <Text fontWeight="medium">{event.title}</Text>
                          <Text fontSize="sm" color={textColor}>{event.date}</Text>
                        </Box>
                      </HStack>
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </GridItem>
      </Grid>
    </VStack>
  );
} 