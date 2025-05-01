# KnowledgePlane Testing Strategy

This document outlines the comprehensive testing strategy for the KnowledgePlane application, ensuring robust quality assurance across all components.

## 1. Unit Testing

### Frontend Unit Tests

Frontend unit tests focus on testing individual React components in isolation, ensuring they render correctly and handle state changes appropriately.

#### Key Components to Test:
- **Map Components**: `LivingMap`, `WebGLMap`, `SigmaGraphLoader`
- **Panel Components**: `ContextPanel`, `EntityDetails`, `RelationshipList`
- **UI Components**: `ViewToggle`, `SearchBox`, `FilterControls`

#### Implementation Details:
- **Framework**: Vitest with React Testing Library
- **Setup**: Tests are configured in `setupTests.ts` with `@testing-library/jest-dom` extensions
- **Patterns**: 
  - Use `renderWithProviders` helper for components requiring context
  - Mock API calls and external dependencies
  - Test component rendering, state changes, and user interactions

### Backend Unit Tests

Backend unit tests verify the correctness of business logic, data processing functions, and API endpoint handlers.

#### Key Areas to Test:
- **Service Functions**: `insight_service`, `briefing_service`, `entity_recognition_service`
- **CRUD Operations**: Data retrieval, creation, update, and deletion functions
- **Authentication Logic**: Token generation, validation, and permission checks

#### Implementation Details:
- **Framework**: Jest with pytest for Python code
- **Patterns**:
  - Use fixtures for test data and mocked dependencies
  - Mock database sessions and external services
  - Test both success paths and error handling

## 2. Integration Testing

Integration tests verify that components work correctly together, focusing on data flow between components and services.

### Frontend Integration Tests
- Test data flow between map components and context panels
- Verify search functionality and filter interactions
- Test loading and error states across component boundaries

### Backend Integration Tests
- Test API endpoint chains that involve multiple services
- Verify database operations across related entities
- Test authentication flow from login to protected resource access

## 3. Visual Regression Testing

Visual regression testing ensures UI components maintain their appearance across code changes.

### Implementation Details:
- **Tools**: Custom visual snapshot utilities
- **Components to Test**:
  - Map component renderers
  - Node and edge styling
  - Loading and error states
  - Context panels and entity details
- **Pattern**: Compare DOM snapshots between test runs to detect visual changes

### Key Features:
- Extracts and compares only properties relevant to visual appearance
- Configurable depth for component tree snapshots
- Filters out non-visual properties to reduce noise in snapshots

## 4. End-to-End Testing

End-to-end tests verify complete user flows by simulating real user interactions with the application.

### Key User Flows:
- User login and session management
- Map navigation and node interactions
- Entity relationship exploration
- Search and filter operations
- Context panel interactions

### Implementation (Future Work):
- **Framework**: Cypress or Playwright
- **Pattern**: Record key user journeys and verify outcomes

## 5. Testing Principles

### Test Organization
- Tests are collocated with the code they test (same directory)
- Naming convention: `*.test.tsx` for frontend, `test_*.py` for backend
- Group related tests with `describe` blocks
- Use clear, descriptive test names that explain the expected behavior

### Test Coverage
- Critical business logic should have 90%+ coverage
- UI components should have tests for:
  - Initial rendering
  - User interactions
  - State changes
  - Error states
- API endpoints should be tested for:
  - Valid inputs
  - Invalid inputs
  - Authentication checks

### Mock Strategy
- External dependencies are always mocked
- Component dependencies are mocked for unit tests
- Database is mocked for all tests except specific DB integration tests

## 6. Continuous Integration

Tests should be run automatically on:
- Pull requests
- Merges to main branch
- Scheduled nightly runs

### CI Pipeline Stages:
1. Lint checks
2. Type checking
3. Unit tests
4. Integration tests
5. Visual regression tests
6. End-to-end tests (future)

## 7. Tools and Libraries

### Frontend
- Vitest for test runner
- React Testing Library for component testing
- jsdom for browser environment simulation
- Custom visual regression utilities

### Backend
- Jest and pytest for test runners
- FastAPI TestClient for API testing
- unittest.mock for mocking dependencies

## 8. Next Steps and Improvements

- Implement end-to-end testing framework
- Add performance testing for map component with large datasets
- Create testing documentation and examples for contributors
- Set up test coverage reporting and monitoring