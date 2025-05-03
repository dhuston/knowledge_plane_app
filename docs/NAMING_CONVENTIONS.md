# Biosphere Alpha Naming Conventions

This document outlines the standardized naming conventions to be used throughout the Biosphere Alpha codebase.

## Table of Contents
- [Frontend Conventions](#frontend-conventions)
  - [Component Files](#component-files)
  - [Component Functions](#component-functions)
  - [Interfaces and Types](#interfaces-and-types)
  - [Props](#props)
  - [Custom Hooks](#custom-hooks)
  - [Test Files](#test-files)
- [Backend Conventions](#backend-conventions)
  - [Python Files](#python-files)
  - [Classes](#classes)
  - [Functions and Methods](#functions-and-methods)
  - [Variables](#variables)
  - [Database Models](#database-models)
- [Directory Structure](#directory-structure)

## Frontend Conventions

### Component Files

**Pattern**: PascalCase with `.tsx` extension

```
Badge.tsx
UserNode.tsx
LivingMap.tsx
ContextPanel.tsx
```

### Component Functions

**Pattern**: PascalCase for React components

```tsx
// Default exports
const Badge: React.FC<BadgeProps> = ({ variant, children }) => {
  // Implementation
};

// Named exports
export const UserNodeContent: React.FC = () => {
  // Implementation
};
```

**Optimization**:
- Use `React.memo` for pure components that render often but rarely change
```tsx
const UserNode = React.memo<UserNodeProps>(({ user }) => {
  // Implementation
});
```

### Interfaces and Types

**Pattern**: PascalCase with descriptive suffixes

- Component props: PascalCase with `Props` suffix
  ```tsx
  interface BadgeProps {
    variant: 'success' | 'error' | 'warning';
    size?: 'sm' | 'md' | 'lg';
    withIcon?: boolean;
  }
  ```

- Domain types: PascalCase with appropriate descriptive name
  ```tsx
  interface User {
    id: string;
    name: string;
    email: string;
  }

  type NotificationType = 'info' | 'warning' | 'error';
  ```

- Avoid "I" prefixes (e.g., use `User` instead of `IUser`)
- When matching backend types, convert snake_case to camelCase except when explicit mapping to API responses is required

### Props

**Pattern**: camelCase

- Standard props: `variant`, `size`, `color`
- Boolean props: use prefixes like "is", "has", or "with"
  ```tsx
  isLoading
  hasError
  withIcon
  ```

- Event handler props: use "on" prefix
  ```tsx
  onClick
  onClose
  onSearch
  ```

### Custom Hooks

**Pattern**: camelCase with "use" prefix, filename matches hook name exactly

```tsx
// In useApiClient.ts
export const useApiClient = () => {
  // Implementation
};

// In useDeltaStream.ts
const useDeltaStream = (onMessage) => {
  // Implementation
};
```

### Test Files

**Pattern**: Match component name with `.test.tsx` suffix

```
Badge.test.tsx
UserNode.test.tsx
```

Test files should be placed either:
- In a `__tests__` subdirectory within the component directory
- Adjacent to the component file they test

## Backend Conventions

### Python Files

**Pattern**: snake_case

```
auth.py
crud_user.py
security.py
```

### Classes

**Pattern**: PascalCase

```python
class UserModel:
    pass

class ProjectService:
    pass
```

### Functions and Methods

**Pattern**: snake_case

```python
def get_user_by_email(email: str):
    pass

def create_access_token(subject: str, expires_delta: timedelta):
    pass
```

### Variables

**Pattern**: snake_case

```python
user_id = "123"
access_token = generate_token()
is_active = True
```

### Database Models

**Pattern**: PascalCase for class names

```python
class User(Base):
    __tablename__ = "users"
    id = Column(UUID, primary_key=True)
    email = Column(String, unique=True, index=True)
```

Fields follow snake_case to match database column names.

## Directory Structure

**Frontend Directories**: kebab-case
```
components/
├── entity-panels/
├── map-integration/
├── __tests__/
```

**Backend Directories**: snake_case
```
app/
├── api/
│   ├── v1/
│   │   ├── endpoints/
├── core/
├── crud/
```

This convention document serves as a reference guide for all contributors to maintain consistency across the codebase. Following these conventions will improve readability, maintainability, and collaboration efficiency on the Biosphere Alpha project.