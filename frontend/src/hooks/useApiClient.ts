import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useAuth } from '../context/AuthContext';
import { useMemo } from 'react';

// Define API base URL from environment variables
// IMPORTANT: Standardized to NOT include "/api/v1" suffix
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

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
export const useApiClient = (): AxiosInstance => {
    const { isAuthenticated, setAuthenticated } = useAuth();

    const apiClient = useMemo(() => {
        // Create a new axios instance
        const instance = axios.create({
            baseURL: `${API_BASE_URL}/api/v1`, // Always include /api/v1 in the baseURL
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true, // Critical for cookies
        });

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

        // Add CSRF token to mutating requests
        instance.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
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

        // Handle authentication errors and token refresh
        instance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

                // Only handle 401 errors that haven't been retried yet
                if (error.response?.status === 401 && !originalRequest._retry) {
                    
                    // Handle concurrent refresh attempts with queue
                    if (isRefreshing) {
                        return new Promise<void>((resolve, reject) => {
                            failedQueue.push({ resolve, reject });
                        })
                        .then(() => {
                            return instance(originalRequest);
                        })
                        .catch(err => {
                            return Promise.reject(err);
                        });
                    }

                    originalRequest._retry = true;
                    isRefreshing = true;

                    try {
                        // Get refresh token from localStorage
                        const refreshToken = localStorage.getItem('knowledge_plane_refresh_token');
                        if (!refreshToken) {
                            throw new Error('No refresh token available');
                        }

                        const refreshResponse = await axios.post(
                            `${API_BASE_URL}/api/v1/auth/refresh-token`, 
                            { refresh_token: refreshToken }, 
                            { withCredentials: true }
                        );
                        
                        if (refreshResponse.status === 200) {
                            // Update the access token in localStorage
                            const newAccessToken = refreshResponse.data.access_token;
                            localStorage.setItem('knowledge_plane_token', newAccessToken);
                            
                            // Update authentication state
                            setAuthenticated(true);

                            // Process any queued requests
                            processQueue(null);
                            
                            // Update the Authorization header
                            if (originalRequest.headers) {
                                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                            }
                            
                            // Retry the original request
                            return instance(originalRequest);
                        }
                    } catch (refreshError) {
                        // Clear tokens and authentication on refresh failure
                        localStorage.removeItem('knowledge_plane_token');
                        localStorage.removeItem('knowledge_plane_refresh_token');
                        setAuthenticated(false);
                        
                        // Process queue with error
                        processQueue(refreshError as AxiosError);
                        return Promise.reject(refreshError);
                    } finally {
                        // Always reset the refreshing flag
                        isRefreshing = false;
                    }
                }
                
                // For non-401 errors or retries that failed, just reject
                return Promise.reject(error);
            }
        );

        return instance;
    }, [isAuthenticated, setAuthenticated]);

    return apiClient;
};