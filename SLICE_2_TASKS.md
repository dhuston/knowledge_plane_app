# KnowledgePlane AI - Slice 2 Tasks (Pilot MVP)

**Goal:** Deliver the full MVP scope as defined in the Epics below, featuring a **functional and interactive Living Map** as the core UX, ready for carefully selected pilot customers.

**Related Document:** See "Slice 2" section and "Living Map & Individual AI Workspace (MVP)" epic in `docs/PRODUCT_BACKLOG.md`.

**Technology Focus:** Python/FastAPI, PostgreSQL + Alembic, Docker Compose, Google SSO, Google Calendar API, JWT, React + TypeScript + Chakra UI, Graph Visualization Library (TBD).

---

## Task Breakdown

**(Note: Tasks continue numbering from Slice 1)**

### Epic: Backend - Core Entities (Slice 2)

*   [x] **BE-TASK-019: Define Project Model & Schema:** Create SQLAlchemy model (`/app/models/project.py`) and Pydantic schemas (`/app/schemas/project.py`) for Projects/Hubs, including relationships (owning team, goal).
*   [x] **BE-TASK-020: Implement Project CRUD:** Basic CRUD operations (`/app/crud/crud_project.py`) for creating, reading, updating Projects.
*   [x] **BE-TASK-021: Implement Project API Endpoints:** Create API endpoints (`/app/api/projects/`) for listing, creating, retrieving, updating projects (with appropriate auth).
*   [x] **BE-TASK-022: Define Goal Model & Schema:** Create SQLAlchemy model (`/app/models/goal.py`) and Pydantic schemas (`/app/schemas/goal.py`) for Goals/OKRs, including parent/child relationships.
*   [x] **BE-TASK-023: Implement Goal CRUD:** Basic CRUD operations (`/app/crud/crud_goal.py`) for Goals.
*   [x] **BE-TASK-024: Implement Goal API Endpoints:** Create API endpoints (`/app/api/goals/`) for listing, creating, retrieving Goals.
*   [x] **BE-TASK-025: Define Knowledge Asset Model & Schema (Basic):** Create initial model/schema for simple native Notes (`/app/models/knowledge_asset.py`, `/app/schemas/knowledge_asset.py`) linked to projects.
*   [x] **BE-TASK-026: Implement Knowledge Asset CRUD (Notes):** Basic CRUD for creating/reading notes associated with a project hub.
*   [x] **BE-TASK-027: Implement Notes API Endpoints:** API endpoints within project scope (e.g., `/projects/{proj_id}/notes`) to manage notes.
*   [x] **BE-TASK-028: Apply Migrations:** Generate and apply Alembic migrations for new models (Project, Goal, Knowledge Asset).

### Epic: Backend - Living Map API (Slice 2)

*   [x] **BE-TASK-029: Refine Map Data Structure:** Define a clear Pydantic schema for nodes and edges returned by the map API (e.g., `MapNode`, `MapEdge` including `id`, `type`, `label`, `data`, `position` hints, `source`, `target`).
*   [x] **BE-TASK-030: Enhance `/map/data` Endpoint:** Update the map data endpoint to include Project and Goal nodes relevant to the user or current view context.
*   [ ] **BE-TASK-031: Implement Map Data Filtering (Basic):** Add basic query parameters to `/map/data` to allow filtering by node type or relationship (e.g., `?types=user,project`). _(Note: This is the first step towards addressing map scalability)_
*   [x] **BE-TASK-032: Implement Relationship Logic:** Ensure backend logic correctly identifies and includes relevant relationships (edges) in the `/map/data` response (e.g., user->project participation, project->goal alignment).

### Epic: Backend - Authentication & Core (Slice 2)

*   [ ] **BE-TASK-033: Implement Token Refresh Logic:** Add mechanism (e.g., refresh tokens, backend checks) to handle JWT expiration and refresh.
*   [ ] **BE-TASK-034: Enhance Authorization:** Implement more granular authorization checks on API endpoints based on user roles or relationship to data (e.g., can user view/edit this project?).

### Epic: Frontend - Map Visualization (Slice 2)

