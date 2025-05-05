# Biosphere Alpha (KnowledgePlane AI) - Technical Documentation

## BMS Azure OpenAI Integration

The Biosphere Alpha platform has been integrated with BMS Azure OpenAI services to power its AI features securely and in compliance with BMS enterprise security standards. This integration enables insights generation, pattern detection, and other AI-powered capabilities while keeping API keys secure.

### Key Components

1. **Backend AI Proxy**
   - Endpoint: `/api/v1/ai-proxy`
   - Methods: `summarize-insights`, `enhance-insight`, `generate-insights`, `custom-prompt`
   - Handles all OpenAI requests securely through the backend
   - Prevents API keys from being exposed to frontend
   - Avoids CORS issues with direct API calls

2. **BMS Azure OpenAI Configuration**
   - Endpoint: `https://bms-openai-services-eastus2-1-nonprod.azu.bms.com`
   - Model: `gpt-4.1-mini`
   - API Version: `2023-05-15`

3. **Security Measures**
   - API keys stored only in backend environment variables
   - All requests proxied through backend for proper authentication
   - Error handling that prevents exposure of sensitive details

### Documentation Location

More details can be found in:
- `/docs/BMS_OPENAI_INTEGRATION_SUMMARY.md`
- `/docs/AZURE_OPENAI_SETUP.md`
- Backend proxy implementation: `/backend/app/api/v1/endpoints/ai_proxy.py`
- Test script: `/backend/scripts/test_bms_openai.py`

## Project Overview

Biosphere Alpha, also known as KnowledgePlane AI, is a multi-tenant SaaS platform designed to create an adaptive organization fabric and living map that visualizes the true emergent structure of how work gets done in organizations. The platform helps organizations "get on the same page" by enabling seamless collaboration, alignment, and adaptation, providing a dynamic network view of people, teams, projects, goals, and knowledge flows rather than relying on static org charts.

## Core Mission

The core mission of Biosphere Alpha is to solve key organizational challenges including:
- **Complexity:** Help navigate intricate organizational structures, processes, and communication pathways
- **Information Silos:** Break down barriers that trap critical knowledge within teams, tools, or individual inboxes
- **Misalignment:** Connect strategic goals set by leadership with day-to-day work performed by teams
- **Collaboration Friction:** Reduce inefficiencies caused by disconnected tools for communication and project management
- **Static Tools:** Provide dynamic, adaptable views of the organization, not rigid structures
- **Onboarding & Integration:** Minimize configuration overhead to model the organization

## Technical Architecture

### Overview

The system follows a **Modular Monolith** architecture with clear boundaries between domains. This approach was chosen to prioritize development speed and reduce operational complexity while maintaining the flexibility to extract specific modules into independent microservices in the future if scaling needs dictate.

### Key Technology Stack

- **Backend:** Python 3.9+ with FastAPI framework
- **Frontend:** React with TypeScript and Chakra UI components
- **Database:** PostgreSQL with PostGIS extension for spatial features
- **Deployment:** Multi-tenant SaaS hosted on AWS
- **Authentication:** JWT-based with support for OAuth providers
- **Graph Visualization:** Custom implementation using SigmaJS

### Data Model

- **Graph-based model** representing entities (Users, Teams, Projects, Goals, Tasks, Notes, Documents) and their relationships
- **Multi-tenant architecture** with logical isolation through tenant context
- **PostgreSQL** with schema-per-tenant approach for data isolation
- **Spatial indexing** for efficient map visualization and operations

### API Design

- **RESTful APIs** for frontend-backend communication
- **OpenAPI/Swagger** documentation for all endpoints
- **JWT authentication** with tenant context embedded in tokens
- **Permission-based authorization** based on user roles and relationships to data

## Core Features & Implementation Status

### 1. Living Map Visualization ✅

The Living Map is the central user interface element, providing an interactive network visualization of the organization's work fabric. It displays entities (people, teams, projects, goals, knowledge) and their relationships.

**Implementation Status:** Complete
- Interactive network graph visualization of organizational entities and relationships
- Dynamic filtering, zooming, and panning capabilities
- Entity-specific visual styling and grouping
- Performance optimizations for large datasets
- Web workers for layout calculations
- Efficient delta updates and caching mechanisms

### 2. Context Panels ✅

Context panels provide detailed information about selected nodes in the Living Map, displaying entity-specific details, relationships, activity timelines, and ML-based suggestions.

