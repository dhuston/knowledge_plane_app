import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useAuth } from '../context/AuthContext'; // Adjust path if context is elsewhere
import { useMemo } from 'react';

// Define your API base URL
// Use environment variables (e.g., import.meta.env.VITE_API_BASE_URL)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

// Anti-CSRF token header
const CSRF_HEADER = 'X-CSRF-Token';

// Flag to prevent multiple concurrent refresh attempts
let isRefreshing = false;
// Array to hold pending requests while token is being refreshed
let failedQueue: Array<{ resolve: () => void; reject: (reason?: any) => void }> = [];

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

export const useApiClient = (): AxiosInstance => {
    // We still need the auth state to track if user is logged in
    const { isAuthenticated, setAuthenticated } = useAuth();

    const apiClient = useMemo(() => {
        const instance = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            // This is critical for cookies to be sent with requests
            withCredentials: true,
        });

        // Get CSRF token if needed
        const fetchCsrfToken = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/auth/csrf-token`, {
                    withCredentials: true
                });
                return response.data.csrfToken;
            } catch (error) {
                console.error("Failed to fetch CSRF token:", error);
                return null;
            }
        };

        instance.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                // For mutating requests (POST, PUT, DELETE, PATCH), add CSRF token
                const mutatingMethods = ['post', 'put', 'delete', 'patch'];
                if (mutatingMethods.includes(config.method?.toLowerCase() || '')) {
                    try {
                        const csrfToken = await fetchCsrfToken();
                        if (csrfToken && config.headers) {
                            config.headers[CSRF_HEADER] = csrfToken;
                        }
                    } catch (error) {
                        console.error("Error setting CSRF token:", error);
                    }
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Add response interceptor for handling 401 Unauthorized
        instance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

                // Check if it's a 401 error and not a retry
                if (error.response?.status === 401 && !originalRequest._retry) {
                    
                    // Prevent multiple refresh attempts simultaneously
                    if (isRefreshing) {
                        // If already refreshing, queue the original request
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

                    console.log("[API Client] Received 401, attempting session refresh...");
                    originalRequest._retry = true; // Mark as retry
                    isRefreshing = true;

                    try {
                        // Get refresh token from localStorage
                        const refreshToken = localStorage.getItem('knowledge_plane_refresh_token');
                        if (!refreshToken) {
                            throw new Error('No refresh token available');
                        }

                        // Use a basic axios instance for the refresh call to avoid interceptor loop
                        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-token`, 
                            { refresh_token: refreshToken }, 
                            { withCredentials: true }
                        );
                        
                        if (refreshResponse.status === 200) {
                            console.log("[API Client] Session refresh successful.");
                            
                            // Update the access token in localStorage
                            const newAccessToken = refreshResponse.data.access_token;
                            localStorage.setItem('knowledge_plane_token', newAccessToken);
                            
                            // User is still authenticated, update auth state
                            setAuthenticated(true);

                            // Process queue with no error
                            processQueue(null);
                            
                            // Update the Authorization header in the original request
                            if (originalRequest.headers) {
                                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                            }
                            
                            // Retry the original request
                            return instance(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error("[API Client] Session refresh failed:", refreshError);
                        
                        // Clear tokens on refresh error
                        localStorage.removeItem('knowledge_plane_token');
                        localStorage.removeItem('knowledge_plane_refresh_token');
                        
                        // User is not authenticated anymore
                        setAuthenticated(false);
                        
                        processQueue(refreshError as AxiosError);
                        return Promise.reject(refreshError);
                    } finally {
                        isRefreshing = false;
                    }
                }
                
                // For other errors, just reject
                return Promise.reject(error);
            }
        );

        return instance;
    // Include isAuthenticated in dependency array so interceptor gets the latest auth state
    }, [isAuthenticated, setAuthenticated]); 

    return apiClient;
}; 