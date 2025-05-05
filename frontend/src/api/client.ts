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
        console.log(`API request adding auth token to ${url} (token length: ${token.length})`);
        console.log(`Token preview: ${token.substring(0, 15)}...`);
        headers.append('Authorization', `Bearer ${token}`);
    } else {
        console.log(`API request to ${url} has no auth token!`);
    }

    // Include credentials to enable cookie-based authentication
    const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include', // Include credentials for CORS requests to support cookies
    };
    
    try {
        const response = await fetch(url, config);
        
        // Enhanced error logging for debugging
        if (!response.ok) {
            console.error(`[Debug] API error for ${url} - Status: ${response.status}`);
            
            let errorData;
            try {
                errorData = await response.json();
                console.error('[Debug] Error details:', errorData);
            } catch (parseError) {
                console.error('[Debug] Could not parse error response as JSON:', parseError);
                // Fallback to text if JSON parsing fails
                try {
                    const textError = await response.text();
                    console.error('[Debug] Error response text:', textError.substring(0, 500));
                } catch (textError) {
                    console.error('[Debug] Could not read error response as text:', textError);
                }
            }
            
            // Throw standardized error with status code and message
            throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
        }

        if (response.status === 204) {
            return null as T; 
        }

        // Log the response for debugging
        if (endpoint.includes('notification')) {
            console.log(`[Debug] Response for ${url}:`, response);
        }

        const data = await response.json() as T;
        
        // For debugging notification-related responses
        if (endpoint.includes('notification')) {
            console.log(`[Debug] Processed data for ${url}:`, data);
        }
        
        return data;
    } catch (error) {
        // Enhanced error logging
        console.error(`[Debug] Request failed for ${url}:`, error);
        throw error;
    }
} 