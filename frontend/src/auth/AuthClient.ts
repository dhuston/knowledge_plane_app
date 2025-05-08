import axios, { AxiosInstance } from 'axios';
import { tokenManager } from './TokenManager';
import { API_BASE_URL, AUTH_TYPE } from '../config/env';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface UserResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  is_active: boolean;
  is_superuser?: boolean;
  is_admin?: boolean;
  title?: string | null;
  avatar_url?: string | null;
  team_id?: string | null;
  manager_id?: string | null;
  permissions?: string[];
  roles?: string[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
}

/**
 * Client for authentication-related API calls
 */
export class AuthClient {
  private api: AxiosInstance;
  private tokenManager: typeof tokenManager;
  private authBaseUrl: string;
  
  constructor(baseURL: string = '') {
    // Don't set baseURL since we want to use relative URLs for proper proxying
    // We'll explicitly add /api/v1 prefix to each request
    this.api = axios.create({
      headers: {
        'Content-Type': 'application/json',
      },
      // Important: We need this for cookies to be sent with requests
      withCredentials: true
    });
    
    console.debug('[AuthClient] Initialized with empty baseURL for proper proxying');
    this.tokenManager = tokenManager;
    
    // Use the appropriate auth endpoint based on the AUTH_TYPE
    // Default to simple-auth if AUTH_TYPE is set to 'simple', otherwise use legacy auth
    // This is the base path - /login/password will be added for standard auth
    this.authBaseUrl = AUTH_TYPE === 'simple' ? '/simple-auth' : '/auth';
    
    console.debug(`[AuthClient] Using auth base URL: ${this.authBaseUrl}`);
    
    // Add authorization header to requests when token exists
    this.api.interceptors.request.use((config) => {
      const token = this.tokenManager.getToken();
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    });
  }
  
  /**
   * Log in with username and password - standard authentication only
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Convert to form data as required by OAuth2 endpoint
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);
      
      console.debug('[AuthClient] Attempting standard login for user:', credentials.email);
      
      // Standard password authentication
      const loginUrl = `/api/v1${this.authBaseUrl}/login/password`;
      console.debug(`[AuthClient] Using login endpoint: ${loginUrl}`);
      
      const response = await this.api.post<AuthResponse>(loginUrl, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log('[AuthClient] Standard login succeeded');
      
      // Log token details (without revealing the full token)
      console.debug('[AuthClient] Received token:', {
        tokenLength: response.data.access_token.length,
        tokenPrefix: response.data.access_token.substring(0, 10) + '...',
        hasRefreshToken: !!response.data.refresh_token
      });
      
      // Store the tokens
      this.tokenManager.storeToken(response.data.access_token);
      
      // If we also have a refresh token, store it
      if (response.data.refresh_token) {
        console.debug('[AuthClient] Storing refresh token');
        this.tokenManager.storeRefreshToken(response.data.refresh_token);
      }
      
      return {
        success: true,
        token: response.data.access_token
      };
    } catch (error: any) {
      console.error('[AuthClient] Login error:', error);
      
      // Extract error message from response if available
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  
  /**
   * Get the current user profile - enhanced version with all necessary permissions
   */
  async getCurrentUser(): Promise<UserResult> {
    try {
      const token = this.tokenManager.getToken();
      
      console.debug('[AuthClient] getCurrentUser token check:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPrefix: token ? token.substring(0, 10) + '...' : null
      });
      
      if (!token) {
        console.warn('[AuthClient] No token available for getCurrentUser');
        return {
          success: false,
          error: 'No authentication token available'
        };
      }
      
      // Make a real API call to get the current user profile
      const userMeUrl = '/api/v1/users/me';
      console.debug(`[AuthClient] Making API call to ${userMeUrl} to get real user data`);
      const response = await this.api.get(userMeUrl);
      
      if (!response.data) {
        throw new Error(`No data returned from ${userMeUrl} endpoint`);
      }
      
      const userData = response.data;
      console.debug('[AuthClient] Received user data from API:', {
        userId: userData.id,
        email: userData.email,
        tenantId: userData.tenant_id,
        roles: userData.roles || []
      });
      
      // Ensure the user object has all required properties
      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email,
        tenant_id: userData.tenant_id,
        is_active: userData.is_active !== false, // Default to true if not provided
        is_admin: userData.is_admin || userData.is_superuser || false,
        is_superuser: userData.is_superuser || false,
        title: userData.title || null,
        avatar_url: userData.avatar_url || null,
        team_id: userData.team_id || null,
        manager_id: userData.manager_id || null,
        permissions: userData.permissions || [],
        roles: userData.roles || []
      };
      
      // Add any additional properties from the API response
      const enhancedUser = {
        ...user,
        ...userData,
        // Ensure these key properties exist
        online_status: userData.online_status !== undefined ? userData.online_status : true,
        role: userData.role || (userData.is_admin ? 'admin' : 'user'),
        onboarding_complete: userData.onboarding_complete !== undefined ? userData.onboarding_complete : true,
      };
      
      return {
        success: true,
        user: enhancedUser
      };
    } catch (error: any) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get user data'
      };
    }
  }
  
  /**
   * Log out the current user
   */
  async logout(): Promise<AuthResult> {
    try {
      await this.api.post(`${this.authBaseUrl}/logout`);
    } catch (error: any) {
      console.error('Logout error:', error);
      // Continue with client-side logout even if server logout fails
    } finally {
      // Always remove the token
      this.tokenManager.removeToken();
    }
    
    // Return success regardless of server response, as we've removed the token
    return {
      success: true
    };
  }
}

// Export a singleton instance
// Don't pass API_BASE_URL - we'll add '/api/v1' prefix to each request explicitly
export const authClient = new AuthClient();