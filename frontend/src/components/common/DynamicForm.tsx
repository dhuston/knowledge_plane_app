import React, { useState, useEffect } from 'react';
import { Box, Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, Input, Select, Checkbox, Textarea, VStack, HStack, Grid, GridItem, Heading, Text, Link, Icon, Switch, InputGroup, InputRightElement, IconButton } from '@chakra-ui/react';
import { ExternalLinkIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

export interface FormField {
  name: string;
  type: 'text' | 'number' | 'password' | 'email' | 'url' | 'select' | 'checkbox' | 'textarea' | 'switch';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  disabled?: boolean;
  defaultValue?: any;
  helpText?: string;
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    errorMessage?: string;
  };
}

export interface FormSchema {
  title?: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
}

export const DynamicForm: React.FC<FormSchema> = ({
  title,
  description,
  fields,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onSubmit,
  onCancel
}) => {
  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  // Initialize form data with default values
  useEffect(() => {
    const initialData: Record<string, any> = {};
    fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        initialData[field.name] = field.defaultValue;
      } else {
        // Set default values based on field type
        switch (field.type) {
          case 'checkbox':
            initialData[field.name] = false;
            break;
          case 'switch':
            initialData[field.name] = false;
            break;
          default:
            initialData[field.name] = '';
        }
      }
    });
    setFormData(initialData);
  }, [fields]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    // Update form data based on input type
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle switch toggle
  const handleSwitchChange = (name: string, isChecked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: isChecked
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (name: string) => {
    setShowPassword(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // Validate a single field
  const validateField = (field: FormField, value: any): string | null => {
    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      return `${field.label} is required`;
    }

    // Skip further validation if empty and not required
    if (value === undefined || value === null || value === '') {
      return null;
    }

    // Validate based on field type and validation rules
    if (field.validation) {
      const { pattern, min, max, minLength, maxLength, errorMessage } = field.validation;

      // Regex pattern validation
      if (pattern && !pattern.test(String(value))) {
        return errorMessage || `Invalid format for ${field.label}`;
      }

      // Number range validation
      if (field.type === 'number') {
        const numValue = Number(value);
        if (min !== undefined && numValue < min) {
          return errorMessage || `${field.label} must be at least ${min}`;
        }
        if (max !== undefined && numValue > max) {
          return errorMessage || `${field.label} must be at most ${max}`;
        }
      }

      // String length validation
      if (typeof value === 'string') {
        if (minLength !== undefined && value.length < minLength) {
          return errorMessage || `${field.label} must be at least ${minLength} characters`;
        }
        if (maxLength !== undefined && value.length > maxLength) {
          return errorMessage || `${field.label} must be at most ${maxLength} characters`;
        }
      }
    }

    // Type-specific validations
    switch (field.type) {
      case 'email':
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(String(value))) {
          return `Please enter a valid email address`;
        }
        break;
      case 'url':
        try {
          new URL(String(value));
        } catch {
          return `Please enter a valid URL`;
        }
        break;
    }

    return null;
  };

  // Validate all fields and return true if valid
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const value = formData[field.name];
      const error = validateField(field, value);
      
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Render form field based on type
  const renderField = (field: FormField) => {
    const { name, type, label, placeholder, options, required, disabled, helpText } = field;
    const value = formData[name];
    const error = errors[name];

    switch (type) {
      case 'text':
      case 'email':
      case 'number':
      case 'url':
        return (
          <FormControl key={name} isInvalid={!!error} isRequired={required} isDisabled={disabled}>
            <FormLabel htmlFor={name}>{label}</FormLabel>
            <Input
              id={name}
              name={name}
              type={type}
              placeholder={placeholder}
              value={value || ''}
              onChange={handleChange}
            />
            {helpText && !error && <FormHelperText>{helpText}</FormHelperText>}
            <FormErrorMessage>{error}</FormErrorMessage>
          </FormControl>
        );

      case 'password':
        return (
          <FormControl key={name} isInvalid={!!error} isRequired={required} isDisabled={disabled}>
            <FormLabel htmlFor={name}>{label}</FormLabel>
            <InputGroup>
              <Input
                id={name}
                name={name}
                type={showPassword[name] ? 'text' : 'password'}
                placeholder={placeholder}
                value={value || ''}
                onChange={handleChange}
              />
              <InputRightElement>
                <IconButton
                  aria-label={showPassword[name] ? "Hide password" : "Show password"}
                  h="1.75rem"
                  size="sm"
                  onClick={() => togglePasswordVisibility(name)}
                  icon={showPassword[name] ? <ViewOffIcon /> : <ViewIcon />}
                />
              </InputRightElement>
            </InputGroup>
            {helpText && !error && <FormHelperText>{helpText}</FormHelperText>}
            <FormErrorMessage>{error}</FormErrorMessage>
          </FormControl>
        );

      case 'select':
        return (
          <FormControl key={name} isInvalid={!!error} isRequired={required} isDisabled={disabled}>
            <FormLabel htmlFor={name}>{label}</FormLabel>
            <Select
              id={name}
              name={name}
              placeholder={placeholder || "Select an option"}
              value={value || ''}
              onChange={handleChange}
            >
              {options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {helpText && !error && <FormHelperText>{helpText}</FormHelperText>}
            <FormErrorMessage>{error}</FormErrorMessage>
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControl key={name} isInvalid={!!error} isDisabled={disabled}>
            <Checkbox
              id={name}
              name={name}
              isChecked={!!value}
              onChange={handleChange}
            >
              {label} {required && <span style={{ color: 'red' }}>*</span>}
            </Checkbox>
            {helpText && !error && <FormHelperText>{helpText}</FormHelperText>}
            <FormErrorMessage>{error}</FormErrorMessage>
          </FormControl>
        );

      case 'switch':
        return (
          <FormControl key={name} isInvalid={!!error} isDisabled={disabled} display="flex" alignItems="center">
            <FormLabel htmlFor={name} mb="0">
              {label} {required && <span style={{ color: 'red' }}>*</span>}
            </FormLabel>
            <Switch
              id={name}
              isChecked={!!value}
              onChange={(e) => handleSwitchChange(name, e.target.checked)}
            />
            {helpText && !error && <FormHelperText ml={2}>{helpText}</FormHelperText>}
            <FormErrorMessage>{error}</FormErrorMessage>
          </FormControl>
        );

      case 'textarea':
        return (
          <FormControl key={name} isInvalid={!!error} isRequired={required} isDisabled={disabled}>
            <FormLabel htmlFor={name}>{label}</FormLabel>
            <Textarea
              id={name}
              name={name}
              placeholder={placeholder}
              value={value || ''}
              onChange={handleChange}
            />
            {helpText && !error && <FormHelperText>{helpText}</FormHelperText>}
            <FormErrorMessage>{error}</FormErrorMessage>
          </FormControl>
        );

      default:
        return null;
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} width="100%">
      {title && (
        <Heading size="md" mb={2}>
          {title}
        </Heading>
      )}
      {description && (
        <Text mb={4} color="gray.600">
          {description}
        </Text>
      )}

      <VStack spacing={4} align="stretch">
        {fields.map(renderField)}

        <HStack spacing={4} justify="flex-end" pt={2}>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" colorScheme="blue">
            {submitLabel}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

export default DynamicForm;