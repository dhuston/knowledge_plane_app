import React, { useState, useEffect } from 'react';
import { Box, FormControl, FormLabel, Switch, Text, Flex, Badge } from '@chakra-ui/react';
import { setApiPathPrefix } from '../../api/client';
import { useApiClient } from '../../hooks/useApiClient';

/**
 * Component that toggles between old and new integration API endpoints
 */
const IntegrationApiSwitch: React.FC = () => {
  const apiClient = useApiClient();
  const [isUsingNewApi, setIsUsingNewApi] = useState<boolean>(false);
  const [isNewApiAvailable, setIsNewApiAvailable] = useState<boolean | null>(null);
  
  // Since we've fully migrated to the new API, always mark as available
  useEffect(() => {
    setIsNewApiAvailable(true);
  }, []);

  // Handle toggle of API version
  const handleApiToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const useNewApi = event.target.checked;
    
    // We've now fully migrated to the streamlined API
    // This toggle is kept for backward compatibility but doesn't change behavior
    setApiPathPrefix('/api/v1');
    
    setIsUsingNewApi(useNewApi);
  };

  return (
    <Box mb={4} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
      <FormControl display="flex" alignItems="center">
        <FormLabel htmlFor="api-switch" mb="0">
          <Flex alignItems="center">
            <Text fontWeight="medium" mr={2}>Use Streamlined API</Text>
            {isNewApiAvailable === true && (
              <Badge colorScheme="green" variant="subtle">Available</Badge>
            )}
            {isNewApiAvailable === false && (
              <Badge colorScheme="red" variant="subtle">Unavailable</Badge>
            )}
            {isNewApiAvailable === null && (
              <Badge colorScheme="gray" variant="subtle">Checking...</Badge>
            )}
          </Flex>
        </FormLabel>
        <Switch 
          id="api-switch" 
          isChecked={isUsingNewApi}
          onChange={handleApiToggle}
          colorScheme="blue"
          isDisabled={isNewApiAvailable !== true}
        />
      </FormControl>
      <Text fontSize="xs" color="gray.600" mt={1}>
        {"Using the streamlined integration API with improved performance"}
      </Text>
    </Box>
  );
};

export default IntegrationApiSwitch;