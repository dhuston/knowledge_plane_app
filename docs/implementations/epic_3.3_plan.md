# Epic 3.3: Notification & Alerts System Implementation Plan

## Overview

The Notification & Alerts System will provide users with timely information about relevant events, changes, and insights within the KnowledgePlane platform. This implementation will follow a Test-Driven Development (TDD) approach to ensure robust functionality and maintainable code.

## Use Cases

1. **Activity Notifications**: Users receive notifications about activities related to their teams, projects, and goals
2. **Insight Alerts**: AI-generated insights trigger alerts when significant patterns or risks are detected
3. **Reminders**: Time-based notifications for approaching deadlines or scheduled events
4. **System Updates**: Notifications about platform updates, maintenance, or feature releases
5. **Mention Alerts**: Notifications when a user is mentioned in notes, comments, or tasks
6. **Relationship Changes**: Alerts when organizational relationships change that affect the user

## Notification Components

### 1. Notification Model

Notifications will contain:
- Type (activity, insight, reminder, system, mention, relationship)
- Severity (info, warning, critical)
- Target users/teams
- Content (title, message)
- Related entity (user, team, project, goal) with ID
- Timestamp (created, expiry)
- Status (read/unread, dismissed)
- Action URLs (where applicable)

### 2. Delivery Channels

- In-app notification center
- Real-time WebSocket delivery
- Email (optional, based on user preferences)
- Living Map visual indicators
- Mobile push (future extension)

### 3. Notification Management

- User preferences for notification types
- Read/unread status tracking
- Dismissal and permanent removal options
- Notification history with filtering

## Implementation Plan

### Phase 1: Backend Infrastructure

#### Task 1.1: Create Notification Data Model
- Create `Notification` SQLAlchemy model
- Implement migration script for notifications table
- Add tenant isolation for proper multi-tenant security
- Create Pydantic schemas for notification objects

#### Task 1.2: Implement Notification CRUD Operations
- Create `crud_notification.py` with standard CRUD operations
- Add methods for bulk operations and filtering
- Implement tenant-aware queries
- Develop notification expiry and cleanup logic

#### Task 1.3: Create Notification API Endpoints
- Implement GET endpoint for retrieving user notifications
- Create PATCH endpoint for marking notifications as read
- Add DELETE endpoint for dismissing notifications
- Implement notification preference endpoints

#### Task 1.4: Develop WebSocket Notification Channel
- Extend existing delta stream for notification delivery
- Implement authentication for WebSocket connections
- Create notification broadcasting mechanism
- Add user-specific notification filtering

### Phase 2: Notification Generation

#### Task 2.1: Activity-Based Notification Generator
- Extend activity logging to trigger notifications
- Implement configurable rules for notification generation
- Create targeting logic to determine notification recipients
- Add content formatting for different activity types

#### Task 2.2: AI-Powered Insight Alerts
- Integrate with existing insight service
- Implement threshold-based alert triggering
- Create severity classification logic
- Develop personalized insight delivery

#### Task 2.3: Scheduled Notification System
- Create time-based notification scheduler
- Implement reminder system for approaching deadlines
- Add recurring notification capabilities
- Develop time zone-aware delivery

#### Task 2.4: System and Administrative Alerts
- Create admin interface for system-wide notifications
- Implement feature announcement notifications
- Add maintenance notification scheduling
- Create emergency broadcast capability

### Phase 3: Frontend Components

#### Task 3.1: Enhance Notification Center Component
- Extend existing NotificationCenter.tsx component
- Implement notification grouping and sorting
- Add infinite scrolling for notification history
- Create dedicated notification detail view

#### Task 3.2: Implement WebSocket Notification Client
- Extend useDeltaStream hook for notification handling
- Add real-time notification reception
- Implement notification sound/visual indicators
- Create notification count badge

#### Task 3.3: Develop User Preference Interface
- Create notification settings UI component
- Implement channel preference toggles
- Add notification type filtering options
- Create schedule-based notification preferences

#### Task 3.4: Map Integration for Visual Alerts
- Add visual indicators to map nodes with notifications
- Implement severity-based highlighting
- Create notification filtering for map view
- Add notification-triggered animations