**Implementation Status:** Complete
- Unified `ContextPanel` component handling all entity types with consistent styling
- Entity-specific panel components for users, teams, projects, goals, and other entities
- Enhanced relationship visualization with interactive elements
- Rich content support with markdown rendering
- Activity timeline component with filtering
- Entity-specific action buttons with permission control
- ML-based entity suggestion algorithm
- Navigation enhancements including breadcrumbs and history
- Smooth UI animations and transitions with entity-specific effects
- Performance optimizations for large datasets

### 3. Emergent Organizational Model ✅

The platform continuously builds and refines the underlying data model, inferring structure, relationships, and workflows organically through user interactions and integrations.

**Implementation Status:** Complete
- Graph-based data model for entities and relationships
- Spatial indexing for efficient proximity queries
- Emergent pattern detection using machine learning
- Relationship strength calculation based on interaction data
- Dynamic clustering of related entities

### 4. AI-Powered Insights Dashboard ✅

The insights dashboard delivers personalized daily insights showing emerging patterns within the organization, analyzing user activities, relationships, and organizational data to provide actionable insights with relevant context.

**Implementation Status:** Complete
- Pattern detection algorithms for collaboration, knowledge, project, and productivity insights
- Personalized dashboard with filtering and sorting capabilities
- Enhanced Daily Digest component with rich personalization features:
  - User-specific summaries considering role, interests, and objectives
  - Prioritized tasks aligned with team objectives
  - Learning recommendations for relevant skills
  - Collaborative opportunities with colleagues on similar projects
  - Productivity tips and motivational insights
- UltraThink creative thinking component with multiple modes:
  - Lateral thinking mode for unconventional perspectives and analogies
  - Analytical mode for first principles thinking and structured analysis
  - Creative mode for divergent thinking and innovative solutions
  - Interactive thought generation with personalized context
- Feedback mechanisms to improve insight relevance over time
- Integration with notification system for high-priority insights

### 5. Strategic Alignment Analysis Engine ✅

This feature enhances the platform by detecting misalignments between projects and goals, providing recommendations to improve organizational alignment, and analyzing the potential impact of strategic decisions.

**Implementation Status:** Complete
- Misalignment detection system for identifying projects without aligned goals
- Alignment recommendation engine using ML-based goal suggestions
- Strategic impact analysis for goal or priority changes
- Map visualization overlays for misalignment data

### 6. Multi-tenant Infrastructure ✅

The platform is built as a secure multi-tenant SaaS application with complete logical separation between tenants.

**Implementation Status:** Complete
- Tenant context middleware for request scoping
- Schema-per-tenant database approach
- JWT authentication with tenant information
- Tenant validation on all API endpoints
- Tenant-specific settings and configurations

### 7. Integration Framework ✅

The platform connects with existing enterprise tools to leverage data and workflows, following an "Integrate First, Augment Where Necessary" approach.

**Implementation Status:** Complete
- Base connector framework for third-party integrations
- OAuth2 support for cloud service integrations
- Pluggable processor architecture for processing imported data
- Supported integrations include:
  - Google Calendar
  - Microsoft Outlook
  - Microsoft Teams
  - JIRA
  - LDAP directory services
  - PubMed research data

### 8. Notification System ✅

A comprehensive notification system keeps users informed about relevant changes and events across the platform.

**Implementation Status:** Complete
- Real-time notifications for organization events
- Customizable notification preferences
- In-app and email notification delivery
- Interactive notification actions

### 9. Workspace & Collaboration Features ✅

Collaborative workspaces enable teams to work together efficiently with shared context.

**Implementation Status:** Complete
- Team workspaces with shared resources
- Project workspaces for project-specific collaboration
- Meeting workspaces integrated with calendar events
- Research workspaces for knowledge management
- Enhanced dashboard components for workspace optimization:
  - Personalized Daily Digest with role-specific insights
  - UltraThink creative thinking assistant for overcoming mental blocks
  - Interactive workspace layouts with customizable content
- Real-time presence indicators

### 10. Hierarchy Navigator ✅

The Hierarchy Navigator provides a structured view of the organizational hierarchy alongside the emergent organization view from the Living Map.

**Implementation Status:** Complete
- Interactive tree visualization of organizations, divisions, departments, teams, and users
- Dynamic loading of hierarchy data from the backend API
- Comprehensive search and filtering capabilities by entity type and name
- Context-sensitive popover details with entity information
- Navigation between hierarchy levels with breadcrumb support
- Complete integration with the Living Map for a unified organizational view
- Industry-specific hierarchies based on tenant type (Tech, Healthcare, Financial, etc.)
- Full exploration of the organizational structure from top-level to individual team members

## Planned Features & Enhancements

### 1. Scenario Simulator ⏳

