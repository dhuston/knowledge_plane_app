import { describe, it, expect } from 'vitest';
import { isValidUrl, sanitizeUrl, createSafeUrl } from './urlValidator';

describe('URL validator utilities', () => {
  describe('isValidUrl', () => {
    it('should validate URLs with http protocol', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('should validate URLs with https protocol', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should validate URLs with www and without protocol', () => {
      expect(isValidUrl('www.example.com')).toBe(true);
    });

    it('should validate URLs without www and without protocol', () => {
      expect(isValidUrl('example.com')).toBe(true);
    });

    it('should validate URLs with path', () => {
      expect(isValidUrl('example.com/path/to/resource')).toBe(true);
    });

    it('should validate URLs with query parameters', () => {
      expect(isValidUrl('example.com/search?q=test&page=1')).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(isValidUrl('')).toBe(false);
    });

    it('should reject undefined values', () => {
      expect(isValidUrl(undefined as unknown as string)).toBe(false);
    });

    it('should reject javascript: URLs', () => {
      expect(isValidUrl('javascript:alert("XSS")')).toBe(false);
    });

    it('should reject data: URLs', () => {
      expect(isValidUrl('data:text/html,<script>alert("XSS")</script>')).toBe(false);
    });

    it('should reject plaintext that resembles URLs', () => {
      expect(isValidUrl('just some text with dots.')).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should return valid URL with existing protocol unchanged', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should add https protocol to URLs without protocol', () => {
      expect(sanitizeUrl('example.com')).toBe('https://example.com');
    });

    it('should return empty string for invalid URLs', () => {
      expect(sanitizeUrl('not a url')).toBe('');
    });

    it('should return empty string for javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert("XSS")')).toBe('');
    });
  });

  describe('createSafeUrl', () => {
    it('should return sanitized URL for valid input', () => {
      expect(createSafeUrl('example.com')).toBe('https://example.com');
    });

    it('should return default URL for invalid input', () => {
      expect(createSafeUrl('invalid url', 'https://default.com')).toBe('https://default.com');
    });

    it('should return empty string for invalid input when no default is provided', () => {
      expect(createSafeUrl('invalid url')).toBe('');
    });

    it('should return default URL for empty input', () => {
      expect(createSafeUrl('', 'https://default.com')).toBe('https://default.com');
    });

    it('should return default URL for undefined input', () => {
      expect(createSafeUrl(undefined as unknown as string, 'https://default.com')).toBe('https://default.com');
    });
  });
});