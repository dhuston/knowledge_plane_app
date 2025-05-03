import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Avatar,
  Icon,
  Flex,
  Divider,
  CircularProgress,
  CircularProgressLabel,
  useColorModeValue
} from '@chakra-ui/react';
import { TimeIcon, CheckIcon, StarIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';

interface ActivityItem {
  id: string;
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  type: 'update' | 'completion' | 'comment' | 'mention';
  entityType: 'project' | 'document' | 'task' | 'goal';
  entityName: string;
  timestamp: string;
  description: string;
}

interface TeamMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
}

export function TeamActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [metrics, setMetrics] = useState<TeamMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const subtleText = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Generate activity icon based on type
  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'update': 
        return TimeIcon;
      case 'completion': 
        return CheckIcon;
      case 'comment':
      case 'mention':
      default:
        return StarIcon;
    }
  };
  
  // Generate badge color based on entity type
  const getBadgeColor = (entityType: string) => {
    switch(entityType) {
      case 'project': 
        return 'blue';
      case 'document': 
        return 'purple';
      case 'task': 
        return 'green';
      case 'goal': 
        return 'orange';
      default:
        return 'gray';
    }
  };
  
  useEffect(() => {
    // Simulate API call to fetch team activity data
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Wait for "API call"
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock activities
        const mockActivities: ActivityItem[] = [
          {
            id: '1',
            user: {
              id: '1',
              name: 'John Smith',
              avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
            },
            type: 'completion',
            entityType: 'task',
            entityName: 'Research Data Analysis',
            timestamp: '10 minutes ago',
            description: 'Completed the first phase of data analysis for the research project.'
          },
          {
            id: '2',
            user: {
              id: '2',
              name: 'Jane Doe',
              avatarUrl: 'https://randomuser.me/api/portraits/women/54.jpg'
            },
            type: 'update',
            entityType: 'project',
            entityName: 'Knowledge Graph Enhancement',
            timestamp: '45 minutes ago',
            description: 'Updated the project timeline and resource allocation.'
          },
          {
            id: '3',
            user: {
              id: '3',
              name: 'Bob Johnson',
              avatarUrl: 'https://randomuser.me/api/portraits/men/42.jpg'
            },
            type: 'comment',
            entityType: 'document',
            entityName: 'Research Findings Report',
            timestamp: '2 hours ago',
            description: 'Added comments on the methodology section of the report.'
          },
          {
            id: '4',
            user: {
              id: '4',
              name: 'Alice Williams',
              avatarUrl: 'https://randomuser.me/api/portraits/women/67.jpg'
            },
            type: 'update',
            entityType: 'goal',
            entityName: 'Q2 Research Objectives',
            timestamp: '3 hours ago',
            description: 'Updated progress metrics for the quarterly research objectives.'
          }
        ];
        
        // Mock team metrics
        const mockMetrics: TeamMetric[] = [
          {
            name: 'Project Completion',
            value: 68,
            target: 100,
            unit: '%'
          },
          {
            name: 'Research Output',
            value: 12,
            target: 15,
            unit: 'documents'
          },
          {
            name: 'Goal Achievement',
            value: 4,
            target: 5,
            unit: 'goals'
          }
        ];
        
        setActivities(mockActivities);
        setMetrics(mockMetrics);
      } catch (error) {
        console.error('Error fetching team activity data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <Box>
      <Heading size="md" mb={1}>Team Activity</Heading>
      
      {/* Team Metrics Section */}
      <Box mb={2}>
        <HStack spacing={4} justify="center">
          {metrics.map((metric, index) => (
            <Box key={index} textAlign="center">
              <CircularProgress 
                value={(metric.value / metric.target) * 100} 
                size="60px" 
                color="blue.400"
                thickness="6px"
              >
                <CircularProgressLabel fontSize="xs">
                  {metric.value}/{metric.target}
                </CircularProgressLabel>
              </CircularProgress>
              <Text fontWeight="medium" fontSize="xs">{metric.name}</Text>
              <Text fontSize="2xs" color={subtleText}>
                {metric.value} of {metric.target} {metric.unit}
              </Text>
            </Box>
          ))}
        </HStack>
      </Box>
      
      <Divider mb={1} />
      
      {/* Recent Activity Feed */}
      <Box>
        <Heading size="sm" mb={1}>Recent Activity</Heading>
        
        <VStack 
          spacing={2} 
          align="stretch" 
          maxH="180px" 
          overflowY="auto" 
          pr={2}
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: borderColor,
              borderRadius: '24px',
            },
          }}
        >
          {activities.map(activity => (
            <Box 
              key={activity.id} 
              p={2} 
              bg={cardBg} 
              borderRadius="md" 
              borderWidth="1px" 
              borderColor={borderColor}
            >
              <Flex>
                <Avatar 
                  size="xs" 
                  name={activity.user.name} 
                  src={activity.user.avatarUrl} 
                  mr={2} 
                />
                <Box flex="1">
                  <Flex 
                    justify="space-between" 
                    align="flex-start" 
                    mb={0}
                  >
                    <HStack spacing={1}>
                      <Text fontWeight="medium" fontSize="xs">{activity.user.name}</Text>
                      <Badge colorScheme={getBadgeColor(activity.entityType)} fontSize="2xs">
                        {activity.entityType}
                      </Badge>
                    </HStack>
                    <Text fontSize="2xs" color={subtleText}>
                      {activity.timestamp}
                    </Text>
                  </Flex>
                  <Text fontSize="xs" mb={1}>
                    <Icon as={getActivityIcon(activity.type)} mr={1} boxSize="10px" />
                    <Text as="span" fontWeight="medium">{activity.entityName}</Text>
                  </Text>
                  <Text fontSize="xs" noOfLines={1}>{activity.description}</Text>
                </Box>
              </Flex>
            </Box>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}