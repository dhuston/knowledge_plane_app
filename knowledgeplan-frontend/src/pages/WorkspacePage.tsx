import React, { useState, useEffect } from 'react'; // Added useState, useEffect
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
  WrapItem,
  Spacer,
  Spinner, // Add Spinner
  Alert, // Add Alert
  AlertIcon, // Add AlertIcon
  List, ListItem // Ensure List/ListItem are imported
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
import { mockTeams, mockUsers, /* currentUser, */ mockProjects, mockActionButtons, /* findGoalById */ } from '../mockData'; // Adjust path as needed
import { apiClient } from '../api/client';
// Import type
// import type { Goal } from '../mockData'; // Removed unused Goal type
import { useAuth } from '../context/AuthContext'; // Import useAuth
// import type { User } from '../context/AuthContext'; // No longer explicitly needed here
// import type { Team } from '../pages/ProfilePage'; // Removed incorrect import

// Define type for Calendar Event from API
interface CalendarEvent {
  summary: string;
  start?: string;
  end?: string;
}

// Define Team type locally for this component
interface Team {
  id: string;
  name: string;
  description?: string | null;
  // Add other fields as needed from the API response
}

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

// Removed unused getGoalIcon helper
// const getGoalIcon = (type: string) => { /* ... */ };

// --- Component ---
export default function WorkspacePage() {
  const { isAuthenticated, isLoading: authIsLoading, user } = useAuth();
  
  // Removed unused teamGoal
  // const teamGoal = null; 
  
  // Keep filtering mock data for now, based on real user ID
  const teamMembers = user?.team_id ? Object.values(mockUsers).filter(u => u.teamId === user.team_id) : []; 
  const userProjects = user?.team_id ? Object.values(mockProjects).filter(h => h.teamId === user.team_id) : []; 

  // State for calendar events
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState<boolean>(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // State for team details
  const [teamDetails, setTeamDetails] = useState<Team | null>(null);
  const [teamLoading, setTeamLoading] = useState<boolean>(false);
  // Removed unused teamError state
  // const [teamError, setTeamError] = useState<string | null>(null);

  // Fetch calendar events *after* user is authenticated
  useEffect(() => {
    console.log(`[WorkspacePage] useEffect triggered. isAuthenticated: ${isAuthenticated}, authIsLoading: ${authIsLoading}`);
    const fetchEvents = async () => {
      // Only fetch if authenticated
      if (!isAuthenticated) {
        console.log("[WorkspacePage] Not authenticated, skipping fetchEvents.");
        // Optionally reset state if user becomes unauthenticated
        // setCalendarEvents([]);
        // setCalendarLoading(false);
        // setCalendarError(null);
        return;
      }
      
      setCalendarLoading(true);
      setCalendarError(null);
      try {
        console.log("[WorkspacePage] Fetching calendar events (user authenticated)");
        const events = await apiClient.get<CalendarEvent[]>('/integrations/google/calendar/events');
        setCalendarEvents(events || []); // Handle null response
      } catch /* (error) */ {
        // console.error("Failed to fetch calendar events:", error);
        setCalendarError("Could not load calendar events. Check connection or permissions.");
      } finally {
        setCalendarLoading(false);
      }
    };

    fetchEvents();
    
  }, [isAuthenticated]); // Re-run effect when isAuthenticated changes

  // Effect to fetch team details when user/team_id changes
  useEffect(() => {
    // console.log(`[WorkspacePage] useEffect triggered. isAuthenticated: ${isAuthenticated}, authIsLoading: ${authIsLoading}`);
    const fetchTeamData = async () => {
      if (user?.team_id) {
        // console.log(`[WorkspacePage] User has teamId ${user.team_id}, fetching team details.`);
        setTeamLoading(true);
        setTeamDetails(null); 
        try {
          const fetchedTeam = await apiClient.get<Team>(`/teams/${user.team_id}`);
          setTeamDetails(fetchedTeam);
          // console.log("[WorkspacePage] Fetched team details:", fetchedTeam);
        } catch /* (error) */ {
          // console.error("[WorkspacePage] Failed to fetch team details:", error);
          // Handle error state if needed, e.g., setTeamError("Failed to load team");
        } finally {
          setTeamLoading(false);
        }
      } else {
        setTeamDetails(null);
        setTeamLoading(false);
      }
    };

    if (!authIsLoading) {
       fetchTeamData();
    }
  }, [user?.team_id, authIsLoading]);

  // --- Briefing Content (Now focuses on Calendar) ---
  const renderBriefingContent = () => {
    // Show loading spinner if auth is loading OR calendar is loading
    if (authIsLoading || calendarLoading) {
      return <Spinner size="sm" />;
    }
    if (calendarError) {
      return <Alert status="warning" size="sm"><AlertIcon />{calendarError}</Alert>;
    }
    if (calendarEvents.length === 0) {
      return <Text fontSize="sm">No events scheduled for today.</Text>;
    }
    return (
       <List spacing={2} mt={2}>
          {calendarEvents.slice(0, 5).map((event, index) => ( // Show max 5 events
            <ListItem key={index} fontSize="sm" fontWeight="normal" display="flex" alignItems="center">
              <Icon as={TimeIcon} color="blue.500" mr={2} />
              <Text as="span" noOfLines={1}>{event.summary} ({formatEventTime(event.start)})</Text> { /* Added time formatting helper needed */}
            </ListItem>
          ))}
          {calendarEvents.length > 5 && <ListItem fontSize="xs" color="gray.500">... and {calendarEvents.length - 5} more.</ListItem>} 
        </List>
    );
  };
  // --- Helper for time formatting (Needs implementation) ---
  const formatEventTime = (dateTimeString?: string): string => {
    if (!dateTimeString) return "All day";
    try {
      // Basic time formatting, improve as needed
      const date = new Date(dateTimeString);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      // Fixed unused var
      return "Time Error";
    }
  }
  // ------------------------------------

  // Placeholder AI Suggestions
  const aiSuggestions = [
    { label: "Link 'drug response patterns' to Goal?", icon: LinkIcon },
    { label: "Tag 'resistance mechanisms'?", icon: TagIcon },
    { label: "Assign 'data submission' task to Bob?", icon: AddIcon }
  ];

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const highlightColor = useColorModeValue('brand.50', 'brand.900');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={8} align="stretch">
        {/* Header Section */}
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
          <Box>
            <Heading size="2xl" color="brand.700" mb={2}>
              {getUserGreeting()}, {user ? user.name : 'User'}
            </Heading>
            <HStack spacing={4} color={textColor}>
              <Text fontSize="lg">{getCurrentDate()}</Text>
              <Divider orientation="vertical" height="20px" />
              <HStack>
                <TimeIcon />
                <Text>
                  {calendarLoading 
                    ? "Loading meetings..." 
                    : `${calendarEvents.length} meeting${calendarEvents.length !== 1 ? 's' : ''} today`
                  }
                </Text>
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
            {renderBriefingContent()}
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
              <Text fontSize="sm" color="gray.500">Goals data loading logic TBD.</Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Team Section - Updated Header */}
        <Card 
          variant="outline" 
          boxShadow="sm" 
          bg={bgColor} 
          borderColor={teamDetails ? "brand.200" : borderColor} // Highlight if team loaded
          mt={8}
        >
          <CardHeader borderBottom="1px" borderColor={borderColor} bg={teamDetails ? highlightColor : undefined} roundedTop="md">
            <Flex justify="space-between" align="center">
              {teamLoading ? (
                <Spinner size="sm" />
              ) : teamDetails ? (
                <HStack spacing={4}>
                  {/* Link uses fetched team ID */}
                  <Link 
                    as={RouterLink} 
                    to={`/team/${teamDetails.id}`} 
                    _hover={{ /* ... hover styles ... */ }}
                    display="flex"
                    alignItems="center"
                  >
                    <Heading size="md" /* ... other styles ... */ color="brand.700">
                      {/* Display fetched team name */}
                      {teamDetails.name} 
                      {/* ... (Arrow icon) ... */}
                    </Heading>
                  </Link>
                  {/* Online count uses filtered mock data for now */}
                  <Tag size="sm" colorScheme="green" variant="solid">
                    {teamMembers.filter(m => m.online).length} ONLINE
                  </Tag>
                  {/* Lead uses mock data for now */}
                  <Text fontSize="sm" color={textColor}>
                    Led by {mockTeams[teamDetails.id]?.lead || 'N/A'} { /* Use mock lead for now */} 
                  </Text>
                </HStack>
              ) : (
                <Heading size="md">Your Team</Heading> // Fallback if no team or error
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
             {/* Team Members Section - Still uses filtered mock data */}
             <Box>
               <Heading size="sm" mb={4}>Team Members</Heading>
               <Flex wrap="wrap" gap={4}>
                 {teamMembers.map((member, index) => (
                   <WrapItem key={index} flexShrink={0}>
                     <Card variant="outline" size="sm" w="250px" _hover={{ borderColor: "brand.200", transform: "translateY(-2px)" }} transition="all 0.2s">
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
               </Flex>
             </Box>
             
             {/* Team Activity & Stats (Content removed as it used unused imports) */}
             <Box mt={6}>
               <Heading size="sm" mb={4}>Team Activity</Heading>
               <Text fontSize="sm" color="gray.500">Team activity loading logic TBD.</Text>
             </Box>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
} 