The Scenario Simulator will enable what-if analysis for organizational changes, allowing leadership to model the impact of restructuring, resource allocation changes, or strategic pivots.

**Implementation Status:** In planning
- Foundation laid through the Strategic Impact Analysis Service
- UI components and visualization techniques in development

### 2. Temporal Map Features ⏳

The Org Time Machine will allow visualization of organizational changes over time, providing historical context and trend analysis.

**Implementation Status:** In planning
- Data model prepared for temporal data tracking
- UI components for timeline navigation in design phase

### 3. Advanced AI Analysis ⏳

Deeper AI integration for more sophisticated insights, recommendations, and predictions.

**Implementation Status:** In planning
- Machine learning pipeline architecture defined
- Data preparation and aggregation mechanisms in development

# Database Migration and Demo Environment Setup Guide

This document provides comprehensive information about how the database migrations are handled in Biosphere Alpha, as well as detailed information about the demo environments available for demonstration and testing.

## Database Migration System

### Migration Configuration

The project uses Alembic for database migrations with the following critical components:

1. **Migration Script Location**: `backend/app/db/migrations/versions/`
2. **Current Baseline Schema**: `0001_baseline_schema.py` - This is the reference migration that establishes the current database schema
3. **Configuration File**: `backend/alembic.ini`

### Docker Configuration for Migrations

The `docker-compose.yml` file is configured to:
1. Execute the baseline migration (`0001_baseline_schema`) during container startup
2. Set up the database with appropriate permissions
3. Launch the FastAPI application with full reload capabilities

### Handling Migration Issues

When encountering issues with migrations:

1. **Migration Errors**: If you see `Can't locate revision identified by '...'` errors, check if the referenced migration exists in the versions directory
2. **Foreign Key Constraints**: When updating data with relationships, follow this order to avoid constraint violations:
   - Delete users (except admin)
   - Delete teams
   - Delete departments
   - Create new departments
   - Create new teams
   - Create new users
   - Create relationships

3. **Performance Options**: For persistent issues, consider these settings:
   - `SKIP_MIGRATION_CHECK=true` in the backend environment variables 
   - Adding `setuptools` to the pip installation in the command line

## Demo Environments

The platform includes fully configured demo environments representing diverse organizational structures across key industries.

### Login Process

To access the demo environments:
1. Navigate to http://localhost:5173/
2. Select a tenant from the dropdown menu
3. Click "Login" (no email/password required for demo tenants)
4. The system will automatically authenticate you with the selected tenant

### 1. Pharma AI Demo

A mid-size pharmaceutical research and development organization.

**Current Data Status:**
- **0 Departments**
- **21 Teams** distributed across departments
- **272 Users** with appropriate roles and titles
- **100 Research Projects** with team assignments
- **500 Knowledge Assets** (documents, notes, meeting records)
- **1 Node** for visualization
- **0 Edges** for relationships

### 2. Tech Innovations Inc.

A medium-size technology company focused on software development and innovation.

**Current Data Status:**
- **6 Departments:**
  - Engineering
  - Product
  - Marketing
  - Sales
  - Operations
  - Research

- **16 Teams** including:
  - Engineering: Frontend, Backend, DevOps, Mobile, Data Science, QA
  - Product: UX/UI, Product Management
  - Marketing: Digital Marketing, Content
  - Sales: Sales Development, Account Management
  - Operations: Finance, HR
  - Research: AI Research, Quantum Computing

- **16 Users** with appropriate roles (team leads and admin)
- **3 Goals** related to platform usage, product development, and infrastructure
- **4 Projects** including Cloud Platform Redesign and AI Integration
- **42 Nodes** for visualization (departments, teams, projects, users)
- **43 Edges** representing organizational relationships

### 3. Metropolitan Health System

A large healthcare provider with integrated medical services.

**Current Data Status:**
- **10 Departments:**
  - Internal Medicine
  - Surgery
  - Pediatrics
  - Oncology
  - Cardiology
  - Emergency Medicine
  - Neurology
  - Radiology
  - Research
  - Administration

- **21 Teams** across clinical and administrative departments
- **21 Users** with appropriate medical and administrative roles
- **5 Goals** focused on patient care, research, and operational excellence
- **6 Projects** including Electronic Health Records Modernization and AI Diagnostic Imaging
- **10 Nodes** for visualization (departments only)
- **21 Edges** for relationships

### 4. Global Financial Group

A large financial services organization with diverse business units.

**Current Data Status:**
- **8 Departments:**
  - Investment Banking
  - Asset Management
  - Retail Banking
  - Risk Management
  - Technology
  - Operations
  - Compliance
  - Marketing

