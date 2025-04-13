import React from 'react'; // Needed for JSX types
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  Button, 
  VStack, 
  Tag, 
  HStack, 
  Card, 
  CardHeader, 
  CardBody, 
  SimpleGrid, 
  Avatar, 
  Container, 
  useColorModeValue, 
  Badge, 
  Tooltip, 
  IconButton, 
  Divider,
  Link,
  Icon,
  Progress,
  Wrap,
  WrapItem,
  Spacer
} from "@chakra-ui/react"; 
import { 
  AddIcon, 
  TimeIcon, 
  ChatIcon, 
  ArrowForwardIcon, 
  CheckIcon,
  LinkIcon
} from '@chakra-ui/icons';
import { GoTag as TagIcon } from "react-icons/go";
// Import shared mock data
import { mockGoals, mockTeams, mockUsers, currentUser, mockProjects, mockActionButtons, findGoalById } from '../mockData'; // Adjust path as needed
// Import type
import type { Goal } from '../mockData'; // Corrected type import

// --- Helper Functions ---
const getUserGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const getCurrentDate = () => {
  return new Date().toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Helper to get icon based on goal type (simplified)
const getGoalIcon = (type: string) => {
  // Remove unused icons from switch case
  switch (type) {
    // case 'Enterprise': return SettingsIcon;
    // case 'Department': return RepeatClockIcon;
    // case 'Team': return CheckCircleIcon;
    // case 'Project': return CheckCircleIcon;
    // default: return CheckCircleIcon;
    default: return undefined; // Or a default icon if preferred
  }
}

// --- Component ---
export default function WorkspacePage() {
  const demoUserName = currentUser.name;
  const userTeam = currentUser.teamId ? mockTeams[currentUser.teamId] : null;
  const teamGoal = userTeam ? findGoalById(userTeam.id, mockGoals as Goal) : null;
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const highlightColor = useColorModeValue('brand.50', 'brand.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const teamMembers = Object.values(mockUsers).filter(user => user.teamId === currentUser.teamId);
  // Use mockProjects directly now
  const userProjects = Object.values(mockProjects).filter(h => h.teamId === currentUser.teamId);

  // Updated Briefing Text with more simulated links/tags
  const briefingText = (
    <Text fontSize="md" lineHeight="tall">
      Today you have <Tooltip label="Linked to Goal: team-ml"><Tag size="sm" variant="solid" colorScheme="blue">2 active experiments</Tag></Tooltip> running, including your <Tooltip label="Linked to Experiment: EMT-Inhib-Screen"><Tag size="sm" variant="solid" colorScheme="purple">EMT inhibitor screening</Tag></Tooltip> which is showing <Text as="strong" color="green.600">promising drug response patterns</Text>. 
      Your recent paper on <Tooltip label="Linked to Topic: Resistance Mechanisms"><Tag size="sm" variant="outline" colorScheme="gray">resistance mechanisms</Tag></Tooltip> has received <Text as="strong" color="brand.700">+12 new citations</Text> this month. 
      Your <Tooltip label="Linked to Project: drug-review-proj"><Tag size="sm" variant="solid" colorScheme="orange">drug resistance review meeting</Tag></Tooltip> is scheduled for <Text as="strong">tomorrow at 10:00 AM</Text>, and there's a <Tooltip label="Linked to Task: data-sub-task"><Tag size="sm" variant="solid" colorScheme="red">resistance mechanism data submission</Tag></Tooltip> due today at <Text as="strong">5:00 PM</Text>. 
      <Tooltip label="Linked to Team: team-platform"><Link as={RouterLink} to={`/team/team-platform`} color="brand.600" fontWeight="medium">3 team members</Link></Tooltip> are currently analyzing related PDX models.
    </Text>
  );

  // Placeholder AI Suggestions
  const aiSuggestions = [
    { label: "Link 'drug response patterns' to Goal?", icon: LinkIcon },
    { label: "Tag 'resistance mechanisms'?", icon: TagIcon },
    { label: "Assign 'data submission' task to Bob?", icon: AddIcon }
  ];

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={8} align="stretch">
        {/* Header Section */}
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
          <Box>
            <Heading size="2xl" color="brand.700" mb={2}>{getUserGreeting()}, {demoUserName}</Heading>
            <HStack spacing={4} color={textColor}>
              <Text fontSize="lg">{getCurrentDate()}</Text>
              <Divider orientation="vertical" height="20px" />
              <HStack>
                <TimeIcon />
                <Text>3 meetings today</Text>
              </HStack>
              <HStack>
                <TimeIcon />
                <Text>2 notifications</Text>
              </HStack>
            </HStack>
          </Box>
          <HStack spacing={2}>
            <IconButton
              aria-label="View notifications"
              icon={<TimeIcon />}
              variant="ghost"
              colorScheme="brand"
            />
            <IconButton
              aria-label="View calendar"
              icon={<TimeIcon />}
              variant="ghost"
              colorScheme="brand"
            />
            <Button colorScheme="brand" leftIcon={<AddIcon />}>
              New Project
            </Button>
          </HStack>
        </Flex>

        {/* Daily Summary Card */}
        <Card 
          variant="outline" 
          bg={highlightColor} 
          borderColor="brand.200"
          boxShadow="sm"
        >
          <CardHeader pb={2}>
            <Flex alignItems="center" justify="space-between">
              <HStack>
                <TimeIcon color="brand.500" />
                <Text fontSize="lg" fontWeight="bold" color="brand.700">Daily Summary</Text>
              </HStack>
              <Tag size="sm" variant="subtle" colorScheme="brand">AI GENERATED</Tag> 
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            {briefingText}
          </CardBody>
        </Card>

        {/* AI Suggestions Section */}
        <Divider my={4} />
        <HStack spacing={2}>
          <Text fontSize="xs" fontWeight="bold" color="gray.500">AI SUGGESTIONS:</Text>
          {aiSuggestions.map((sug, i) => (
            <Button 
              key={i} 
              size="xs" 
              variant="outline" 
              colorScheme="gray" 
              leftIcon={<Icon as={sug.icon} boxSize={3}/>}
              isDisabled
            >
              {sug.label}
            </Button>
          ))}
        </HStack>

        {/* Quick Actions */}
        <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing={4}>
          {mockActionButtons.map((action, index) => (
            <Tooltip key={index} label={action.tooltip} hasArrow>
              <Button 
                leftIcon={<Icon as={action.icon} />} 
                variant="outline" 
                borderColor="brand.200"
                color="brand.700"
                _hover={{ bg: "brand.50" }}
                h="48px"
                isDisabled
              >
                {action.label}
              </Button>
            </Tooltip>
          ))}
        </SimpleGrid>

        {/* Main Content Grid (Projects and Goals only) */}
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={6}>
          {/* Projects Card */}
          <Card variant="outline" boxShadow="sm" bg={bgColor} borderColor={borderColor}>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md">Your Projects</Heading>
                <Button size="sm" variant="ghost" colorScheme="brand" rightIcon={<ArrowForwardIcon />}>
                  View All
                </Button>
              </Flex>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {userProjects.map(hub => (
                  <Card key={hub.id} variant="outline" size="sm">
                    <CardBody>
                      <Flex alignItems="center" justify="space-between">
                        <VStack align="stretch" spacing={1}>
                          <HStack mb={2}>
                            <Heading size="sm">{hub.name}</Heading>
                            <Badge colorScheme={hub.statusColorScheme}>
                              {hub.status}
                            </Badge>
                          </HStack>
                          <HStack mb={2}>
                            <Tag size="sm" variant="subtle" colorScheme={hub.statusColorScheme}>
                              <Icon as={hub.statusIcon} mr={1} />
                              {hub.subtext}
                            </Tag>
                          </HStack>
                        </VStack>
                        <Spacer />
                        <HStack>
                          <Link 
                            as={RouterLink} 
                            to={`/hub/${hub.id}`} 
                            fontSize="sm" 
                            color="brand.600"
                            fontWeight="medium"
                            mr={2}
                          >
                            View Details <Icon as={ArrowForwardIcon} mx={1}/>
                          </Link>
                          <Tooltip label="Connect this project...">
                            <IconButton
                               aria-label="Connect project"
                               icon={<LinkIcon />}
                               size="xs"
                               variant="ghost"
                               colorScheme="gray"
                               isDisabled
                             />
                          </Tooltip>
                        </HStack>
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Key Goals Card */}
          <Card variant="outline" boxShadow="sm" bg={bgColor} borderColor={borderColor}>
            <CardHeader>
               <Flex justify="space-between" align="center">
                <Heading size="md">Key Goals</Heading>
                <Link as={RouterLink} to="/goals" fontSize="sm" color="brand.600">
                   View All <Icon as={ArrowForwardIcon} mx={1}/>
                </Link>
               </Flex>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                {/* Display Team Goal directly */}
                {teamGoal ? (
                  <Flex key={teamGoal.id} alignItems="center">
                    <Icon as={getGoalIcon(teamGoal.type)} color="blue.500" mr={2} /> { /* Hardcoded color for now */}
                    <Link as={RouterLink} to={'/goals'} fontSize="sm" fontWeight="medium" color="brand.600">
                      {teamGoal.title}
                    </Link>
                  </Flex>
                ) : (
                   <Text fontSize="sm" color="gray.500">No specific team goals found.</Text>
                )}
                 {/* Add another placeholder goal if needed for demo */}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Team Section - Full Width */}
        <Card 
          variant="outline" 
          boxShadow="sm" 
          bg={bgColor} 
          borderColor="brand.200"
          mt={8}
        >
          <CardHeader borderBottom="1px" borderColor={borderColor} bg={highlightColor} roundedTop="md">
            <Flex justify="space-between" align="center">
              {userTeam ? (
                <HStack spacing={4}>
                  <Link 
                    as={RouterLink} 
                    to={`/team/${userTeam.id}`} 
                    _hover={{
                      textDecoration: 'none',
                      '& > .team-name': {
                        color: 'brand.600',
                        transform: 'translateX(2px)'
                      },
                      '& > .team-name-icon': {
                        opacity: 1,
                        transform: 'translateX(0)',
                        color: 'brand.600'
                      }
                    }}
                    display="flex"
                    alignItems="center"
                  >
                    <Heading 
                      size="md" 
                      className="team-name"
                      transition="all 0.2s"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      color="brand.700"
                    >
                      {userTeam.name}
                      <Icon
                        as={ArrowForwardIcon}
                        className="team-name-icon"
                        boxSize={4}
                        opacity={0.3}
                        transform="translateX(-4px)"
                        transition="all 0.2s"
                        color="brand.700"
                      />
                    </Heading>
                  </Link>
                  <Tag size="sm" colorScheme="green" variant="solid">
                    {teamMembers.filter(m => m.online).length} ONLINE
                  </Tag>
                  <Text fontSize="sm" color={textColor}>Led by {userTeam.lead}</Text>
                </HStack>
              ) : (
                <Heading size="md">Your Team</Heading>
              )}
              <HStack>
                <Button leftIcon={<ChatIcon />} variant="ghost" size="sm" colorScheme="brand">
                  Team Chat
                </Button>
                <Button leftIcon={<TimeIcon />} variant="ghost" size="sm" colorScheme="brand">
                  Team Calendar
                </Button>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {/* Team Members Section */}
              <Box>
                <Heading size="sm" mb={4}>Team Members</Heading>
                <Wrap spacing={4}>
                  {teamMembers.map((member, index) => (
                    <WrapItem key={index}>
                      <Card 
                        variant="outline" 
                        size="sm" 
                        w="250px"
                        _hover={{ borderColor: "brand.200", transform: "translateY(-2px)" }}
                        transition="all 0.2s"
                      >
                        <CardBody>
                          <HStack spacing={3}>
                            <Avatar size="md" name={member.name} src={member.avatar} />
                            <Box>
                              <Link 
                                as={RouterLink} 
                                to={`/profile/${member.id}`} 
                                fontWeight="medium" 
                                fontSize="sm" 
                                color="brand.700"
                                display="block"
                              >
                                {member.name}
                              </Link>
                              <Text fontSize="xs" color={textColor}>{member.title}</Text>
                              <HStack mt={1}>
                                {member.online && (
                                  <Tag size="sm" colorScheme="green" variant="subtle">
                                    <Icon as={CheckIcon} mr={1} boxSize="10px"/> online
                                  </Tag>
                                )}
                                <IconButton
                                  aria-label="Message"
                                  icon={<ChatIcon />}
                                  size="xs"
                                  variant="ghost"
                                  colorScheme="brand"
                                />
                              </HStack>
                            </Box>
                          </HStack>
                        </CardBody>
                      </Card>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>

              {/* Team Activity & Stats */}
              <Box>
                <Heading size="sm" mb={4}>Team Activity</Heading>
                <VStack spacing={4} align="stretch">
                  <Card variant="outline" p={4}>
                    <Text fontWeight="medium" mb={2}>Current Sprint Progress</Text>
                    <Progress value={75} colorScheme="brand" rounded="full" size="sm" mb={2} />
                    <Text fontSize="sm" color={textColor}>Sprint ends in 5 days</Text>
                  </Card>
                  
                  <Card variant="outline" p={4}>
                    <Text fontWeight="medium" mb={2}>Recent Achievements</Text>
                    <VStack align="stretch" spacing={2}>
                      <HStack>
                        <Icon as={CheckIcon} color="green.500" />
                        <Text fontSize="sm">Completed Project Milestone</Text>
                      </HStack>
                      <HStack>
                        <Icon as={TimeIcon} color="yellow.500" />
                        <Text fontSize="sm">Team Recognition Award</Text>
                      </HStack>
                    </VStack>
                  </Card>

                  <Card variant="outline" p={4}>
                    <Text fontWeight="medium" mb={2}>Upcoming Team Events</Text>
                    <VStack align="stretch" spacing={2}>
                      <HStack>
                        <Icon as={TimeIcon} color="brand.500" />
                        <Text fontSize="sm">Sprint Planning (Tomorrow, 10 AM)</Text>
                      </HStack>
                      <HStack>
                        <Icon as={TimeIcon} color="brand.500" />
                        <Text fontSize="sm">Team Retrospective (Friday, 2 PM)</Text>
                      </HStack>
                    </VStack>
                  </Card>
                </VStack>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
} 