*   [x] **FE-TASK-037: Select Graph Visualization Library:** Research and choose a suitable React graph visualization library (e.g., react-flow, vis.js, sigma.js) based on features, performance, documentation, and ease of integration.
*   [x] **FE-TASK-038: Install & Integrate Viz Library:** Add the chosen library to the frontend project and configure basic setup.
*   [x] **FE-TASK-039: Create `LivingMap` Component:** Develop the main component (`/src/components/map/LivingMap.tsx`) responsible for rendering the graph.
*   [x] **FE-TASK-040: Fetch and Render Basic Map Data:** Connect `LivingMap` component to fetch data from the backend `/map/data` endpoint and render basic nodes (users, teams, projects) and edges.
*   [x] **FE-TASK-041: Implement Node Styling:** Apply different visual styles (shape, color, icon) to nodes based on their type (User, Team, Project, Goal).
*   [x] **FE-TASK-042: Implement Edge Styling:** Apply basic styling to edges representing different relationship types.
*   [x] **FE-TASK-043: Implement Basic Layout:** Configure an initial graph layout algorithm (e.g., ELKjs) provided by the library.
*   [x] **FE-TASK-043.1 (New): Implement Initial Visual Polish:** Refine default node/edge appearance (using custom components if needed), ensure smooth basic interactions (pan/zoom), and improve overall aesthetic presentation within the chosen library (react-flow).

### Epic: Frontend - Map Interaction (Slice 2)

*   [x] **FE-TASK-044: Implement Pan & Zoom:** Ensure the map canvas is pannable and zoomable using standard interactions (mouse drag, scroll wheel).
*   [x] **FE-TASK-045: Implement Hover Interaction:** On hovering a node, display a simple tooltip or overlay with basic info (e.g., node name/title). Highlight the hovered node and immediate neighbors.
*   [x] **FE-TASK-046: Implement Click Interaction:** On clicking a node, trigger the opening of the `BriefingPanel` and pass the selected node's ID/data. Keep the node visually selected.

### Epic: Frontend - Supporting UI (Slice 2)

*   [x] **FE-TASK-047: Create `BriefingPanel` Component:** Develop the slide-in panel component (`/src/components/panels/BriefingPanel.tsx`).
*   [x] **FE-TASK-048: Populate `BriefingPanel` (User):** When a User node is selected, fetch detailed data from `/users/{id}` and display profile information in the panel (e.g., name, title, email, team, manager, *key projects/goals they are involved in* - context relevant to most personas).
*   [x] **FE-TASK-049: Populate `BriefingPanel` (Team):** When a Team node is selected, fetch detailed data from `/teams/{id}` and display team info (name, lead, members, *active projects, linked goals* - context relevant to PI, Director).
*   [x] **FE-TASK-050: Populate `BriefingPanel` (Project):** When a Project node is selected, fetch detailed data from `/projects/{id}` and display project info (name, status, description, owner, team, members/participants, *aligned goal, recent notes/assets* - context relevant to Scientist, PI, Director).
*   [ ] **FE-TASK-051: Integrate Daily Briefing:** Create a dedicated panel/component (`/src/components/panels/DailyBriefingPanel.tsx`) to display the AI briefing, potentially triggered from a main layout element or linked from the user's node. Ensure it uses real calendar data (`/integrations/google/calendar/events`) and highlights entities relevant to the user's context (initial step for Scientist persona).
*   [x] **FE-TASK-052: Implement Project Hub Creation (Basic):** Add UI (e.g., button in main layout or context menu) to trigger creation of a new Project. Connect to backend `/projects` endpoint. New project should appear as a node on the map.
*   [x] **FE-TASK-053: Implement Note Taking in Hub:** Add simple input/display for notes within the Project `BriefingPanel`. Connect to backend note endpoints (initial Knowledge Asset interaction).
*   [x] **FE-TASK-054: Implement User Invitation to Hub (Visual):** Add UI element to invite users (e.g., search/add button in Project `BriefingPanel`). Initially, this might just update frontend state or link visually on the map without full backend logic.

### General / Cleanup (Slice 2)

*   [ ] **GEN-TASK-001: Address Core TODOs:** Resolve outstanding TODO comments from Slice 1 & 2.
*   [ ] **GEN-TASK-002: Refactor Existing UI:** Adapt existing components (e.g., `MainLayout`, `ProfilePage`) to fit the new map-centric paradigm. Remove redundant old `WorkspacePage` components/mock data.
*   [ ] **GEN-TASK-003: Basic Monitoring/Logging Setup:** Implement initial monitoring and logging configurations for backend/frontend. 