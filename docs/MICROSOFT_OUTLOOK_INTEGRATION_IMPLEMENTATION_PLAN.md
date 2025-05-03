# Microsoft Outlook Integration Implementation Plan

## Introduction

This document outlines a detailed, step-by-step implementation plan for integrating Microsoft Outlook calendar data with our daily briefing feature. The implementation follows Test-Driven Development (TDD) principles, focusing on writing tests first, followed by the minimal implementation needed to pass those tests, and then refactoring as needed.

## Implementation Timeline and Dependencies

The implementation will follow this sequence, respecting dependencies between components:

1. Backend Services (Week 1)
   - Microsoft Outlook Calendar Service
   - Updated Briefing Service
   - API Endpoints

2. Frontend Updates (Week 2)
   - useCalendarEvents Hook
   - Enhanced DailyBriefing Component
   - Authentication Handling

3. Testing & Polishing (Week 3)
   - Integration Testing
   - Performance Optimization
   - Bug Fixing

## Detailed Implementation Steps

### Phase 1: Backend Service Implementation

#### 1. Microsoft Outlook Calendar Service

1. **Create Test File**
   - Create `test_microsoft_outlook_service.py`
   - Define test cases for token refresh, service initialization, and event fetching
   - Use appropriate mocking for Microsoft Graph API responses

2. **Implement Service File**
   - Create `microsoft_outlook_service.py`
   - Implement token refresh similar to Google Calendar approach
   - Create service initialization function
   - Implement calendar event fetching with date filtering
   - Add error handling and logging

3. **Key Components**:
   ```python
   # Main service functions
   async def refresh_microsoft_token(user: UserModel) -> tuple[str, datetime | None]
   async def get_microsoft_outlook_service(user: UserModel, db: AsyncSession | None = None)
   async def get_todays_calendar_events(service) -> list
   async def get_calendar_events_range(service, start_date: datetime, end_date: datetime) -> list
   ```

#### 2. Update Briefing Service

1. **Create Test File**
   - Update `test_briefing_service.py` with new test cases
   - Test calendar provider detection
   - Test calendar event fetching with multiple sources
   - Test fallback behavior

2. **Update Service**
   - Modify `briefing_service.py`
   - Update `_get_calendar_summary` to detect and use appropriate calendar service
   - Implement provider preference logic
   - Add fallback mechanism
   - Normalize event format across providers

3. **Key Updates**:
   ```python
   # New function to determine available calendar sources
   async def _get_available_calendar_sources(self, user: models.User) -> List[str]
   
   # Updated function to get calendar events from any source
   async def _get_calendar_summary(self, user: models.User, preferred_source: Optional[str] = None) -> Optional[str]
   ```

#### 3. Calendar API Endpoints

1. **Create Test File**
   - Create `test_calendar.py` for endpoint tests
   - Test authorization requirements
   - Test event retrieval with different parameters
   - Test error cases

2. **Implement Endpoints**
   - Create `calendar.py` endpoints file
   - Implement GET endpoint for today's events
   - Implement GET endpoint for date range events
   - Add parameters for calendar source preference
   - Implement proper error handling

3. **Key Endpoints**:
   ```python
   @router.get("/events/today", response_model=List[schemas.CalendarEvent])
   async def get_today_events(
       db: AsyncSession = Depends(get_db_session),
       current_user: models.User = Depends(security.get_current_user),
       source: Optional[str] = None
   )
   
   @router.get("/events/range", response_model=List[schemas.CalendarEvent])
   async def get_events_range(
       start_date: str,
       end_date: str,
       db: AsyncSession = Depends(get_db_session),
       current_user: models.User = Depends(security.get_current_user),
       source: Optional[str] = None
   )
   ```

### Phase 2: Frontend Implementation

#### 4. Update useCalendarEvents Hook

1. **Create Test File**
   - Update/create `useCalendarEvents.test.ts`
   - Test API call behavior
   - Test error handling
   - Test loading states
   - Test caching behavior

2. **Update Hook**
   - Modify `useCalendarEvents.ts`
   - Replace mock data with API calls
   - Add proper error and loading states
   - Implement caching mechanism
   - Add source preference parameter

3. **Key Changes**:
   ```typescript
   // Updated hook signature
   export function useCalendarEvents(options?: {
     source?: string;
     cacheTime?: number;
   }): CalendarHookResult {
     // Implementation
   }
   ```

#### 5. Enhance DailyBriefing Component

1. **Create Test File**
   - Update `DailyBriefing.test.tsx`
   - Test rendering with different event types
   - Test Teams meeting link handling
   - Test loading and error states

2. **Update Component**
   - Enhance `DailyBriefing.tsx`
   - Add Teams meeting link detection and rendering
   - Add calendar source indicators
   - Improve event type visualization
   - Add proper loading and error states

3. **Key Updates**:
   ```tsx
   // Helper function to render meeting links
   const renderMeetingLink = (event: CalendarEvent) => {
     if (event.onlineMeetingUrl) {
       // Render Teams or other meeting link
     }
     return null;
   };
   ```

#### 6. Authentication State Handling

1. **Create Test File**
   - Create tests for authentication state components
   - Test authentication prompts
   - Test error recovery flows

2. **Implement Components**
   - Create AuthPrompt component for calendar services
   - Add authentication state checking to calendar hooks
   - Implement user-friendly error messages

### Phase 3: Integration & Final Testing

#### 7. Integration Testing

1. **Backend Integration Tests**
   - Create tests that verify entire flow from API to service
   - Test multi-tenant isolation
   - Test authorization boundaries

2. **Frontend Integration Tests**
   - Test full rendering flow with API mocks
   - Test user interactions with authentication

#### 8. Final Optimization & Polishing

1. **Performance Optimization**
   - Add caching layer for calendar data
   - Implement lazy loading for event details
   - Optimize database queries

2. **Documentation & Examples**
   - Update API documentation
   - Add examples for developers
   - Update user guide

## Testing Strategy

Following TDD principles, each component will have tests written before implementation:

1. **Unit Tests**
   - Test individual functions in isolation
   - Use mocks for external dependencies
   - Test edge cases and error conditions

2. **Integration Tests**
   - Test interactions between components
   - Test end-to-end flows with mocked external services

3. **API Tests**
   - Test API endpoints for correct behavior
   - Test authorization and authentication

4. **Frontend Tests**
   - Test hooks with mocked API responses
   - Test component rendering with various data scenarios
   - Test user interactions

## Success Metrics

The implementation will be considered successful when:

1. All tests pass with good coverage
2. The daily briefing shows real calendar data from Microsoft Outlook
3. Users can see event details including Teams meeting links
4. The system gracefully handles authentication issues
5. Performance meets or exceeds benchmarks (< 200ms to load calendar data)