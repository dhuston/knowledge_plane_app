# Simplified Authentication Implementation Plan

## Overview

This document outlines a streamlined approach to authentication for the Biosphere Alpha platform. The current implementation is complex with numerous interdependencies, making it difficult to maintain and debug. This plan proposes a simplified authentication system that preserves the core functionality while improving reliability and maintainability.

## Current Issues

1. **Complexity**: The current auth system involves multiple layers of JWT handling, token storage management, and complex error handling.
2. **Infinite Loop Risk**: Current implementation has circular dependencies that can cause render loops in React.
3. **Excessive Debugging Code**: There's an abundance of debug logging and state tracking that adds overhead.
4. **Tenant Context Complexity**: The tenant handling adds complexity to token validation and user management.
5. **Multiple Storage Locations**: Token storage is attempted across localStorage and sessionStorage with complex fallbacks.

## Implementation Plan

### Phase 1: Define Requirements and Core Components

**Core Authentication Requirements:**

1. JWT-based authentication with access tokens
2. Multi-tenant support with tenant ID in tokens
3. User profile data retrieval after authentication
4. Support for basic credential and OAuth authentication methods
5. Automatic token validation
6. Clear separation between frontend and backend authentication concerns

**Simplified Component Structure:**

1. **Backend Components**:
   - `SimpleAuthService`: Core authentication service
   - `JWTHandler`: Token creation, validation, and parsing
   - `UserAuthenticator`: User authentication logic
   - `TenantValidator`: Tenant validation logic

2. **Frontend Components**:
   - `AuthProvider`: Main React context provider
   - `AuthClient`: API client for authentication endpoints
   - `TokenManager`: Token storage and retrieval
   - `useAuth`: Hook for accessing auth state and methods

### Phase 2: Backend Implementation

#### Step 1: Create SimpleAuthService

```python
# app/services/simple_auth_service.py

from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from uuid import UUID
from jose import jwt, JWTError

from app.core.config import settings
from app.models.user import User
from app.db.session import AsyncSession


class SimpleAuthService:
    """Simplified authentication service for handling JWT operations and user authentication."""
    
    def __init__(self, secret_key: str, algorithm: str, token_expire_minutes: int = 60):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.token_expire_minutes = token_expire_minutes
    
    def create_token(self, user_id: UUID, tenant_id: Optional[UUID] = None) -> str:
        """
        Create a JWT token for a user.
        
        Args:
            user_id: User ID to include in the token
            tenant_id: Optional tenant ID to include in the token
            
        Returns:
            str: Encoded JWT token
        """
        expires = datetime.utcnow() + timedelta(minutes=self.token_expire_minutes)
        
        # Create payload with required claims
        payload = {
            "sub": str(user_id),
            "exp": expires
        }
        
        # Add tenant ID if provided
        if tenant_id:
            payload["tenant_id"] = str(tenant_id)
            
        # Encode and return the token
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate a JWT token and return its payload.
        
        Args:
            token: JWT token to validate
            
        Returns:
            Optional[Dict[str, Any]]: Token payload if valid, None otherwise
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            return None
    
    async def authenticate_user(
        self, 
        db: AsyncSession,
        email: str, 
        password: str
    ) -> Tuple[bool, Optional[User]]:
        """
        Authenticate a user with email and password.
        
        Args:
            db: Database session
            email: User email
            password: User password
            
        Returns:
            Tuple[bool, Optional[User]]: (Success flag, User if successful)
        """
        from app.crud.crud_user import user as crud_user
        
        # Get user by email
        user = await crud_user.get_by_email(db, email=email)
        if not user:
            return False, None
        
        # Verify password
        from app.core.security import pwd_context
        if not pwd_context.verify(password, user.hashed_password):
            return False, None
            
        return True, user
    
    async def get_user_from_token(
        self, 
        db: AsyncSession,
        token: str
    ) -> Tuple[bool, Optional[User], Optional[str]]:
        """
        Get a user from a token.
        
        Args:
            db: Database session
            token: JWT token
            
        Returns:
            Tuple[bool, Optional[User], Optional[str]]: 
                (Success flag, User if successful, Error message if unsuccessful)
        """
        from app.crud.crud_user import user as crud_user
        
        # Validate token
        payload = self.validate_token(token)
        if not payload:
            return False, None, "Invalid token"
        
        # Extract user ID
        user_id_str = payload.get("sub")
        if not user_id_str:
            return False, None, "User ID not found in token"
            
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            return False, None, "Invalid user ID format"
        
        # Get user from database
        user = await crud_user.get(db, id=user_id)
        if not user:
            return False, None, "User not found"
            
        # Validate tenant if present in token
        tenant_id_str = payload.get("tenant_id")
        if tenant_id_str:
            try:
                token_tenant_id = UUID(tenant_id_str)
                if user.tenant_id != token_tenant_id:
                    # In production, this would be an error
                    # For development/demo, we'll allow it but warn
                    if settings.DEBUG:
                        return True, user, "Tenant mismatch (allowed in DEBUG mode)"
                    else:
                        return False, None, "User tenant does not match token tenant"
            except ValueError:
                return False, None, "Invalid tenant ID format"
                
        return True, user, None


# Create a global instance using settings
simple_auth_service = SimpleAuthService(
    secret_key=settings.SECRET_KEY,
    algorithm=settings.ALGORITHM,
    token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
)
```

