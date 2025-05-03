# Microsoft Outlook Integration

## Overview

This document provides technical details about the Microsoft Outlook calendar integration for the KnowledgePlane AI platform. The integration allows users to see their Microsoft Outlook calendar events in their daily briefings and other platform features.

## Components

The integration consists of several components:

1. **Microsoft Outlook Service** (`microsoft_outlook_service.py`): Core service for interacting with Microsoft Graph API
2. **Calendar Schema** (`schemas/calendar.py`): Pydantic models for calendar data
3. **Calendar API Endpoints** (`api/v1/endpoints/calendar.py`): API routes for calendar operations
4. **OAuth Integration**: Authentication with Microsoft Graph API

## Setup Requirements

### Microsoft Azure Application Registration

To enable Microsoft Outlook integration, you need to register an application in the Microsoft Azure portal:

1. Log in to the [Azure Portal](https://portal.azure.com)
2. Navigate to "App registrations"
3. Create a new registration with the following settings:
   - Name: KnowledgePlane AI
   - Supported account types: Single tenant or multi-tenant based on your needs
   - Redirect URI: `https://your-app-domain.com/api/v1/auth/callback/microsoft`
4. Under API permissions, add the following Microsoft Graph permissions:
   - `Calendars.Read`
   - `User.Read`
   - `offline_access`
5. Create a client secret

### Environment Variables

Add the following environment variables to your backend configuration:

```
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret
MICROSOFT_REDIRECT_URI=https://your-app-domain.com/api/v1/auth/callback/microsoft
MICROSOFT_AUTHORITY=https://login.microsoftonline.com/common
```

## Authentication Flow

1. User initiates login with Microsoft
2. User is redirected to Microsoft login page
3. After successful login, user is redirected back to the application
4. The application exchanges the authorization code for access and refresh tokens
5. Tokens are stored in the user's record in the database
6. The refresh token is used to obtain new access tokens when needed

## Token Handling

The `refresh_microsoft_token` function in `microsoft_outlook_service.py` handles token refresh when the access token expires. This function:

1. Retrieves the refresh token from the user record
2. Makes a request to the Microsoft token endpoint
3. Updates the user record with the new tokens
4. Returns the new access token

## Calendar Events API

### Endpoints

- **GET /api/v1/calendar/events/today**: Retrieves calendar events for the current day
- **GET /api/v1/calendar/events/range**: Retrieves calendar events within a specified date range

### Example Response

```json
[
  {
    "id": "AAMkADg0NDc3MjQ0LTUyODgtNDQ2Yy1iNGNhLTQ1YzAyMzJkMDc5MQBGAAAAAABQtDobc7FES6_V7AbU_PP-BwDcsTEAN",
    "title": "Project Status Meeting",
    "start": "2025-05-03T14:00:00Z",
    "end": "2025-05-03T15:00:00Z",
    "location": "Conference Room A",
    "organizer": {
      "name": "Jane Smith",
      "email": "jane.smith@example.com"
    },
    "attendees": [
      {
        "name": "John Doe",
        "email": "john.doe@example.com",
        "status": "accepted"
      }
    ],
    "onlineMeetingUrl": "https://teams.microsoft.com/l/meetup-join/19%3ameeting_...",
    "source": "microsoft_outlook"
  }
]
```

## Integration with Briefing Service

The `BriefingService` class has been enhanced to support multiple calendar sources:

1. The `_get_available_calendar_sources` method detects which calendar integrations are available for a user
2. The `_get_calendar_summary` method retrieves events from the preferred calendar source
3. If the preferred source fails, it falls back to other available sources

## Error Handling

The service implements comprehensive error handling:

1. Token refresh errors
2. API request failures
3. Permission issues
4. Rate limiting
5. Network errors

All errors are properly logged and appropriate fallback mechanisms are in place.

## Testing

Unit tests are available in:
- `app/tests/services/test_microsoft_outlook_service.py`
- `app/tests/api/v1/endpoints/test_calendar.py`

Run tests with:
```bash
cd backend
poetry run pytest app/tests/services/test_microsoft_outlook_service.py -v
```

## Limitations

1. The integration currently supports read-only access to calendar events
2. Calendar event creation/modification is not supported yet
3. Recurring meeting exceptions are handled but complex recurrence patterns may have edge cases
4. Free/busy information is not currently used

## Future Enhancements

1. Write support for calendar operations (create/update/delete events)
2. Integration with user availability status
3. Meeting suggestions based on AI insights
4. Calendar analytics for time management insights
5. Meeting scheduling optimization