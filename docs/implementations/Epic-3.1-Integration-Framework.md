# Epic 3.1: Integration Framework Implementation Plan

## 1. Overview

The Integration Framework is a critical component of the KnowledgePlane platform, enabling connections with external enterprise systems to provide rich data for the Living Map visualization. This framework will allow the system to ingest, process, and synchronize data from various sources while maintaining proper tenant isolation and data consistency.

## 2. Architecture Design

### 2.1 Core Integration Components

The Integration Framework will consist of the following major components:

1. **Integration Core**
   - Core abstractions and interfaces
   - Configuration management
   - Authentication/credential management
   - Scheduler and execution engine
   - Error handling and retry logic

2. **Connector System**
   - Base connector interface
   - Protocol-specific connectors (REST, GraphQL, LDAP, etc.)
   - Service-specific connectors (Google Workspace, Microsoft 365, etc.)
   - Connector registry and discovery

3. **Data Processing Pipeline**
   - Data extraction
   - Data transformation
   - Data validation
   - Entity mapping and matching
   - Relationship detection

4. **Integration Management**
   - Admin interface for integration configuration
   - Monitoring and health checks
   - Logging and auditing
   - Rate limiting and throttling

### 2.2 High-Level Architecture Diagram

```
                   ┌───────────────────────────┐
                   │     Integration Core      │
                   └───────────────────────────┘
                             ▲
                             │
                 ┌───────────┼───────────┐
                 │           │           │
    ┌────────────▼─┐   ┌─────▼─────┐   ┌─▼──────────────┐
    │  Connectors  │   │Processors │   │    Management  │
    └──────────────┘   └───────────┘   └────────────────┘
           ▲                 │                 ▲
           │                 │                 │
           │                 ▼                 │
           │        ┌─────────────┐           │
           └────────│   Entity    │───────────┘
                    │  Database   │
                    └─────────────┘
```

### 2.3 Data Flow

1. **Ingestion**:
   - Connectors pull data from external systems based on schedules
   - Data is validated and normalized to internal schema
   - Changes are detected compared to previous sync

2. **Processing**:
   - Entity data is mapped to internal models
   - Relationships between entities are identified
   - Metrics and insights are extracted
   - Data is enriched with additional context

3. **Storage**:
   - Processed data is stored in the main database
   - Graph nodes and edges are created or updated
   - Historical data is archived for auditing

4. **Notification**:
   - Changes are published to message queue
   - Real-time updates are pushed to user interfaces
   - Integration health events are logged

## 3. Implementation Plan

### 3.1 Phase 1: Foundation (Weeks 1-2)

#### Core Integration Framework
- Create integration core package structure
- Define base interfaces and abstract classes
- Implement configuration management system
- Build credential storage and retrieval system
- Create integration registry for dynamic loading

#### Integration Models and Database Schema
- Design and implement integration configuration tables
- Create integration status and history models
- Add credential secure storage
- Implement schedule and execution tracking

#### Basic Admin Interface
- Create API endpoints for integration management
- Implement integration health check endpoints
- Build basic integration configuration UI

### 3.2 Phase 2: Connector System (Weeks 3-5)

#### Connector Base Classes
- Implement BaseConnector abstract class
- Create connector discovery and registry mechanism
- Build connection pooling and reuse system
- Implement rate limiting and backoff strategies

#### Protocol-Specific Connectors
- REST API connector with OAuth support
- GraphQL connector
- LDAP connector
- Database connectors (JDBC, ODBC)

#### Service-Specific Connectors
- Google Workspace connector
- Microsoft 365 connector
- Generic OAuth2 connector template

### 3.3 Phase 3: Data Processing Pipeline (Weeks 6-7)

#### Data Extraction
- Implement data pagination handling
- Build incremental sync capability
- Create data change detection

#### Data Transformation and Mapping
- Implement schema mapping engine
- Build entity property transformation
- Create relationship inference system

#### Entity Resolution
- Design and implement entity matching
- Build entity merging and deduplication
- Create confidence scoring for matches

