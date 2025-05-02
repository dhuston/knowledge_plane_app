import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import axios from 'axios';
import useApiClient from './useApiClient';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

// Mock async state updates for hooks
const waitFor = async (callback: () => boolean, timeout = 1000) => {
  const start = Date.now();
  while (!callback()) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
};

describe('useApiClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Setup mocks
    mockedAxios.get = vi.fn();
    mockedAxios.post = vi.fn();
    mockedAxios.put = vi.fn();
    mockedAxios.delete = vi.fn();
  });

  it('should initialize with loading false and no error', () => {
    const { result } = renderHook(() => useApiClient());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should make a GET request successfully', async () => {
    const mockData = { id: 1, name: 'Test Data' };
    mockedAxios.get.mockResolvedValue({ data: mockData });
    
    const { result } = renderHook(() => useApiClient());
    
    const responsePromise = result.current.get('/test-endpoint');
    
    expect(result.current.loading).toBe(true);
    
    // Wait for state update
    await waitFor(() => !result.current.loading);
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    
    const response = await responsePromise;
    expect(response).toEqual(mockData);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/test-endpoint', expect.any(Object));
  });

  it('should make a POST request successfully', async () => {
    const postData = { name: 'New Item' };
    const mockResponse = { id: 1, name: 'New Item' };
    mockedAxios.post.mockResolvedValue({ data: mockResponse });
    
    const { result } = renderHook(() => useApiClient());
    
    const responsePromise = result.current.post('/test-endpoint', postData);
    
    expect(result.current.loading).toBe(true);
    
    // Wait for state update
    await waitFor(() => !result.current.loading);
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    
    const response = await responsePromise;
    expect(response).toEqual(mockResponse);
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/test-endpoint', postData, expect.any(Object));
  });

  it('should make a PUT request successfully', async () => {
    const putData = { id: 1, name: 'Updated Item' };
    const mockResponse = { id: 1, name: 'Updated Item' };
    mockedAxios.put.mockResolvedValue({ data: mockResponse });
    
    const { result } = renderHook(() => useApiClient());
    
    const responsePromise = result.current.put('/test-endpoint/1', putData);
    
    // Wait for state update
    await waitFor(() => !result.current.loading);
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    
    const response = await responsePromise;
    expect(response).toEqual(mockResponse);
    expect(mockedAxios.put).toHaveBeenCalledWith('/api/test-endpoint/1', putData, expect.any(Object));
  });

  it('should make a DELETE request successfully', async () => {
    const mockResponse = { success: true };
    mockedAxios.delete.mockResolvedValue({ data: mockResponse });
    
    const { result } = renderHook(() => useApiClient());
    
    const responsePromise = result.current.delete('/test-endpoint/1');
    
    // Wait for state update
    await waitFor(() => !result.current.loading);
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    
    const response = await responsePromise;
    expect(response).toEqual(mockResponse);
    expect(mockedAxios.delete).toHaveBeenCalledWith('/api/test-endpoint/1', expect.any(Object));
  });

  it('should handle request errors', async () => {
    const error = new Error('Network Error');
    mockedAxios.get.mockRejectedValue(error);
    
    const { result } = renderHook(() => useApiClient());
    
    const responsePromise = result.current.get('/test-endpoint').catch(e => e);
    
    // Wait for state update
    await waitFor(() => !result.current.loading);
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    
    const response = await responsePromise;
    expect(response).toBe(error);
  });

  it('should reset error state on new request', async () => {
    // First, cause an error
    const error = new Error('Network Error');
    mockedAxios.get.mockRejectedValueOnce(error);
    
    const { result } = renderHook(() => useApiClient());
    
    // Make request that will error
    result.current.get('/error-endpoint').catch(() => {});
    
    // Wait for state update
    await waitFor(() => !result.current.loading);
    
    expect(result.current.error).toBe(error);
    
    // Now make a successful request
    const mockData = { success: true };
    mockedAxios.get.mockResolvedValueOnce({ data: mockData });
    
    // Start new request
    result.current.get('/success-endpoint');
    
    // Error should be reset at start of new request
    expect(result.current.error).toBeNull();
  });
});