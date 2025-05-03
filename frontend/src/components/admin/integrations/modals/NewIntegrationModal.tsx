/**
 * NewIntegrationModal.tsx
 * Modal component for adding new integrations
 */
import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  HStack,
  Box,
  Text,
  Flex,
  Image,
  Divider,
  Badge,
  FormHelperText,
  FormErrorMessage,
  useColorModeValue,
} from '@chakra-ui/react';
import { Integration, IntegrationType } from '../models/IntegrationModels';

interface NewIntegrationModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;
  
  /**
   * Callback when the modal is closed
   */
  onClose: () => void;
  
  /**
   * Callback when a new integration is added
   */
  onAddIntegration: (integration: Partial<Integration>) => void;
  
  /**
   * Available integration types
   */
  availableTypes: IntegrationType[];
}

/**
 * Modal component for adding new integrations
 */
const NewIntegrationModal: React.FC<NewIntegrationModalProps> = ({
  isOpen,
  onClose,
  onAddIntegration,
  availableTypes,
}) => {
  // Form state
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Group integration types by category
  const typesByCategory = useMemo(() => {
    const categories: Record<string, IntegrationType[]> = {};
    
    availableTypes.forEach(type => {
      if (!categories[type.category]) {
        categories[type.category] = [];
      }
      categories[type.category].push(type);
    });
    
    return categories;
  }, [availableTypes]);
  
  // Get selected integration type
  const selectedType = useMemo(() => {
    return availableTypes.find(type => type.id === selectedTypeId);
  }, [availableTypes, selectedTypeId]);
  
  // Handle type change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTypeId(e.target.value);
    validateForm({ typeId: e.target.value, name: customName });
  };
  
  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomName(e.target.value);
    validateForm({ typeId: selectedTypeId, name: e.target.value });
  };
  
  // Validate form
  const validateForm = (values: { typeId: string, name: string }) => {
    const errors: Record<string, string> = {};
    
    if (!values.typeId) {
      errors.typeId = 'Integration type is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    // Validate form
    if (!validateForm({ typeId: selectedTypeId, name: customName })) {
      return;
    }
    
    if (!selectedType) return;
    
    // Create new integration
    const newIntegration: Partial<Integration> = {
      type: selectedTypeId,
      name: customName || selectedType.name,
      status: 'configuring',
      config: {},
      createdAt: new Date().toISOString(),
    };
    
    // Add the integration
    onAddIntegration(newIntegration);
    
    // Reset form and close modal
    resetForm();
    onClose();
  };
  
  // Reset form
  const resetForm = () => {
    setSelectedTypeId('');
    setCustomName('');
    setFormErrors({});
  };
  
  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Integration</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <FormControl isRequired isInvalid={!!formErrors.typeId}>
              <FormLabel>Integration Type</FormLabel>
              <Select
                placeholder="Select integration type"
                value={selectedTypeId}
                onChange={handleTypeChange}
                data-testid="integration-type-select"
              >
                {Object.entries(typesByCategory).map(([category, types]) => (
                  <optgroup key={category} label={category.charAt(0).toUpperCase() + category.slice(1)}>
                    {types.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </Select>
              {formErrors.typeId && (
                <FormErrorMessage>{formErrors.typeId}</FormErrorMessage>
              )}
            </FormControl>
            
            <FormControl>
              <FormLabel>Display Name (Optional)</FormLabel>
              <Input
                placeholder="Enter custom name"
                value={customName}
                onChange={handleNameChange}
                data-testid="integration-name-input"
              />
              <FormHelperText>
                If left blank, the default name will be used.
              </FormHelperText>
            </FormControl>
            
            {selectedType && (
              <Box 
                p={4} 
                bg={useColorModeValue('gray.50', 'gray.700')} 
                borderRadius="md"
              >
                <Flex align="center" mb={2}>
                  {selectedType.icon && (
                    <Image 
                      src={selectedType.icon} 
                      alt={`${selectedType.name} icon`} 
                      boxSize="32px" 
                      mr={3} 
                    />
                  )}
                  <Box>
                    <Text fontWeight="medium">{selectedType.name}</Text>
                    <HStack mt={1}>
                      <Badge colorScheme="blue">
                        {selectedType.category}
                      </Badge>
                      <Badge colorScheme="green">
                        {selectedType.authTypes[0]}
                      </Badge>
                    </HStack>
                  </Box>
                </Flex>
                
                <Divider my={3} />
                
                <Text fontSize="sm">
                  {selectedType.description}
                </Text>
                
                {selectedType.supportedEntityTypes.length > 0 && (
                  <Box mt={3}>
                    <Text fontSize="xs" fontWeight="medium" mb={1}>
                      Supported Entity Types:
                    </Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {selectedType.supportedEntityTypes.map(entityType => (
                        <Badge key={entityType} colorScheme="gray" fontSize="xs">
                          {entityType}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                )}
              </Box>
            )}
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <Button variant="outline" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit}
            isDisabled={!selectedTypeId}
            data-testid="continue-button"
          >
            Continue Setup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NewIntegrationModal;