### 3.4 Phase 4: Specific Integration Types (Weeks 8-12)

#### Research Paper Integration
- Implement academic database connectors
- Build citation network analysis
- Create paper metadata extraction and topic modeling

#### Calendar Integration
- Enhance Google Calendar connector
- Implement Microsoft Outlook connector
- Build meeting analysis and classification

#### Team Directory Integration
- Implement Active Directory connector
- Build Google Workspace directory connector
- Create team structure synchronization

#### Project System Integration
- Implement Jira connector
- Build Azure DevOps connector
- Create project data synchronization

#### Goal Tracking Integration
- Implement OKR platform connectors
- Build goal hierarchy mapping
- Create goal-team relationship mapping

### 3.5 Phase 5: Integration Management (Weeks 13-14)

#### Admin Interface
- Build integration setup wizards
- Implement integration health dashboards
- Create integration troubleshooting tools

#### Monitoring and Logging
- Implement detailed integration logging
- Build health monitoring and alerting
- Create integration metrics dashboard

#### Testing and Documentation
- Complete integration test suite
- Create integration developer documentation
- Build connector development guide

## 4. Technical Design

### 4.1 Integration Core

#### 4.1.1 Interfaces and Abstract Classes

```python
# Key interfaces and abstract classes

class BaseConnector(ABC):
    """Base interface for all integration connectors."""
    
    @abstractmethod
    async def connect(self) -> bool:
        """Establish connection to external system."""
        pass
    
    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """Test if the connection to the external system is working."""
        pass
    
    @abstractmethod
    async def fetch_data(self, entity_type: str, last_sync: Optional[datetime] = None) -> AsyncIterator[Dict[str, Any]]:
        """Fetch data from external system."""
        pass

class BaseProcessor(ABC):
    """Base interface for data processors."""
    
    @abstractmethod
    async def process_entity(self, raw_data: Dict[str, Any], entity_type: str) -> Optional[Dict[str, Any]]:
        """Process a single entity from raw data."""
        pass
    
    @abstractmethod
    async def process_relationship(self, source_entity: Dict[str, Any], target_entity: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process relationship between two entities."""
        pass

class IntegrationManager:
    """Manages the lifecycle of integrations."""
    
    async def register_integration(self, integration_config: Dict[str, Any]) -> UUID:
        """Register a new integration."""
        pass
    
    async def update_integration(self, integration_id: UUID, config: Dict[str, Any]) -> bool:
        """Update an existing integration."""
        pass
    
    async def run_integration(self, integration_id: UUID) -> Dict[str, Any]:
        """Run an integration manually."""
        pass
    
    async def get_integration_status(self, integration_id: UUID) -> Dict[str, Any]:
        """Get current status of an integration."""
        pass
```

#### 4.1.2. Database Models

```python
class Integration(Base):
    """Integration configuration table."""
    __tablename__ = "integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    integration_type = Column(String, nullable=False)  # e.g., "google_calendar", "microsoft_teams"
    config = Column(JSONB, nullable=False)  # Configuration specific to this integration
    is_enabled = Column(Boolean, default=True, nullable=False)
    schedule = Column(String, nullable=True)  # Cron expression for scheduling
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=False)

class IntegrationCredential(Base):
    """Securely stored credentials for integrations."""
    __tablename__ = "integration_credentials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    integration_id = Column(UUID(as_uuid=True), ForeignKey("integrations.id", ondelete="CASCADE"), index=True, nullable=False)
    credential_type = Column(String, nullable=False)  # e.g., "oauth2", "api_key", "basic_auth"
    credentials = Column(JSONB, nullable=False)  # Encrypted credentials
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=False)

class IntegrationRun(Base):
    """Record of integration execution runs."""
    __tablename__ = "integration_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    integration_id = Column(UUID(as_uuid=True), ForeignKey("integrations.id", ondelete="CASCADE"), index=True, nullable=False)
    status = Column(String, nullable=False)  # "running", "success", "failed", etc.
    start_time = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    entity_count = Column(Integer, default=0, nullable=False)
    error_count = Column(Integer, default=0, nullable=False)
    details = Column(JSONB, nullable=True)  # Additional details about the run
```

