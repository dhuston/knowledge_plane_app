import React from 'react';
import {
  Box,
  VStack,
  Text,
  Heading,
  Spinner,
  HStack,
  useColorModeValue,
  Icon,
  Divider,
  Badge,
  Button,
} from '@chakra-ui/react';
import { 
  FiMessageSquare, 
  FiEdit, 
  FiLink, 
  FiPlus, 
  FiCheck, 
  FiAlertCircle,
  FiClock,
  FiMoreHorizontal
} from 'react-icons/fi';

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user: string;
}

interface ActivityTimelineProps {
  activities: Activity[];
  isLoading: boolean;
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities, isLoading }) => {
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const timelineBg = useColorModeValue('gray.50', 'gray.700');
  const timelineIndicatorColor = useColorModeValue('blue.500', 'blue.300');
  
  // Get icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'comment':
        return FiMessageSquare;
      case 'update':
        return FiEdit;
      case 'link':
        return FiLink;
      case 'create':
        return FiPlus;
      case 'complete':
        return FiCheck;
      case 'alert':
        return FiAlertCircle;
      default:
        return FiClock;
    }
  };
  
  // Format timestamp to relative time (e.g., "2 hours ago", "Yesterday")
  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
    }
    
    if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    
    if (diffDays === 1) {
      return 'Yesterday';
    }
    
    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    
    // Format as date for older activities
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch">
        <Box p={3} bg={headerBg} borderRadius="md">
          <Heading size="sm">Activity Timeline</Heading>
        </Box>
        <Box textAlign="center" py={4}>
          <Spinner size="md" />
        </Box>
      </VStack>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <VStack spacing={4} align="stretch">
        <Box p={3} bg={headerBg} borderRadius="md">
          <Heading size="sm">Activity Timeline</Heading>
        </Box>
        <Text color="gray.500" fontSize="sm" textAlign="center" py={2}>
          No recent activity
        </Text>
      </VStack>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Box p={3} bg={headerBg} borderRadius="md" display="flex" justifyContent="space-between" alignItems="center">
        <Heading size="sm">Activity Timeline</Heading>
        <Badge colorScheme="blue">{activities.length}</Badge>
      </Box>
      
      {/* Timeline */}
      <VStack spacing={0} align="stretch" position="relative" pl={8}>
        {/* Vertical timeline line */}
        <Box
          position="absolute"
          left="16px"
          top="0"
          bottom="0"
          width="1px"
          bg={timelineIndicatorColor}
        ></Box>
        
        {activities.map((activity, idx) => (
          <React.Fragment key={activity.id}>
            <Box position="relative" p={3}>
              {/* Timeline dot */}
              <Box
                position="absolute"
                left="-8px"
                top="5px"
                width="4px"
                height="4px"
                borderRadius="full"
                bg={timelineIndicatorColor}
                zIndex={1}
              ></Box>
              
              <VStack align="stretch" spacing={1}>
                <HStack justify="space-between">
                  <HStack>
                    <Icon as={getActivityIcon(activity.type)} color={timelineIndicatorColor} />
                    <Text fontSize="sm" fontWeight="medium">{activity.user}</Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.500">
                    {formatRelativeTime(activity.timestamp)}
                  </Text>
                </HStack>
                
                <Box
                  ml={6}
                  p={2}
                  borderRadius="md"
                  borderWidth="1px"
                  bg={timelineBg}
                >
                  <Text fontSize="sm">{activity.message}</Text>
                </Box>
              </VStack>
            </Box>
            
            {/* Add divider between activities (except for the last one) */}
            {idx < activities.length - 1 && <Divider ml={6} />}
          </React.Fragment>
        ))}
      </VStack>

      {/* Show more button */}
      {activities.length > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          leftIcon={<FiMoreHorizontal />}
          alignSelf="center"
          mt={2}
          onClick={() => {
            // In a real implementation, this would load more activities
            // For now, we'll just show a simple toast message
            window.alert('Loading more activities would be implemented in a real application');
          }}
        >
          Show More ({activities.length} displayed)
        </Button>
      )}
    </VStack>
  );
};

export default ActivityTimeline;