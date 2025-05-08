/**
 * sanitize.ts
 * Utility functions for sanitizing user input to prevent XSS attacks
 */
import DOMPurify from 'dompurify';

/**
 * Sanitizes a string to prevent XSS attacks
 */
export const sanitizeString = (input: string): string => {
  return DOMPurify.sanitize(input);
};

/**
 * Sanitizes an object by sanitizing all string properties
 * This is useful for sanitizing form input objects
 */
export const sanitizeObject = <T extends Record<string, unknown>>(obj: T): T => {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
};

export default {
  sanitizeString,
  sanitizeObject
};