### 4.2 API Endpoints

#### 4.2.1 Integration Management Endpoints

```
# Integration Management API

GET /api/v1/integrations
POST /api/v1/integrations
GET /api/v1/integrations/{integration_id}
PUT /api/v1/integrations/{integration_id}
DELETE /api/v1/integrations/{integration_id}

# Integration Operations
POST /api/v1/integrations/{integration_id}/run
GET /api/v1/integrations/{integration_id}/status
GET /api/v1/integrations/{integration_id}/history

# Integration Authentication
POST /api/v1/integrations/{integration_id}/auth/initiate
GET /api/v1/integrations/auth/callback

# Integration Specific Data Endpoints
GET /api/v1/integrations/{integration_id}/entities
GET /api/v1/integrations/{integration_id}/preview
```

### 4.3 Connector Implementation Examples

#### 4.3.1 Google Calendar Connector

```python
class GoogleCalendarConnector(BaseConnector):
    """Connector for Google Calendar API."""
    
    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        self.config = config
        self.credentials = credentials
        self.service = None
    
    async def connect(self) -> bool:
        """Establish connection to Google Calendar API."""
        try:
            creds = Credentials(
                token=self.credentials.get("access_token"),
                refresh_token=self.credentials.get("refresh_token"),
                client_id=self.config.get("client_id"),
                client_secret=self.config.get("client_secret"),
                token_uri="https://oauth2.googleapis.com/token",
            )
            
            # Refresh token if expired
            if creds.expired:
                creds.refresh(GoogleAuthRequest())
                # Update stored credentials with new token
                
            self.service = build('calendar', 'v3', credentials=creds, cache_discovery=False)
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Google Calendar: {e}")
            return False
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test if the connection to Google Calendar is working."""
        if not self.service:
            await self.connect()
        
        try:
            # Try to list calendars to test connection
            calendars = await asyncio.to_thread(
                lambda: self.service.calendarList().list().execute()
            )
            return {
                "status": "success",
                "message": f"Successfully connected to Google Calendar. Found {len(calendars.get('items', []))} calendars."
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to connect to Google Calendar: {str(e)}"
            }
    
    async def fetch_data(self, entity_type: str, last_sync: Optional[datetime] = None) -> AsyncIterator[Dict[str, Any]]:
        """Fetch calendar data from Google Calendar."""
        if not self.service:
            await self.connect()
        
        if entity_type == "calendar_event":
            # Calculate time range
            if last_sync:
                time_min = last_sync.isoformat()
            else:
                time_min = (datetime.now() - timedelta(days=30)).isoformat()
            
            time_max = (datetime.now() + timedelta(days=30)).isoformat()
            
            # Get list of calendars
            calendars_result = await asyncio.to_thread(
                lambda: self.service.calendarList().list().execute()
            )
            
            calendars = calendars_result.get('items', [])
            
            # Fetch events from each calendar
            for calendar in calendars:
                calendar_id = calendar.get('id')
                
                # Use pagination to fetch all events
                page_token = None
                while True:
                    events_result = await asyncio.to_thread(
                        lambda: self.service.events().list(
                            calendarId=calendar_id,
                            timeMin=time_min,
                            timeMax=time_max,
                            maxResults=100,
                            singleEvents=True,
                            orderBy='startTime',
                            pageToken=page_token
                        ).execute()
                    )
                    
                    events = events_result.get('items', [])
                    
                    for event in events:
                        yield {
                            "id": event.get('id'),
                            "calendar_id": calendar_id,
                            "calendar_name": calendar.get('summary'),
                            "summary": event.get('summary'),
                            "description": event.get('description'),
                            "start": event.get('start'),
                            "end": event.get('end'),
                            "attendees": event.get('attendees', []),
                            "location": event.get('location'),
                            "organizer": event.get('organizer'),
                            "recurrence": event.get('recurrence'),
                            "status": event.get('status'),
                            "raw_data": event
                        }
                    
                    page_token = events_result.get('nextPageToken')
                    if not page_token:
                        break
```

