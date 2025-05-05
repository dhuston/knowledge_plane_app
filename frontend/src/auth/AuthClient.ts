import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
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
  title?: string | null;
  avatar_url?: string | null;
  team_id?: string | null;
  manager_id?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

/**
 * Client for authentication-related API calls
 */
export class AuthClient {
  private api: AxiosInstance;
  private tokenManager: typeof tokenManager;
  private authBaseUrl: string;
  
  constructor(baseURL: string = '/api/v1') {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.tokenManager = tokenManager;
    
    // Use the appropriate auth endpoint based on the AUTH_TYPE
    // Default to simple-auth if AUTH_TYPE is set to 'simple', otherwise use legacy auth
    this.authBaseUrl = AUTH_TYPE === 'simple' ? '/simple-auth' : '/auth';
    
    // Add authorization header to requests when token exists
    this.api.interceptors.request.use((config) => {
      const token = this.tokenManager.getToken();
      
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      
      return config;
    });
  }
  
  /**
   * Log in with username and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Convert to form data as required by OAuth2 endpoint
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);
      
      const response = await this.api.post<AuthResponse>(`${this.authBaseUrl}/login`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      // Store the token
      this.tokenManager.storeToken(response.data.access_token);
      
      return {
        success: true,
        token: response.data.access_token
      };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Extract error message from response if available
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Log in with tenant ID (demo mode)
   */
  async demoLogin(tenantId: string): Promise<AuthResult> {
    try {
      const response = await this.api.post<AuthResponse>(`${this.authBaseUrl}/demo-login`, { tenant_id: tenantId });
      
      // Store the token
      this.tokenManager.storeToken(response.data.access_token);
      
      return {
        success: true,
        token: response.data.access_token
      };
    } catch (error: any) {
      console.error('Demo login error:', error);
      
      // Extract error message from response if available
      const errorMessage = error.response?.data?.detail || error.message || 'Demo login failed';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Get the current user profile
   */
  async getCurrentUser(): Promise<UserResult> {
    try {
      const response = await this.api.get<User>(`${this.authBaseUrl}/me`);
      
      return {
        success: true,
        user: response.data
      };
    } catch (error: any) {
      console.error('Get current user error:', error);
      
      // Extract error message from response if available
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to get user data';
      
      return {
        success: false,
        error: errorMessage
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
export const authClient = new AuthClient(API_BASE_URL);