import { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Skeleton,
  SkeletonText,
  Divider,
  Flex,
  Badge,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Tag,
  Button
} from '@chakra-ui/react';
import { CalendarIcon, TimeIcon, InfoOutlineIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { useCalendarEvents } from '../../../hooks/useCalendarEvents';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  attendees: string[];
  summary: string;
}

export function DailyBriefing() {
  const { events, isLoading, error } = useCalendarEvents();
  const cardBg = useColorModeValue('white', 'gray.700');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const highlightBg = useColorModeValue('blue.50', 'blue.900');
  const tabBg = useColorModeValue('gray.100', 'gray.700');
  const activeTabBg = useColorModeValue('white', 'gray.600');
  
  // State for compact view toggle
  const [compactView, setCompactView] = useState(true);
  
  if (isLoading) {
    return (
      <Box data-testid="briefing-skeleton">
        <Heading size="md" mb={4}>Daily Briefing</Heading>
        <VStack spacing={4} align="stretch">
          <Skeleton height="100px" />
          <Skeleton height="100px" />
          <SkeletonText mt={4} noOfLines={4} spacing="4" />
        </VStack>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box>
        <Heading size="md" mb={4}>Daily Briefing</Heading>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertTitle>Unable to load calendar events</AlertTitle>
        </Alert>
      </Box>
    );
  }
  
  // Handler for toggling compact view
  const toggleCompactView = () => setCompactView(!compactView);
  
  // Renders a single event in detailed view
  const renderDetailedEvent = (event: CalendarEvent) => (
    <Box 
      key={event.id} 
      p={3} 
      bg={cardBg} 
      borderRadius="md" 
      borderLeft="4px solid" 
      borderColor={accentColor}
      shadow="sm"
    >
      <Flex justify="space-between" align="center" mb={1}>
        <Heading size="sm">{event.title}</Heading>
        <Badge colorScheme="blue">
          <Flex align="center">
            <TimeIcon mr={1} />
            {event.startTime} - {event.endTime}
          </Flex>
        </Badge>
      </Flex>
      
      <Text fontSize="sm" color="gray.500" mb={2}>
        {event.location}
      </Text>
      
      <Text fontSize="sm" noOfLines={2}>
        {event.summary}
      </Text>
    </Box>
  );
  
  // Renders a single event in compact view
  const renderCompactEvent = (event: CalendarEvent) => (
    <Flex 
      key={event.id}
      p={2}
      borderRadius="md"
      borderLeft="3px solid"
      borderColor={accentColor}
      bg={cardBg}
      shadow="sm"
      justify="space-between"
      align="center"
    >
      <HStack spacing={2}>
        <TimeIcon color="gray.500" boxSize={3} />
        <Text fontWeight="medium" fontSize="sm">{event.startTime}</Text>
        <Text fontSize="sm">{event.title}</Text>
      </HStack>
      <Tag size="sm" variant="subtle" colorScheme="blue">
        {event.attendees.length} attendees
      </Tag>
    </Flex>
  );
  
  return (
    <Box>
      <Flex align="center" justify="space-between" mb={2}>
        <Heading size="md">Daily Briefing</Heading>
        {events.length > 0 && (
          <Button 
            size="xs" 
            variant="ghost" 
            onClick={toggleCompactView}
            leftIcon={compactView ? <ChevronDownIcon /> : <ChevronUpIcon />}
          >
            {compactView ? "Expand" : "Compact"}
          </Button>
        )}
      </Flex>
      
      {events.length === 0 ? (
        <Box p={3} bg={cardBg} borderRadius="md" textAlign="center">
          <CalendarIcon boxSize={8} color={accentColor} mb={2} />
          <Text>No events scheduled for today</Text>
        </Box>
      ) : (
        <Tabs variant="enclosed" colorScheme="blue" size="sm" isLazy>
          <TabList bg={tabBg} borderRadius="md" p={1}>
            <Tab 
              _selected={{ bg: activeTabBg, fontWeight: "medium" }} 
              borderTopRadius="md"
              fontSize="sm"
              px={4}
              py={2}
            >
              <HStack>
                <CalendarIcon />
                <Text>Schedule ({events.length})</Text>
              </HStack>
            </Tab>
            <Tab
              _selected={{ bg: activeTabBg, fontWeight: "medium" }} 
              borderTopRadius="md"
              fontSize="sm"
              px={4}
              py={2}
            >
              <HStack>
                <InfoOutlineIcon />
                <Text>Meeting Prep</Text>
              </HStack>
            </Tab>
          </TabList>
          
          <TabPanels>
            {/* Schedule Tab */}
            <TabPanel p={0} pt={3}>
              <VStack spacing={compactView ? 1 : 3} align="stretch">
                {events.map(event => 
                  compactView ? renderCompactEvent(event) : renderDetailedEvent(event)
                )}
              </VStack>
            </TabPanel>
            
            {/* Meeting Prep Tab */}
            <TabPanel p={0} pt={3}>
              <Box data-testid="meeting-preparation">
                <Accordion allowToggle defaultIndex={[0]}>
                  {events.map((event: CalendarEvent) => (
                    <AccordionItem 
                      key={`prep-${event.id}`} 
                      border="none" 
                      mb={2}
                      bg={highlightBg} 
                      borderRadius="md"
                    >
                      <AccordionButton borderRadius="md" _hover={{ bg: 'transparent' }}>
                        <Box flex="1" textAlign="left">
                          <Text fontWeight="medium">{event.title}</Text>
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <VStack spacing={3} align="stretch">
                          <Box>
                            <Text fontWeight="medium">Key Participants:</Text>
                            <Flex mt={1} flexWrap="wrap" gap={2}>
                              {event.attendees.map((attendee, idx) => (
                                <Badge key={idx} colorScheme="purple">
                                  {attendee}
                                </Badge>
                              ))}
                            </Flex>
                          </Box>
                          
                          <Box>
                            <Text fontWeight="medium">Suggested Talking Points:</Text>
                            <VStack align="stretch" mt={1}>
                              <Text fontSize="sm">• Update on project timeline and milestones</Text>
                              <Text fontSize="sm">• Research findings from last sprint</Text>
                              <Text fontSize="sm">• Resource allocation for upcoming tasks</Text>
                            </VStack>
                          </Box>
                          
                          <Box>
                            <Text fontWeight="medium">Relevant Documents:</Text>
                            <VStack align="stretch" mt={1}>
                              <Text fontSize="sm" color="blue.500" cursor="pointer">
                                - Project Status Report (April)
                              </Text>
                              <Text fontSize="sm" color="blue.500" cursor="pointer">
                                - Research Findings Summary
                              </Text>
                            </VStack>
                          </Box>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}
    </Box>
  );
}