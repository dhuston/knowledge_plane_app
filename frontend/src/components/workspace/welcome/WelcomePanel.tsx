import {
  Box,
  Flex,
  Heading,
  Text,
  Avatar,
  Stack,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  useColorModeValue,
  Tag,
  Badge,
  HStack,
} from '@chakra-ui/react';
import { useUserContext } from '../../../context/UserContext';

export function WelcomePanel() {
  const { user, isLoading } = useUserContext();
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const subtleColor = useColorModeValue('gray.600', 'gray.400');
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  // Format the current date
  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  if (isLoading) {
    return (
      <Box data-testid="welcome-skeleton">
        <Flex align="center" mb={6}>
          <SkeletonCircle size="16" mr={4} />
          <Stack flex="1">
            <Skeleton height="30px" width="200px" />
            <Skeleton height="20px" width="150px" mt={2} />
          </Stack>
        </Flex>
        <SkeletonText mt={4} noOfLines={3} spacing="4" />
      </Box>
    );
  }
  
  if (!user) {
    return (
      <Box textAlign="center" p={5}>
        <Heading size="md">Welcome to KnowledgePlane AI</Heading>
        <Text mt={2}>Please log in to see your personalized workspace.</Text>
      </Box>
    );
  }
  
  const firstName = user.name.split(' ')[0];
  
  return (
    <Box>
      <Flex 
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'flex-start', md: 'center' }}
        justify="space-between"
        mb={6}
      >
        <Flex align="center">
          <Avatar 
            size="lg" 
            name={user.name} 
            src={user.avatarUrl} 
            mr={4}
          />
          <Box>
            <Heading size="lg">
              {getGreeting()}, {firstName}
            </Heading>
            <Text color={subtleColor} mt={1}>
              {user.role} • {formatDate()}
            </Text>
          </Box>
        </Flex>
        
        <HStack spacing={2} mt={{ base: 4, md: 0 }}>
          <Tag size="md" colorScheme="blue">3 Tasks Due Today</Tag>
          <Tag size="md" colorScheme="green">2 New Messages</Tag>
        </HStack>
      </Flex>
      
      <Box data-testid="personalized-insights" mt={6}>
        <Heading size="md" mb={3}>
          Today's Focus
        </Heading>
        
        <Stack spacing={4}>
          <Flex 
            p={3} 
            bg={useColorModeValue('blue.50', 'blue.900')} 
            borderRadius="md" 
            borderLeft="4px solid" 
            borderColor={accentColor}
            align="center"
          >
            <Badge colorScheme="blue" mr={3}>Priority</Badge>
            <Text>Quarterly research review meeting at 11:00 AM with Research Team</Text>
          </Flex>
          
          <Flex 
            p={3} 
            bg={useColorModeValue('green.50', 'green.900')} 
            borderRadius="md"
            borderLeft="4px solid" 
            borderColor="green.500"
            align="center"
          >
            <Badge colorScheme="green" mr={3}>Goal</Badge>
            <Text>Research project proposal due tomorrow - 80% complete</Text>
          </Flex>
          
          <Flex 
            p={3} 
            bg={useColorModeValue('purple.50', 'purple.900')} 
            borderRadius="md"
            borderLeft="4px solid" 
            borderColor="purple.500"
            align="center"
          >
            <Badge colorScheme="purple" mr={3}>Insight</Badge>
            <Text>Project Alpha team has been highly active in the last 24 hours</Text>
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
}