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
  Icon, 
  Avatar, 
  Container, 
  useColorModeValue, 
  Badge, 
  Tooltip, 
  IconButton, 
  Divider 
} from "@chakra-ui/react"; 
import { AddIcon, ChatIcon, SearchIcon, EditIcon, QuestionOutlineIcon, ViewIcon, InfoIcon, WarningIcon, ArrowForwardIcon, CheckIcon, BellIcon, CalendarIcon, StarIcon } from '@chakra-ui/icons';

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

export default function WorkspacePage() {
  const demoUserName = "Demo User"; // Placeholder user name
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const highlightColor = useColorModeValue('brand.50', 'brand.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // --- Static Demo Briefing Content (Enhanced Styling) ---
  // const briefingItems = [ ... ]; 
  // ------------------------------------

  // --- Static Demo Hub List ---
  const demoHubs = [
    { 
      id: 'phoenix', 
      name: 'Project Phoenix', 
      status: 'In Progress', 
      statusColorScheme: 'blue', 
      statusIcon: InfoIcon, // Example icon
      subtext: 'Next step: Integration testing • Due EOW',
      progress: 65,
      priority: 'High'
    },
    { 
      id: 'q3-strategy', 
      name: 'Q3 Strategy Hub', 
      status: 'Needs Review', 
      statusColorScheme: 'orange', 
      statusIcon: WarningIcon, // Example icon
      subtext: 'Awaiting feedback on draft proposal',
      progress: 40,
      priority: 'Medium'
    }
  ];
  // ---------------------------

  // --- Action Button Placeholders ---
  const actionButtons = [
    { label: "Find Data", icon: SearchIcon, tooltip: "Search through your data sources" },
    { label: "Search Literature", icon: QuestionOutlineIcon, tooltip: "Find relevant research papers" },
    { label: "Design Experiment", icon: EditIcon, tooltip: "Create a new experiment" },
    { label: "Create Project", icon: AddIcon, tooltip: "Start a new project" },
    { label: "Search Knowledgebase", icon: ViewIcon, tooltip: "Browse the knowledge base" },
  ];
  // ----------------------------------

  // --- Static Demo Team Data ---
  const demoTeam = [
    { name: "Sarah Chen", role: "Lead Researcher", online: true, avatar: "", lastActive: "Just now" },
    { name: "Bob Smith", role: "Data Scientist", online: false, avatar: "", lastActive: "2h ago" },
    { name: "Charlie Day", role: "Lab Technician", online: true, avatar: "", lastActive: "5m ago" }
  ];
  // -----------------------------

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
                <CalendarIcon />
                <Text>3 meetings today</Text>
              </HStack>
              <HStack>
                <BellIcon />
                <Text>2 notifications</Text>
              </HStack>
            </HStack>
          </Box>
          <HStack spacing={2}>
            <IconButton
              aria-label="View notifications"
              icon={<BellIcon />}
              variant="ghost"
              colorScheme="brand"
            />
            <IconButton
              aria-label="View calendar"
              icon={<CalendarIcon />}
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
                <StarIcon color="brand.500" />
                <Text fontSize="lg" fontWeight="bold" color="brand.700">Daily Summary</Text>
              </HStack>
              <Tag size="sm" variant="subtle" colorScheme="brand">AI GENERATED</Tag> 
            </Flex>
          </CardHeader>
          <CardBody pt={0}>
            <Text fontSize="md" lineHeight="tall">
              Your recent paper on resistance mechanisms has received <Text as="strong" color="brand.700">+12 new citations</Text> this month. 
              Your <Tag size="sm" variant="solid" colorScheme="orange">drug resistance review meeting</Tag> is scheduled for tomorrow at <Text as="strong">10:00 AM</Text>, and there's a <Tag size="sm" variant="solid" colorScheme="red">resistance mechanism data submission</Tag> due today at <Text as="strong">5:00 PM</Text>. 
              <Text as="strong">3 team members</Text> are currently analyzing related PDX models.
            </Text>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing={4}>
          {actionButtons.map((action, index) => (
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

        {/* Main Content Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
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
                {demoHubs.map(hub => (
                  <Card key={hub.id} variant="outline" size="sm">
                    <CardBody>
                      <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
                        <Box flex="1">
                          <HStack mb={2}>
                            <Heading size="sm">{hub.name}</Heading>
                            <Badge colorScheme={hub.priority === 'High' ? 'red' : 'orange'}>
                              {hub.priority}
                            </Badge>
                          </HStack>
                          <HStack mb={2}>
                            <Tag size="sm" variant="subtle" colorScheme={hub.statusColorScheme}>
                              <Icon as={hub.statusIcon} mr={1} />
                              {hub.status}
                            </Tag>
                            <Text fontSize="sm" color={textColor}>
                              {hub.progress}% Complete
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color={textColor}>{hub.subtext}</Text>
                        </Box>
                        <HStack spacing={2}>
                          <Button
                            as={RouterLink}
                            to={`/hub/${hub.id}`}
                            size="sm"
                            colorScheme="brand"
                            variant="ghost"
                          >
                            View Details
                          </Button>
                          <IconButton
                            aria-label="Chat about project"
                            icon={<ChatIcon />}
                            size="sm"
                            variant="ghost"
                          />
                        </HStack>
                      </Flex>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Team Card */}
          <Card variant="outline" boxShadow="sm" bg={bgColor} borderColor={borderColor}>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <HStack>
                  <Heading size="md">Your Team</Heading>
                  <Tag size="sm" colorScheme="green" variant="subtle">
                    {demoTeam.filter(m => m.online).length} ONLINE
                  </Tag>
                </HStack>
                <Button leftIcon={<ChatIcon />} variant="ghost" size="sm" colorScheme="brand">
                  Message Team
                </Button>
              </Flex>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                {demoTeam.map((member, index) => (
                  <Flex 
                    key={index} 
                    p={3} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    borderColor={borderColor}
                    align="center"
                    justify="space-between"
                  >
                    <HStack spacing={3}>
                      <Avatar size="sm" name={member.name} src={member.avatar} />
                      <Box>
                        <Text fontWeight="medium">{member.name}</Text>
                        <Text fontSize="sm" color={textColor}>{member.role}</Text>
                      </Box>
                    </HStack>
                    <HStack>
                      <Text fontSize="sm" color={textColor}>{member.lastActive}</Text>
                      {member.online && (
                        <Tag size="sm" colorScheme="green" variant="subtle">
                          <Icon as={CheckIcon} mr={1} boxSize="10px"/> online
                        </Tag>
                      )}
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Container>
  );
} 