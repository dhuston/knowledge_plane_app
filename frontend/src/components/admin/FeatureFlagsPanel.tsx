import React from 'react';
import {
  Box,
  Heading,
  Switch,
  FormControl,
  FormLabel,
  VStack,
  Text,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';
import { useFeatureFlags } from '../../utils/featureFlags';

/**
 * Admin panel for managing feature flags
 */
const FeatureFlagsPanel: React.FC = () => {
  const { flags, toggleFeature } = useFeatureFlags();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Function to format feature name for display
  const formatFeatureName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/^enable /, ''); // Remove "enable" prefix
  };

  // Group features by category
  const featureCategories = {
    'Real-time Features': ['enableDeltaStream'],
    'Visualization Features': ['enableAnalytics', 'enableTeamClustering'],
    'UI Components': ['enableIntegrations', 'enableSuggestions', 'enableActivityTimeline'],
    'Navigation': ['enableHierarchyNavigator']
  };

  return (
    <Box 
      p={5} 
      borderWidth="1px" 
      borderRadius="lg"
      bg={bgColor}
      borderColor={borderColor}
      width="100%"
      maxWidth="600px"
      margin="0 auto"
      shadow="md"
    >
      <Heading size="md" mb={4}>Feature Management</Heading>
      <Text mb={4} fontSize="sm" color="gray.500">
        Enable or disable features using the toggles below
      </Text>
      
      {Object.entries(featureCategories).map(([category, featureKeys]) => (
        <Box key={category} mb={4}>
          <Heading size="sm" mb={3} color="blue.500">{category}</Heading>
          <VStack spacing={3} align="stretch">
            {featureKeys.map(key => (
              <FormControl 
                key={key} 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between"
              >
                <FormLabel htmlFor={key} mb={0} fontSize="sm" fontWeight="normal">
                  {formatFeatureName(key as string)}
                </FormLabel>
                <Switch
                  id={key}
                  isChecked={flags[key as keyof typeof flags]}
                  onChange={() => toggleFeature(key as keyof typeof flags)}
                  colorScheme="blue"
                />
              </FormControl>
            ))}
          </VStack>
          {/* Add divider between categories except for the last one */}
          {category !== Object.keys(featureCategories)[Object.keys(featureCategories).length - 1] && (
            <Divider my={3} />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default FeatureFlagsPanel;