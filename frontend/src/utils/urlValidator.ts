/**
 * urlValidator.ts
 * Utility functions for URL validation and sanitization
 */

// Simpler URL validation regex but still comprehensive
export const URL_PATTERN = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

// List of allowed protocols
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Checks if a URL is valid
 * @param url URL to validate
 * @returns True if URL is valid, false otherwise
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;

  try {
    // First check with regex
    if (!URL_PATTERN.test(url)) {
      return false;
    }

    // Then use URL constructor for additional validation
    const parsedUrl = new URL(url.startsWith('http') ? url : `http://${url}`);
    
    // Check protocol is allowed
    return ALLOWED_PROTOCOLS.includes(parsedUrl.protocol);
  } catch (error) {
    return false;
  }
};

/**
 * Ensures a URL is safe to use
 * @param url URL to sanitize
 * @returns Safe URL or empty string if invalid
 */
export const sanitizeUrl = (url: string): string => {
  // Check if URL is valid
  if (!isValidUrl(url)) {
    return '';
  }

  // Make sure URL has a protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url;
};

/**
 * Creates a safe URL for navigation
 * Ensures URL has a proper protocol and is from an allowed list
 */
export function createSafeUrl(url: string, defaultUrl: string = ''): string {
  if (!url) return defaultUrl;
  
  const sanitized = sanitizeUrl(url);
  return sanitized || defaultUrl;
}

export default {
  isValidUrl,
  sanitizeUrl,
  createSafeUrl
};