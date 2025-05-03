# Authentication System Design

## Current State Analysis

The current authentication system has the following components:

1. **OAuth Implementation**:
   - Uses Google OAuth for authentication
   - Includes OAuth provider registry for extensibility
   - Has development mode with mock authentication

2. **Token System**:
   - JWT tokens for authentication
   - Access tokens and refresh tokens
   - Token blacklist for logout

3. **Multi-tenant Support**:
   - Auto-creates tenants based on email domains
   - Includes tenant ID in JWT tokens

4. **Frontend Integration**:
   - Auth context for managing authentication state
   - Protected routes for securing the application
   - Callback handling for OAuth flow

## Key Pain Points

1. **Development Experience**: 
   - Current dev mode requires configuring environment variables
   - Inconsistent mock authentication between backend and frontend

2. **Customer Demo Setup**:
   - No easy way to set up demo instances with pre-configured users
   - Requires Google OAuth credentials for every demo

3. **Production Readiness**:
   - Lacks production-grade OAuth error handling and recovery
   - OAuth token storage is not secure (tokens stored in plaintext)

4. **Multi-tenant Isolation**:
   - User lookup doesn't properly enforce tenant isolation
   - Tenant creation is too automatic, lacking control

## Proposed Solution

### 1. Dual-Mode Authentication System

Create a unified system that can operate in two modes:

#### Demo Mode

- **Local Authentication**: Password-based with pre-seeded accounts
- **Simplified Setup**: No external dependencies
- **No OAuth Required**: Works without internet connection
- **Demo Data**: Pre-populated multi-tenant environment

#### Production Mode

- **Enhanced OAuth**: Support for multiple identity providers (Google, Microsoft, SAML)
- **Secure Token Storage**: Encrypted storage for OAuth tokens
- **Custom Tenant Management**: APIs for tenant creation/management
- **Advanced User Management**: Role-based access control

### 2. Unified Backend Architecture

```
┌────────────────────────────────────────────────────────┐
│                  Authentication Controller              │
├────────────────┬─────────────────────┬─────────────────┤
│   OAuth Flow    │   Password Flow     │   Token Flow    │
│  (Production)   │      (Demo)         │   (Shared)      │
└────────────────┴─────────────────────┴─────────────────┘
               │                  │
               ▼                  ▼
┌────────────────────────┐  ┌────────────────────────┐
│   User Service         │  │   Token Service         │
│ - User Creation        │  │ - Token Generation      │
│ - User Lookup          │  │ - Token Validation      │
│ - Profile Management   │  │ - Token Refresh         │
└────────────────────────┘  └────────────────────────┘
               │                  │
               ▼                  ▼
┌────────────────────────┐  ┌────────────────────────┐
│   Tenant Service       │  │   Permissions Service   │
│ - Tenant Management    │  │ - Access Control        │
│ - Domain Mapping       │  │ - Role Management       │
└────────────────────────┘  └────────────────────────┘
```

### 3. Enhanced Frontend Components

- **Improved Auth Context**: Proper token refresh handling
- **Demo Mode UI**: Special login UI for demo environments
- **Admin Console**: User and tenant management interfaces
- **Error Recovery**: Better handling of auth failures

## Implementation Plan

### Phase 1: Demo-Ready Authentication

1. **Implement Password Authentication Backend**:
   - Create local user authentication endpoints
   - Add password hashing and validation
   - Maintain JWT token system compatibility

2. **Create Demo Seeding System**:
   - Script to generate demo tenant and users
   - Pre-configured demo credentials
   - Demo data reset capability

3. **Develop Demo Mode UI**:
   - Create password login form
   - Add mode toggle between OAuth and password
   - Improve error handling for demos

### Phase 2: Production-Ready Authentication

1. **Enhanced OAuth Implementation**:
   - Add Microsoft and SAML providers
   - Improve OAuth error handling
   - Implement secure token storage

2. **Tenant Administration**:
   - Create tenant management API
   - Add tenant creation controls
   - Implement domain verification

3. **User Management System**:
   - Design role-based access control
   - Create user management API
   - Build admin console UI

### Phase 3: Integration and Testing

1. **Authentication Flow Testing**:
   - Test all authentication paths
   - Verify token refresh behavior
   - Validate tenant isolation

2. **Performance Optimization**:
   - Improve token validation performance
   - Add caching for frequently used auth data
   - Optimize database queries

3. **Documentation and Guides**:
   - Create setup documentation for different modes
   - Document API endpoints for integration
   - Provide configuration guidelines

## Feature Comparison

| Feature                 | Demo Mode | Production Mode |
|-------------------------|-----------|----------------|
| Local Authentication    | ✅        | ❌             |
| Google OAuth            | ❌        | ✅             |
| Microsoft OAuth         | ❌        | ✅             |
| SAML Integration        | ❌        | ✅             |
| Pre-seeded Data         | ✅        | ❌             |
| User Management         | Basic     | Advanced       |
| Tenant Isolation        | ✅        | ✅             |
| Token Refresh           | ✅        | ✅             |
| Role-based Access       | Basic     | Advanced       |
| Self-registration       | ❌        | ✅             |

## Configuration

The system will use a simple configuration mechanism to determine the mode:

```yaml
auth:
  mode: "demo" | "production"
  demo:
    admin_password: "secure_password_for_demo_admin"
    auto_login: true | false
  production:
    oauth_providers:
      google:
        client_id: "..."
        client_secret: "..."
      microsoft:
        client_id: "..."
        client_secret: "..."
    domains:
      - "alloweddomain.com"
```

## Conclusion

This authentication system redesign provides a flexible solution that:

1. Works seamlessly for demos without external dependencies
2. Scales to production use with enhanced security features
3. Maintains multi-tenant isolation
4. Provides a smooth user experience in all modes

By separating the authentication modes while keeping a unified token system, we can ensure that the same application code works in both demo and production environments with minimal configuration changes.