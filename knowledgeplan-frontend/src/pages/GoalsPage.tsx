import React from 'react';
import { Box, Heading, Text, /* VStack, */ Tag, Card, CardBody, CardHeader, Icon, Flex, Link } from "@chakra-ui/react";
import { Link as RouterLink } from 'react-router-dom'; // For linking projects
import { CheckCircleIcon, RepeatClockIcon, SettingsIcon } from '@chakra-ui/icons'; // Example icons
// Import shared mock data
import { mockGoals } from '../mockData'; // Adjust path as needed
// Import type
import type { Goal } from '../mockData'; // Use exported type

// Define types for Goal data (optional but good practice)
// type Goal = { ... };

// Mock Data (Copied here for self-containment, could be imported)
// const mockGoals: Goal = { ... };

// Recursive component to render goals
const GoalItem: React.FC<{ goal: Goal; level: number }> = ({ goal, level }) => {
  const getTagColorScheme = (type: Goal['type']) => {
    switch (type) {
      case 'Enterprise': return 'red';
      case 'Department': return 'orange';
      case 'Team': return 'blue';
      case 'Project': return 'purple';
      default: return 'gray';
    }
  };
  
  const getIcon = (type: Goal['type']) => {
     switch (type) {
      case 'Enterprise': return SettingsIcon;
      case 'Department': return RepeatClockIcon;
      case 'Team': return CheckCircleIcon; // Placeholder icons
      case 'Project': return CheckCircleIcon;
      default: return CheckCircleIcon;
    }
  }

  return (
    <Card variant="outline" size="sm" w="100%" mb={4}>
      <CardHeader pb={1} pt={2} px={3}>
        <Flex alignItems="center">
           <Icon as={getIcon(goal.type)} color={`${getTagColorScheme(goal.type)}.500`} mr={2} />
           <Tag size="sm" variant="subtle" colorScheme={getTagColorScheme(goal.type)} mr={3}>{goal.type}</Tag>
           {goal.type === 'Project' ? (
             <Link 
               as={RouterLink} 
               to={`/hub/${goal.id}`} 
               fontWeight="medium" 
               color="brand.700"
               _hover={{ textDecoration: 'underline' }}
              >
                {goal.title}
             </Link>
           ) : (
             <Text fontWeight="medium">{goal.title}</Text>
           )}
        </Flex>
      </CardHeader>
      {goal.children && goal.children.length > 0 && (
        <CardBody pl={`${level * 1.5 + 3}rem`} pt={1} pb={2}> { /* Indent children */ }
          {goal.children.map(child => (
            <GoalItem key={child.id} goal={child} level={level + 1} />
          ))}
        </CardBody>
      )}
    </Card>
  );
};

export default function GoalsPage() {
  return (
    <Box>
      <Heading size="lg" mb={6}>Strategic Goals & OKRs</Heading>
      <GoalItem goal={mockGoals} level={0} />
    </Box>
  );
} 