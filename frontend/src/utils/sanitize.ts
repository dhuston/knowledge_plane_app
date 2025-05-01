/**
 * sanitize.ts
 * Utility functions for sanitizing user input to prevent XSS attacks
 */
import DOMPurify from 'dompurify';

// URL validation regex - same as in SafeMarkdown component
export const URL_PATTERN = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

/**
 * Sanitizes a string to prevent XSS attacks
 */
export const sanitizeString = (input: string): string => {
  return DOMPurify.sanitize(input);
};

/**
 * Validates a URL string
 * @returns True if URL is valid, false otherwise
 */
export const isValidUrl = (url: string): boolean => {
  return URL_PATTERN.test(url);
};

/**
 * Sanitizes a URL - returns the URL if valid, empty string otherwise
 */
export const sanitizeUrl = (url: string): string => {
  return isValidUrl(url) ? url : '';
};

/**
 * Sanitizes an object by sanitizing all string properties
 * This is useful for sanitizing form input objects
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const result: Record<string, any> = {};

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
  sanitizeUrl,
  sanitizeObject,
  isValidUrl
};