#### 4.3.2 Jira Connector

```python
class JiraConnector(BaseConnector):
    """Connector for Jira API."""
    
    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        self.config = config
        self.credentials = credentials
        self.client = None
    
    async def connect(self) -> bool:
        """Establish connection to Jira API."""
        try:
            # Create Jira client using credentials
            self.client = JIRA(
                server=self.config.get("server_url"),
                basic_auth=(
                    self.credentials.get("username"),
                    self.credentials.get("api_token")
                )
            )
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Jira: {e}")
            return False
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test if the connection to Jira is working."""
        if not self.client:
            await self.connect()
        
        try:
            # Try to get server info to test connection
            server_info = await asyncio.to_thread(self.client.server_info)
            return {
                "status": "success",
                "message": f"Successfully connected to Jira {server_info.get('version')}"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Failed to connect to Jira: {str(e)}"
            }
    
    async def fetch_data(self, entity_type: str, last_sync: Optional[datetime] = None) -> AsyncIterator[Dict[str, Any]]:
        """Fetch data from Jira API."""
        if not self.client:
            await self.connect()
        
        if entity_type == "project":
            # Fetch projects
            projects = await asyncio.to_thread(self.client.projects)
            
            for project in projects:
                project_data = await asyncio.to_thread(
                    lambda: self.client.project(project.id)
                )
                
                yield {
                    "id": project.id,
                    "key": project.key,
                    "name": project.name,
                    "description": getattr(project, "description", None),
                    "lead": getattr(project_data, "lead", {}).get("displayName") if hasattr(project_data, "lead") else None,
                    "raw_data": project_data.__dict__
                }
                
        elif entity_type == "issue":
            # Create JQL query based on last sync time
            jql = ""
            if last_sync:
                last_sync_str = last_sync.strftime("%Y-%m-%d %H:%M")
                jql = f"updated >= '{last_sync_str}'"
            
            # Fetch issues with pagination
            start_at = 0
            max_results = 50
            
            while True:
                issues = await asyncio.to_thread(
                    lambda: self.client.search_issues(
                        jql,
                        startAt=start_at,
                        maxResults=max_results,
                        expand="changelog"
                    )
                )
                
                if not issues:
                    break
                    
                for issue in issues:
                    assignee = None
                    if hasattr(issue.fields, "assignee") and issue.fields.assignee:
                        assignee = {
                            "name": issue.fields.assignee.displayName,
                            "email": getattr(issue.fields.assignee, "emailAddress", None),
                            "id": issue.fields.assignee.accountId
                        }
                    
                    yield {
                        "id": issue.id,
                        "key": issue.key,
                        "summary": issue.fields.summary,
                        "description": issue.fields.description,
                        "status": issue.fields.status.name,
                        "issue_type": issue.fields.issuetype.name,
                        "project_id": issue.fields.project.id,
                        "project_key": issue.fields.project.key,
                        "assignee": assignee,
                        "reporter": {
                            "name": issue.fields.reporter.displayName,
                            "email": getattr(issue.fields.reporter, "emailAddress", None),
                            "id": issue.fields.reporter.accountId
                        } if hasattr(issue.fields, "reporter") and issue.fields.reporter else None,
                        "created": issue.fields.created,
                        "updated": issue.fields.updated,
                        "raw_data": {
                            "fields": {k: v for k, v in issue.fields.__dict__.items() if not k.startswith("_")}
                        }
                    }
                
                if len(issues) < max_results:
                    break
                    
                start_at += max_results
```

### 4.4 Data Processing Examples

#### 4.4.1 Calendar Event Processor

