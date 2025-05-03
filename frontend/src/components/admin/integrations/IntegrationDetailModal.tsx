import React, { useState } from "react";
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
  FormErrorMessage,
  Box,
  Text,
  Image,
  VStack,
  HStack,
  Textarea,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Flex,
  Badge,
  useToast
} from "@chakra-ui/react";
import { AuthSelector } from "./auth/AuthSelector";
import { Integration, IntegrationStatus, AuthConfig } from "./models/IntegrationModels";

interface IntegrationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (integration: Integration) => void;
  integration: Integration;
}

export const IntegrationDetailModal: React.FC<IntegrationDetailModalProps> = ({
  isOpen,
  onClose,
  onSave,
  integration
}) => {
  // State for form data
  const [formData, setFormData] = useState<Integration>(integration);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const toast = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleNumberChange = (name: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAuthConfigChange = (config: AuthConfig) => {
    setAuthConfig(config);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Display name is required";
    }

    // Add validation for other required fields
    if (!authConfig && formData.authTypes && formData.authTypes.length > 0) {
      newErrors.auth = "Authentication configuration is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Merge the auth config with the form data
      const updatedIntegration: Integration = {
        ...formData,
        authConfig: authConfig || undefined
      };

      await onSave(updatedIntegration);
      toast({
        title: "Configuration saved",
        description: `${formData.name} has been successfully configured.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error saving configuration",
        description: "There was an error saving your configuration. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Error saving integration configuration:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Configure Integration</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Integration Header */}
            <HStack spacing={4}>
              {formData.logoUrl && (
                <Image
                  src={formData.logoUrl}
                  alt={`${formData.name} logo`}
                  boxSize="40px"
                  objectFit="contain"
                />
              )}
              <Box>
                <Text fontSize="lg" fontWeight="bold">
                  {formData.name}
                </Text>
                <Badge
                  colorScheme={formData.status === IntegrationStatus.ACTIVE ? "green" : "gray"}
                >
                  {formData.status === IntegrationStatus.ACTIVE ? "Active" : "Inactive"}
                </Badge>
              </Box>
            </HStack>
            
            {/* Description */}
            <Text>{formData.description}</Text>
            <Divider />
            
            {/* Basic Settings */}
            <VStack spacing={4} align="stretch">
              <Text fontWeight="medium" fontSize="md">
                Basic Settings
              </Text>
              
              <FormControl isInvalid={!!errors.name}>
                <FormLabel htmlFor="name">Display Name</FormLabel>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
              </FormControl>
              
              <FormControl>
                <FormLabel htmlFor="description">Description</FormLabel>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  resize="vertical"
                  rows={3}
                />
              </FormControl>
            </VStack>
            
            {/* Authentication Settings */}
            {formData.authTypes && formData.authTypes.length > 0 && (
              <>
                <Divider />
                <VStack spacing={4} align="stretch">
                  <Text fontWeight="medium" fontSize="md">
                    Authentication Method
                  </Text>
                  <FormControl isInvalid={!!errors.auth}>
                    <AuthSelector
                      availableAuthTypes={formData.authTypes}
                      onChange={handleAuthConfigChange}
                      initialConfig={formData.authConfig}
                    />
                    {errors.auth && <FormErrorMessage>{errors.auth}</FormErrorMessage>}
                  </FormControl>
                </VStack>
              </>
            )}
            
            {/* Sync Settings */}
            <Divider />
            <VStack spacing={4} align="stretch">
              <Text fontWeight="medium" fontSize="md">
                Sync Settings
              </Text>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="enabled" mb="0">
                  Enable Automatic Sync
                </FormLabel>
                <Switch
                  id="enabled"
                  isChecked={formData.syncEnabled !== false}
                  onChange={(e) => handleSwitchChange("syncEnabled", e.target.checked)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel htmlFor="syncFrequency">Sync Frequency (minutes)</FormLabel>
                <NumberInput
                  id="syncFrequency"
                  min={15}
                  max={1440}
                  value={formData.syncFrequency || 60}
                  onChange={(_, value) => handleNumberChange("syncFrequency", value)}
                  isDisabled={formData.syncEnabled === false}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </VStack>
            
            {/* Advanced Settings */}
            <Divider />
            <Accordion allowToggle>
              <AccordionItem border="none">
                <h2>
                  <AccordionButton px={0}>
                    <Text fontWeight="medium" fontSize="md">
                      Advanced Settings
                    </Text>
                    <AccordionIcon ml="auto" />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4} px={0}>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel htmlFor="customEndpoint">Custom Endpoint URL</FormLabel>
                      <Input
                        id="customEndpoint"
                        name="customEndpoint"
                        placeholder="https://api.example.com"
                        value={formData.customEndpoint || ""}
                        onChange={handleChange}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel htmlFor="timeout">Timeout (seconds)</FormLabel>
                      <NumberInput
                        id="timeout"
                        min={1}
                        max={300}
                        value={formData.timeout || 30}
                        onChange={(_, value) => handleNumberChange("timeout", value)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel htmlFor="maxRetries">Max Retries</FormLabel>
                      <NumberInput
                        id="maxRetries"
                        min={0}
                        max={10}
                        value={formData.maxRetries || 3}
                        onChange={(_, value) => handleNumberChange("maxRetries", value)}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="debugMode" mb="0">
                        Debug Mode
                      </FormLabel>
                      <Switch
                        id="debugMode"
                        isChecked={formData.debugMode === true}
                        onChange={(e) => handleSwitchChange("debugMode", e.target.checked)}
                      />
                    </FormControl>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Save Configuration
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};