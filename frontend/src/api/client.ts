// src/api/client.ts

import { 
  AppError, 
  ErrorCategory, 
  createApiError, 
  logError 
} from '../utils/errorHandling';

// Get backend API base URL from environment variable with fallback
// IMPORTANT: Standardizing across the app to use base URL WITHOUT "/api/v1" 
// This avoids path duplication issues
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.protocol === 'https:' 
  ? "https://localhost:8001" 
  : "http://localhost:8001");

/**
 * API client for making HTTP requests to the backend with enhanced error handling
 */
export const apiClient = {
    /**
     * Make a GET request to the API
     * @param endpoint - API endpoint path (without base URL)
     * @param options - Optional fetch options
     * @returns Promise with the response data
     */
    async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return await request<T>(endpoint, { ...options, method: 'GET' }, 'fetching data');
    },
    
    /**
     * Make a POST request to the API
     * @param endpoint - API endpoint path (without base URL)
     * @param body - Request body to send as JSON
     * @param options - Optional fetch options
     * @returns Promise with the response data
     */
    async post<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
        return await request<T>(endpoint, { 
            ...options, 
            method: 'POST', 
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }
        }, 'creating resource');
    },
    
    /**
     * Make a PUT request to the API
     * @param endpoint - API endpoint path (without base URL)
     * @param body - Request body to send as JSON
     * @param options - Optional fetch options
     * @returns Promise with the response data
     */
    async put<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
        return await request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }
        }, 'updating resource');
    },
    
    /**
     * Make a DELETE request to the API
     * @param endpoint - API endpoint path (without base URL)
     * @param options - Optional fetch options
     * @returns Promise with the response data
     */
    async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return await request<T>(endpoint, {
            ...options,
            method: 'DELETE'
        }, 'deleting resource');
    },
    
    /**
     * Make a PATCH request to the API
     * @param endpoint - API endpoint path (without base URL)
     * @param body - Request body to send as JSON
     * @param options - Optional fetch options
     * @returns Promise with the response data
     */
    async patch<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
        return await request<T>(endpoint, {
            ...options,
            method: 'PATCH',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }
        }, 'patching resource');
    },

    /**
     * Check if a specific API endpoint is available
     * @param endpoint - API endpoint to check
     * @returns Promise resolving to true if API is available, false otherwise
     */
    async isEndpointAvailable(endpoint: string): Promise<boolean> {
      try {
        const url = buildUrl(endpoint);
        
        // Try a GET request first (which usually has better CORS support)
        try {
          const getResponse = await fetch(url, { 
            method: 'GET', 
            cache: 'no-store',
            credentials: 'include',
            headers: { 
              'X-Availability-Check': 'true',
              'Accept': 'application/json'
            }
          });
          return getResponse.ok;
        } catch (getError) {
          // Fall back to HEAD if GET fails
          const headResponse = await fetch(url, { 
            method: 'HEAD', 
            cache: 'no-store',
            credentials: 'include',
            headers: { 
              'X-Availability-Check': 'true',
              'Accept': 'application/json'
            }
          });
          return headResponse.ok;
        }
      } catch (error) {
        console.warn(`API availability check failed for ${endpoint}:`, error);
        return false;
      }
    },

    /**
     * Check if the API is generally available (health check)
     * @returns Promise resolving to true if API is available, false otherwise
     */
    async isApiAvailable(): Promise<boolean> {
      try {
        return await this.isEndpointAvailable('/api/v1/health');
      } catch (_) {
        return false;
      }
    }
};

/**
 * Builds a full URL from API base and endpoint
 */