### Phase 4: Testing and Optimization

#### Task 4.1: End-to-End Testing
- Implement comprehensive test suite
- Test notification delivery across channels
- Verify tenant isolation for notifications
- Test performance under high notification volume

#### Task 4.2: Performance Optimization
- Implement notification batching for efficiency
- Add database indexing for notification queries
- Optimize WebSocket message format
- Implement read notification archiving

#### Task 4.3: Mobile Responsiveness
- Ensure notification UI works on mobile devices
- Optimize notification display for small screens
- Implement touch-friendly notification interactions
- Test notification behavior across devices

## Technical Specifications

### Database Schema

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    action_url VARCHAR(500),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE notification_recipients (
    notification_id UUID NOT NULL,
    user_id UUID NOT NULL,
    read_at TIMESTAMP,
    dismissed_at TIMESTAMP,
    PRIMARY KEY (notification_id, user_id),
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE notification_preferences (
    user_id UUID NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (user_id, notification_type),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### API Endpoints

```
GET /api/v1/notifications - Get current user's notifications
PATCH /api/v1/notifications/{id} - Update notification status
DELETE /api/v1/notifications/{id} - Dismiss notification
GET /api/v1/notifications/preferences - Get notification preferences
PUT /api/v1/notifications/preferences - Update notification preferences
POST /api/v1/notifications/test - Send test notification (dev only)
WS /api/v1/ws/notifications - WebSocket for real-time notifications
```

### Component Structure

```
components/
├── notifications/
│   ├── NotificationCenter.tsx (main container)
│   ├── NotificationItem.tsx (individual notification)
│   ├── NotificationList.tsx (scrollable list)
│   ├── NotificationBadge.tsx (unread count)
│   ├── NotificationPreferences.tsx (settings)
│   └── NotificationDetail.tsx (expanded view)
```

### Hooks and Context

```typescript
// Notification context
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
}

// Custom hooks
const useNotifications = () => useContext(NotificationContext);
const useNotificationStream = () => {
  // WebSocket connection and message handling
};
```

## Testing Strategy

### Backend Tests

1. **Model Tests**:
   - Verify notification creation with different parameters
   - Test tenant isolation
   - Verify expiry logic

2. **API Tests**:
   - Test all notification endpoints
   - Verify permission controls
   - Test WebSocket delivery

3. **Generator Tests**:
   - Test activity to notification mapping
   - Verify insight alert generation
   - Test scheduled notification delivery

### Frontend Tests

1. **Component Tests**:
   - Test NotificationCenter rendering and interactions
   - Verify badge count updates
   - Test preference UI updates

2. **Integration Tests**:
   - Verify WebSocket notification reception
   - Test notification interactions (mark read, dismiss)
   - Test preference changes affecting notification delivery

3. **E2E Tests**:
   - Complete notification flow from generation to display
   - Test multi-user notification scenarios
   - Verify email notification delivery (if implemented)

## Implementation Timeline

| Week | Focus Area | Tasks |
|------|-----------|-------|
| 1 | Backend Foundation | Tasks 1.1, 1.2 |
| 2 | API & WebSockets | Tasks 1.3, 1.4 |
| 3 | Notification Generation | Tasks 2.1, 2.2 |
| 4 | Scheduled & Admin Alerts | Tasks 2.3, 2.4 |
| 5 | Frontend Components | Tasks 3.1, 3.2 |
| 6 | User Preferences & Map | Tasks 3.3, 3.4 |
| 7 | Testing & Optimization | Tasks 4.1, 4.2, 4.3 |

## Success Metrics

1. **Performance**:
   - Notifications delivered within 500ms of triggering event
   - System handles 100+ notifications per second
   - Frontend remains responsive with 1000+ stored notifications

2. **Usability**:
   - Users can find and manage notifications intuitively
   - Notification content is clear and actionable
   - Preferences give users control over notification volume

3. **Technical**:
   - 90%+ test coverage for notification system
   - No cross-tenant notification leakage
   - Proper error handling for all notification scenarios