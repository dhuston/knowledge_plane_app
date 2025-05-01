// src/api/client.ts

// Get backend API base URL
const API_BASE_URL = window.location.protocol === 'https:' 
  ? "https://localhost:8001/api/v1" 
  : "http://localhost:8001/api/v1"; // Match backend prefix

// Simple API client using fetch

export const apiClient = {
    async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
        return await request<T>(endpoint, { ...options, method: 'GET' });
    },
    async post<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
        return await request<T>(endpoint, { 
            ...options, 
            method: 'POST', 
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }
        });
    },
    // Add put, delete methods as needed
};

async function request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});
    
    const token = localStorage.getItem('knowledge_plane_token');
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
    }

    // Add credential handling for CORS
    const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include', // Include credentials for CORS requests
    };
    
    console.log(`API Request to: ${url}`);
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