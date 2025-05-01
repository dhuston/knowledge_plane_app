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
  useColorModeValue
} from '@chakra-ui/react';
import { CalendarIcon, TimeIcon } from '@chakra-ui/icons';
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
  
  return (
    <Box>
      <Heading size="md" mb={4}>Daily Briefing</Heading>
      
      {events.length === 0 ? (
        <Box p={4} bg={cardBg} borderRadius="md" textAlign="center">
          <CalendarIcon boxSize={10} color={accentColor} mb={3} />
          <Text>No events scheduled for today</Text>
        </Box>
      ) : (
        <VStack spacing={4} align="stretch">
          {/* Today's Schedule */}
          <Box>
            <Heading size="sm" mb={3} color={accentColor}>
              <Flex align="center">
                <CalendarIcon mr={2} />
                Today's Schedule
              </Flex>
            </Heading>
            
            <VStack spacing={3} align="stretch">
              {events.map((event: CalendarEvent) => (
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
              ))}
            </VStack>
          </Box>
          
          <Divider />
          
          {/* Meeting Preparation */}
          <Box data-testid="meeting-preparation">
            <Heading size="sm" mb={3} color={accentColor}>
              AI-Powered Meeting Prep
            </Heading>
            
            <Accordion allowToggle>
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
                      <Text fontWeight="medium">{event.title} Preparation</Text>
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
          
          {/* Additional briefing sections could be added here */}
        </VStack>
      )}
    </Box>
  );
}