```python
class CalendarEventProcessor(BaseProcessor):
    """Process calendar events into internal entities."""
    
    def __init__(self, db: AsyncSession, tenant_id: UUID):
        self.db = db
        self.tenant_id = tenant_id
    
    async def process_entity(self, raw_data: Dict[str, Any], entity_type: str) -> Optional[Dict[str, Any]]:
        """Process a calendar event into an internal entity."""
        if entity_type != "calendar_event":
            return None
        
        # Extract event details
        event_id = raw_data.get("id")
        calendar_id = raw_data.get("calendar_id")
        
        # Create a unique ID for this event within our system
        unique_id = str(uuid4())
        
        # Check if this event already exists in our system
        existing_node = await self.db.execute(
            select(Node).where(
                and_(
                    Node.tenant_id == self.tenant_id,
                    Node.type == "calendar_event",
                    Node.props["external_id"].astext == event_id,
                    Node.props["calendar_id"].astext == calendar_id
                )
            )
        )
        existing_node = existing_node.scalars().first()
        
        # Prepare node properties
        props = {
            "title": raw_data.get("summary"),
            "description": raw_data.get("description"),
            "start_time": raw_data.get("start", {}).get("dateTime"),
            "end_time": raw_data.get("end", {}).get("dateTime"),
            "location": raw_data.get("location"),
            "calendar_id": calendar_id,
            "calendar_name": raw_data.get("calendar_name"),
            "external_id": event_id,
            "status": raw_data.get("status"),
            "last_updated": datetime.now().isoformat()
        }
        
        # Create or update node
        if existing_node:
            # Update existing node
            existing_node.props = props
            self.db.add(existing_node)
            node_id = existing_node.id
        else:
            # Create new node
            new_node = Node(
                id=UUID(unique_id),
                tenant_id=self.tenant_id,
                type="calendar_event",
                props=props
            )
            self.db.add(new_node)
            node_id = new_node.id
        
        await self.db.commit()
        
        # Process attendees to create relationships
        await self._process_attendees(node_id, raw_data.get("attendees", []))
        
        return {
            "id": node_id,
            "type": "calendar_event",
            "props": props
        }
    
    async def _process_attendees(self, event_node_id: UUID, attendees: List[Dict[str, Any]]):
        """Process event attendees and create relationships to user nodes."""
        for attendee in attendees:
            email = attendee.get("email")
            if not email:
                continue
            
            # Find user by email
            user_node = await self.db.execute(
                select(Node).where(
                    and_(
                        Node.tenant_id == self.tenant_id,
                        Node.type == "user",
                        Node.props["email"].astext == email
                    )
                )
            )
            user_node = user_node.scalars().first()
            
            if user_node:
                # Create relationship between user and event
                edge = Edge(
                    tenant_id=self.tenant_id,
                    src=user_node.id,
                    dst=event_node_id,
                    label="PARTICIPATES_IN",
                    props={
                        "response_status": attendee.get("responseStatus"),
                        "is_organizer": attendee.get("organizer", False),
                        "is_optional": attendee.get("optional", False)
                    }
                )
                self.db.add(edge)
        
        await self.db.commit()
    
    async def process_relationship(self, source_entity: Dict[str, Any], target_entity: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process relationship between two entities."""
        # This could be used for calendar-specific relationships like recurring events
        return None
```

### 4.5 Integration Management UI

The admin interface for managing integrations will include the following key components:

1. **Integration Dashboard**
   - List of all configured integrations
   - Status indicators for each integration
   - Last run time and success/failure
   - Quick actions (run, disable, configure)

2. **Integration Configuration**
   - Type selection (from available connector types)
   - Connection parameters specific to the integration type
   - Authentication setup (OAuth flow, API keys, etc.)
   - Schedule configuration (frequency, times)
   - Data mapping options

3. **Integration Monitoring**
   - Run history with timestamps and duration
   - Error logs and resolution suggestions
   - Data volume and processing statistics
   - Performance metrics and optimization suggestions

4. **Health Check Report**
   - Connection status to each system
   - Authentication status and expiration
   - Rate limit information and usage
   - Data quality and validation metrics