#### Step 2: Create FastAPI Dependencies

```python
# app/api/deps.py (replace or update existing file)

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.services.simple_auth_service import simple_auth_service
from app.models.user import User


# Configure OAuth2 password bearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"/api/v1/auth/login")


async def get_db() -> AsyncSession:
    """Get a database session."""
    async for session in get_db_session():
        yield session


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get the current user from the token.
    
    Args:
        token: JWT token from authorization header
        db: Database session
        
    Returns:
        User: Current authenticated user
        
    Raises:
        HTTPException: If authentication fails
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    success, user, error = await simple_auth_service.get_user_from_token(db, token)
    
    if not success or not user:
        # Log the error reason for debugging
        print(f"Authentication failed: {error}")
        raise credentials_exception
        
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensure the current user is active.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User: Current active user
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Ensure the current user is a superuser.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User: Current active superuser
        
    Raises:
        HTTPException: If user is not a superuser
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions"
        )
    return current_user


def get_tenant_id(
    current_user: User = Depends(get_current_user),
):
    """
    Get the tenant ID for the current user.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        UUID: Tenant ID
        
    Raises:
        HTTPException: If user has no tenant association
    """
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=400,
            detail="User has no tenant association"
        )
    return current_user.tenant_id
```

#### Step 3: Update Authentication Endpoints

```python
# app/api/v1/endpoints/auth.py

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.schemas.token import Token
from app.schemas.user import User
from app.services.simple_auth_service import simple_auth_service


router = APIRouter()


@router.post("/login", response_model=Token)
async def login_access_token(
    response: Response,
    db: AsyncSession = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # Authenticate user
    success, user = await simple_auth_service.authenticate_user(
        db, form_data.username, form_data.password
    )
    
    if not success or not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = simple_auth_service.create_token(
        user_id=user.id,
        tenant_id=user.tenant_id
    )
    
    # Set cookie for token (optional, can be used with token in header)
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=60 * 60 * 24,  # 1 day
        secure=not deps.settings.DEBUG,
        samesite="lax" if deps.settings.DEBUG else "strict"
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(response: Response) -> dict:
    """
    Logout endpoint to clear cookies.
    """
    response.delete_cookie(key="access_token")
    
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=User)
async def read_users_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user
```

### Phase 3: Frontend Implementation

#### Step 1: Create TokenManager

```typescript
// src/auth/TokenManager.ts

/**
 * Manages JWT token storage and retrieval
 */
export class TokenManager {
  private readonly tokenKey = 'access_token';
  
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
   * Remove the stored token
   */
  removeToken(): void {
    try {
      localStorage.removeItem(this.tokenKey);
    } catch (error) {
      console.error('Failed to remove token:', error);
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
```

#### Step 2: Create AuthClient

