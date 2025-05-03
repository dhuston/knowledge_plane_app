import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Switch,
  FormControl,
  FormLabel,
  VStack,
  Text,
  Divider,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  Flex,
  Tooltip,
  HStack
} from '@chakra-ui/react';
import { FiRefreshCw } from 'react-icons/fi';
import { useAdmin, FeatureFlag } from '../../context/AdminContext';

/**
 * Admin panel for managing feature flags
 * This version uses the real backend API instead of localStorage
 */
const FeatureFlagsPanel: React.FC = () => {
  const { featureFlags, loadFeatureFlags, updateFeatureFlag } = useAdmin();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Load feature flags on initial render
  useEffect(() => {
    const loadFlags = async () => {
      try {
        setLoading(true);
        setError(null);
        await loadFeatureFlags();
      } catch (err) {
        setError('Failed to load feature flags');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFlags();
  }, [loadFeatureFlags]);

  // Function to format feature name for display
  const formatFeatureName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/^enable /, ''); // Remove "enable" prefix
  };

  // Function to toggle a feature flag
  const handleToggleFeature = async (key: string, currentValue: boolean) => {
    try {
      await updateFeatureFlag(key, !currentValue);
    } catch (err) {
      setError(`Failed to update ${key}`);
      console.error(err);
    }
  };

  // Reload feature flags
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      await loadFeatureFlags();
    } catch (err) {
      setError('Failed to refresh feature flags');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group features by category
  const groupFeaturesByCategory = (flags: Record<string, FeatureFlag>) => {
    const categories: Record<string, FeatureFlag[]> = {};
    
    Object.values(flags).forEach(flag => {
      if (!categories[flag.category]) {
        categories[flag.category] = [];
      }
      categories[flag.category].push(flag);
    });
    
    return categories;
  };

  // Render loading state
  if (loading && !featureFlags) {
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
        textAlign="center"
      >
        <Spinner size="xl" color="blue.500" my={10} />
        <Text mt={4}>Loading feature flags...</Text>
      </Box>
    );
  }

  // Render error state
  if (error && !featureFlags) {
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
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
        <Button mt={4} onClick={handleRefresh} leftIcon={<FiRefreshCw />}>
          Try Again
        </Button>
      </Box>
    );
  }

  // Render feature flags
  const categories = featureFlags ? groupFeaturesByCategory(featureFlags) : {};

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
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">Feature Management</Heading>
        <Tooltip label="Refresh feature flags">
          <Button 
            size="sm" 
            onClick={handleRefresh} 
            leftIcon={<FiRefreshCw />} 
            isLoading={loading}
          >
            Refresh
          </Button>
        </Tooltip>
      </Flex>
      
      <Text mb={4} fontSize="sm" color="gray.500">
        Enable or disable features using the toggles below
      </Text>

      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      {Object.entries(categories).map(([category, flags]) => (
        <Box key={category} mb={4}>
          <Heading size="sm" mb={3} color="blue.500">{category}</Heading>
          <VStack spacing={3} align="stretch">
            {flags.map(flag => (
              <FormControl 
                key={flag.key} 
                display="flex" 
                alignItems="center" 
                justifyContent="space-between"
              >
                <HStack>
                  <FormLabel htmlFor={flag.key} mb={0} fontSize="sm" fontWeight="normal">
                    {formatFeatureName(flag.key)}
                  </FormLabel>
                  {flag.description && (
                    <Tooltip label={flag.description}>
                      <Text fontSize="xs" color="gray.500">ⓘ</Text>
                    </Tooltip>
                  )}
                </HStack>
                <Switch
                  id={flag.key}
                  isChecked={flag.enabled}
                  onChange={() => handleToggleFeature(flag.key, flag.enabled)}
                  colorScheme="blue"
                  isDisabled={loading}
                />
              </FormControl>
            ))}
          </VStack>
          {/* Add divider between categories except for the last one */}
          {category !== Object.keys(categories)[Object.keys(categories).length - 1] && (
            <Divider my={3} />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default FeatureFlagsPanel;