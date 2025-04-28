# KnowledgePlane AI - Slice 3 Tasks (Living Map Polish & Clustering)

**Goal:** Enhance the visual presentation, interactivity, and clarity of the Living Map based on the Slice 2 MVP. Implement initial node clustering to handle density.

**Related Epic:** Living Map - Advanced Visualization & Interaction (from `PRODUCT_BACKLOG.md`)

---

## Task Breakdown

**(Note: Tasks continue numbering from Slice 2)**

### Epic: Frontend - Map Visual Polish (Slice 3)

*   [x] **FE-TASK-055: Refine Node Visuals:**
    *   Improve differentiation between node types (User, Team, Project, Goal) using distinct colors, icons, or shapes.
    *   Potentially incorporate node status (e.g., project status) visually (e.g., border color, badge).
    *   Ensure consistent and clear labeling, handling potential overlaps.
*   [x] **FE-TASK-056: Enhance Edge Styling:**
    *   Improve clarity of different relationship types (e.g., `REPORTS_TO` vs. `MEMBER_OF` vs. `ALIGNED_TO`).
    *   Consider curved edges or improved routing for less visual clutter (investigate react-flow options).
    *   Refine edge thickness, color, and arrowheads.
*   [x] **FE-TASK-057: Improve Map Interactions:**
    *   Refine hover effects (e.g., clearer highlighting of node and immediate neighbors).
    *   Enhance visual feedback for selected nodes/edges.
    *   Ensure smooth panning/zooming animations and interactions feel fluid.

### Epic: Frontend - Map Clustering (Slice 3)

*   [ ] **FE-TASK-058: Implement Basic Node Clustering (Team Example):** _(Deferred - Requires broader scalability strategy. Visual component `ClusteredTeamNode.tsx` created. Logic implementation pending.)_
    *   Develop logic within `LivingMap.tsx` or a helper to group `User` nodes under their parent `Team` node, potentially triggered by zoom level or a manual toggle.
    *   Design and implement the visual representation of a "clustered" Team node (e.g., showing member count, different shape/style). _(Visual component done)_
    *   Ensure clicking a cluster expands it or navigates appropriately (TBD interaction). Consider performance implications.

### General / Cleanup (Slice 3)

*   [x] **GEN-TASK-005: Address Core TODOs (Slice 3 Scope):** Resolve any new TODOs introduced during this slice or pick up relevant deferred TODOs (e.g., add participant logic if feasible).
*   [ ] **GEN-TASK-006: Plan Scalability Strategy:** Define approaches for handling large graphs (e.g., view filtering/contextual loading in `/map/data`, progressive rendering, layout strategies, further clustering/summarization techniques).
    *   [x] **BE-TASK-035: Implement Contextual Loading:** Refactor `/map/data` endpoint to fetch a limited graph centered on the current user's context (team, projects, related goals) instead of loading all tenant data. _(Part of GEN-TASK-006)_
    *   [x] **BE-TASK-036: Implement Centered Loading (Depth 1):** Enhance `/map/data` endpoint to accept `center_node_id` and `depth` (initially `depth=1`) parameters. When provided, fetch the graph centered on that node and its direct neighbors, respecting the `types` filter. _(Part of GEN-TASK-006)_
    *   [x] **BE-TASK-037: Extend Centered Loading to Depth 2:** Update `/map/data` endpoint logic to support `depth=2` by fetching neighbors of the 1-hop neighbors when `depth=2` is requested. _(Part of GEN-TASK-006)_ 