```typescript
// src/auth/AuthClient.ts

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { tokenManager } from './TokenManager';

// Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  is_active: boolean;
  is_superuser: boolean;
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
  
  constructor(baseURL: string = '/api/v1') {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Add authorization header to requests when token exists
    this.api.interceptors.request.use((config) => {
      const token = tokenManager.getToken();
      
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
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Convert to form data as required by OAuth2 endpoint
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await this.api.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    return response.data;
  }
  
  /**
   * Get the current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>('/auth/me');
    return response.data;
  }
  
  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    await this.api.post('/auth/logout');
    tokenManager.removeToken();
  }
}

// Export a singleton instance
export const authClient = new AuthClient();
```

#### Step 3: Create AuthProvider and Hook

```typescript
// src/auth/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authClient, User } from './AuthClient';
import { tokenManager } from './TokenManager';

// Define the authentication context type
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context with default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if we have a token
        if (!tokenManager.hasToken()) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }
        
        // Token exists, get user profile
        const userData = await authClient.getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Authentication check failed:', err);
        setIsAuthenticated(false);
        setUser(null);
        
        // Only show error if token exists but is invalid
        if (tokenManager.hasToken()) {
          setError('Session expired. Please login again.');
          // Clean up invalid token
          tokenManager.removeToken();
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call login API
      const response = await authClient.login({ username: email, password });
      
      // Store token
      tokenManager.storeToken(response.access_token);
      
      // Get user data
      const userData = await authClient.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please check your credentials.');
      setIsAuthenticated(false);
      setUser(null);
      tokenManager.removeToken();
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authClient.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // Always clear state and token, even if API call fails
      setIsAuthenticated(false);
      setUser(null);
      tokenManager.removeToken();
      setIsLoading(false);
    }
  };
  
  // Context value
  const value = {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    logout,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### Step 4: Create LoginPage Component

```tsx
// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useAuth } from '../auth/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      await login(email, password);
      // Navigation will happen in the useEffect above
    } catch (err) {
      console.error('Login submission error:', err);
      setError('Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
      <VStack spacing={4}>
        <Heading>Login</Heading>
        
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <VStack spacing={4}>
            <FormControl id="email" isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </FormControl>
            
            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </FormControl>
            
            <Button
              type="submit"
              colorScheme="blue"
              width="100%"
              isLoading={submitting}
              loadingText="Logging in..."
            >
              Login
            </Button>
          </VStack>
        </form>
        
        <Text fontSize="sm" color="gray.500">
          Don't have an account? Contact your administrator.
        </Text>
      </VStack>
    </Box>
  );
};
```

#### Step 5: Create ProtectedRoute Component

```tsx
// src/auth/ProtectedRoute.tsx

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Box, Spinner, Center } from '@chakra-ui/react';

interface ProtectedRouteProps {
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // Render child routes if authenticated
  return <Outlet />;
};
```

### Phase 4: Testing

#### Step 1: Write Backend Tests

```python
# backend/tests/api/test_auth.py

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.services.simple_auth_service import simple_auth_service
from app.models.user import User
from tests.utils.user import create_test_user


@pytest.fixture
def client():
    return TestClient(app)


@pytest.mark.asyncio
async def test_login_success(client: TestClient, db: AsyncSession):
    # Create test user
    user = await create_test_user(db, "test@example.com", "testpassword")
    
    # Login
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "test@example.com",
            "password": "testpassword"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    
    # Verify token
    token = data["access_token"]
    payload = simple_auth_service.validate_token(token)
    assert payload is not None
    assert payload["sub"] == str(user.id)


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: TestClient, db: AsyncSession):
    # Create test user
    await create_test_user(db, "test@example.com", "testpassword")
    
    # Login with wrong password
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "test@example.com",
            "password": "wrongpassword"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    # Check response
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Incorrect username or password"


@pytest.mark.asyncio
async def test_get_user_me(client: TestClient, db: AsyncSession):
    # Create test user
    user = await create_test_user(db, "test@example.com", "testpassword")
    
    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "test@example.com",
            "password": "testpassword"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token = login_response.json()["access_token"]
    
    # Get user profile
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(user.id)
    assert data["email"] == user.email


@pytest.mark.asyncio
async def test_get_user_me_invalid_token(client: TestClient):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalidtoken"}
    )
    
    # Check response
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["detail"] == "Could not validate credentials"


