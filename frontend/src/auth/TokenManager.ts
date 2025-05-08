/**
 * Manages JWT token storage and retrieval
 */
export class TokenManager {
  private readonly tokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';
  
  /**
   * Store a token in localStorage
   */
  storeToken(token: string): void {
    try {
      localStorage.setItem(this.tokenKey, token);
    } catch (error) {
      console.error('Failed to store token:', error);
      // No fallback needed - if localStorage fails, user will need to re-login
    }
  }
  
  /**
   * Store a refresh token in localStorage
   */
  storeRefreshToken(token: string): void {
    try {
      localStorage.setItem(this.refreshTokenKey, token);
    } catch (error) {
      console.error('Failed to store refresh token:', error);
    }
  }
  
  /**
   * Get the stored token
   */
  getToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  }
  
  /**
   * Get the stored refresh token
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.refreshTokenKey) || null;
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }
  
  /**
   * Remove the stored token
   */
  removeToken(): void {
    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.refreshTokenKey);
    } catch (error) {
      console.error('Failed to remove tokens:', error);
    }
  }
  
  /**
   * Check if a token exists
   */
  hasToken(): boolean {
    return !!this.getToken();
  }
  
  /**
   * Parse a JWT token (without validation)
   */
  parseToken(token: string): any {
    try {
      // Split the token and get the payload part (second part)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to parse token:', error);
      return null;
    }
  }
}

// Export a singleton instance
export const tokenManager = new TokenManager();