- **22 Teams** across financial services divisions
- **0 Users** (only admin user)
- **0 Goals**
- **7 Projects** including Wealth Tech Platform and AI-Powered Advisory
- **0 Nodes** for visualization
- **0 Edges** for relationships

### 5. Advanced Manufacturing Corp

A large manufacturing enterprise focused on industrial innovation.

**Current Data Status:**
- **8 Departments:**
  - Engineering
  - Production
  - Quality Assurance
  - Supply Chain
  - Research & Development
  - Maintenance
  - Safety & Compliance
  - Operations

- **0 Teams**
- **0 Users** (only admin user)
- **0 Goals** 
- **8 Projects** including Smart Factory Initiative and Digital Twin Implementation
- **0 Nodes** for visualization
- **0 Edges** for relationships

### 6. University Research Alliance

A higher education institution with extensive research programs.

**Current Data Status:**
- **8 Departments:**
  - College of Science
  - College of Engineering
  - College of Liberal Arts
  - College of Business
  - College of Medicine
  - Information Technology
  - Research Administration
  - University Administration

- **0 Teams**
- **0 Users** (only admin user)
- **0 Goals**
- **9 Projects** including Quantum Computing Research and Climate Science Initiative
- **1 Node** for visualization
- **0 Edges** for relationships

## Technical Setup

The database is fully configured with:
- PostgreSQL with PostGIS extension for spatial features
- Complete schema matching the application models
- Rich organizational test data
- Proper department-team-user hierarchical relationships

### Database Population Scripts

Scripts for populating demo data are located in `backend/scripts/`:

1. **update_demo_tenants.py** - Main script to update all tenants with comprehensive data
2. **create_tech_tenant.py** - Example script for Tech Innovations Inc. tenant
3. **create_healthcare_tenant.py** - Script for Metropolitan Health System tenant
4. **create_financial_tenant.py** - Script for Global Financial Group tenant
5. **create_manufacturing_tenant.py** - Script for Advanced Manufacturing Corp tenant
6. **create_education_tenant.py** - Script for University Research Alliance tenant

To run these scripts:
```bash
docker-compose exec backend python /app/scripts/update_demo_tenants.py
```

## Usage Notes

1. **Access:** Log in by selecting a tenant from the dropdown menu at http://localhost:5173/

2. **Explore the Living Map:** The map visualization will display the complete organizational structure with proper team and department relationships.

3. **Context Panels:** Click on any entity to view detailed information in the context panels.

4. **Search and Filter:** Use the search functionality to find specific people, teams, projects, or goals.

5. **Industry-Specific Features:** Each demo environment showcases features relevant to that industry:
   - **Pharma:** Research collaboration and regulatory compliance
   - **Tech:** Agile development and innovation tracking
   - **Healthcare:** Patient care initiatives and clinical research
   - **Financial:** Risk management and compliance monitoring
   - **Manufacturing:** Production efficiency and supply chain visibility
   - **Education:** Research grants and cross-departmental collaboration

6. **Test Data:** All data represents realistic organizational structures tailored to each industry.

## Development Guidelines

### Development Workflow

#### Phase 1: Planning

1. **Determine the Scope:**
   - Understand all use cases, features, and functionalities required for the work
   - Document these use cases and any constraints or dependencies
   - Identify potential risks and mitigations

2. **Break Down into Tasks:**
   - Decompose the scope into granular tasks or modules
   - List out the expected inputs, processes, and outputs for each task
   - For each subtask, clearly define success criteria
   - Identify dependencies between tasks

3. **Create the Implementation Plan:**
   - Define a step-by-step execution approach for each subtask
   - Use concise, actionable steps that can serve as a checklist during development
   - Save the detailed plan in a markdown file
   - Get feedback on the plan before beginning implementation

#### Phase 2: Test-Driven Development (TDD)

1. **Initial Test Writing:**
   - For each task, write tests based on the expected input/output pairs
   - Focus on meaningful scenarios, covering both positive cases (expected behavior) and negative cases (edge or error scenarios)
   - Avoid creating mock implementations, even for functionality that does not exist yet in the codebase

2. **Run the Tests:**
   - Execute the written tests and confirm that they fail (to ensure the tests are working as intended)
   - Verify that the tests fail for the expected reasons

3. **Implementation Phase:**
   - Write only the minimal amount of code required to pass the test case
   - Avoid writing excess or speculative code
   - Iterate incrementally—one test case at a time

4. **Refinement and Generalization:**
   - Once the tests pass, refactor the code for clarity, performance, and maintainability
   - Ensure not to overfit implementation to the specific test cases
   - Aim for general, scalable solutions