## 5. Test Strategy

### 5.1 Unit Tests

1. **Connector Tests**
   - Test connection establishment
   - Test authentication and token refresh
   - Test data retrieval with mocked responses
   - Test error handling and retries

2. **Processor Tests**
   - Test entity transformation
   - Test relationship mapping
   - Test data validation
   - Test error handling

3. **Service Tests**
   - Test integration configuration
   - Test scheduling logic
   - Test credential management
   - Test status tracking

### 5.2 Integration Tests

1. **End-to-End Flow Tests**
   - Complete integration cycle with mock external systems
   - Data flow from external system to internal database
   - Relationship creation between entities
   - Event publishing to notification system

2. **Error Recovery Tests**
   - Connection failure scenarios
   - Authentication failure recovery
   - Rate limiting and backoff behavior
   - Data validation error handling

### 5.3 Mock External Systems

1. **Mock API Server**
   - Simulate response patterns from real systems
   - Inject controlled errors for testing
   - Test pagination and result limits
   - Test different authentication methods

2. **Data Generators**
   - Generate realistic test data for each integration type
   - Create complex relationship patterns
   - Simulate large data volumes
   - Inject edge cases and problematic data

## 6. Security Considerations

1. **Credential Management**
   - Secure storage of API keys, tokens, and passwords
   - Encryption at rest for all credentials
   - Proper key rotation and expiry handling
   - Minimal permission principle for all connections

2. **Data Privacy**
   - Tenant isolation for all integration configurations and data
   - Filtering of sensitive information during ingestion
   - Proper data retention policies
   - User consent tracking for data access

3. **Access Control**
   - Role-based access to integration configuration
   - Audit logging for all integration operations
   - Integration-specific permissions
   - Approval workflows for sensitive integrations

4. **Authentication**
   - OAuth 2.0 flow for user-authorized connections
   - Secure handling of refresh tokens
   - Monitoring for unauthorized access attempts
   - Token revocation on suspicious activity

## 7. Monitoring and Operations

1. **Logging Strategy**
   - Detailed integration execution logs
   - Error tracking with context
   - Data volume and processing metrics
   - Performance monitoring

2. **Alerting**
   - Integration failure notifications
   - Authentication expiration warnings
   - Rate limit approaching alerts
   - Data quality issue detection

3. **Dashboard**
   - Integration health overview
   - Success rate metrics
   - Data volume trends
   - Error rate and types

## 8. Implementation Timeline

| Week | Phase | Key Deliverables |
|------|-------|-----------------|
| 1-2 | Foundation | Core interfaces, models, basic config management |
| 3-5 | Connector System | BaseConnector, Google/Microsoft connectors, authentication |
| 6-7 | Data Processing | Entity mapping, relationship detection, data transformation |
| 8-9 | Research & Calendar | Research paper and calendar connectors with processors |
| 10-11 | Team & Project | Team directory and project management connectors |
| 12 | Goal & Document | Goal tracking and document storage connectors |
| 13-14 | Management UI | Admin interface for monitoring and configuration |

## 9. Success Metrics

1. **Integration Reliability**
   - >99.5% success rate for scheduled integration runs
   - <1% error rate in data processing
   - <5 minute resolution time for authentication issues

2. **Data Quality**
   - >95% entity matching accuracy
   - <2% duplicate entities created
   - >98% field mapping accuracy

3. **Performance**
   - <5 minutes for full synchronization of most integrations
   - <100ms latency impact on API endpoints
   - <5% additional database load from integration processes

4. **User Experience**
   - <15 minutes to configure a new integration
   - >90% auto-resolution of common integration errors
   - <3 steps to authenticate with external systems

## 10. Conclusion

The Integration Framework will provide a robust foundation for connecting KnowledgePlane with enterprise systems, enabling rich data visualization and insights within the platform. This implementation plan outlines a structured approach to building the framework, focusing on flexibility, security, and reliability to ensure successful integration with diverse external systems.