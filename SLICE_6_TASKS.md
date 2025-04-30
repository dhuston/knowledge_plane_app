# KnowledgePlane AI - Slice 6 Tasks (Enterprise-Scale Living Map)

**Goal:** Upgrade the Living Map experience so it remains fluid and insightful for enterprise tenants (hundreds-to-thousands of nodes), via a WebGL renderer swap, progressive disclosure & graph-native backend enhancements.

**Related Epics:** Living Map – Advanced Visualisation & Interaction, Scalability, Technical Architecture

---

## Task Breakdown

*(Continuing numbering from Slice 5 – last task was 068)*

### Epic: Frontend – WebGL Renderer & Progressive Disclosure (Slice 6)

* [ ] **FE-TASK-069: Swap SVG renderer for WebGL:** Replace the current React-Flow SVG layer with a WebGL/Canvas-backed alternative (e.g. `react-flow-renderer + regl` or Sigma.js). Achieve 5 000+ nodes @60 fps.
* [x] **FE-TASK-070: Implement Semantic Zoom LOD:** Dynamically adjust node detail based on zoom level (department → team → user → asset). Ensure text/avatars hide at low zoom to reduce draw calls.
* [ ] **FE-TASK-071: Dynamic Clustering / Collapse UI:** Add click-to-collapse groups & auto-cluster toggle (hierarchical / force). Integrate with existing filter + cluster state.
* [x] **FE-TASK-072: Facet & Time Filters Panel:** Extend filter sidebar with project/therapeutic area/date range facets. Filters must instantly hide unrelated sub-graphs.
* [ ] **FE-TASK-073: Viewport-Driven Lazy Loading:** Implement tile-based fetch; request only nodes/edges inside (or near) the current viewport. Pan/zoom triggers incremental API calls.
* [x] **FE-TASK-074: Mini-Map & Search-to-Focus:** Provide global mini-map overview + search bar that pans/zooms to a node.

### Epic: Backend – Graph-Native API & Data Model (Slice 6)

* [x] **BE-TASK-075: Nodes/Edges Property-Graph Tables:** Create `nodes` & `edges` tables (UUID PK, JSONB props) with tenant-aware indexes; migrate existing models.
* [x] **BE-TASK-076: Recursive CTE Endpoints:** Add `/graph/expand` that returns ≤200 neighbours (depth ≤3) via recursive CTE, respecting RLS & filters.
* [x] **BE-TASK-077: Pre-computed LOD Views:** Nightly job materialises roll-up tables (`department_rollup`, `goal_rollup`) for fast org-wide views.
* [x] **BE-TASK-078: Delta Stream Service:** Produce Kafka/SQS events on node/edge INSERT/UPDATE; expose WebSocket endpoint `/ws/delta` for the browser.
* [x] **BE-TASK-079: In-Memory Neighbour Cache:** Redis cache keyed by `(tenant, src_id, depth)` to accelerate hover expansions.

### Epic: Infrastructure – Postgres Graph Extensions (Slice 6)

* [ ] **INFRA-TASK-080: Install Apache AGE:** Enable openCypher in the existing PG cluster; verify mixed SQL/Cypher queries.
* [ ] **INFRA-TASK-081: Add `ltree` & `pgRouting`:** Enable fast hierarchical & shortest-path queries. Document migration.

### Epic: Algorithmic Helpers – Navigability at Scale (Slice 6)

* [ ] **ALG-TASK-082: Community Detection Batch Job:** Offline Louvain/Leiden runs update `node_metrics.community_id` nightly.
* [ ] **ALG-TASK-083: Centrality Scoring:** Compute PageRank/betweenness; store in `node_metrics` for UI highlighting.
* [ ] **ALG-TASK-084: Adaptive Edge Pruning:** API trims low-relevance edges based on persona/context query params.

### General / Cleanup (Slice 6)

* [ ] **GEN-TASK-009: Update Architecture Docs:** Capture Postgres-graph approach, WebGL stack choice, performance benchmarks.
* [ ] **GEN-TASK-010: Spike ‑ Renderer POC:** 1-week time-boxed spike comparing `react-force-graph`, Sigma.js, deck.gl + custom shaders; document findings. 