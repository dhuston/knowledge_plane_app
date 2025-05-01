import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { useAuth } from '../context/AuthContext'; // Adjust path if context is elsewhere
import { useMemo } from 'react';

// Define your API base URL
// Use environment variables (e.g., import.meta.env.VITE_API_BASE_URL)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';

// Define keys for localStorage (consistent with AuthContext)
const ACCESS_TOKEN_KEY = 'knowledge_plane_token';
const REFRESH_TOKEN_KEY = 'knowledge_plane_refresh_token';

// Flag to prevent multiple concurrent refresh attempts
let isRefreshing = false;
// Array to hold pending requests while token is being refreshed
let failedQueue: Array<{ resolve: (value: string | null) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const useApiClient = (): AxiosInstance => {
    // Need setToken from useAuth to update tokens after refresh
    const { token, setToken } = useAuth();

    const apiClient = useMemo(() => {
        const instance = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        instance.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);
                if (currentToken) {
                    // Ensure headers object exists
                    if (!config.headers) {
                        config.headers = new axios.AxiosHeaders(); // Initialize properly
                    }
                    config.headers.Authorization = `Bearer ${currentToken}`;
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
                        return new Promise<string | null>((resolve, reject) => {
                            failedQueue.push({ resolve, reject });
                        })
                        .then(newToken => {
                            if (originalRequest.headers) {
                                originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
                            }
                            return instance(originalRequest);
                        })
                        .catch(err => {
                            return Promise.reject(err);
                        });
                    }

                    console.log("[API Client] Received 401, attempting token refresh...");
                    originalRequest._retry = true; // Mark as retry
                    isRefreshing = true;

                    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

                    if (!refreshToken) {
                        console.error("[API Client] No refresh token found. Logging out.");
                        setToken(null, null); // Clear tokens and trigger logout via AuthContext
                        isRefreshing = false;
                        processQueue(error, null); // Reject queued requests with null token
                        return Promise.reject(error);
                    }

                    try {
                        // Use a basic axios instance for the refresh call to avoid interceptor loop
                        const refreshResponse = await axios.post<{ access_token: string }>(`${API_BASE_URL}/auth/refresh-token`, {
                            refresh_token: refreshToken
                        });
                        
                        const newAccessToken = refreshResponse.data.access_token;
                        console.log("[API Client] Token refresh successful.");
                        
                        // Update tokens using setToken from AuthContext
                        setToken(newAccessToken, refreshToken); // Keep the same refresh token for now

                        // Update the header of the original request
                        if (originalRequest.headers) {
                           originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                        }
                        
                        processQueue(null, newAccessToken); // Process queue with new token
                        return instance(originalRequest); // Retry the original request
                    } catch (refreshError) {
                        console.error("[API Client] Token refresh failed:", refreshError);
                        setToken(null, null); // Clear tokens on refresh failure
                        processQueue(refreshError as AxiosError, null); // Reject queue with null token
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
    // Include setToken in dependency array so interceptor gets the latest version
    }, [token, setToken]); 

    return apiClient;
}; 