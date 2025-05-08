/**
 * url-utils.ts
 * Unified utilities for URL validation, sanitization, and manipulation.
 */

import DOMPurify from 'dompurify';

/**
 * Comprehensive URL pattern that matches most valid URLs
 * Combines approaches from different implementations in the codebase
 */
export const URL_PATTERN = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

/**
 * More permissive URL pattern for internal use cases
 * Used in cases where simple path-like strings are acceptable
 */
export const RELAXED_URL_PATTERN = /^(https?:\/\/)?([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z0-9]([a-z0-9-]*[a-z0-9])?([/\\w .-]*)*\/?$/i;

/**
 * List of allowed protocols
 */
export const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Validation options for URL checks
 */
export interface UrlValidationOptions {
  /**
   * Whether to use URL constructor for validation in addition to regex
   * This provides more thorough validation but may reject some valid-looking URLs
   */
  useUrlConstructor?: boolean;

  /**
   * Whether to use a more relaxed pattern for validation
   * This is more permissive and may accept some malformed URLs
   */
  relaxedPattern?: boolean;

  /**
   * Whether to validate protocol against allowed protocols list
   */
  validateProtocol?: boolean;

  /**
   * Whether to accept relative URLs (starting with '/')
   */
  allowRelative?: boolean;
}

/**
 * Default validation options
 */
export const DEFAULT_VALIDATION_OPTIONS: UrlValidationOptions = {
  useUrlConstructor: true,
  relaxedPattern: false,
  validateProtocol: true,
  allowRelative: false,
};

/**
 * Checks if a URL is valid using configurable validation strategies
 * 
 * @param url URL to validate
 * @param options Validation options
 * @returns True if URL is valid, false otherwise
 */
export const isValidUrl = (url: string, options: UrlValidationOptions = DEFAULT_VALIDATION_OPTIONS): boolean => {
  // Handle empty values
  if (!url) return false;
  
  // Handle relative URLs if allowed
  if (options.allowRelative && url.startsWith('/')) return true;
  
  // Step 1: Regex pattern validation
  const pattern = options.relaxedPattern ? RELAXED_URL_PATTERN : URL_PATTERN;
  if (!pattern.test(url)) {
    return false;
  }
  
  // Step 2: Optional URL constructor validation
  if (options.useUrlConstructor) {
    try {
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      
      // Step 3: Optional protocol validation
      if (options.validateProtocol && !ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
  
  return true;
};

/**
 * Sanitizes a URL to make it safe for use
 * 
 * @param url URL to sanitize
 * @param defaultUrl Default URL to return if input is invalid (default: '')
 * @param options Validation options
 * @returns Safe URL or default value if invalid
 */
export const sanitizeUrl = (url: string, defaultUrl: string = '', options: UrlValidationOptions = DEFAULT_VALIDATION_OPTIONS): string => {
  // Check if URL is empty or invalid
  if (!url || !isValidUrl(url, options)) {
    return defaultUrl;
  }

  // Handle relative URLs if allowed
  if (options.allowRelative && url.startsWith('/')) {
    return url;
  }

  // Ensure URL has a protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url;
};

/**
 * Creates a safe URL for navigation or linking
 * Ensures URL has a proper protocol and is valid
 * 
 * @param url URL to process
 * @param defaultUrl Default URL to return if input is invalid (default: '')
 * @returns Safe URL for navigation or defaultUrl if invalid
 */
export const createSafeUrl = (url: string, defaultUrl: string = ''): string => {
  if (!url) return defaultUrl;
  
  return sanitizeUrl(url, defaultUrl);
};

/**
 * Sanitizes a URL using DOMPurify
 * This provides additional protection against XSS attacks
 * 
 * @param url URL to sanitize
 * @returns Sanitized URL
 */
export const sanitizeUrlWithDOMPurify = (url: string): string => {
  if (!url) return '';
  
  return DOMPurify.sanitize(url);
};

/**
 * Extracts the hostname from a URL
 * 
 * @param url URL to process
 * @returns Hostname or empty string if invalid
 */
export const extractHostname = (url: string): string => {
  try {
    if (!url) return '';
    
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch (error) {
    return '';
  }
};

/**
 * Standardizes URL for comparison
 * 
 * @param url URL to standardize
 * @returns Standardized URL or empty string if invalid
 */
export const standardizeUrl = (url: string): string => {
  try {
    if (!url) return '';
    
    // Parse URL
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    
    // Create standardized form
    return `${urlObj.hostname}${urlObj.pathname}`.toLowerCase();
  } catch (error) {
    return '';
  }
};

export default {
  isValidUrl,
  sanitizeUrl,
  createSafeUrl,
  sanitizeUrlWithDOMPurify,
  extractHostname,
  standardizeUrl,
  URL_PATTERN,
  RELAXED_URL_PATTERN,
  ALLOWED_PROTOCOLS
};