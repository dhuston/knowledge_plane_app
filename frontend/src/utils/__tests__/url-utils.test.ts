/**
 * Unit tests for url-utils.ts
 */
import { 
  isValidUrl, 
  sanitizeUrl, 
  createSafeUrl, 
  extractHostname, 
  standardizeUrl,
  URL_PATTERN,
  RELAXED_URL_PATTERN
} from '../url-utils';

describe('URL_PATTERN', () => {
  test('should match valid URLs', () => {
    const validUrls = [
      'https://example.com',
      'http://example.com',
      'https://www.example.com',
      'http://subdomain.example.com',
      'https://example.com/path',
      'https://example.com/path/to/resource',
      'https://example.com/path?query=value',
      'https://example.com/path#fragment',
      'example.com',
      'www.example.com',
    ];

    validUrls.forEach(url => {
      expect(URL_PATTERN.test(url)).toBe(true);
    });
  });

  test('should not match invalid URLs', () => {
    const invalidUrls = [
      'not a url',
      'http:/example.com', // Missing slash
      'http:///example.com', // Too many slashes
      'http://example', // No TLD
      'file:///path/to/file', // File protocol
      'javascript:alert(1)', // JavaScript protocol
      'ftp://example.com', // FTP protocol
    ];

    invalidUrls.forEach(url => {
      expect(URL_PATTERN.test(url)).toBe(false);
    });
  });
});

describe('RELAXED_URL_PATTERN', () => {
  test('should match valid URLs with relaxed requirements', () => {
    const validUrls = [
      'https://example.com',
      'http://example.com',
      'example.com',
      'example.com/some path with spaces', // Spaces in path
      'sub_domain.example.com', // Underscore in hostname
    ];

    validUrls.forEach(url => {
      expect(RELAXED_URL_PATTERN.test(url)).toBe(true);
    });
  });
});

describe('isValidUrl', () => {
  test('should validate proper URLs', () => {
    const validUrls = [
      'https://example.com',
      'http://example.com',
      'https://www.example.com',
      'example.com',
    ];

    validUrls.forEach(url => {
      expect(isValidUrl(url)).toBe(true);
    });
  });

  test('should reject invalid URLs', () => {
    const invalidUrls = [
      '',
      'not a url',
      'ftp://example.com',
      'javascript:alert(1)',
    ];

    invalidUrls.forEach(url => {
      expect(isValidUrl(url)).toBe(false);
    });
  });

  test('should handle relative URLs based on options', () => {
    const relativeUrl = '/path/to/resource';
    
    // Default behavior - reject relative URLs
    expect(isValidUrl(relativeUrl)).toBe(false);
    
    // With allowRelative option
    expect(isValidUrl(relativeUrl, { allowRelative: true })).toBe(true);
  });

  test('should respect relaxedPattern option', () => {
    const urlWithSpaces = 'example.com/path with spaces';
    
    // Default behavior - should reject
    expect(isValidUrl(urlWithSpaces)).toBe(false);
    
    // With relaxedPattern option
    expect(isValidUrl(urlWithSpaces, { relaxedPattern: true, useUrlConstructor: false })).toBe(true);
  });

  test('should validate protocol when specified', () => {
    const ftpUrl = 'ftp://example.com';
    
    // With protocol validation
    expect(isValidUrl(ftpUrl, { validateProtocol: true })).toBe(false);
    
    // Without protocol validation (but still needs to pass regex)
    expect(isValidUrl(ftpUrl, { validateProtocol: false, relaxedPattern: true, useUrlConstructor: false })).toBe(true);
  });
});

describe('sanitizeUrl', () => {
  test('should return a safe URL with protocol when valid', () => {
    expect(sanitizeUrl('example.com')).toBe('https://example.com');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  test('should return default value for invalid URLs', () => {
    expect(sanitizeUrl('')).toBe('');
    expect(sanitizeUrl('not a url')).toBe('');
    expect(sanitizeUrl('not a url', 'https://default.com')).toBe('https://default.com');
  });

  test('should handle relative URLs based on options', () => {
    // Default behavior - treat as invalid
    expect(sanitizeUrl('/path/to/resource')).toBe('');
    
    // With allowRelative option
    expect(sanitizeUrl('/path/to/resource', '', { allowRelative: true })).toBe('/path/to/resource');
  });
});

describe('createSafeUrl', () => {
  test('should create a safe URL for linking', () => {
    expect(createSafeUrl('example.com')).toBe('https://example.com');
    expect(createSafeUrl('http://example.com')).toBe('http://example.com');
  });

  test('should return default value for invalid URLs', () => {
    expect(createSafeUrl('')).toBe('');
    expect(createSafeUrl('', 'https://default.com')).toBe('https://default.com');
    expect(createSafeUrl('not a url', 'https://default.com')).toBe('https://default.com');
  });
});

describe('extractHostname', () => {
  test('should extract hostname from URLs', () => {
    expect(extractHostname('https://example.com')).toBe('example.com');
    expect(extractHostname('http://www.example.com')).toBe('www.example.com');
    expect(extractHostname('example.com')).toBe('example.com');
    expect(extractHostname('https://subdomain.example.com/path?query=value')).toBe('subdomain.example.com');
  });

  test('should return empty string for invalid URLs', () => {
    expect(extractHostname('')).toBe('');
    expect(extractHostname('not a url')).toBe('');
  });
});

describe('standardizeUrl', () => {
  test('should standardize URLs for comparison', () => {
    expect(standardizeUrl('https://Example.com/Path')).toBe('example.com/path');
    expect(standardizeUrl('http://example.com/path')).toBe('example.com/path');
    expect(standardizeUrl('example.com/Path/')).toBe('example.com/path/');
  });

  test('should return empty string for invalid URLs', () => {
    expect(standardizeUrl('')).toBe('');
    expect(standardizeUrl('not a url')).toBe('');
  });
});