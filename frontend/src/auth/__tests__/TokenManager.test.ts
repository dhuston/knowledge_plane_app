import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenManager } from '../TokenManager';

describe('TokenManager', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => {
        return store[key] || null;
      }),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();

  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // Clear storage before each test
    localStorageMock.clear();
    
    // Reset mocks
    vi.clearAllMocks();
  });

  it('stores token successfully', () => {
    const tokenManager = new TokenManager();
    const testToken = 'test.jwt.token';
    
    tokenManager.storeToken(testToken);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', testToken);
  });

  it('retrieves stored token', () => {
    const tokenManager = new TokenManager();
    const testToken = 'test.jwt.token';
    
    // Store token
    localStorageMock.setItem('access_token', testToken);
    
    // Retrieve token
    const retrievedToken = tokenManager.getToken();
    
    expect(retrievedToken).toBe(testToken);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('access_token');
  });

  it('returns null when token not found', () => {
    const tokenManager = new TokenManager();
    
    const retrievedToken = tokenManager.getToken();
    
    expect(retrievedToken).toBeNull();
    expect(localStorageMock.getItem).toHaveBeenCalledWith('access_token');
  });

  it('removes token successfully', () => {
    const tokenManager = new TokenManager();
    const testToken = 'test.jwt.token';
    
    // Store token first
    localStorageMock.setItem('access_token', testToken);
    
    // Remove token
    tokenManager.removeToken();
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
    expect(tokenManager.getToken()).toBeNull();
  });

  it('parses token payload correctly', () => {
    const tokenManager = new TokenManager();
    // Sample JWT token with known payload
    // Payload: { "sub": "1234567890", "name": "Test User", "iat": 1516239022 }
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    
    const payload = tokenManager.parseToken(testToken);
    
    expect(payload).toEqual({
      sub: '1234567890',
      name: 'Test User',
      iat: 1516239022
    });
  });

  it('returns null for invalid token when parsing', () => {
    const tokenManager = new TokenManager();
    const invalidToken = 'invalid.token.format';
    
    const payload = tokenManager.parseToken(invalidToken);
    
    expect(payload).toBeNull();
  });

  it('handles localStorage errors when storing token', () => {
    const tokenManager = new TokenManager();
    const testToken = 'test.jwt.token';
    
    // Mock implementation to throw error
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error('Storage error');
    });
    
    // This should not throw error outside
    expect(() => tokenManager.storeToken(testToken)).not.toThrow();
  });

  it('handles localStorage errors when retrieving token', () => {
    const tokenManager = new TokenManager();
    
    // Mock implementation to throw error
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error('Storage error');
    });
    
    const retrievedToken = tokenManager.getToken();
    
    expect(retrievedToken).toBeNull();
  });
});