function buildUrl(endpoint: string): string {
    // Normalize endpoint paths
    const normalizedEndpoint = endpoint.startsWith('/api/v1') 
        ? endpoint 
        : `/api/v1${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    // Add the normalized endpoint to the base URL
    if (API_BASE_URL.endsWith('/') && normalizedEndpoint.startsWith('/')) {
        return `${API_BASE_URL}${normalizedEndpoint.substring(1)}`;
    } else if (!API_BASE_URL.endsWith('/') && !normalizedEndpoint.startsWith('/')) {
        return `${API_BASE_URL}/${normalizedEndpoint}`;
    } else {
        return `${API_BASE_URL}${normalizedEndpoint}`;
    }
}

/**
 * Enhanced request function that handles authentication, response processing, and structured error handling
 * @param endpoint - API endpoint path
 * @param options - Request options
 * @param operation - Description of the operation for error context
 * @returns Promise with the response data
 */
async function request<T>(endpoint: string, options: RequestInit, operation = 'API request'): Promise<T> {
    const url = buildUrl(endpoint);
    const headers = new Headers(options.headers || {});
    
    // Add authentication token if available
    const token = localStorage.getItem('knowledge_plane_token');
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    // Include credentials to enable cookie-based authentication
    const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include',
    };

    try {
        // Start the request with timeout handling
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 second timeout
        
        const response = await fetch(url, {
            ...config,
            signal: abortController.signal
        });
        
        clearTimeout(timeoutId);

        // Create structured error for unsuccessful responses
        if (!response.ok) {
            let errorData: any = {};
            let errorText = '';
            
            try {
                errorData = await response.json();
            } catch (_) {
                try {
                    errorText = await response.text();
                    // If response is HTML or too long, use a generic message instead
                    if (errorText.includes('<html') || errorText.length > 500) {
                        errorText = `Server returned ${response.status} ${response.statusText}`;
                    }
                } catch (_) {
                    errorText = `Server returned ${response.status} ${response.statusText}`;
                }
            }
            
            const detail = errorData?.detail || errorData?.message || errorData?.error || errorText;
            let category: ErrorCategory;
            
            // Categorize based on status code
            switch (response.status) {
                case 401:
                    category = ErrorCategory.AUTHENTICATION;
                    break;
                case 403:
                    category = ErrorCategory.AUTHORIZATION;
                    break;
                case 404:
                    category = ErrorCategory.NOT_FOUND;
                    break;
                case 422:
                    category = ErrorCategory.VALIDATION;
                    break;
                default:
                    category = response.status >= 500 
                        ? ErrorCategory.SERVER 
                        : ErrorCategory.UNKNOWN;
            }
            
            // Create structured AppError with appropriate metadata
            const appError = new AppError(
                detail || `Error ${response.status} while ${operation}`,
                category,
                { status: response.status, data: errorData }
            );
            
            // Add additional details to the error object
            appError.status = response.status;
            appError.endpoint = endpoint;
            appError.responseData = errorData;
            
            // Log the error for debugging, but without exposing sensitive information
            logError(appError, `API:${options.method || 'GET'}:${endpoint}`);
            
            throw appError;
        }

        // Handle 204 No Content responses
        if (response.status === 204) {
            return null as T;
        }

        // Parse successful responses
        try {
            const data = await response.json() as T;
            return data;
        } catch (parseError) {
            const error = new AppError(
                `Failed to parse response from ${endpoint}`, 
                ErrorCategory.SERVER,
                parseError
            );
            logError(error, 'API:JSON-parse');
            throw error;
        }
    } catch (error) {
        // Handle fetch errors (network issues, timeouts, etc.)
        if (error instanceof AppError) {
            // Re-throw AppErrors that we created above
            throw error;
        }
        
        // Convert other errors to AppError with appropriate categorization
        if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
            throw new AppError(
                `Network error while ${operation}: The server may be unavailable`,
                ErrorCategory.NETWORK,
                error
            );
        }
        
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new AppError(
                `Request timeout while ${operation}`,
                ErrorCategory.NETWORK,
                error
            );
        }
        
        // Generic error handling for other cases
        throw createApiError(error, operation);
    }
}

// Add error handling types to AppError
declare module '../utils/errorHandling' {
    interface AppError {
        status?: number;
        endpoint?: string;
        responseData?: any;
    }
} 