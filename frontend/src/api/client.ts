// src/api/client.ts

// Get backend API base URL from environment variable with fallback
// Add extra logs to debug URL construction
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (window.location.protocol === 'https:' 
  ? "https://localhost:8001/api/v1" 
  : "http://localhost:8001/api/v1");
  
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
    // Check if endpoint contains /api/v1 prefix and handle it properly
    let url = '';
    
    // If base URL already includes api/v1 and the endpoint also includes it,
    // we need to avoid duplication
    const baseHasApiPrefix = API_BASE_URL.includes('/api/v1');
    const endpointHasApiPrefix = endpoint.startsWith('/api/v1');
    
    if (baseHasApiPrefix && endpointHasApiPrefix) {
        // Extract just the part after /api/v1
        const pathAfterPrefix = endpoint.substring(7); // '/api/v1'.length === 7
        
        // Ensure we don't double up on slashes
        if (API_BASE_URL.endsWith('/') && pathAfterPrefix.startsWith('/')) {
            url = `${API_BASE_URL}${pathAfterPrefix.substring(1)}`;
        } else if (!API_BASE_URL.endsWith('/') && !pathAfterPrefix.startsWith('/')) {
            url = `${API_BASE_URL}/${pathAfterPrefix}`;
        } else {
            url = `${API_BASE_URL}${pathAfterPrefix}`;
        }
        
        console.warn(`API path duplication detected. Endpoint '${endpoint}' modified to avoid /api/v1 duplication.`);
        console.warn(`Using URL: ${url}`);
    } else {
        // Normal case - handle slashes properly
        if (endpoint.startsWith('/') && API_BASE_URL.endsWith('/')) {
            url = `${API_BASE_URL}${endpoint.substring(1)}`;
        } else if (!endpoint.startsWith('/') && !API_BASE_URL.endsWith('/')) {
            url = `${API_BASE_URL}/${endpoint}`;
        } else {
            url = `${API_BASE_URL}${endpoint}`;
        }
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