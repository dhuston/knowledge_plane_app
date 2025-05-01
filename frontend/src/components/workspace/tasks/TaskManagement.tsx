import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Checkbox,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import { AddIcon, ChevronDownIcon, CalendarIcon, InfoIcon } from '@chakra-ui/icons';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  entityType?: 'project' | 'team' | 'personal';
  entityId?: string;
  entityName?: string;
}

export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'project' | 'team' | 'personal'>('all');
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  // Get entity type badge color
  const getEntityColor = (entityType?: string) => {
    switch(entityType) {
      case 'project': return 'blue';
      case 'team': return 'purple';
      case 'personal': return 'teal';
      default: return 'gray';
    }
  };

  useEffect(() => {
    // Simulate API call to fetch tasks
    const fetchTasks = async () => {
      setIsLoading(true);
      
      try {
        // Wait for "API call"
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Mock tasks
        const mockTasks: Task[] = [
          {
            id: '1',
            title: 'Prepare research findings presentation',
            completed: false,
            dueDate: '2025-05-03',
            priority: 'high',
            entityType: 'project',
            entityId: '101',
            entityName: 'Knowledge Graph Enhancement'
          },
          {
            id: '2',
            title: 'Review team quarterly goals',
            completed: true,
            dueDate: '2025-05-01',
            priority: 'medium',
            entityType: 'team',
            entityId: '201',
            entityName: 'Research Team'
          },
          {
            id: '3',
            title: 'Update project documentation',
            completed: false,
            dueDate: '2025-05-05',
            priority: 'medium',
            entityType: 'project',
            entityId: '101',
            entityName: 'Knowledge Graph Enhancement'
          },
          {
            id: '4',
            title: 'Schedule 1:1 with team members',
            completed: false,
            dueDate: '2025-05-02',
            priority: 'low',
            entityType: 'personal',
          },
          {
            id: '5',
            title: 'Submit expense report',
            completed: false,
            dueDate: '2025-05-10',
            priority: 'low',
            entityType: 'personal',
          }
        ];
        
        setTasks(mockTasks);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
  }, []);

  // Toggle task completion
  const toggleTaskCompletion = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  // Add new task
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: `new-${Date.now()}`,
      title: newTaskTitle,
      completed: false,
      priority: 'medium',
      entityType: 'personal',
    };
    
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  // Filter tasks based on current filter
  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.entityType === filter);

  // Filter tasks for different tabs
  const todayTasks = filteredTasks.filter(task => 
    task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString()
  );
  
  const upcomingTasks = filteredTasks.filter(task => 
    task.dueDate && new Date(task.dueDate) > new Date() && 
    new Date(task.dueDate).toDateString() !== new Date().toDateString()
  );
  
  const completedTasks = filteredTasks.filter(task => task.completed);
  
  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Task Management</Heading>
        
        <Menu>
          <MenuButton as={Button} rightIcon={<ChevronDownIcon />} size="sm" variant="outline">
            {filter === 'all' ? 'All Tasks' : 
             filter === 'project' ? 'Project Tasks' :
             filter === 'team' ? 'Team Tasks' : 'Personal Tasks'}
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => setFilter('all')}>All Tasks</MenuItem>
            <MenuItem onClick={() => setFilter('project')}>Project Tasks</MenuItem>
            <MenuItem onClick={() => setFilter('team')}>Team Tasks</MenuItem>
            <MenuItem onClick={() => setFilter('personal')}>Personal Tasks</MenuItem>
          </MenuList>
        </Menu>
      </HStack>
      
      {/* Add Task Input */}
      <InputGroup size="md" mb={4}>
        <Input
          placeholder="Add a new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddTask();
          }}
          bg={cardBg}
        />
        <InputRightElement>
          <IconButton
            aria-label="Add task"
            icon={<AddIcon />}
            size="sm"
            onClick={handleAddTask}
          />
        </InputRightElement>
      </InputGroup>
      
      {/* Tasks Display */}
      <Tabs variant="enclosed" size="sm">
        <TabList>
          <Tab>Today ({todayTasks.length})</Tab>
          <Tab>Upcoming ({upcomingTasks.length})</Tab>
          <Tab>Completed ({completedTasks.length})</Tab>
        </TabList>
        
        <TabPanels>
          {/* Today's Tasks */}
          <TabPanel px={0} pt={4}>
            {todayTasks.length === 0 ? (
              <Box textAlign="center" py={6} color="gray.500">
                <CalendarIcon boxSize={6} mb={2} />
                <Text>No tasks due today</Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={2}>
                {todayTasks.map((task) => (
                  <Box 
                    key={task.id} 
                    p={3} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    borderColor={borderColor}
                    bg={cardBg}
                  >
                    <Flex align="flex-start">
                      <Checkbox 
                        isChecked={task.completed}
                        onChange={() => toggleTaskCompletion(task.id)}
                        mr={3}
                        mt={1}
                        colorScheme="green"
                      />
                      <Box flex="1">
                        <Text 
                          textDecoration={task.completed ? 'line-through' : 'none'}
                          color={task.completed ? 'gray.500' : 'inherit'}
                        >
                          {task.title}
                        </Text>
                        <HStack mt={1} spacing={2}>
                          <Badge colorScheme={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          {task.entityType && (
                            <Badge colorScheme={getEntityColor(task.entityType)}>
                              {task.entityName || task.entityType}
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </TabPanel>
          
          {/* Upcoming Tasks */}
          <TabPanel px={0} pt={4}>
            {upcomingTasks.length === 0 ? (
              <Box textAlign="center" py={6} color="gray.500">
                <InfoIcon boxSize={6} mb={2} />
                <Text>No upcoming tasks</Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={2}>
                {upcomingTasks.map((task) => (
                  <Box 
                    key={task.id} 
                    p={3} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    borderColor={borderColor}
                    bg={cardBg}
                  >
                    <Flex align="flex-start">
                      <Checkbox 
                        isChecked={task.completed}
                        onChange={() => toggleTaskCompletion(task.id)}
                        mr={3}
                        mt={1}
                        colorScheme="green"
                      />
                      <Box flex="1">
                        <Text 
                          textDecoration={task.completed ? 'line-through' : 'none'}
                          color={task.completed ? 'gray.500' : 'inherit'}
                        >
                          {task.title}
                        </Text>
                        <HStack mt={1} spacing={2}>
                          {task.dueDate && (
                            <Text fontSize="xs" color="gray.500">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </Text>
                          )}
                          <Badge colorScheme={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          {task.entityType && (
                            <Badge colorScheme={getEntityColor(task.entityType)}>
                              {task.entityName || task.entityType}
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </TabPanel>
          
          {/* Completed Tasks */}
          <TabPanel px={0} pt={4}>
            {completedTasks.length === 0 ? (
              <Box textAlign="center" py={6} color="gray.500">
                <InfoIcon boxSize={6} mb={2} />
                <Text>No completed tasks</Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={2}>
                {completedTasks.map((task) => (
                  <Box 
                    key={task.id} 
                    p={3} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    borderColor={borderColor}
                    bg={cardBg}
                    opacity={0.8}
                  >
                    <Flex align="flex-start">
                      <Checkbox 
                        isChecked={task.completed}
                        onChange={() => toggleTaskCompletion(task.id)}
                        mr={3}
                        mt={1}
                        colorScheme="green"
                      />
                      <Box flex="1">
                        <Text 
                          textDecoration={task.completed ? 'line-through' : 'none'}
                          color={task.completed ? 'gray.500' : 'inherit'}
                        >
                          {task.title}
                        </Text>
                        <HStack mt={1} spacing={2}>
                          <Badge colorScheme={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          {task.entityType && (
                            <Badge colorScheme={getEntityColor(task.entityType)}>
                              {task.entityName || task.entityType}
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}