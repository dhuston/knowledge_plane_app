import {
  Box,
  Heading,
  VStack,
  SimpleGrid,
  Icon,
  Text,
  HStack,
  Avatar,
  Badge,
  Flex,
  IconButton,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  CalendarIcon, 
  EditIcon, 
  AddIcon, 
  SearchIcon,
  ChatIcon,
  StarIcon
} from '@chakra-ui/icons';
import { useState } from 'react';

interface QuickActionItem {
  id: string;
  icon: any;
  label: string;
  onClick: () => void;
}

interface RecentEntity {
  id: string;
  name: string;
  type: 'project' | 'team' | 'document' | 'user';
  avatarUrl?: string;
}

export function QuickActions() {
  const [recentEntities, setRecentEntities] = useState<RecentEntity[]>([
    {
      id: '1',
      name: 'Knowledge Graph Enhancement',
      type: 'project',
    },
    {
      id: '2',
      name: 'Research Team',
      type: 'team',
    },
    {
      id: '3',
      name: 'John Smith',
      type: 'user',
      avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    },
    {
      id: '4',
      name: 'Project Proposal.docx',
      type: 'document',
    },
  ]);
  
  const actionBgColor = useColorModeValue('gray.50', 'whiteAlpha.100');
  const actionHoverBgColor = useColorModeValue('gray.100', 'whiteAlpha.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const quickActions: QuickActionItem[] = [
    {
      id: 'create-meeting',
      icon: CalendarIcon,
      label: 'Schedule Meeting',
      onClick: () => console.log('Schedule meeting clicked'),
    },
    {
      id: 'add-task',
      icon: EditIcon,
      label: 'Add Task',
      onClick: () => console.log('Add task clicked'),
    },
    {
      id: 'new-project',
      icon: AddIcon,
      label: 'New Project',
      onClick: () => console.log('New project clicked'),
    },
    {
      id: 'search-knowledge',
      icon: SearchIcon,
      label: 'Knowledge Search',
      onClick: () => console.log('Knowledge search clicked'),
    },
    {
      id: 'message-team',
      icon: ChatIcon,
      label: 'Message Team',
      onClick: () => console.log('Message team clicked'),
    },
    {
      id: 'create-goal',
      icon: StarIcon,
      label: 'Create Goal',
      onClick: () => console.log('Create goal clicked'),
    },
  ];
  
  // Get entity icon based on type
  const getEntityIcon = (type: string) => {
    switch(type) {
      case 'project':
        return StarIcon;
      case 'team':
        return CalendarIcon;
      case 'document':
        return EditIcon;
      case 'user':
        return ChatIcon;
      default:
        return SearchIcon;
    }
  };
  
  // Get entity badge color based on type
  const getEntityColor = (type: string) => {
    switch(type) {
      case 'project':
        return 'blue';
      case 'team':
        return 'purple';
      case 'document':
        return 'green';
      case 'user':
        return 'teal';
      default:
        return 'gray';
    }
  };
  
  return (
    <Box>
      <Heading size="md" mb={4}>Quick Actions</Heading>
      
      {/* Action Buttons Grid */}
      <SimpleGrid columns={2} spacing={3} mb={6}>
        {quickActions.map((action) => (
          <Box
            key={action.id}
            p={3}
            bg={actionBgColor}
            borderRadius="md"
            cursor="pointer"
            onClick={action.onClick}
            transition="all 0.2s"
            _hover={{ bg: actionHoverBgColor }}
            textAlign="center"
          >
            <Icon as={action.icon} boxSize={5} mb={2} />
            <Text fontSize="sm" fontWeight="medium">
              {action.label}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
      
      <Divider mb={4} />
      
      {/* Recently Accessed */}
      <Box>
        <Heading size="sm" mb={3}>Recently Accessed</Heading>
        
        <VStack spacing={3} align="stretch">
          {recentEntities.map((entity) => (
            <Flex 
              key={entity.id} 
              p={2} 
              borderWidth="1px" 
              borderRadius="md" 
              borderColor={borderColor}
              align="center"
              cursor="pointer"
              _hover={{ bg: actionBgColor }}
            >
              {entity.type === 'user' ? (
                <Avatar size="sm" name={entity.name} src={entity.avatarUrl} mr={3} />
              ) : (
                <Icon 
                  as={getEntityIcon(entity.type)} 
                  boxSize={5} 
                  mr={3} 
                  color={`${getEntityColor(entity.type)}.500`}
                />
              )}
              
              <Box flex="1">
                <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                  {entity.name}
                </Text>
                <Badge size="sm" colorScheme={getEntityColor(entity.type)}>
                  {entity.type}
                </Badge>
              </Box>
              
              <IconButton
                aria-label="View entity"
                icon={<SearchIcon />}
                size="xs"
                variant="ghost"
              />
            </Flex>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}