import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import axios from 'axios';
import { AuthClient } from '../AuthClient';
import { TokenManager } from '../TokenManager';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as unknown as {
  create: ReturnType<typeof vi.fn>;
  interceptors: {
    request: { use: ReturnType<typeof vi.fn> };
    response: { use: ReturnType<typeof vi.fn> };
  };
  post: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

// Mock TokenManager
vi.mock('../TokenManager');
const MockedTokenManager = TokenManager as unknown as {
  new (): {
    getToken: ReturnType<typeof vi.fn>;
    storeToken: ReturnType<typeof vi.fn>;
    removeToken: ReturnType<typeof vi.fn>;
    parseToken: ReturnType<typeof vi.fn>;
  };
};

describe('AuthClient', () => {
  let authClient: AuthClient;
  let tokenManager: {
    getToken: ReturnType<typeof vi.fn>;
    storeToken: ReturnType<typeof vi.fn>;
    removeToken: ReturnType<typeof vi.fn>;
    parseToken: ReturnType<typeof vi.fn>;
  };
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Setup TokenManager mock
    tokenManager = {
      getToken: vi.fn().mockReturnValue('test-token'),
      storeToken: vi.fn(),
      removeToken: vi.fn(),
      parseToken: vi.fn()
    };
    
    // Setup axios mock
    mockedAxios.create = vi.fn(() => mockedAxios);
    mockedAxios.interceptors = {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    };
    
    // Create AuthClient instance
    authClient = new AuthClient('/api/v1');
    
    // Replace the private tokenManager with our mock
    Object.defineProperty(authClient, 'tokenManager', {
      value: tokenManager,
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct base URL', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: '/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('sets up request interceptor for auth token', () => {
    expect(mockedAxios.interceptors.request.use).toHaveBeenCalled();
  });

  it('login sends correct request and handles successful response', async () => {
    // Setup mock response
    const mockResponse = {
      data: {
        access_token: 'new-token',
        token_type: 'bearer'
      }
    };
    mockedAxios.post = vi.fn().mockResolvedValueOnce(mockResponse);

    // Call login method
    const credentials = { email: 'test@example.com', password: 'password' };
    const result = await authClient.login(credentials);

    // Verify request
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/simple-auth/login',
      new URLSearchParams({
        username: credentials.email,
        password: credentials.password
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Verify token storage
    expect(tokenManager.storeToken).toHaveBeenCalledWith('new-token');

    // Verify result
    expect(result).toEqual({
      success: true,
      token: 'new-token'
    });
  });

  it('login handles error response', async () => {
    // Setup mock error
    const mockError = {
      response: {
        status: 401,
        data: {
          detail: 'Incorrect email or password'
        }
      }
    };
    mockedAxios.post = vi.fn().mockRejectedValueOnce(mockError);

    // Call login method
    const credentials = { email: 'test@example.com', password: 'wrong-password' };
    const result = await authClient.login(credentials);

    // Verify result includes error message
    expect(result).toEqual({
      success: false,
      error: 'Incorrect email or password'
    });
  });

  it('demoLogin sends correct request and handles successful response', async () => {
    // Setup mock response
    const mockResponse = {
      data: {
        access_token: 'demo-token',
        token_type: 'bearer'
      }
    };
    mockedAxios.post = vi.fn().mockResolvedValueOnce(mockResponse);

    // Call demoLogin method
    const tenantId = '123e4567-e89b-12d3-a456-426614174000';
    const result = await authClient.demoLogin(tenantId);

    // Verify request
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/simple-auth/demo-login',
      { tenant_id: tenantId }
    );

    // Verify token storage
    expect(tokenManager.storeToken).toHaveBeenCalledWith('demo-token');

    // Verify result
    expect(result).toEqual({
      success: true,
      token: 'demo-token'
    });
  });

  it('demoLogin handles error response', async () => {
    // Setup mock error
    const mockError = {
      response: {
        status: 404,
        data: {
          detail: 'Tenant not found'
        }
      }
    };
    mockedAxios.post = vi.fn().mockRejectedValueOnce(mockError);

    // Call demoLogin method
    const tenantId = 'invalid-tenant-id';
    const result = await authClient.demoLogin(tenantId);

    // Verify result includes error message
    expect(result).toEqual({
      success: false,
      error: 'Tenant not found'
    });
  });

  it('getCurrentUser retrieves user data successfully', async () => {
    // Setup mock user data
    const mockUserData = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      name: 'Test User',
      tenant_id: '123e4567-e89b-12d3-a456-426614174001'
    };
    
    // Setup mock response
    const mockResponse = {
      data: mockUserData
    };
    mockedAxios.get = vi.fn().mockResolvedValueOnce(mockResponse);

    // Call getCurrentUser method
    const result = await authClient.getCurrentUser();

    // Verify request
    expect(mockedAxios.get).toHaveBeenCalledWith('/simple-auth/me');

    // Verify result
    expect(result).toEqual({
      success: true,
      user: mockUserData
    });
  });

  it('getCurrentUser handles error response', async () => {
    // Setup mock error
    const mockError = {
      response: {
        status: 401,
        data: {
          detail: 'Not authenticated'
        }
      }
    };
    mockedAxios.get = vi.fn().mockRejectedValueOnce(mockError);

    // Call getCurrentUser method
    const result = await authClient.getCurrentUser();

    // Verify result includes error message
    expect(result).toEqual({
      success: false,
      error: 'Not authenticated'
    });
  });

  it('logout calls API and clears token', async () => {
    // Setup mock response
    const mockResponse = {
      data: {
        message: 'Successfully logged out'
      }
    };
    mockedAxios.post = vi.fn().mockResolvedValueOnce(mockResponse);

    // Call logout method
    const result = await authClient.logout();

    // Verify request
    expect(mockedAxios.post).toHaveBeenCalledWith('/simple-auth/logout');

    // Verify token removal
    expect(tokenManager.removeToken).toHaveBeenCalled();

    // Verify result
    expect(result).toEqual({
      success: true
    });
  });

  it('logout handles error', async () => {
    // Setup mock error
    const mockError = {
      response: {
        status: 500,
        data: {
          detail: 'Internal server error'
        }
      }
    };
    mockedAxios.post = vi.fn().mockRejectedValueOnce(mockError);

    // Call logout method
    const result = await authClient.logout();

    // Verify token removal still happens even on API error
    expect(tokenManager.removeToken).toHaveBeenCalled();

    // Verify result
    expect(result).toEqual({
      success: true
    });
  });

  it('request interceptor adds auth header when token exists', () => {
    // Extract the interceptor function from the mock calls
    const requestInterceptor = mockedAxios.interceptors.request.use.mock.calls[0][0];
    
    // Create a mock request config
    const mockConfig = {
      headers: {}
    };
    
    // Call the interceptor function
    const result = requestInterceptor(mockConfig);
    
    // Verify the token was added to headers
    expect(result.headers).toEqual({
      'Authorization': 'Bearer test-token'
    });
  });

  it('request interceptor does not modify headers when no token exists', () => {
    // Setup token manager to return null
    tokenManager.getToken = vi.fn().mockReturnValueOnce(null);
    
    // Extract the interceptor function from the mock calls
    const requestInterceptor = mockedAxios.interceptors.request.use.mock.calls[0][0];
    
    // Create a mock request config
    const mockConfig = {
      headers: {}
    };
    
    // Call the interceptor function
    const result = requestInterceptor(mockConfig);
    
    // Verify the headers were not modified
    expect(result.headers).toEqual({});
  });
});