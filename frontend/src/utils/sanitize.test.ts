import { describe, it, expect } from 'vitest';
import { sanitizeString, sanitizeUrl, sanitizeObject, isValidUrl } from './sanitize';

describe('sanitize utilities', () => {
  describe('sanitizeString', () => {
    it('should sanitize HTML in strings', () => {
      const dirtyString = '<script>alert("XSS")</script>Hello';
      expect(sanitizeString(dirtyString)).toBe('Hello');
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('should handle plain strings without HTML', () => {
      const plainString = 'Just a regular string';
      expect(sanitizeString(plainString)).toBe(plainString);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs with http', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('should validate correct URLs with https', () => {
      expect(isValidUrl('https://example.com/path')).toBe(true);
    });

    it('should validate correct URLs without protocol', () => {
      expect(isValidUrl('example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
    });

    it('should reject script URLs', () => {
      expect(isValidUrl('javascript:alert("XSS")')).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should return valid URLs unchanged', () => {
      const validUrl = 'https://example.com';
      expect(sanitizeUrl(validUrl)).toBe(validUrl);
    });

    it('should return empty string for invalid URLs', () => {
      expect(sanitizeUrl('javascript:alert("XSS")')).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string properties in an object', () => {
      const dirtyObject = {
        name: '<script>alert("XSS")</script>Name',
        description: '<img src="x" onerror="alert(1)">Description',
        count: 42,
        valid: true
      };

      const sanitized = sanitizeObject(dirtyObject);
      expect(sanitized.name).toBe('Name');
      expect(sanitized.description).toBe('Description');
      expect(sanitized.count).toBe(42);
      expect(sanitized.valid).toBe(true);
    });

    it('should sanitize nested objects', () => {
      const dirtyObject = {
        user: {
          name: '<script>alert("XSS")</script>Name',
          profile: {
            bio: '<img src="x" onerror="alert(1)">Bio'
          }
        }
      };

      const sanitized = sanitizeObject(dirtyObject);
      expect(sanitized.user.name).toBe('Name');
      expect(sanitized.user.profile.bio).toBe('Bio');
    });

    it('should handle empty objects', () => {
      expect(sanitizeObject({})).toEqual({});
    });
  });
});