@pytest.mark.asyncio
async def test_logout(client: TestClient, db: AsyncSession):
    # Create test user
    await create_test_user(db, "test@example.com", "testpassword")
    
    # Login
    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "test@example.com",
            "password": "testpassword"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token = login_response.json()["access_token"]
    
    # Logout
    response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Check response
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "Successfully logged out"
    
    # Check that cookie is cleared
    assert "access_token" not in response.cookies
```

#### Step 2: Write Frontend Tests

```typescript
// frontend/src/auth/AuthContext.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import { authClient } from './AuthClient';
import { tokenManager } from './TokenManager';

// Mock dependencies
jest.mock('./AuthClient');
jest.mock('./TokenManager');

// Test component that uses the auth hook
const TestComponent = () => {
  const { isAuthenticated, user, login, logout, isLoading, error } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading...' : 'Not loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'No user'}</div>
      <div data-testid="error">{error || 'No error'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (tokenManager.hasToken as jest.Mock).mockReturnValue(false);
    (authClient.getCurrentUser as jest.Mock).mockResolvedValue(null);
  });
  
  test('initially shows loading state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
  });
  
  test('shows unauthenticated state when no token', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not authenticated');
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
  });
  
  test('shows authenticated state when valid token', async () => {
    // Mock token and user
    (tokenManager.hasToken as jest.Mock).mockReturnValue(true);
    (authClient.getCurrentUser as jest.Mock).mockResolvedValue({
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      tenant_id: '456',
      is_active: true,
      is_superuser: false,
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });
    
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user')).toContainHTML('Test User');
  });
  
  test('handles login success', async () => {
    // Mock successful login and user fetch
    (authClient.login as jest.Mock).mockResolvedValue({ 
      access_token: 'fake-token',
      token_type: 'bearer'
    });
    (authClient.getCurrentUser as jest.Mock).mockResolvedValue({
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      tenant_id: '456',
      is_active: true,
      is_superuser: false,
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });
    
    // Click login button
    userEvent.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    });
    
    expect(tokenManager.storeToken).toHaveBeenCalledWith('fake-token');
    expect(screen.getByTestId('user')).toContainHTML('Test User');
  });
  
  test('handles login failure', async () => {
    // Mock failed login
    const loginError = new Error('Invalid credentials');
    (authClient.login as jest.Mock).mockRejectedValue(loginError);
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });
    
    // Click login button
    userEvent.click(screen.getByText('Login'));
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not authenticated');
    });
    
    expect(screen.getByTestId('error')).not.toHaveTextContent('No error');
  });
  
  test('handles logout', async () => {
    // Mock authenticated state
    (tokenManager.hasToken as jest.Mock).mockReturnValue(true);
    (authClient.getCurrentUser as jest.Mock).mockResolvedValue({
      id: '123',
      name: 'Test User',
      email: 'test@example.com',
      tenant_id: '456',
      is_active: true,
      is_superuser: false,
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
    });
    
    // Click logout button
    userEvent.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Not authenticated');
    });
    
    expect(authClient.logout).toHaveBeenCalled();
    expect(tokenManager.removeToken).toHaveBeenCalled();
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
  });
});
```

### Phase 5: Integration and Deployment

1. **Integration Steps**:
   - Update API routes to use new authentication dependencies
   - Update frontend routes to use protected route component
   - Set up environment variables for production deployment
   
2. **Migration Strategy**:
   - Run new auth system in parallel with existing system
   - Gradually migrate endpoints to new system
   - Update frontend components to use new auth hooks
   - Run integration tests after each component migration

3. **Deployment Checklist**:
   - Ensure all tests pass
   - Update API documentation
   - Deploy backend changes first
   - Deploy frontend changes after confirming backend stability
   - Monitor error logs during initial deployment

## Benefits of the New Implementation

1. **Simplicity**: Significantly reduced code complexity with clear separation of responsibilities
2. **Reliability**: Fewer side effects, better error handling, and more predictable behavior
3. **Maintainability**: Modular design makes future changes easier to implement
4. **Performance**: Reduced state updates, fewer re-renders, and more efficient token handling
5. **Development Experience**: Clear interfaces and testing patterns make development more efficient

## Conclusion

This simplified authentication implementation maintains all the core functionality required by the Biosphere Alpha platform while dramatically reducing complexity. By focusing on clear separation of concerns and following best practices for authentication, we create a more reliable and maintainable system that will be easier to extend in the future.