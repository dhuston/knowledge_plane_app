/**
 * Validation utilities for ensuring data integrity and security
 */

/**
 * Validates that a string is not empty
 * @param value String to validate
 * @param fieldName Name of the field for the error message
 * @returns The original string if valid
 * @throws Error if validation fails
 */
export function validateRequired(value: string | undefined | null, fieldName: string): string {
  if (value === null || value === undefined || value.trim() === '') {
    throw new Error(`${fieldName} is required`);
  }
  return value;
}

/**
 * Validates that a string doesn't exceed maximum length
 * @param value String to validate
 * @param maxLength Maximum allowed length
 * @param fieldName Name of the field for the error message
 * @returns The original string if valid
 * @throws Error if validation fails
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): string {
  if (value && value.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength} characters`);
  }
  return value;
}

/**
 * Validates that a number is within the specified range
 * @param value Number to validate
 * @param min Minimum allowed value
 * @param max Maximum allowed value
 * @param fieldName Name of the field for the error message
 * @returns The original number if valid
 * @throws Error if validation fails
 */
export function validateRange(value: number, min: number, max: number, fieldName: string): number {
  if (value < min || value > max) {
    throw new Error(`${fieldName} must be between ${min} and ${max}`);
  }
  return value;
}

/**
 * Validates a URL string
 * @param value URL string to validate
 * @param fieldName Name of the field for the error message
 * @param allowEmpty Whether to allow empty strings
 * @returns The original URL string if valid, or undefined if empty and allowed
 * @throws Error if validation fails
 */
export function validateUrl(
  value: string | undefined | null, 
  fieldName: string,
  allowEmpty = true
): string | undefined {
  if ((value === null || value === undefined || value.trim() === '') && allowEmpty) {
    return undefined;
  }
  
  if ((value === null || value === undefined || value.trim() === '') && !allowEmpty) {
    throw new Error(`${fieldName} is required`);
  }
  
  try {
    // Check if the URL is valid by attempting to construct a URL object
    new URL(value!);
    return value!;
  } catch {
    throw new Error(`${fieldName} is not a valid URL`);
  }
}

/**
 * Validates an email string
 * @param value Email string to validate
 * @param fieldName Name of the field for the error message
 * @param allowEmpty Whether to allow empty strings
 * @returns The original email string if valid, or undefined if empty and allowed
 * @throws Error if validation fails
 */
export function validateEmail(
  value: string | undefined | null, 
  fieldName: string,
  allowEmpty = true
): string | undefined {
  if ((value === null || value === undefined || value.trim() === '') && allowEmpty) {
    return undefined;
  }
  
  if ((value === null || value === undefined || value.trim() === '') && !allowEmpty) {
    throw new Error(`${fieldName} is required`);
  }
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value!)) {
    throw new Error(`${fieldName} is not a valid email address`);
  }
  
  return value!;
}

/**
 * Sanitizes a string for safe display, removing potentially harmful content
 * @param value String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(value: string | undefined | null): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Replace potentially dangerous characters
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates an array has elements
 * @param array Array to validate
 * @param fieldName Name of the field for the error message
 * @param minLength Minimum required length (default: 1)
 * @returns The original array if valid
 * @throws Error if validation fails
 */
export function validateArrayNotEmpty<T>(
  array: T[] | undefined | null, 
  fieldName: string,
  minLength = 1
): T[] {
  if (!array || array.length < minLength) {
    throw new Error(`${fieldName} must have at least ${minLength} item(s)`);
  }
  
  return array;
}

/**
 * Validates object has required properties
 * @param obj Object to validate
 * @param requiredProps Array of property names that must exist
 * @param objectName Name of the object for the error message
 * @returns The original object if valid
 * @throws Error if validation fails
 */
export function validateRequiredProps<T extends object>(
  obj: T | undefined | null,
  requiredProps: string[],
  objectName: string
): T {
  if (!obj) {
    throw new Error(`${objectName} is required`);
  }
  
  for (const prop of requiredProps) {
    // @ts-ignore: Dynamic property access
    if (obj[prop] === undefined || obj[prop] === null) {
      throw new Error(`${objectName} is missing required property: ${prop}`);
    }
  }
  
  return obj;
}