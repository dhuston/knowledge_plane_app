import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuth } from '../context/AuthContext'; // Adjust path if context is elsewhere
import { useMemo } from 'react';

// Define your API base URL
// TODO: Use environment variables (e.g., import.meta.env.VITE_API_BASE_URL)
const API_BASE_URL = 'http://localhost:8001/api/v1';

export const useApiClient = (): AxiosInstance => {
    const { token } = useAuth();

    // Use useMemo to create the Axios instance only when the token changes
    const apiClient = useMemo(() => {
        const instance = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add a request interceptor to include the auth token if it exists
        instance.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                // Handle request error
                return Promise.reject(error);
            }
        );

        // Optional: Add response interceptor for handling common errors (e.g., 401 Unauthorized)
        // instance.interceptors.response.use(
        //     (response) => response,
        //     (error) => {
        //         if (error.response && error.response.status === 401) {
        //             // Handle unauthorized access, maybe redirect to login
        //             console.error("Unauthorized access - 401");
        //             // Potentially call logout() from useAuth here
        //         }
        //         return Promise.reject(error);
        //     }
        // );

        return instance;
    }, [token]); // Dependency array ensures instance is recreated if token changes

    return apiClient;
}; 