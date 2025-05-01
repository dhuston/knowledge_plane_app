import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Divider,
  Progress,
  useColorModeValue,
  Icon,
  Tooltip,
  SimpleGrid,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import { 
  FiCalendar, 
  FiTarget, 
  FiFlag, 
  FiTrendingUp, 
  FiUsers,
  FiBarChart2,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { MapNode } from '../../../types/map';
import { GoalRead } from '../../../types/goal';

interface GoalPanelProps {
  data: GoalRead;
  selectedNode: MapNode;
}

const GoalPanel: React.FC<GoalPanelProps> = ({ data, selectedNode }) => {
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const sectionBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Get status color
  const getStatusColor = (status: string = ''): string => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('on track')) {
      return 'green';
    } else if (statusLower.includes('planning')) {
      return 'blue';
    } else if (statusLower.includes('caution')) {
      return 'yellow';
    } else if (statusLower.includes('complete')) {
      return 'teal';
    } else if (statusLower.includes('risk') || statusLower.includes('behind')) {
      return 'red';
    }
    
    return 'gray';
  };
  
  // Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set';
    
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Calculate days remaining
  const getDaysRemaining = (dateString?: string): string => {
    if (!dateString) return 'No deadline';
    
    try {
      const deadline = new Date(dateString);
      const now = new Date();
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
      if (diffDays === 0) return 'Due today';
      return `${diffDays} days remaining`;
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Get progress color based on percentage
  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return 'green';
    if (progress >= 60) return 'teal';
    if (progress >= 40) return 'blue';
    if (progress >= 20) return 'orange';
    return 'red';
  };
  
  // Get metrics data
  const getMetricsData = () => {
    return [
      {
        label: data.metrics?.[0]?.name || 'Completion',
        value: data.metrics?.[0]?.current_value || data.progress || 0,
        target: data.metrics?.[0]?.target_value || 100,
        unit: data.metrics?.[0]?.unit || '%',
        trend: 'up',
      },
      {
        label: data.metrics?.[1]?.name || 'Quality',
        value: data.metrics?.[1]?.current_value || Math.round(Math.random() * 100),
        target: data.metrics?.[1]?.target_value || 95,
        unit: data.metrics?.[1]?.unit || '%',
        trend: Math.random() > 0.5 ? 'up' : 'down',
      }
    ];
  };
  
  const metricsData = getMetricsData();
  const progress = data.progress || 0;
  const progressColor = getProgressColor(progress);

  return (
    <VStack spacing={4} align="stretch">
      {/* Goal Header */}
      <Box p={4} borderRadius="md" bg={headerBg}>
        <VStack align="flex-start" spacing={2}>
          <HStack width="100%" justifyContent="space-between">
            <Heading size="md">{data.title}</Heading>
            {data.status && (
              <Badge colorScheme={getStatusColor(data.status)}>
                {data.status}
              </Badge>
            )}
          </HStack>
          {data.description && (
            <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
              {data.description}
            </Text>
          )}
        </VStack>
      </Box>

      {/* Progress Information */}
      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <VStack align="center" justify="center" spacing={3} p={2}>
            <CircularProgress 
              value={progress} 
              size="100px" 
              thickness="8px" 
              color={`${progressColor}.400`}
            >
              <CircularProgressLabel fontWeight="bold">{progress}%</CircularProgressLabel>
            </CircularProgress>
            <Text fontSize="sm" fontWeight="medium" color={`${progressColor}.500`}>
              Overall Progress
            </Text>
          </VStack>
          
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <HStack>
                <Icon as={FiCalendar} color="blue.500" />
                <Text fontSize="sm" color="gray.500">Target Date</Text>
              </HStack>
              <Tooltip label={getDaysRemaining(data.target_date)}>
                <Text fontSize="sm">{formatDate(data.target_date)}</Text>
              </Tooltip>
            </HStack>
            <Divider />
            <HStack justify="space-between">
              <HStack>
                <Icon as={FiUsers} color="blue.500" />
                <Text fontSize="sm" color="gray.500">Owner</Text>
              </HStack>
              <Text fontSize="sm">{data.owner?.name || 'Not assigned'}</Text>
            </HStack>
            <HStack justify="space-between">
              <HStack>
                <Icon as={FiFlag} color="blue.500" />
                <Text fontSize="sm" color="gray.500">Priority</Text>
              </HStack>
              <Badge colorScheme={
                data.priority === 'High' ? 'red' : 
                data.priority === 'Medium' ? 'orange' : 'green'
              }>
                {data.priority || 'Medium'}
              </Badge>
            </HStack>
          </VStack>
        </SimpleGrid>
      </Box>

      {/* Key Results / Metrics */}
      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
        <VStack align="stretch" spacing={3}>
          <Heading size="sm">Key Metrics</Heading>
          <Divider />
          
          {metricsData.map((metric, idx) => (
            <Box key={idx} py={2}>
              <HStack justify="space-between" mb={1}>
                <HStack spacing={1}>
                  <Icon as={FiBarChart2} color="blue.500" boxSize={4} />
                  <Text fontSize="sm" fontWeight="medium">{metric.label}</Text>
                </HStack>
                <HStack spacing={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    {metric.value}{metric.unit}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    / {metric.target}{metric.unit}
                  </Text>
                  <Icon 
                    as={metric.trend === 'up' ? FiTrendingUp : FiTrendingUp}
                    color={metric.trend === 'up' ? 'green.500' : 'red.500'}
                  />
                </HStack>
              </HStack>
              <Progress 
                value={(metric.value / metric.target) * 100} 
                size="sm" 
                colorScheme={metric.trend === 'up' ? 'green' : 'blue'} 
                borderRadius="full"
              />
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Success Criteria */}
      {data.success_criteria && data.success_criteria.length > 0 && (
        <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
          <VStack align="stretch" spacing={3}>
            <Heading size="sm">Success Criteria</Heading>
            <Divider />
            
            {data.success_criteria.map((criteria, idx) => {
              const isComplete = criteria.status === 'complete';
              return (
                <HStack key={idx} spacing={3}>
                  <Icon 
                    as={isComplete ? FiCheck : FiTarget} 
                    color={isComplete ? 'green.500' : 'gray.400'} 
                    boxSize={5}
                  />
                  <VStack align="start" spacing={0} flex={1}>
                    <Text 
                      fontSize="sm" 
                      textDecoration={isComplete ? 'line-through' : 'none'}
                      color={isComplete ? 'gray.500' : undefined}
                    >
                      {criteria.description}
                    </Text>
                    {criteria.target && (
                      <Text fontSize="xs" color="gray.500">
                        Target: {criteria.target}
                      </Text>
                    )}
                  </VStack>
                  <Badge colorScheme={isComplete ? 'green' : 'gray'}>
                    {isComplete ? 'Complete' : 'Pending'}
                  </Badge>
                </HStack>
              );
            })}
          </VStack>
        </Box>
      )}

      {/* Aligned Projects */}
      {data.aligned_projects && data.aligned_projects.length > 0 && (
        <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
          <VStack align="stretch" spacing={3}>
            <Heading size="sm">Aligned Projects</Heading>
            <Divider />
            
            {data.aligned_projects.map((project, idx) => (
              <HStack key={idx} justify="space-between" spacing={3}>
                <HStack spacing={2}>
                  <Badge 
                    colorScheme={
                      project.status === 'Active' ? 'green' :
                      project.status === 'Blocked' ? 'red' : 'gray'
                    }
                  >
                    {project.status}
                  </Badge>
                  <Text fontSize="sm">{project.name}</Text>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  {project.progress || 0}% complete
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );
};

export default GoalPanel;