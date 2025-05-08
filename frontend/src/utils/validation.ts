/**
 * Validation utilities for ensuring data integrity and security.
 * Provides standardized validation functions with consistent error handling.
 */
import { isValidUrl, UrlValidationOptions } from './url-utils';
import DOMPurify from 'dompurify';

/**
 * Validation error class for type-safe error handling
 */
export class ValidationError extends Error {
  field: string;
  type: string;
  
  constructor(message: string, field: string, type: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.type = type;
    
    // For better stack traces in modern environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

/**
 * Common validation options
 */
export interface ValidationOptions {
  required?: boolean;
  errorType?: string;
  customMessage?: string;
  fieldName: string;
}

/**
 * String validation options
 */
export interface StringValidationOptions extends ValidationOptions {
  maxLength?: number;
  pattern?: RegExp;
  trim?: boolean;
}

/**
 * Number validation options
 */
export interface NumberValidationOptions extends ValidationOptions {
  min?: number;
  max?: number;
}

/**
 * Array validation options
 */
export interface ArrayValidationOptions extends ValidationOptions {
  minLength?: number;
  maxLength?: number;
}

/**
 * Email validation regex
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates that a string is not empty
 * 
 * @param value String to validate
 * @param options Validation options
 * @returns The original string if valid
 * @throws ValidationError if validation fails
 */
export function validateRequired(
  value: string | undefined | null, 
  options: ValidationOptions
): string {
  const { fieldName, errorType = 'required', customMessage } = options;
  
  if (value === null || value === undefined || value.trim() === '') {
    throw new ValidationError(
      customMessage || `${fieldName} is required`,
      fieldName,
      errorType
    );
  }
  
  return value;
}

/**
 * Validates that a string doesn't exceed maximum length
 * 
 * @param value String to validate
 * @param options Validation options
 * @returns The original string if valid
 * @throws ValidationError if validation fails
 */
export function validateMaxLength(
  value: string,
  options: StringValidationOptions
): string {
  const { fieldName, maxLength, errorType = 'maxLength', customMessage } = options;
  
  if (maxLength !== undefined && value.length > maxLength) {
    throw new ValidationError(
      customMessage || `${fieldName} exceeds maximum length of ${maxLength} characters`,
      fieldName,
      errorType
    );
  }
  
  return value;
}

/**
 * Validates that a number is within the specified range
 * 
 * @param value Number to validate
 * @param options Validation options
 * @returns The original number if valid
 * @throws ValidationError if validation fails
 */
export function validateRange(
  value: number,
  options: NumberValidationOptions
): number {
  const { fieldName, min, max, errorType = 'range', customMessage } = options;
  
  if ((min !== undefined && value < min) || (max !== undefined && value > max)) {
    const rangeText = min !== undefined && max !== undefined
      ? `between ${min} and ${max}`
      : min !== undefined
        ? `at least ${min}`
        : `at most ${max}`;
        
    throw new ValidationError(
      customMessage || `${fieldName} must be ${rangeText}`,
      fieldName,
      errorType
    );
  }
  
  return value;
}

/**
 * Validates a URL string using the url-utils isValidUrl function
 * 
 * @param value URL string to validate
 * @param options Validation options including URL-specific options
 * @returns The original URL string if valid, or undefined if empty and allowed
 * @throws ValidationError if validation fails
 */
export function validateUrl(
  value: string | undefined | null,
  options: StringValidationOptions & { urlOptions?: UrlValidationOptions, allowEmpty?: boolean }
): string | undefined {
  const { fieldName, errorType = 'url', customMessage, required = false, allowEmpty = !required, urlOptions } = options;
  
  if ((value === null || value === undefined || value.trim() === '') && allowEmpty) {
    return undefined;
  }
  
  if ((value === null || value === undefined || value.trim() === '') && !allowEmpty) {
    throw new ValidationError(
      customMessage || `${fieldName} is required`,
      fieldName,
      'required'
    );
  }
  
  if (!isValidUrl(value!, urlOptions)) {
    throw new ValidationError(
      customMessage || `${fieldName} is not a valid URL`,
      fieldName,
      errorType
    );
  }
  
  return value!;
}

/**
 * Validates an email string
 * 
 * @param value Email string to validate
 * @param options Validation options
 * @returns The original email string if valid, or undefined if empty and allowed
 * @throws ValidationError if validation fails
 */
export function validateEmail(
  value: string | undefined | null,
  options: StringValidationOptions & { allowEmpty?: boolean }
): string | undefined {
  const { fieldName, errorType = 'email', customMessage, required = false, allowEmpty = !required } = options;
  
  if ((value === null || value === undefined || value.trim() === '') && allowEmpty) {
    return undefined;
  }
  
  if ((value === null || value === undefined || value.trim() === '') && !allowEmpty) {
    throw new ValidationError(
      customMessage || `${fieldName} is required`,
      fieldName,
      'required'
    );
  }
  
  if (!EMAIL_REGEX.test(value!)) {
    throw new ValidationError(
      customMessage || `${fieldName} is not a valid email address`,
      fieldName,
      errorType
    );
  }
  
  return value!;
}

/**
 * Sanitizes a string using DOMPurify for safe display
 * 
 * @param value String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(value: string | undefined | null): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  return DOMPurify.sanitize(value);
}

/**
 * Validates an array has elements
 * 
 * @param array Array to validate
 * @param options Validation options
 * @returns The original array if valid
 * @throws ValidationError if validation fails
 */
export function validateArrayNotEmpty<T>(
  array: T[] | undefined | null,
  options: ArrayValidationOptions
): T[] {
  const { fieldName, errorType = 'array', customMessage, minLength = 1 } = options;
  
  if (!array || array.length < minLength) {
    throw new ValidationError(
      customMessage || `${fieldName} must have at least ${minLength} item(s)`,
      fieldName,
      errorType
    );
  }
  
  return array;
}

/**
 * Validates object has required properties
 * 
 * @param obj Object to validate
 * @param options Validation options
 * @returns The original object if valid
 * @throws ValidationError if validation fails
 */
export function validateRequiredProps<T extends object>(
  obj: T | undefined | null,
  options: ValidationOptions & { requiredProps: string[] }
): T {
  const { fieldName, errorType = 'object', customMessage, requiredProps } = options;
  
  if (!obj) {
    throw new ValidationError(
      customMessage || `${fieldName} is required`,
      fieldName,
      'required'
    );
  }
  
  for (const prop of requiredProps) {
    // @ts-expect-error: Dynamic property access with string keys from requiredProps
    if (obj[prop] === undefined || obj[prop] === null) {
      throw new ValidationError(
        customMessage || `${fieldName} is missing required property: ${prop}`,
        fieldName,
        errorType
      );
    }
  }
  
  return obj;
}

/**
 * Validates a string input with common validation rules
 * Convenience function that chains multiple validations
 * 
 * @param value String to validate
 * @param options Validation options
 * @returns The validated string or undefined if empty and allowed
 * @throws ValidationError if validation fails
 */
export function validateString(
  value: string | undefined | null,
  options: StringValidationOptions & { allowEmpty?: boolean }
): string | undefined {
  const { 
    fieldName, 
    maxLength, 
    pattern,
    required = false,
    allowEmpty = !required,
    trim = true 
  } = options;
  
  // Handle empty values
  if ((value === null || value === undefined || (trim && value.trim() === '')) && allowEmpty) {
    return undefined;
  }
  
  if ((value === null || value === undefined || (trim && value.trim() === '')) && !allowEmpty) {
    throw new ValidationError(
      options.customMessage || `${fieldName} is required`,
      fieldName,
      'required'
    );
  }
  
  let validatedValue = value!;
  
  // Apply trimming if needed
  if (trim) {
    validatedValue = validatedValue.trim();
  }
  
  // Check max length if specified
  if (maxLength !== undefined && validatedValue.length > maxLength) {
    throw new ValidationError(
      options.customMessage || `${fieldName} exceeds maximum length of ${maxLength} characters`,
      fieldName,
      'maxLength'
    );
  }
  
  // Check pattern if specified
  if (pattern && !pattern.test(validatedValue)) {
    throw new ValidationError(
      options.customMessage || `${fieldName} has an invalid format`,
      fieldName,
      'format'
    );
  }
  
  return validatedValue;
}

// Organize exports by category for better discoverability
export const StringValidations = {
  validateRequired,
  validateMaxLength,
  validateString,
  validateEmail,
  validateUrl
};

export const NumberValidations = {
  validateRange
};

export const ArrayValidations = {
  validateArrayNotEmpty
};

export const ObjectValidations = {
  validateRequiredProps
};

// Export utilities for sanitization
export const Sanitization = {
  sanitizeString
};