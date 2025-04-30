# KnowledgePlane AI - Slice 4 Tasks (Map Filtering & Goal Alignment)

**Goal:** Enhance Living Map usability through frontend filtering controls and deepen strategic alignment features by improving Goal management and visualization.

**Related Epics:** Living Map - Advanced Visualization & Interaction, Strategic Alignment Engine (from `PRODUCT_BACKLOG.md`)

---

## Task Breakdown

**(Note: Tasks continue numbering from Slice 3)**

### Epic: Frontend - Map Filtering Controls (Slice 4)

*   [x] **FE-TASK-059: Design Filter Panel/UI:** Design the UI element(s) for controlling map filters (e.g., a collapsible sidebar panel, dropdowns adjacent to the map).
*   [x] **FE-TASK-060: Implement Node Type Filter:** Add controls (e.g., checkboxes in the filter panel) to filter nodes by type (User, Team, Project, Goal) using the existing `/map/data?types=` API parameter. Update `LivingMap.tsx` to pass selected types to the API call and re-fetch/re-layout data.
*   [x] **(Stretch) FE-TASK-061: Implement Status Filter (Projects/Goals):** Add controls (e.g., multi-select dropdown) to filter projects/goals by status. _(Requires backend API enhancement: add `status` query param to `/map/data` or relevant entity list endpoints)._

### Epic: Strategic Alignment - Goals (Slice 4)

*   [x] **BE-TASK-038: Enhance Goal Model/Schema/CRUD/API:** 
    *   Review `Goal` model/schema, ensure fields like `type` (e.g., Company KR, Dept OKR, Team Objective) and `status` are well-defined and usable.
    *   Ensure `POST /goals` and `PUT /goals/{goal_id}` handle these fields correctly.
    *   Ensure `GET /goals` endpoint can return goals (potentially filtered) for linking UI.
*   [x] **FE-TASK-062: Enhance Goal Node Display:** Update `GoalNode.tsx` to visually represent Goal `type` or `status` if applicable (e.g., different icon/color based on type).
*   [x] **FE-TASK-063: Goal Linking UI (Project Panel):** Implement UI within the Project `BriefingPanel.tsx` to select an existing Goal (fetch from `/goals`?) and link it to the current project (calling `PUT /projects/{project_id}`).
*   [x] **FE-TASK-064: Visualize Goal Hierarchy:** Ensure parent-child Goal relationships (`ALIGNED_TO` edges with "Child Of" label) are clearly rendered on the map. Consider enhancing layout hints or styling for hierarchies.

### General / Cleanup (Slice 4)

*   [x] **GEN-TASK-007: Address Core TODOs (Slice 4 Scope):** Resolve any new TODOs introduced or pick up relevant deferred TODOs. 