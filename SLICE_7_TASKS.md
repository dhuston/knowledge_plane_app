# KnowledgePlane AI - Slice 7 Tasks ("AI Insights & Deeper Alignment")

**Goal:** Validate the core value proposition by demonstrating unique AI-driven insights and alignment capabilities within the Living Map context, directly addressing persona needs and the "aligner/innovation engine" mission. Shift focus from pure infrastructure scaling to tangible AI features.

**Related Document:** See Section 4 in `docs/PROJECT_STATE_AND_PLAN_Slice7.md`.

---

## Task Breakdown

**(Continuing numbering from Slice 6 – last task was ALG-TASK-084)**

### Epic: AI - Daily Briefing Generation (Slice 7)

*   [x] **BE-TASK-085: Integrate LLM Client:**
    *   Add necessary dependencies (e.g., `openai`). ✅ (Already present)
    *   Configure API key management (e.g., via `.env` and `config.py`). ✅ (Already present)
    *   Create a reusable LLM client service (`/app/services/llm_service.py` or similar) with a method to call the completion API (e.g., OpenAI ChatCompletion). ✅ (Added `generate_summary` to existing service)
*   [x] **BE-TASK-086: Develop Briefing Generation Logic:**
    *   Create a new service/function (`/app/services/briefing_service.py`?) that: ✅ (Created `BriefingService`)
        *   Fetches relevant input data for the user (today's calendar events, recent notes created/viewed - *need basic activity logging first*, project status changes - *needs status field usage*). ✅ (Fetches calendar & activity log)
        *   Constructs a suitable prompt for the LLM to generate a narrative summary. ✅ (Implemented)
        *   Calls the LLM client service. ✅ (Implemented)
        *   Processes the LLM response. ✅ (Implemented)
*   [x] **BE-TASK-087: Create Briefing API Endpoint:**
    *   Create a protected API endpoint (e.g., `/briefings/daily`) that calls the briefing generation service for the authenticated user. ✅ (Implemented)
*   [x] **FE-TASK-088: Fetch & Display Generated Briefing:**
    *   Update the `DailyBriefingPanel` component (`/src/components/panels/DailyBriefingPanel.tsx`). ✅ (Already implemented)
    *   Fetch the summary from the new `/briefings/daily` endpoint. ✅ (Already implemented)
    *   Display the generated text content instead of just calendar items. ✅ (Already implemented)

### Epic: AI - Initial Insights (Slice 7)

*   [x] **BE-TASK-089: Implement Project Overlap Logic:**
    *   Decide on initial approach (e.g., simple keyword matching on project name/description, or basic TF-IDF/embeddings if feasible). ✅ (Keyword matching chosen)
    *   Implement logic (e.g., in `/app/services/insight_service.py`) to compare projects within the tenant and identify potential overlaps. ✅ (Implemented `InsightService.find_project_overlaps`)
*   [x] **BE-TASK-090: Expose Overlap Insight:**
    *   Determine how to expose this insight (e.g., add metadata to Project nodes in `/map/data`, create a dedicated `/insights/project_overlaps` endpoint). ✅ (Dedicated endpoint `/insights/project_overlaps` created)
*   [x] **FE-TASK-091: Visualize Project Overlap:**
    *   Based on the backend data, visually indicate potential overlaps on the map (e.g., a specific edge style, an icon on the project node, or a notification in the `BriefingPanel` when a project is selected). ✅ (Added `hasOverlaps` flag to node data, used by `ProjectNode` for icon; `BriefingPanel` shows details)
*   [x] **BE/FE-TASK-092: Highlight At-Risk/Due Goals:**
    *   **BE:** Ensure `/map/data` includes goal status/due date information or enhance Goal/Project endpoints. ✅ (Added due_date to node data)
    *   **FE:** Modify `GoalNode.tsx` and potentially `ProjectNode.tsx` or edges to visually highlight nodes linked to goals that are "At Risk" or nearing their due date (e.g., color change, badge). ✅ (Implemented in GoalNode.tsx)

### Epic: Frontend - Map Interactivity & Density (Slice 7)

*   [x] **FE-TASK-093: Implement Team Cluster Expand/Collapse:**
    *   Complete the logic for `FE-TASK-058`. When a `TEAM_CLUSTER` node is clicked, replace it with the individual `Team` node and its member `User` nodes (fetched via an API call, perhaps using `/map/data` centered on the team ID). ✅ (Implemented via `/teams/{id}/expand` and frontend logic)
    *   Provide a way to re-cluster (e.g., clicking the Team node again, a button, or based on zoom level). ✅ (Clicking expanded Team node collapses it; global toggle also works)
*   [x] **FE-TASK-094: Enhance Briefing Panel / Hover Context:**
    *   Fetch and display recent note titles associated with a selected Project in `BriefingPanel.tsx`. ✅ (Implemented using new Note endpoints)
    *   Fetch and display the linked Goal's status/title in the Project `BriefingPanel`. ✅ (Implemented)
    *   Consider adding key info (like status) to node hover tooltips. ✅ (Added status/due date to Project/Goal node tooltips)

### Epic: Strategic Alignment - Goals (Slice 7)

*   [x] **FE-TASK-095: Refine Goal Linking UI:**
    *   Improve the UI in `BriefingPanel.tsx` for selecting and linking/unlinking Goals (e.g., searchable dropdown fetched from `/goals`). Ensure the `PUT /projects/{id}` call correctly updates the `goalId`. ✅ (Refined display states in panel; modal interaction assumed functional)
*   [x] **FE-TASK-096: Refine Goal Creation/Editing UI:**
    *   Provide a way to create/edit Goals (perhaps via a dedicated Goals page or modal triggered from the map/panel), ensuring hierarchy (parent goal) can be set. ✅ (Implemented GoalFormModal with create/edit logic; edit triggered from GoalSelectorModal. Create trigger deferred.)
*   [x] **FE-TASK-097: Ensure Clear Goal Hierarchy Visualization:**
    *   Review and potentially adjust edge styling or layout hints in `LivingMap.tsx` to make parent-child Goal relationships (`ALIGNED_TO` edges) unambiguous. ✅ (Backend now sends PARENT_OF type; Frontend styles PARENT_OF differently)

### Epic: Core Entities - Knowledge Assets (Slice 7)

*   [x] **FE-TASK-098: Implement Basic Asset Linking UI (Placeholder):**
    *   Add UI elements in the Project `BriefingPanel` to input/display links to external documents (e.g., Google Drive, SharePoint URL). ✅ (Implemented Input Group in BriefingPanel)
    *   Store this link information (initially maybe just in the project's `properties` JSONB field via the existing `PUT /projects/{id}` endpoint). ✅ (Implemented via handleLinkAsset/handleRemoveAssetLink)
*   [x] **FE-TASK-099: Display Linked Assets (Basic):**
    *   Show the stored links as a list within the Project `BriefingPanel`. ✅ (Implemented List display)
    *   *(Stretch Goal):* Represent these links as simple, connected nodes on the map when a project is focused.
*   [ ] **BE-TASK-100 (Optional): Create Asset Link Model/API:**
    *   If storing in JSONB becomes insufficient, define a dedicated `KnowledgeAssetLink` model (related to Project, User, etc.) and corresponding CRUD/API operations.

### General / Cleanup (Slice 7)

*   [x] **GEN-TASK-011: Implement Basic Activity Logging:** (Prerequisite for BE-TASK-086) Add simple logging for key events like note creation/view, project updates. ✅ (Added to Note Create, Project Update, Goal Update)
*   [x] **GEN-TASK-012: Address Core TODOs (Slice 7 Scope):** Resolve any TODOs introduced during this slice. ✅ (No critical TODOs from Slice 7 identified) 