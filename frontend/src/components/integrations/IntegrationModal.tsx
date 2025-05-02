import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Stack,
  Switch,
  FormHelperText,
  useToast,
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  Text,
  Divider
} from '@chakra-ui/react';
import { Integration } from '../../types/integration';
import { 
  useCreateIntegration, 
  useUpdateIntegration, 
  useIntegrationTypes,
  useIntegrationSchema 
} from '../../hooks/useIntegrations';
import LoadingSpinner from '../common/LoadingSpinner';
import DynamicForm from '../common/DynamicForm';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: (refreshNeeded?: boolean) => void;
  integration: Integration | null;
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({ 
  isOpen, 
  onClose,
  integration
}) => {
  const toast = useToast();
  const isEditing = !!integration;
  const title = isEditing ? 'Edit Integration' : 'Add Integration';
  
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    integration_type: '',
    is_enabled: true,
    schedule: '',
    config: {},
    credentials: {}
  });
  
  const [activeTab, setActiveTab] = useState(0);

  const createMutation = useCreateIntegration();
  const updateMutation = useUpdateIntegration();
  
  // Fetch available integration types
  const { 
    isLoading: isLoadingTypes, 
    error: typesError,
    data: integrationTypes 
  } = useIntegrationTypes();
  
  // Fetch schema for the selected integration type
  const { 
    isLoading: isLoadingSchema,
    error: schemaError,
    data: configSchema,
    refetch: refetchSchema
  } = useIntegrationSchema(formValues.integration_type, {
    enabled: !!formValues.integration_type
  });

  // Reset form when modal opens/closes or integration changes
  useEffect(() => {
    if (isOpen) {
      if (integration) {
        // Edit mode - populate form with integration data
        setFormValues({
          name: integration.name,
          description: integration.description || '',
          integration_type: integration.integration_type,
          is_enabled: integration.is_enabled,
          schedule: integration.schedule || '',
          config: integration.config || {},
          credentials: {} // Don't pre-populate credentials for security reasons
        });
        setActiveTab(0);
      } else {
        // Create mode - reset form
        setFormValues({
          name: '',
          description: '',
          integration_type: '',
          is_enabled: true,
          schedule: '',
          config: {},
          credentials: {}
        });
        setActiveTab(0);
      }
    }
  }, [isOpen, integration]);

  // Refetch schema when integration type changes
  useEffect(() => {
    if (formValues.integration_type) {
      refetchSchema();
    }
  }, [formValues.integration_type, refetchSchema]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormValues(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormValues(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleConfigChange = (newConfig: any) => {
    setFormValues(prev => ({ ...prev, config: newConfig }));
  };

  const handleCredentialsChange = (newCredentials: any) => {
    setFormValues(prev => ({ ...prev, credentials: newCredentials }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormValues(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async () => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          integrationId: integration!.id,
          data: formValues
        });
        toast({
          title: 'Integration updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createMutation.mutateAsync(formValues);
        toast({
          title: 'Integration created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose(true);
    } catch (error) {
      toast({
        title: isEditing ? 'Failed to update integration' : 'Failed to create integration',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Modal isOpen={isOpen} onClose={() => onClose()} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs index={activeTab} onChange={setActiveTab} isLazy>
            <TabList>
              <Tab>Basic Info</Tab>
              <Tab isDisabled={!formValues.integration_type}>Configuration</Tab>
              <Tab isDisabled={!formValues.integration_type}>Credentials</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <Stack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Name</FormLabel>
                    <Input
                      name="name"
                      value={formValues.name}
                      onChange={handleInputChange}
                      placeholder="Integration name"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      name="description"
                      value={formValues.description}
                      onChange={handleInputChange}
                      placeholder="Brief description of this integration"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Integration Type</FormLabel>
                    {isLoadingTypes ? (
                      <LoadingSpinner size="sm" />
                    ) : typesError ? (
                      <Alert status="error">
                        <AlertIcon />
                        Failed to load integration types
                      </Alert>
                    ) : (
                      <Select
                        name="integration_type"
                        value={formValues.integration_type}
                        onChange={handleInputChange}
                        placeholder="Select integration type"
                      >
                        {integrationTypes?.map(type => (
                          <option key={type} value={type}>
                            {type.replace('_', ' ')}
                          </option>
                        ))}
                      </Select>
                    )}
                    <FormHelperText>
                      The type of system to integrate with
                    </FormHelperText>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Schedule (Cron Expression)</FormLabel>
                    <Input
                      name="schedule"
                      value={formValues.schedule}
                      onChange={handleInputChange}
                      placeholder="0 0 * * *"
                    />
                    <FormHelperText>
                      When to run this integration automatically (cron format)
                    </FormHelperText>
                  </FormControl>

                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="is_enabled" mb="0">
                      Enabled
                    </FormLabel>
                    <Switch
                      id="is_enabled"
                      name="is_enabled"
                      isChecked={formValues.is_enabled}
                      onChange={handleSwitchChange}
                    />
                  </FormControl>
                </Stack>
              </TabPanel>

              <TabPanel>
                {!formValues.integration_type ? (
                  <Alert status="info">
                    <AlertIcon />
                    Please select an integration type first
                  </Alert>
                ) : isLoadingSchema ? (
                  <LoadingSpinner />
                ) : schemaError ? (
                  <Alert status="error">
                    <AlertIcon />
                    Failed to load configuration schema
                  </Alert>
                ) : !configSchema ? (
                  <Alert status="info">
                    <AlertIcon />
                    No configuration options available for this integration type
                  </Alert>
                ) : (
                  <>
                    <Text mb={4}>
                      Configure the connection parameters for this integration.
                    </Text>
                    <DynamicForm
                      schema={configSchema}
                      formData={formValues.config}
                      onChange={handleConfigChange}
                    />
                  </>
                )}
              </TabPanel>

              <TabPanel>
                {!formValues.integration_type ? (
                  <Alert status="info">
                    <AlertIcon />
                    Please select an integration type first
                  </Alert>
                ) : (
                  <>
                    <Text mb={4}>
                      Enter the authentication credentials for this integration.
                    </Text>
                    <Box mb={4}>
                      <Alert status="info" mb={4}>
                        <AlertIcon />
                        Credentials are stored securely and encrypted at rest.
                      </Alert>
                    
                      {formValues.integration_type === 'google_calendar' && (
                        <>
                          <FormControl mb={4} isRequired>
                            <FormLabel>Access Token</FormLabel>
                            <Input
                              type="password"
                              value={formValues.credentials.access_token || ''}
                              onChange={(e) => handleCredentialsChange({
                                ...formValues.credentials,
                                access_token: e.target.value
                              })}
                            />
                          </FormControl>
                          
                          <FormControl mb={4}>
                            <FormLabel>Refresh Token</FormLabel>
                            <Input
                              type="password"
                              value={formValues.credentials.refresh_token || ''}
                              onChange={(e) => handleCredentialsChange({
                                ...formValues.credentials,
                                refresh_token: e.target.value
                              })}
                            />
                          </FormControl>
                        </>
                      )}
                      
                      {formValues.integration_type === 'jira' && (
                        <>
                          <FormControl mb={4} isRequired>
                            <FormLabel>Username/Email</FormLabel>
                            <Input
                              value={formValues.credentials.username || ''}
                              onChange={(e) => handleCredentialsChange({
                                ...formValues.credentials,
                                username: e.target.value
                              })}
                            />
                          </FormControl>
                          
                          <FormControl mb={4} isRequired>
                            <FormLabel>API Token</FormLabel>
                            <Input
                              type="password"
                              value={formValues.credentials.api_token || ''}
                              onChange={(e) => handleCredentialsChange({
                                ...formValues.credentials,
                                api_token: e.target.value
                              })}
                            />
                            <FormHelperText>
                              Generate an API token from your Jira account settings
                            </FormHelperText>
                          </FormControl>
                        </>
                      )}
                      
                      {formValues.integration_type === 'ldap' && (
                        <>
                          <FormControl mb={4} isRequired>
                            <FormLabel>Bind DN</FormLabel>
                            <Input
                              value={formValues.credentials.bind_dn || ''}
                              onChange={(e) => handleCredentialsChange({
                                ...formValues.credentials,
                                bind_dn: e.target.value
                              })}
                            />
                            <FormHelperText>
                              Distinguished name used to bind to the LDAP server
                            </FormHelperText>
                          </FormControl>
                          
                          <FormControl mb={4} isRequired>
                            <FormLabel>Password</FormLabel>
                            <Input
                              type="password"
                              value={formValues.credentials.password || ''}
                              onChange={(e) => handleCredentialsChange({
                                ...formValues.credentials,
                                password: e.target.value
                              })}
                            />
                          </FormControl>
                        </>
                      )}
                    </Box>
                  </>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={() => onClose()}>
            Cancel
          </Button>
          {activeTab > 0 && (
            <Button mr={3} onClick={() => setActiveTab(activeTab - 1)}>
              Previous
            </Button>
          )}
          {activeTab < 2 ? (
            <Button 
              colorScheme="blue" 
              onClick={() => setActiveTab(activeTab + 1)}
              isDisabled={activeTab === 0 && !formValues.integration_type}
            >
              Next
            </Button>
          ) : (
            <Button 
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={isLoading}
              loadingText={isEditing ? "Updating" : "Creating"}
              isDisabled={!formValues.name || !formValues.integration_type}
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default IntegrationModal;