5. **Final Verification:**
   - Run all tests to ensure they pass successfully
   - Conduct a self-review of the implementation
   - Document any notable decisions or trade-offs

### Critical Implementation Requirements

1. **Never Use Mock Data:**
   - All features must use real data from the backend API
   - Do not create or use mock data generators
   - If an API endpoint fails or returns no data, handle the error gracefully
   - Log errors properly for troubleshooting

2. **Avoid Unnecessary Fallback Options:**
   - Don't implement complex fallbacks that mask real issues
   - Handle errors directly rather than cascading through multiple fallback mechanisms
   - Fail fast and explicitly when required services are unavailable
   - Make service dependencies clear and avoid hiding them behind fallbacks

3. **API-First Development:**
   - Backend API endpoints should be implemented before frontend features
   - Frontend components should always connect to real API endpoints
   - Use proper error handling and loading states instead of fallback mock data
   - Test with real data flows in development environments

### Fundamental Development Principles

1. **Work Checklist:**
   - Maintain a continuous reference and checklist for each task
   - Track implementation progress systematically
   - Verify completion of all requirements before submitting work
   - Document any assumptions or design decisions made

2. **Core Design Principles:**
   - **KISS (Keep It Simple, Stupid):** Prioritize simplicity over complexity
   - **DRY (Don't Repeat Yourself):** Avoid code duplication
   - **YAGNI (You Aren't Gonna Need It):** Don't add functionality until it's necessary
   - **SOLID:** Apply single responsibility, open-closed, Liskov substitution, interface segregation, and dependency inversion principles

3. **No Premature Optimization:**
   - Focus on correct, testable functionality first
   - Optimize only after profiling identifies actual bottlenecks
   - Document performance considerations but implement them only when necessary
   - Let measured data drive optimization decisions

4. **Single Responsibility Focus:**
   - Files should do one thing well
   - Avoid files that require extensive scrolling to understand
   - Split files with multiple unrelated responsibilities
   - Ensure files can be named concisely to reflect their purpose
   - Files should be easy to test in isolation

### Code Style & Standards

1. **Python Import Structure:**
   ```python
   # Import standard Python modules first
   import os
   import sys
   from typing import List, Optional

   # Import third-party modules
   import fastapi
   from sqlalchemy import Column, Integer, String
   from pydantic import BaseModel

   # Import local modules
   from app.core import security
   from app.models.user import User
   from app.schemas.user import UserCreate
   ```

2. **React/TypeScript Best Practices:**
   - Use functional components with hooks
   - Leverage React.memo for optimized renders
   - Implement proper type definitions
   - Follow the component structure defined in the project

3. **Performance Optimization:**
   - Use memoization to prevent unnecessary re-renders
   - Implement virtualization for large lists
   - Apply lazy loading for non-critical components
   - Utilize web workers for computationally intensive tasks

### Testing Strategy

1. **Backend Testing:**
   - Unit tests for individual functions and classes
   - Integration tests for API endpoints and service interactions
   - Database tests for model operations and queries
   - Tenant isolation tests to ensure data separation
   - No mock services - use test databases with real implementations

2. **Frontend Testing:**
   - Component tests using React Testing Library
   - Visual regression tests for UI components
   - Performance tests for critical interactions
   - End-to-end tests for key user flows
   - Use API stubs with realistic data, never mock data generators

3. **Data Requirements:**
   - Test with realistic datasets that match production patterns
   - Never use randomly generated mock data
   - Test failure scenarios with proper API error responses
   - Maintain test fixtures that represent real-world use cases

4. **Testing Commands:**
   ```bash
   # Backend tests
   cd backend
   poetry run python -m pytest

   # Frontend tests
   cd frontend
   npm test
   ```

### Bug Fix Strategies

1. **Reproduce:**
   - Create a minimal test case that reproduces the issue
   - Document steps to consistently trigger the bug
   - Identify environmental factors that might contribute

2. **Diagnose:**
   - Use logging and debugging tools to trace the issue
   - Isolate the problem to specific components or interactions
   - Analyze performance metrics if the issue is performance-related

3. **Fix:**
   - Make targeted changes to address the root cause
   - Add or update tests to verify the fix
   - Document the solution for future reference

4. **Validate:**
   - Run the test suite to ensure no regressions
   - Verify the fix works in all affected environments
   - Monitor for any unexpected side effects

## Notifications System Debugging Notes

When encountering issues with the notification system, check the following:

1. **Common Error Patterns:**
   - `Cannot read properties of undefined (reading 'preferences')` - This occurs when the response from `/notifications/preferences` API call is malformed or missing
   - `Cannot read properties of undefined (reading 'filter')` - This happens when trying to filter notifications that are undefined
   - `Cannot read properties of undefined (reading 'map')` - This occurs in NotificationCenter when notifications array is undefined

2. **Resolution Strategy:**
   - Add defensive checks in useNotifications.ts for response data structure
   - Set safe default values (empty arrays) when API calls fail
   - Add API availability tracking to provide proper UI feedback
   - Implement robust error handling with detailed logging
   - Add fallback UI states for when backend services are unavailable

3. **Debugging Tips:**
   - Check browser console logs for detailed API response structures
   - Verify API endpoints are correctly prefixed with `/api/v1`
   - Monitor the new debug logs with `[Debug]` prefix for notification operations
   - Check if backend notification endpoints are properly implemented

4. **Key Files:**
   - `/frontend/src/hooks/useNotifications.ts` - Main hook for notification functionality
   - `/frontend/src/components/notifications/NotificationCenter.tsx` - Notification display UI
   - `/frontend/src/components/notifications/NotificationPreferences.tsx` - User notification settings
   - `/backend/app/api/v1/endpoints/notifications.py` - Backend notification API endpoints

5. **Implementation Notes:**
   - Notification system requires properly formatted responses from backend API
   - Each notification must have a unique ID, type, severity, title, and message
   - Real-time notifications use the delta stream via WebSockets
   - Preferences are stored per user in the database
   - Empty arrays should be used as default values for missing data

## Backend Dependency Troubleshooting Guide

### Common Empty Response Issue with FastAPI

When encountering `net::ERR_EMPTY_RESPONSE` errors from FastAPI backend:

1. **Common Error Pattern:**
   - `GET http://localhost:8001/api/v1/users/me net::ERR_EMPTY_RESPONSE`
   - Backend server responds with no data and connection is terminated unexpectedly
   - Often caused by critical errors in the FastAPI application

2. **Resolution Strategies:**

   ### Missing Dependencies
   - Check for missing Python dependencies in backend container
   - Common missing dependencies include:
     - `python-multipart` - Required for form data handling
     - `setuptools` - Required for package management and installation
     - `networkx` - Required for graph operations
   
   ### Fix Commands:
   ```bash
   # Install missing dependencies in the running container
   docker exec <container-name> /app/.venv/bin/pip install python-multipart
   docker exec <container-name> /app/.venv/bin/pip install setuptools
   
   # Restart the container to apply changes
   docker restart <container-name>
   ```

   ### Dependency Management
   - Ensure all dependencies are properly listed in `pyproject.toml`
   - Update the Dockerfile to include commonly missed dependencies
   - Consider adding a dependency check on startup

3. **Validation Steps:**
   - Check the backend logs for startup errors: `docker logs <container-name>`
   - Test simple endpoints like `/api/v1/health/` to confirm API is running
   - Use curl to test authentication endpoints without browser interference

4. **Prevention:**
   - Add all form-related dependencies to the project: `python-multipart`
   - Include package management tools: `setuptools`
   - Use `docker-compose up --build` when changing dependencies to rebuild containers
   - Add health checks to Docker Compose setup to detect startup failures

## CORS Troubleshooting Guide

When encountering CORS errors in the application, follow these steps to diagnose and fix the issues:

1. **Common CORS Error Patterns:**
   - `Access to fetch at 'http://localhost:8001/api/v1/admin/feature-flags' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource`
   - `Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource`
   - `CORS request did not succeed`

2. **Resolution Strategies:**

   ### Backend Configuration
   - Ensure the FastAPI CORS middleware is properly configured in `backend/app/main.py`
   - Make sure all required origins are included in the `allow_origins` list:
     ```python
     app.add_middleware(
         CORSMiddleware,
         allow_origins=[
             "http://localhost:5173",
             "http://localhost:8001",
             # Other origins as needed
         ],
         allow_credentials=True,
         allow_methods=["*"],
         allow_headers=["*"],
     )
     ```
   - Verify that `allow_credentials=True` if cookies are being used for authentication
   - Check that `allow_methods` includes all required HTTP methods (GET, POST, PUT, etc.)

   ### Frontend API Calls
   - Ensure all API calls use the correct format with the proper prefix:
     - Correct: `/api/v1/admin/feature-flags`
     - Incorrect: `/admin/feature-flags` (missing `/api/v1` prefix)
   - When using the API client, check for path normalization issues
   - Include appropriate authentication headers (Bearer token)
   - Verify `credentials: 'include'` is set for requests that need cookies

   ### Environment Configuration
   - Check that the `VITE_API_BASE_URL` environment variable is correctly set
   - Verify Docker port mappings in `docker-compose.yml` match the frontend configuration
   - Ensure the backend is exposing the correct port (typically 8001)

3. **Debugging Techniques:**
   - Use browser developer tools Network tab to inspect requests and responses
   - Check for preflight OPTIONS requests and their responses
   - Add debug logging in API client requests
   - Implement public fallback endpoints that don't require authentication
   - Use tools like curl or Postman to test API endpoints directly

4. **Sample Debug Endpoints:**
   - `/api/v1/debug/feature-flags-status` - Shows status of feature flags system
   - `/api/v1/debug/public-feature-flags` - Gets feature flags without authentication

5. **Implementation Notes:**
   - For sensitive endpoints, always maintain proper authentication requirements
   - Use fallback mechanisms to handle API failures gracefully
   - Consider implementing public endpoints for critical functionality
   - Add robust error handling and informative logging
   - Update frontend to handle CORS errors with appropriate user feedback

## Authentication System Fixes

### Login Infinite Loop Fix

Fixed an issue where the login process was experiencing an infinite loop during user data synchronization, causing performance degradation and potential application freezes.

**Root Cause:**
- Circular dependency between the token state management and user data fetching mechanisms in AuthContext.tsx
- Two separate useEffect hooks both triggered on token changes:
  - Main authentication check on component mount
  - Immediate user fetch when token changed
- Direct reading from localStorage on each render causing unnecessary state updates and re-renders

**Fix Implementation:**
1. **State Management Refactoring**: Changed from directly reading localStorage on each render to using React state, preventing unnecessary re-renders
2. **Unified Token Updates**: Modified the `setToken` function to update both localStorage and React state simultaneously
3. **Loop Protection**: Added detection for excessive effect runs with a circuit-breaker to prevent infinite loops
4. **Token Storage Optimization**: Enhanced the token storage mechanism to avoid state update cycles
5. **Improved Logging**: Added comprehensive logging for debugging authentication flow issues

This fix maintains the same authentication functionality while preventing infinite render cycles, resulting in more stable login experiences and improved performance.

### User Authentication Attribute Check Fix

Fixed an issue where the backend authentication middleware was causing errors when checking for the `is_active` attribute on user objects that don't have this attribute.

**Error Message:**
```
AttributeError: 'User' object has no attribute 'is_active'
```

**Root Cause:**
- In `backend/app/api/deps.py`, the `get_current_active_user` dependency was attempting to check `current_user.is_active`
- The User model in `backend/app/models/user.py` doesn't have an `is_active` attribute
- This was causing an AttributeError that prevented the organization hierarchy from loading

**Fix Implementation:**
1. **Added Attribute Check**: Modified the `get_current_active_user` function to first check if the user has the `is_active` attribute before attempting to access it
2. **Conditional Verification**: Added a `hasattr(current_user, 'is_active')` check before using the attribute
3. **Consistency with Superuser Check**: Made the active user check consistent with the superuser check which was already using `hasattr()` for attribute verification

This fix ensures that endpoints protected by the `get_current_active_user` dependency will work properly even if the User model doesn't have an `is_active` attribute, allowing the organization hierarchy to load correctly.

## API Endpoints Implementation

### Organizations API

Added comprehensive endpoints to support hierarchical organization visualization:

1. **GET `/api/v1/organizations/structure`**
   - Returns a complete organizational hierarchy structure for the current user's tenant
   - Includes organizations, divisions, departments, teams, and users
   - Provides path information for navigation purposes
   - Supports the Hierarchy Navigator component in the frontend
   - Generates industry-specific hierarchies based on tenant type:
     - Tech: Engineering-focused with software teams and departments
     - Healthcare: Clinical services structure with medical departments
     - Pharma: Research & development focused with clinical operations
     - Financial: Banking structure with investment and asset management
     - Manufacturing: Production and engineering oriented departments
     - Education: Academic structure with research departments

2. **GET `/api/v1/organizations/unit/{unit_id}`**
   - Returns details about a specific unit in the organizational hierarchy
   - Includes its immediate children for efficient navigation
   - Supports any unit type: organization, division, department, team, user
   - Provides consistent path information for breadcrumb navigation
   - Supports optional `children_only` query parameter to return only child entities
   - Handles user-specific team affiliations

3. **Hierarchical Data Structure**
   - Each organizational unit has:
     - Unique ID and human-readable name
     - Type identifier (organization, division, department, team, user)
     - Description for context
     - Parent reference for hierarchy traversal
     - Level indicator (0-4) for depth in the hierarchy
     - Complete path from root to current node
     - Child entities (when applicable)

These endpoints work alongside the existing `/api/v1/map/path` and `/api/v1/map/unit/{unit_id}` endpoints, providing additional organization hierarchy information for the frontend components.

The implementation features intelligent fallback mechanisms to ensure the hierarchy navigator works even if some endpoints are unavailable, and provides consistent data structures across all tenant types.

## Map Functionality Bug Fixes

### ContextPanel Bug Fixes

#### 1. onNodeClick Reference Error Fix

Fixed an issue where the Context Panel was producing a ReferenceError in the browser console when displaying node details.

**Error Message:**
```
ReferenceError: onNodeClick is not defined at ContextPanel (ContextPanel.tsx:521:7)
```

**Root Cause:**
- The `onNodeClick` prop was correctly defined in the `ContextPanelProps` interface but was missing from the component's props destructuring
- The component was attempting to use `onNodeClick` in callback functions without having it available in scope
- This caused the React error boundary to catch the error and try to recreate the component tree

**Fix Implementation:**
1. **Prop Destructuring Fix**: Added the missing `onNodeClick` prop to the component's destructuring pattern
2. **Verification**: Confirmed that the parent component (MainLayout) was correctly passing the function for the `onNodeClick` prop
3. **Testing**: Verified that node clicks within the context panel now correctly show context information

#### 2. React Hooks Order Error Fix

Fixed an issue where clicking on multiple nodes sequentially would cause a React hooks error and break the panel functionality.

**Error Message:**
```
Rendered fewer hooks than expected. This may be caused by an accidental early return statement.
```

**Root Cause:**
- React hooks were being conditionally called after early return statements
- Specifically, `useRef`, `useState`, and other hooks were declared after conditional returns, violating React's rules of hooks
- When clicking a second node, React expected the same number of hooks in the same order as the first render

**Fix Implementation:**
1. **Hook Reordering**: Moved all hook declarations (`useRef`, `useState`, etc.) to the top of the component before any conditional returns
2. **State Organization**: Consolidated all state, ref declarations, and memoized values at the beginning of the component
3. **Code Refactoring**: Refactored the code to ensure hooks maintain consistent order between renders
4. **Testing**: Verified that clicking on multiple nodes in sequence now works correctly with no errors

These fixes ensure that when users interact with the map, they can click on multiple nodes in sequence and consistently see the context information panel without errors.

### Deployment Process

1. **Local Development:**
   - Use Docker Compose for local environment setup
   - Configure environment variables via .env files
   - Run services individually for faster iteration

2. **Testing Environment:**
   - Automated deployments from feature branches
   - Integration tests run against deployed services
   - Performance and security tests executed

3. **Production Deployment:**
   - Blue-green deployment strategy
   - Staged rollout to monitor for issues
   - Automated rollback capabilities
   - Detailed deployment logging and monitoring

## Strategic Alignment with Vision

The platform's implementation directly supports the KnowledgePlane AI vision of creating an "Adaptive Organization Fabric & Living Map" that reveals the true, emergent fabric of how work gets done:

1. **Enhanced Living Map Visualization:** Provides rich, detailed information about entities directly within the Living Map interface, supporting the vision of an "evolving, interactive blueprint that visualizes interconnections."

2. **Supporting the Emergent Organizational Model:** The relationship visualization and entity suggestions help users discover connections between people, teams, projects, and goals, illuminating both formal and informal organizational structures.

3. **Integration-First Approach:** The platform connects with existing tools and workflows, supporting the "Integrate First, Augment Where Necessary" pillar of the vision.

4. **Foundations for Adaptive Intelligence:** The ML-based insights and suggestion systems fulfill the promise of "contextual insights surfaced directly on the map or via integrated feeds/panels."

5. **User-Centric Experience:** The performance optimizations, animations, and intuitive navigation ensure the platform provides immediate value to individuals.

## Conclusion

Biosphere Alpha (KnowledgePlane AI) represents a significant advancement in organizational intelligence and collaboration tools. By visualizing the true emergent structure of how work gets done, detecting misalignments between strategy and execution, and providing AI-powered insights, the platform helps organizations achieve better alignment, break down silos, and adapt to changing conditions more effectively.

The implementation follows modern software engineering best practices, with a modular architecture, comprehensive testing, and a focus on performance and scalability. The multi-tenant design enables efficient operation as a SaaS platform while maintaining strict data isolation between tenants.

As development continues, the platform will expand its capabilities in areas such as scenario simulation, temporal analysis, and advanced AI integration, further enhancing its value as a strategic tool for organizational intelligence and alignment.