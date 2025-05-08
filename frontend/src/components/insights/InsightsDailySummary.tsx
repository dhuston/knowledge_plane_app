import React from 'react';
import {
  Box,
  Heading,
  Text,
  useColorModeValue,
  VStack,
  Card,
  CardBody,
} from '@chakra-ui/react';

interface InsightsDailySummaryProps {
  maxHeight?: string;
  personalizationContext?: {
    userId?: string;
    userName?: string;
    filterPreferences?: {
      prioritizeTeamInsights?: boolean;
      showPersonalInsights?: boolean;
    };
    [key: string]: any;
  };
}

/**
 * Simplified daily summary component that doesn't depend on InsightsContext
 */
const InsightsDailySummary: React.FC<InsightsDailySummaryProps> = ({ 
  maxHeight,
  personalizationContext
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const userName = personalizationContext?.userName || 'User';

  return (
    <Box 
      bg={bgColor}
      borderWidth="1px"
      borderRadius="md"
      borderColor={borderColor}
      overflow="hidden"
      boxShadow="sm"
      transition="all 0.2s"
    >
      <Box p={4} maxHeight={maxHeight || "300px"} overflowY="auto">
        <VStack spacing={4} align="stretch">
          <Heading as="h3" size="md">Your Daily Summary</Heading>
          
          <Card variant="outline" p={3}>
            <CardBody>
              <Text fontSize="sm">
                Welcome, {userName.split(' ')[0]}! Your summary functionality has been simplified.
                Check back soon for more insights about your work and team activity.
              </Text>
            </CardBody>
          </Card>
          
          <Card variant="outline" p={3}>
            <CardBody>
              <Text fontSize="sm" fontWeight="medium">Today's focus:</Text>
              <Text fontSize="sm" mt={2}>
                Continue working on your current projects and collaborating with your team.
              </Text>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    </Box>
  );
};

export default InsightsDailySummary;