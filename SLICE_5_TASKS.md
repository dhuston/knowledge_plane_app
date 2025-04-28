# KnowledgePlane AI - Slice 5 Tasks (Robust Team Clustering)

**Goal:** Implement backend logic for clustering User nodes under Team nodes based on a threshold, and integrate this with a frontend toggle for the Living Map.

**Related Epics:** Living Map - Advanced Visualization & Interaction, Scalability

---

## Task Breakdown

**(Note: Tasks continue numbering from Slice 4)**

### Epic: Backend - Clustering Logic (Slice 5)

*   [x] **BE-TASK-039: Refactor `get_map_data` for Clustering:**
    *   Modify `get_map_data` in `endpoints/map.py` to cleanly separate the unclustered vs. clustered processing paths based on the `cluster_teams` query parameter.
    *   Ensure entity fetching (Steps 1 & 2 from Slice 3 refactor) happens *before* the clustered/unclustered split.
*   [x] **BE-TASK-040: Implement User Grouping by Team:**
    *   Inside the `if cluster_teams:` block, add logic to iterate through `fetched_entities` and group fetched `User` models by their `team_id`.
*   [x] **BE-TASK-041: Implement Clustering Threshold Logic:**
    *   Define a constant `MIN_MEMBERS_FOR_CLUSTER` (e.g., 4).
    *   Identify which teams meet this threshold based on the grouped users *within the fetched context*. Keep track of users belonging to these clusters (`processed_user_ids`).
*   [x] **BE-TASK-042: Implement Clustered Node Creation:**
    *   Inside the `if cluster_teams:` block, iterate through `fetched_entities`.
    *   Add non-user/non-team nodes normally (respecting filters).
    *   Add individual `User` nodes *only* if they have no team or their team is *below* the clustering threshold (and respect user type filter).
    *   Add regular `Team` nodes *only* if the team is *below* the clustering threshold (and respect team type filter).
    *   For teams *above* the threshold, add a `TEAM_CLUSTER` node (respecting type filter), populating its `data` with `memberCount`. Ensure the original `Team` node and member `User` nodes are *not* added.
*   [x] **BE-TASK-043: Implement Edge Re-routing for Clustering:**
    *   Inside the `if cluster_teams:` block, implement the logic to create the final `edges` list.
    *   Iterate through potential relationships based on `fetched_entities`.
    *   For each potential edge: determine the *effective* source and target IDs (if a user/team is clustered, use the cluster/team ID).
    *   Use the `add_edge_if_allowed` helper, ensuring it checks against the *final list* of added nodes (including clusters) and avoids self-loops or duplicates. Handle all relevant edge types (User-Manager, User-Team/Cluster, User-Project, Team/Cluster-Lead, Team/Cluster-Project, Project-Goal, Goal-Goal).

### Epic: Frontend - Clustering Integration (Slice 5)

*   [x] **FE-TASK-065: Add `TEAM_CLUSTER` Type:** Add `TEAM_CLUSTER` to the `MapNodeTypeEnum` in `types/map.ts`.
*   [x] **FE-TASK-066: Implement Clustering Toggle UI:** Add a UI element (e.g., `Switch` or `Button`) to `LivingMap.tsx`, likely near the filter toggle, that controls the `isClustered` state.
*   [x] **FE-TASK-067: Trigger Backend Clustering:** Modify the `fetchRawData` effect in `LivingMap.tsx` to include the `cluster_teams=true` or `cluster_teams=false` query parameter in the `/map/data` API call based on the `isClustered` state. Ensure data is refetched when the toggle changes.
*   [x] **FE-TASK-068: Handle Cluster Node Click (Basic):** Define the initial interaction for clicking a `TEAM_CLUSTER` node. For Slice 5, simply having it open the standard Team Briefing Panel (using the underlying team's ID) might be sufficient. This involves potentially adjusting the `handleNodeClick` logic or ensuring the `originalApiNode` data is passed correctly.

### General / Cleanup (Slice 5)

*   [ ] **GEN-TASK-008: Address Core TODOs (Slice 5 Scope):** Resolve any TODOs introduced during this slice. 