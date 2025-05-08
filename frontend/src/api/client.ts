// src/api/client.ts

import { 
  AppError, 
  ErrorCategory, 
  createApiError, 
  logError 
} from '../utils/errorHandling';

// Import API_BASE_URL from centralized config
import { API_BASE_URL } from '../config/env';

// Import tokenManager for consistent token access
import { tokenManager } from '../auth/TokenManager';

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
    async isEndpointAvailable(endpoint: string, method: string = 'GET'): Promise<boolean> {
      try {
        const url = buildUrl(endpoint);
        
        // For endpoints that might only accept POST, OPTIONS is safer than GET
        const checkMethod = method === 'POST' ? 'OPTIONS' : 'GET';
        
        try {
          console.log(`[Debug] Checking endpoint availability: ${url} with method ${checkMethod}`);
          const response = await fetch(url, { 
            method: checkMethod, 
            cache: 'no-store',
            // Allow redirects
            redirect: 'follow',
            credentials: 'include',
            headers: { 
              'X-Availability-Check': 'true',
              'Accept': 'application/json'
            }
          });
          
          // Even a 405 "Method Not Allowed" means the endpoint exists
          // Also consider redirects (3xx) as existing endpoints
          const status = response.status;
          const exists = response.ok || status === 405 || (status >= 300 && status < 400);
          
          console.log(`[Debug] Endpoint check result: ${exists ? 'Available' : 'Not available'} (status: ${status})`);
          return exists;
        } catch (requestError) {
          console.warn(`[Debug] Primary check failed for ${endpoint}:`, requestError);
          
          // As a final fallback, try OPTIONS method which should be widely supported
          try {
            const optionsResponse = await fetch(url, { 
              method: 'OPTIONS', 
              cache: 'no-store',
              redirect: 'follow',
              credentials: 'include'
            });
            const status = optionsResponse.status;
            const exists = optionsResponse.ok || status === 204 || status === 405 || (status >= 300 && status < 400);
            console.log(`[Debug] Fallback endpoint check result: ${exists ? 'Available' : 'Not available'} (status: ${status})`);
            return exists;
          } catch (optionsError) {
            console.warn(`[Debug] OPTIONS check failed for ${endpoint}:`, optionsError);
            return false;
          }
        }
      } catch (error) {
        console.warn(`[Debug] API availability check failed for ${endpoint}:`, error);
        return false;
      }
    },

    /**
     * Check if the API is generally available (health check)
     * @returns Promise resolving to true if API is available, false otherwise
     */
    async isApiAvailable(): Promise<boolean> {
      try {
        // Try with trailing slash first, as the server redirects to this
        const withSlash = await this.isEndpointAvailable('/api/v1/health/');
        if (withSlash) return true;
        
        // Fall back to without trailing slash
        return await this.isEndpointAvailable('/api/v1/health');
      } catch (_) {
        return false;
      }
    },
    
    /**
     * Get map data directly without authentication (development only)
     * @param tenantId - UUID of the tenant
     * @returns Promise with the map data
     */
    async getDevMapData(tenantId: string): Promise<any> {
      try {
        const url = buildUrl(`/map/dev/graph/${tenantId}`);
        console.log(`[DEV] Getting map data from: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("[DEV] Error fetching map data:", error);
        throw error;
      }
    },
    
    /**
     * Get notification data directly without authentication (development only)
     * @param tenantId - UUID of the tenant 
     * @returns Promise with the notification data
     */
    async getDevNotifications(tenantId: string): Promise<any> {
      try {
        const url = buildUrl(`/notifications/dev/${tenantId}`);
        console.log(`[DEV] Getting notifications from: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("[DEV] Error fetching notifications:", error);
        throw error;
      }
    },
    
    /**
     * Get notification preferences directly without authentication (development only)
     * @param tenantId - UUID of the tenant
     * @returns Promise with the notification preferences
     */
    async getDevNotificationPreferences(tenantId: string): Promise<any> {
      try {
        const url = buildUrl(`/notifications/dev/${tenantId}/preferences`);
        console.log(`[DEV] Getting notification preferences from: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("[DEV] Error fetching notification preferences:", error);
        throw error;
      }
    },

    /**
     * AI proxy development endpoints
     * These endpoints provide mock responses without requiring authentication
     */

    /**
     * Check AI proxy health (development only)
     * @param tenantId - UUID of the tenant
     * @returns Promise with health status
     */
    async checkDevAiProxyHealth(tenantId: string): Promise<any> {
      try {
        const url = buildUrl(`/ai-proxy/dev/${tenantId}/health`);
        console.log(`[DEV] Checking AI proxy health from: ${url}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("[DEV] Error checking AI proxy health:", error);
        throw error;
      }
    },
    
    /**
     * Summarize insights using dev endpoint (development only)
     * @param tenantId - UUID of the tenant
     * @param insights - List of insights to summarize
     * @param userPreferences - Optional user preferences
     * @returns Promise with the summary
     */
    async devSummarizeInsights(tenantId: string, insights: any[], userPreferences?: any): Promise<any> {
      try {
        const url = buildUrl(`/ai-proxy/dev/${tenantId}/summarize-insights`);
        console.log(`[DEV] Summarizing insights using: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            insights,
            user_preferences: userPreferences || null
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("[DEV] Error summarizing insights:", error);
        throw error;
      }
    },
    
    /**
     * Enhance an insight using dev endpoint (development only)
     * @param tenantId - UUID of the tenant
     * @param insight - The insight to enhance
     * @returns Promise with the enhanced insight
     */
    async devEnhanceInsight(tenantId: string, insight: any): Promise<any> {
      try {
        const url = buildUrl(`/ai-proxy/dev/${tenantId}/enhance-insight`);
        console.log(`[DEV] Enhancing insight using: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(insight)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("[DEV] Error enhancing insight:", error);
        throw error;
      }
    },
    
    /**
     * Generate insights from activities using dev endpoint (development only)
     * @param tenantId - UUID of the tenant
     * @param activities - Activities to analyze
     * @param contextData - Optional context data
     * @returns Promise with the generated insights
     */
    async devGenerateInsights(tenantId: string, activities: any[], contextData?: any): Promise<any> {
      try {
        const url = buildUrl(`/ai-proxy/dev/${tenantId}/generate-insights`);
        console.log(`[DEV] Generating insights using: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            activities,
            context_data: contextData || null
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("[DEV] Error generating insights:", error);
        throw error;
      }
    },
    
    /**
     * Process a custom prompt using dev endpoint (development only)
     * @param tenantId - UUID of the tenant
     * @param prompt - The prompt to process
     * @returns Promise with the response
     */
    async devCustomPrompt(tenantId: string, prompt: string): Promise<any> {
      try {
        const url = buildUrl(`/ai-proxy/dev/${tenantId}/custom-prompt`);
        console.log(`[DEV] Processing custom prompt using: ${url}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ prompt })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("[DEV] Error processing custom prompt:", error);
        throw error;
      }
    }
};

/**
 * Default API path prefix for API endpoints
 */
let apiPathPrefix = '/api/v1';

/**
 * Set the API path prefix for endpoints
 * @param prefix - The new API path prefix
 */
export function setApiPathPrefix(prefix: string): void {
    apiPathPrefix = prefix.startsWith('/') ? prefix : `/${prefix}`;
}

/**
 * Builds a full URL from API base and endpoint
 */
function buildUrl(endpoint: string): string {
    console.debug('[API Client] Building URL for endpoint:', endpoint);
    
    // Check if endpoint already has API version prefix
    const hasApiPrefix = endpoint.startsWith('/api/v1') || endpoint.startsWith('/api/v2');
    
    // If API_BASE_URL is empty and endpoint already starts with /api,
    // we don't need additional prefixes - this is for Vite proxy in Docker setup
    if (!API_BASE_URL && hasApiPrefix) {
        console.debug('[API Client] Using endpoint as-is with proxy:', endpoint);
        return endpoint;
    }
    
    // Normalize endpoint paths by adding API prefix if needed
    const normalizedEndpoint = hasApiPrefix 
        ? endpoint 
        : `${apiPathPrefix}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    // If API_BASE_URL is empty, return just the normalized endpoint
    // This is typically for proxying in development
    if (!API_BASE_URL) {
        console.debug('[API Client] Using normalized endpoint with proxy:', normalizedEndpoint);
        return normalizedEndpoint;
    }
    
    // Add the normalized endpoint to the base URL
    let fullUrl;
    if (API_BASE_URL.endsWith('/') && normalizedEndpoint.startsWith('/')) {
        fullUrl = `${API_BASE_URL}${normalizedEndpoint.substring(1)}`;
    } else if (!API_BASE_URL.endsWith('/') && !normalizedEndpoint.startsWith('/')) {
        fullUrl = `${API_BASE_URL}/${normalizedEndpoint}`;
    } else {
        fullUrl = `${API_BASE_URL}${normalizedEndpoint}`;
    }
    
    console.debug('[API Client] Built full URL:', fullUrl);
    return fullUrl;
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
    
    // Add authentication token using TokenManager for consistency
    const token = tokenManager.getToken();
    
    // Debug token availability
    console.debug('[API Client] Auth token check:', {
        endpoint,
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPrefix: token ? `${token.substring(0, 10)}...` : 'none',
        tokenSource: 'TokenManager.getToken()'
    });
    
    if (token) {
        headers.append('Authorization', `Bearer ${token}`);
        console.debug('[API Client] Added Authorization header for request to:', endpoint);
    } else {
        console.warn('[API Client] No auth token available for request to:', endpoint);
    }

    // Include credentials to enable cookie-based authentication
    // And ensure redirects are followed (especially for trailing slash redirects)
    const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include',
        redirect: 'follow',
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