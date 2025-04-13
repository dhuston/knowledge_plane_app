# KnowledgePlane AI - Slice 1 Tasks (Technical Validation Alpha)

**Goal:** Replace core mocks with real backend plumbing for key pathways. Validate core technical assumptions for authentication, database persistence, basic API communication, and the first integration. Demonstrate the *start* of the Emergent Org Model with real data.

**Related Document:** See "Slice 1" section in `docs/PRODUCT_BACKLOG.md` for scope and features.

**Technology Focus:** Python/FastAPI (Modular Monolith), PostgreSQL + Alembic, Docker Compose (local), Google SSO, Google Calendar API, JWT.

---

## Task Breakdown

**(Note: Backend tasks assume a new top-level `knowledgeplan-backend` directory)**

### Epic: Backend - Core Setup (Slice 1)

* **BE-TASK-001: Create Backend Directory Structure:**
  * Create top-level `/knowledgeplan-backend` directory.
  * Establish initial subdirectories: `/app` (main code), `/app/core` (config, db session), `/app/api` (routers), `/app/models` (SQLAlchemy), `/app/crud` (db operations), `/app/schemas` (Pydantic), `/app/db` (migrations, session setup), `/tests`.
* **BE-TASK-002: Initialize Python Project (FastAPI):**
  * Inside `/knowledgeplan-backend`, set up `pyproject.toml` using Poetry (or PDM).
  * Add core dependencies: `fastapi`, `uvicorn[standard]`, `pydantic[email]`, `python-dotenv`, `sqlalchemy[asyncio]`, `asyncpg` (for async PostgreSQL), `alembic`.
  * Configure linting/formatting (e.g., `ruff`, `black`). Add initial configs.
* **BE-TASK-003: Basic FastAPI App & Config:**
  * Create main FastAPI app instance (`/app/main.py`).
  * Implement core settings management (`/app/core/config.py` using Pydantic BaseSettings).
  * Implement a simple health check endpoint (`/health`) in `/app/api/`. Add basic API router structure.
* **BE-TASK-004: Dockerize Backend:**
  * Create `knowledgeplan-backend/Dockerfile`.
  * Use multi-stage builds. Include Poetry installation and dependency install step.
* **BE-TASK-005: Setup Docker Compose (Local Dev):**
  * Create root `docker-compose.yml`.
  * Define `backend` service using the backend Dockerfile.
  * Define `db` service using official `postgres` image.
  * Configure environment variables (using `.env` file), ports, and volumes for backend code and DB data persistence.

### Epic: Backend - Database Setup (Slice 1)

* **BE-TASK-006:** Configure DB Connection & Session: Set up SQLAlchemy async engine and session management (`/app/db/session.py`).
* **BE-TASK-007:** Define Initial Models (Tenant, User): Create SQLAlchemy models for `Tenant` and `User` (`/app/models/`) including `tenant_id`, `manager_id` FKs, and basic profile fields.
* **BE-TASK-008:** Setup Alembic Migrations: Initialize Alembic (`alembic init`) within `/app/db/`. Configure `env.py` and `alembic.ini`.
* **BE-TASK-009:** Create Initial Migration: Generate and review the first Alembic migration script to create the `tenants` and `users` tables.

### Epic: Backend - Authentication (Slice 1)

* **BE-TASK-010:** Google OAuth2 Config: Add Google OAuth2 client ID/secret to config. Implement utility functions for Google auth URL generation and token exchange.
* **BE-TASK-011:** Auth Routes & Logic: Create FastAPI router (`/app/api/auth/`) with `/login/google` (redirects to Google) and `/callback/google` endpoints.
* **BE-TASK-012:** User Upsert Logic: In the callback, fetch user info from Google, find/create user in DB (associating with a tenant - *initial tenant logic TBD*), potentially sync manager info.
* **BE-TASK-013:** JWT Implementation: Generate JWT token upon successful login containing user ID/tenant ID. Implement dependency to verify JWT and extract current user (`/app/core/security.py`).

### Epic: Backend - API Endpoints (Slice 1)

* **BE-TASK-014:** Define User Schemas: Create Pydantic schemas for User output (`/app/schemas/user.py`).
* **BE-TASK-015:** Implement User CRUD: Basic CRUD operations for fetching user data (`/app/crud/crud_user.py`).
* **BE-TASK-016:** Implement `/users/me` Endpoint: Create protected API endpoint that uses JWT dependency to get current user and return their data using the User schema.

### Epic: Backend - Integration (Slice 1)

* **BE-TASK-017:** Google Calendar API Client: Add `google-api-python-client`, `google-auth-oauthlib` dependencies. Implement helper/service for Google Calendar API interactions (using stored user credentials - *credential storage TBD*).
* **BE-TASK-018:** Fetch Calendar Events Endpoint: Create a (protected) API endpoint (e.g., `/integrations/google/calendar/events`) that uses the Calendar client to fetch today's events for the authenticated user.

### Epic: Frontend - Integration (Slice 1)

* **FE-TASK-031:** Update Login Flow: Modify `LoginPage.tsx` button `onClick` handler to redirect to backend `/login/google` endpoint instead of simulating navigation.
* **FE-TASK-032:** Handle Auth Callback: Implement logic (potentially on a dedicated `/auth/callback` route or by checking URL params on load) to receive JWT from backend redirect, store it securely (e.g., localStorage), and update auth state.
* **FE-TASK-033:** API Client Setup: Create basic utility/hook for making authenticated API calls (adding JWT to Authorization header).
* **FE-TASK-034:** Fetch/Display Real User Data: Update `MainLayout.tsx` (User Menu) and `ProfilePage.tsx` to fetch data from `/users/me` endpoint and display real user info instead of mock data.
* **FE-TASK-035:** Fetch/Display Real Calendar Data: Update `WorkspacePage.tsx` briefing section to fetch data from `/integrations/google/calendar/events` endpoint and display real events.
* **FE-TASK-036:** Display Real Manager Link: Ensure `ProfilePage.tsx` uses the potentially synced `manager_id` from the `/users/me` API response to link to the correct manager profile.
