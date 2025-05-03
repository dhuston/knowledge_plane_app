# API Router Test Plan

This document outlines a comprehensive testing strategy for backend API routers to achieve 80%+ coverage.

## Current Testing Status

The current test coverage for API endpoints is limited, with only a few basic tests for map endpoints. The test_map.py file shows a good foundation but doesn't cover many important test cases or other endpoints.

### Existing Tests:
- Basic map data endpoint authentication tests
- Simple filter tests for map data
- Neighbor API endpoint basic test
- Unauthorized access test

## Test Approach

We'll use a combination of:
1. **Unit tests**: Testing individual components in isolation with mocks
2. **Integration tests**: Testing interactions between components
3. **API tests**: End-to-end testing of API endpoints

## Testing Tools

- **pytest**: Main testing framework
- **pytest-asyncio**: For testing async code
- **pytest-cov**: For coverage measurement
- **SQLAlchemy test fixtures**: For database testing
- **unittest.mock**: For mocking dependencies
- **TestClient**: FastAPI's test client for API testing

## Priority API Endpoints for Testing

Based on the analysis of the codebase, these endpoints are critical and should be tested first:

### 1. Map API (/api/v1/endpoints/map.py)
- `get_map_data` endpoint
- Helper functions like `get_neighbor_ids` and `get_entity_internal`
- Filtering and pagination logic
- Spatial query functionality

### 2. Authentication & User APIs
- Login/token endpoints
- User creation, update, and retrieval
- Permission validation
- OAuth integrations

### 3. Project & Team APIs
- CRUD operations for projects and teams
- Team membership operations
- Project participant management

### 4. Goal APIs
- Goal creation, update, and retrieval
- Goal hierarchies and relationships

### 5. Notification APIs
- Creating and retrieving notifications
- Notification preferences and filters

## Test Cases for Map API

### GET /map/data
1. **Authentication Tests**
   - Unauthorized access returns 401
   - Invalid token returns 401
   - Expired token returns 401

2. **Permission Tests**
   - Users can only access nodes within their tenant
   - Users with limited permissions see restricted data

3. **Parameter Validation Tests**
   - Invalid node type in 'types' parameter returns 400
   - Invalid UUID for center_node_id returns 422
   - Invalid depth value (< 1 or > 2) returns 422

4. **Filter Tests**
   - Type filters correctly limit returned nodes
   - Status filters correctly limit projects and goals
   - Combined type and status filters work correctly

5. **Pagination Tests**
   - Correct number of nodes returned based on limit
   - Correct nodes returned for different page values
   - Metadata indicates total available nodes/pages

6. **Centered View Tests**
   - Centered on user returns correct depth-1 neighbors
   - Centered on team returns correct depth-1 neighbors
   - Centered on project returns correct depth-1 neighbors
   - Depth-2 parameter returns extended graph

7. **Clustering Tests**
   - cluster_teams=true groups users under team nodes
   - Edges correctly re-routed to team cluster nodes

8. **Spatial Query Tests**
   - Viewport-based filtering returns correct nodes
   - Radius-based queries return nodes within radius
   - LOD scaling works correctly at different zoom levels

### Helper Functions

1. **get_entity_repository**
   - Returns correct repository for each entity type
   - Returns None for unrecognized entity types

2. **get_entity_type_from_model**
   - Returns correct type enum for different model instances
   - Returns None for unrecognized model types

3. **passes_filters**
   - Entities match type filters correctly
   - Entities match status filters correctly
   - Filtering logic correctly combines filters

4. **get_neighbor_ids**
   - User neighbors include manager, team, direct reports, projects
   - Team neighbors include lead, members, owned projects
   - Project neighbors include owner team, aligned goal, participants
   - Goal neighbors include parent goal, child goals, aligned projects

## Test Cases for User API

1. **User Creation**
   - Valid user data creates user successfully
   - Duplicate email returns appropriate error
   - Invalid data validation works correctly

2. **User Authentication**
   - Valid credentials generate valid access token
   - Invalid credentials return appropriate error
   - Password validation rules enforced

3. **User Profile Operations**
   - Get current user returns correct data
   - Update profile with valid data succeeds
   - Update with invalid data returns appropriate error

4. **User Search and Listing**
   - Search by name returns correct users
   - Filtering and pagination work correctly

## Test Cases for Team API

1. **Team CRUD Operations**
   - Create team with valid data succeeds
   - Get team by ID returns correct data
   - Update team with valid data succeeds
   - Delete team with valid ID succeeds

2. **Team Membership Operations**
   - Add user to team succeeds
   - Remove user from team succeeds
   - List team members returns correct users

3. **Team Relationships**
   - Team to projects relationship is correct
   - Team to department relationship is correct

## Implementation Plan

### Phase 1: Framework Setup
1. Create fixture factories for common test data
2. Set up database test configuration
3. Create authentication test helpers

### Phase 2: Map API Tests
1. Implement test cases for map API endpoints
2. Implement helper function tests
3. Implement filter and pagination tests

### Phase 3: User/Auth API Tests
1. Implement authentication endpoint tests
2. Implement user endpoint tests
3. Implement permission validation tests

### Phase 4: Project/Team API Tests
1. Implement project endpoint tests
2. Implement team endpoint tests
3. Implement relationship tests

### Phase 5: Additional API Tests
1. Implement goal endpoint tests
2. Implement notification endpoint tests
3. Implement remaining endpoint tests

## Example Implementation

Example test for the map data endpoint with filter parameters:

```python
@pytest.mark.asyncio
async def test_get_map_data_with_type_and_status_filters(client, test_user):
    # Prepare test data in the database
    # Users, teams, projects (some active, some inactive), goals
    
    # Make request with filters
    response = await client.get(
        "/api/v1/map/data?types=USER,PROJECT&statuses=active",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    # Validate response
    assert response.status_code == 200
    data = response.json()
    
    # Verify only USER and PROJECT nodes are returned
    assert all(node["type"] in ["USER", "PROJECT"] for node in data["nodes"])
    
    # Verify only active projects are returned
    projects = [node for node in data["nodes"] if node["type"] == "PROJECT"]
    assert all(node["data"]["status"] == "active" for node in projects)
    
    # Verify edges connect only returned nodes
    node_ids = set(node["id"] for node in data["nodes"])
    for edge in data["edges"]:
        assert edge["source"] in node_ids
        assert edge["target"] in node_ids
```

## Coverage Goals

| Area | Current Coverage | Target Coverage |
|------|------------------|----------------|
| Map API | ~20% | 90% |
| Auth API | ~30% | 85% |
| User API | ~25% | 85% |
| Team API | ~10% | 80% |
| Project API | ~15% | 80% |
| Goal API | ~5% | 80% |
| Overall | ~15% | 80% |

## Mock Strategies

### Database Mocks
- Use SQLAlchemy's testing utilities
- Create in-memory SQLite database for tests
- Mock complex database operations

### External Service Mocks
- Mock OAuth providers
- Mock Redis cache
- Mock other external dependencies

## Setup for New Tests

Each new test file should:

1. Set up the FastAPI TestClient
2. Create fixtures for authentication and database access
3. Include test data preparation helpers
4. Implement teardown to clean up resources

## Conclusion

This test plan provides a comprehensive strategy for increasing backend API test coverage to 80%+. By implementing tests following this plan, we'll ensure the reliability and correctness of our API endpoints while making future development safer and more maintainable.