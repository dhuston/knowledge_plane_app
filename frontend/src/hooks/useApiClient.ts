import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useAuth } from '../auth/AuthContext';
import { tokenManager } from '../auth/TokenManager';
import { useMemo } from 'react';
import { API_BASE_URL } from '../config/env';

// Anti-CSRF token header
const CSRF_HEADER = 'X-CSRF-Token';

// Flag to prevent multiple concurrent refresh attempts
let isRefreshing = false;
// Array to hold pending requests while token is being refreshed
let failedQueue: Array<{ resolve: () => void; reject: (reason?: any) => void }> = [];

/**
 * Process the queue of failed requests after token refresh
 * @param error - Error from token refresh, if any
 */
const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Hook that provides an authenticated axios instance for API requests
 * @returns Axios instance configured for API requests with auth
 */
// Extend the AxiosInstance type to include our custom methods
interface EnhancedAxiosInstance extends AxiosInstance {
    isApiAvailable(): Promise<boolean>;
}

export const useApiClient = (): EnhancedAxiosInstance => {
    // Get just the authentication status from context
    const { isAuthenticated } = useAuth();

    const apiClient = useMemo(() => {
        // Create a new axios instance
        const instance = axios.create({
            baseURL: `${API_BASE_URL}/api/v1`, // Always include /api/v1 in the baseURL
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true, // Critical for cookies
        });
        
        // Add isApiAvailable method to check if the API is available
        const augmentedInstance: any = instance;
        augmentedInstance.isApiAvailable = async (): Promise<boolean> => {
            try {
                // Check if the health endpoint is available
                const response = await axios.get(`${API_BASE_URL}/api/v1/health`, { 
                    timeout: 3000,
                    validateStatus: (status) => status < 500 // Accept any non-server error
                });
                return response.status < 400; // Any 2xx or 3xx status is OK
            } catch (error) {
                console.error('API availability check failed:', error);
                return false;
            }
        };

        /**
         * Fetch CSRF token from the server
         * @returns CSRF token string or null if fetch fails
         */
        const fetchCsrfToken = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/v1/auth/csrf-token`, {
                    withCredentials: true
                });
                return response.data.csrfToken;
            } catch (error) {
                return null;
            }
        };

        // Add authentication headers and CSRF token to requests
        instance.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                // Add authentication token to all requests using TokenManager
                const token = tokenManager.getToken();
                
                // Enhanced debugging for token
                console.debug('[ApiClient] Token Diagnostics:', {
                    hasToken: !!token,
                    tokenLength: token ? token.length : 0,
                    tokenPrefix: token ? token.substring(0, 10) + '...' : null,
                    tokenStorage: 'Using TokenManager.getToken()',
                    url: config.url
                });
                
                if (token && config.headers) {
                    config.headers['Authorization'] = `Bearer ${token}`;
                    
                    // Add tenant ID header from token if available
                    try {
                        const tokenPayload = tokenManager.parseToken(token);
                        console.debug('[ApiClient] Token payload:', {
                            hasPayload: !!tokenPayload,
                            subject: tokenPayload?.sub,
                            tenantId: tokenPayload?.tenant_id,
                            expiration: tokenPayload?.exp ? new Date(tokenPayload.exp * 1000).toISOString() : null,
                            isExpired: tokenPayload?.exp ? (Date.now() / 1000) > tokenPayload.exp : null
                        });
                        
                        if (tokenPayload && tokenPayload.tenant_id) {
                            config.headers['x-tenant-id'] = tokenPayload.tenant_id;
                        }
                    } catch (e) {
                        console.warn('[ApiClient] Failed to parse token for tenant ID', e);
                    }
                    
                    // Log for debugging
                    console.log('[ApiClient] Added auth headers successfully', {
                        url: config.url,
                        method: config.method,
                        authHeader: `Bearer ${token.substring(0, 10)}...`
                    });
                } else {
                    console.warn('[ApiClient] No token available for request', {
                        url: config.url,
                        method: config.method
                    });
                }
                
                // Only add CSRF token to mutating methods
                const mutatingMethods = ['post', 'put', 'delete', 'patch'];
                if (mutatingMethods.includes(config.method?.toLowerCase() || '')) {
                    try {
                        const csrfToken = await fetchCsrfToken();
                        if (csrfToken && config.headers) {
                            config.headers[CSRF_HEADER] = csrfToken;
                        }
                    } catch (error) {
                        // Continue with request even if CSRF fetch fails
                    }
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Handle authentication errors with improved error handling
        instance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

                // Log detailed error information
                console.error('[ApiClient] Request failed', {
                    url: originalRequest.url,
                    method: originalRequest.method,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    message: error.message
                });

                // For all errors, including 401s, simply reject with the original error
                // This avoids complex token refresh logic that might cause issues
                return Promise.reject(error);
            }
        );

        return augmentedInstance as EnhancedAxiosInstance;
    }, [isAuthenticated]);

    return apiClient;
};