// src/api/client.ts

// Get backend API base URL from environment variable with fallback
// IMPORTANT: Standardizing across the app to use base URL WITHOUT "/api/v1" 
// This avoids path duplication issues
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.protocol === 'https:' 
  ? "https://localhost:8001" 
  : "http://localhost:8001");
  
console.log(`API base URL: ${API_BASE_URL}`);

/**
 * API client for making HTTP requests to the backend
 */
export const apiClient = {
    /**
     * Make a GET request to the API
     * @param endpoint - API endpoint path (without base URL)
     * @param options - Optional fetch options
     * @returns Promise with the response data
     */
    async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return await request<T>(endpoint, { ...options, method: 'GET' });
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
        });
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
        });
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
        });
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
        });
    }
};

/**
 * Main request function that handles authentication and response processing
 * @param endpoint - API endpoint path
 * @param options - Request options
 * @returns Promise with the response data
 */
async function request<T>(endpoint: string, options: RequestInit): Promise<T> {
    // Normalize endpoint paths to ensure they work with the API base URL
    let url = '';

    // NEW IMPLEMENTATION: Simply ensure the endpoint always begins with /api/v1
    // since we've standardized API_BASE_URL to NOT include this prefix
    const normalizedEndpoint = endpoint.startsWith('/api/v1') 
        ? endpoint 
        : `/api/v1${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    // Add the normalized endpoint to the base URL
    if (API_BASE_URL.endsWith('/') && normalizedEndpoint.startsWith('/')) {
        url = `${API_BASE_URL}${normalizedEndpoint.substring(1)}`;
    } else if (!API_BASE_URL.endsWith('/') && !normalizedEndpoint.startsWith('/')) {
        url = `${API_BASE_URL}/${normalizedEndpoint}`;
    } else {
        url = `${API_BASE_URL}${normalizedEndpoint}`;
    }
    
    console.log(`Making API request to: ${url}`);
    
    const headers = new Headers(options.headers || {});
    
    const token = localStorage.getItem('knowledge_plane_token');
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    // Include credentials to enable cookie-based authentication
    const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include', // Include credentials for CORS requests to support cookies
    };
    
    const response = await fetch(url, config);
    
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            // Ignore if response body isn't JSON
        }
        throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) {
        return null as T; 
    }

    return await response.json() as T;
} 