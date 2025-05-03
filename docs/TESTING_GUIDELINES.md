# Testing Guidelines for Biosphere Alpha

This document outlines the testing standards and best practices for the Biosphere Alpha project to maintain high code quality and test coverage.

## Coverage Requirements

- Minimum overall test coverage: **80%**
- Minimum coverage for critical components: **90%**
- Critical components include:
  - Authentication services
  - Map visualization components
  - Multi-tenant data isolation logic
  - All API endpoints

## Testing Technologies

### Frontend Testing
- **Testing Framework**: Vitest + React Testing Library
- **Coverage Tool**: @vitest/coverage-v8
- **Browser Testing**: JSDOM

### Backend Testing
- **Testing Framework**: pytest + pytest-asyncio
- **Coverage Tool**: pytest-cov
- **Database**: In-memory SQLite or test PostgreSQL instance

## Test Types

### 1. Unit Tests
- Test individual components, functions, or methods in isolation
- Mock dependencies and external services
- Should be fast and focused on a single unit of functionality

### 2. Integration Tests
- Test interactions between components
- Verify different parts of the system work together correctly
- May involve real database interactions (with test databases)

### 3. API Tests
- Test API endpoints using FastAPI TestClient
- Verify request handling, response format, and status codes
- Test authentication and permission logic

### 4. UI Component Tests
- Test React components for correct rendering and behavior
- Verify component state changes and event handling
- Test accessibility features

## Test Organization

### Frontend Tests
- Place tests next to the components they test
- Use either `ComponentName.test.tsx` naming or place in `__tests__` directory
- Organize tests by feature/component

```
src/
  components/
    MyComponent.tsx
    MyComponent.test.tsx  # or
    __tests__/
      MyComponent.test.tsx
```

### Backend Tests
- Organize tests to mirror the application structure
- Use `test_` prefix for test files
- Group tests by module/feature

```
app/
  api/
    v1/
      endpoints/
        test_map.py
  services/
    test_briefing_service.py
```

## Test Writing Guidelines

### Frontend Tests

1. **Component Testing**
   - Test component rendering
   - Test user interactions
   - Test component state changes
   - Use `screen` queries to find elements
   - Use `user-event` for realistic user interactions

   ```tsx
   it('should update count when increment button is clicked', async () => {
     render(<Counter initialCount={0} />);
     
     expect(screen.getByText('Count: 0')).toBeInTheDocument();
     
     await userEvent.click(screen.getByRole('button', { name: /increment/i }));
     
     expect(screen.getByText('Count: 1')).toBeInTheDocument();
   });
   ```

2. **Hooks Testing**
   - Test custom hooks with `renderHook`
   - Test state updates with `act`
   - Mock dependencies and context values

   ```tsx
   it('should update state when setValue is called', () => {
     const { result } = renderHook(() => useCustomHook());
     
     act(() => {
       result.current.setValue('new value');
     });
     
     expect(result.current.value).toBe('new value');
   });
   ```

3. **Context Testing**
   - Test context providers with wrapped components
   - Test context consumers with mocked context values
   - Verify context updates propagate to consumers

### Backend Tests

1. **API Testing**
   - Test with a FastAPI TestClient
   - Test authentication and permissions
   - Test response status codes and content
   - Test error handling

   ```python
   @pytest.mark.asyncio
   async def test_get_item_not_found(client):
       response = await client.get("/api/v1/items/999")
       assert response.status_code == 404
       assert "detail" in response.json()
   ```

2. **Database Testing**
   - Use test databases or in-memory SQLite
   - Ensure proper isolation between tests
   - Clean up after tests
   - Test model relationships and constraints

3. **Service Testing**
   - Mock external dependencies
   - Test business logic independently
   - Test error handling and edge cases

## Test Fixtures and Mocks

### Frontend
- Use factory functions to create test data
- Use `vi.mock()` for mocking modules
- Use `vi.fn()` for mock functions
- Create reusable test providers for context

### Backend
- Use pytest fixtures for test data and dependencies
- Use `unittest.mock` or `pytest-mock` for mocking
- Create factory functions for test model instances

```python
@pytest.fixture
def test_user():
    return models.User(
        id=uuid4(),
        name="Test User",
        email="test@example.com",
        tenant_id=uuid4()
    )
```

## Running Tests

### Frontend
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Backend
```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=app

# Generate HTML coverage report
pytest --cov=app --cov-report=html
```

## Adding Tests for New Features

1. **Write tests first** when possible (TDD approach)
2. **Include tests in PRs** - all new features must include tests
3. **Maintain or improve coverage** - PRs should not decrease overall coverage
4. **Test edge cases** - not just the happy path

## Tips for Writing Testable Code

1. **Dependency Injection** - Use constructor or parameter injection for dependencies
2. **Avoid global state** - It makes testing difficult
3. **Single Responsibility** - Functions and components should do one thing well
4. **Pure functions** - Prefer pure functions over functions with side effects
5. **Small components** - Keep components small and focused for easier testing

## Continuous Integration

Tests run automatically:
- On all pull requests to `main`
- On pushes to the `main` branch
- Failing tests block merging

The CI pipeline:
1. Runs all tests
2. Generates coverage reports
3. Verifies coverage meets thresholds
4. Reports results on PR comments

## Debugging Tests

### Frontend
- Use `screen.debug()` to log component output
- Use `console.log()` for debugging (remove before committing)
- Run tests with `--no-timeout` for debugging

### Backend
- Use `pytest -vvs` for verbose output
- Use `pytest.set_trace()` for debugging
- Use `pytest --pdb` to debug failing tests

## Test Documentation

- Document complex test scenarios
- Explain the purpose of non-trivial tests
- Add comments for nuanced testing approaches
- Use descriptive test names