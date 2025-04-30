# KnowledgePlane AI - Product Backlog (High-Level)

**Note:** This is a living document. Items will be refined, detailed, and prioritized continuously based on the Agile development process. Prioritization (e.g., MoSCoW) will be applied during sprint planning. **This backlog has been updated to reflect the central "Living Map" UX vision.**

---

## MVP Phasing & Demo Strategy

To balance the need for rapid demonstration (for VCs, early customers) with building a robust platform centered on the Living Map, the MVP rollout is planned in slices:

### Slice 0: The Vision Demo (Target: Weeks)

* **Goal:** Create a visually compelling frontend prototype demonstrating the *essence* of the **Living Map** and KnowledgePlane AI's value proposition. Prioritize speed and impact over fully functional backend systems.
* **Target Audience:** VCs, potential early pilot customers.
* **Technology Focus:** Frontend-heavy (React/Vue + TypeScript, potentially a basic graph viz lib like react-flow), high-fidelity UI/UX, minimal/mock backend (hardcoded data or simple mock server).
* **Key User Stories Represented & Simulation Strategy:** Mock a simple version of the Living Map showing a few nodes (people, teams, projects) and links. Implement basic hover effects showing mock context panels. Simulate navigation/interaction with the map. Include mockups of the Daily Briefing panel and Insights feed, drawing attention to how they relate to the map.

### Slice 0.5: Vision Demo - Organizational Context (Target: + ~1-2 Weeks)

**Goal:** Enhance the Slice 0 demo by enriching the **mocked Living Map** with more nodes representing organizational context (Goals/OKRs, Departments) and illustrating alignment (e.g., linking projects to goals visually on the map). Use static data.

**Epics Involved (Conceptual):** Living Map Visualization, Emergent Organizational Model, Strategic Alignment Engine.

**Tasks:** Add mock goal nodes, department nodes to the map visualization. Show visual links representing alignment. Add mock Goal/Department pages accessible perhaps via clicking nodes on the map.

### Slice 1: The Technical Validation Alpha (Target: + ~1-2 Months after Slice 0.5)

* **Goal:** Replace core mocks with real backend plumbing for key pathways. Validate core technical assumptions for authentication, database persistence, basic API communication, and the first integration. Demonstrate the *start* of the Emergent Org Model with real data **feeding a very basic, technically functional Living Map view**. Focus is on backend plumbing and data flow, less on visual polish of the map itself at this stage.
* **Target Audience:** Internal team, potentially trusted advisors/friends & family.
* **Technology Focus:** Initial Python/FastAPI backend (Modular Monolith), PostgreSQL DB setup w/ Alembic, Docker Compose for local dev, Real SSO (Google), Real Calendar API integration (Google), JWT Auth, Basic API endpoints for map data, Simple frontend graph rendering.
* **Key Features / User Stories:**
  * Backend: Setup FastAPI project, initial User/Tenant/Team models & migrations (Alembic), DB connection. Define basic Node/Edge concepts for the map data.
  * Authentication: Implement Google OAuth2 login flow (backend callback, user upsert, JWT generation/validation).
  * API: Create `/users/me`, `/users/{id}`, `/teams/{id}` endpoints returning authenticated user data from DB. Create initial `/map/data` endpoint returning basic node/link data for the current user's context.
  * Frontend: Connect Login page to backend OAuth flow, handle JWT, fetch and display real user data on Profile/Nav. **Implement a rudimentary graph view component that consumes `/map/data` and renders nodes (users, teams) and basic links (manager, team membership).**
  * Integration: Implement Google Calendar API auth (OAuth) and fetch today's events (backend). Store credentials.
  * AI Briefing (Map Context): Replace static briefing calendar items with dynamically fetched Google Calendar data, presented in a panel potentially linked to the user's node on the map.
  * Org Model (Seed): During user sync/auth, attempt to pull manager info from Google API and store `manager_id` link in User table. **Visualize this 'reports-to' link on the rudimentary map.** Display linked manager name on Profile page/panel.

### Slice 2: The Pilot MVP (Target: + ~2-3 Months after Slice 1)

* **Goal:** Deliver the full MVP scope as defined in the Epics below, featuring a **functional and interactive Living Map** as the core UX, ready for carefully selected pilot customers.
* **Target Audience:** Initial pilot customers.
* **Technology Focus:** Complete MVP features, robust integration handling, enhanced map visualization (**initial visual polish**, interactivity, basic filtering, contextual panels), initial AI insights surfaced, basic monitoring/logging, initial deployment pipeline.

---

## Epics & User Stories

### Epic: Core Platform & User Onboarding (MVP Foundation)

* **Goal:** Establish the basic platform infrastructure, user authentication, and the **foundation for the Living Map**. Provide the shell for the **intelligent workspace centered on the map**.
* **User Stories (MVP Focus):**
  * As a new user, I want to sign up for KnowledgePlane using my company's Google Workspace account so that I don't need to create a separate password.
  * As a new user, I want to sign up for KnowledgePlane using my company's Microsoft Azure AD account so that I don't need to create a separate password.
  * As a new user, I want to log in securely using my integrated company account (Google/Microsoft).
  * As a user, I want to see my basic profile information (name, email, title - if available) automatically populated from my company directory upon first login **and visible in my node's context panel on the Living Map**.
  * As a user, I want a primary workspace view **dominated by the interactive Living Map, with access to supporting panels like the AI Daily Briefing, Insights feed, and collaboration hubs accessible contextually from the map**.
  * As a platform administrator, I want basic tenant isolation configured so that data from different customer organizations is kept separate **within the underlying model and map data**.

### Epic: Living Map & Individual AI Workspace (MVP)

* **Goal:** Provide immediate value via the **interactive Living Map and an AI assistant that surfaces relevant information contextually within the map interface**. Offer basic native collaboration accessible from the map. _(Addresses core navigation, context, and efficiency needs for Scientist, PI, and initial Director visibility)_
* **User Stories (MVP Focus):**
  * **[Living Map]** As a user, I want to see an **interactive network graph (Living Map)** visualizing key entities (myself, my team, my manager, projects I'm involved in) and their basic relationships (reports-to, team membership, project assignment).
  * **[Living Map]** As a user, I want to **pan and zoom** the Living Map to explore the organizational network.
  * **[Living Map]** As a user, when I **hover over a node** (person, team, project) on the map, I want to see basic information in a tooltip or small overlay.
  * **[Living Map]** As a user, when I **click on a node** on the map, I want a detailed **Briefing Panel** to open showing relevant context (profile info, team members, project status, etc.). _(Crucial for delivering persona-specific context)_
  * **[AI Assistant]** As a user, when I start my day, I want to see an **AI-generated Daily Briefing** presented in a panel, summarizing key information (e.g., upcoming meetings from calendar, mentions, key project updates - *initial version may be simple*) **and potentially highlighting relevant nodes on the map**. _(Initial step towards Scientist's desired assistant)_
  * **[AI Assistant]** As the system (AI), I want to generate the Daily Briefing by pulling data from integrated sources (initially Calendar, basic profile info) **and relating it to entities in the organizational model/map**.
  * **[AI Assistant]** As a user, I want the Daily Briefing presented in clear prose, potentially highlighting key entities (people, projects, meetings) **which link back to their nodes/panels on the map**.
  * **[Collaboration Hub]** As a user, I want to create a basic **Project Collaboration Hub** (e.g., a simple page/space associated with a project name), **represented as a node on the Living Map**.
  * **[Collaboration Hub]** As a user, I want to add simple notes or updates within a Project Collaboration Hub, **accessible via the project node's Briefing Panel on the map**.
  * **[Collaboration Hub]** As a user, I want to invite/add other KnowledgePlane users to a Project Collaboration Hub **(visualized as participant links on the map)**.
  * **[Living Map]** As a user, I want the Living Map to indicate placeholders or connection points for future integration with common business tools (e.g., Project Management, CRM - *visual cue only for MVP*).
  * *(Dependency: Requires Calendar Integration)*
  * *(Dependency: Requires basic User Profile data)*

### Epic: Integration - Identity & Basic Structure (MVP)

* **Goal:** Integrate with core identity providers to enable SSO and **passively infer basic organizational structure to populate the initial Living Map**.
* **User Stories (MVP Focus):**
  * As the system, I want to periodically sync basic user profile data (name, email, title, manager - if available) from the configured Identity Provider (Google/Microsoft) **to update the corresponding nodes and links on the Living Map**.
  * As the system, I want to infer basic reporting relationships ("reports to") based on manager information synced from the Identity Provider **and display these as links on the Living Map**.
  * As the system, I want to identify basic team/group memberships based on group data synced from the Identity Provider (e.g., Azure AD groups, Google Groups) **and represent these as team nodes and membership links on the Living Map**.
  * As a user, I want to see my inferred manager and team memberships (if available from sync) **visualized on the Living Map and listed in my user profile panel**.

### Epic: Integration - Calendar (MVP)

* **Goal:** Integrate with user calendars to understand schedules and inform the AI Daily Briefing **within the Living Map context**.
* **User Stories (MVP Focus):**
  * As a user, I want to authenticate my Google Calendar with KnowledgePlane so the platform can read my schedule (read-only).
  * As a user, I want to authenticate my Microsoft Outlook Calendar (via Microsoft Graph) with KnowledgePlane so the platform can read my schedule (read-only).
  * As the system, I want to fetch calendar events (today/near future) for authenticated users to use as input for the AI Daily Briefing **and potentially link events to project/people nodes on the map**.

### Epic: Integration - Communication (MVP Scaffolding)

* **Goal:** Integrate with a core communication tool to **establish the connection and enable future pattern analysis to enrich the Living Map relationships**. (Note: MVP functionality limited to auth and basic data pull).
* **User Stories (MVP Focus):**
  * As a user, I want to authenticate my company's Slack account with KnowledgePlane so the platform can access relevant public channel information (read-only initially) **for future visualization of communication links on the map**.
  * As a user, I want to authenticate my company's Microsoft Teams account with KnowledgePlane so the platform can access relevant public channel/team information (read-only initially) **for future visualization of communication links on the map**.
  * *(Post-MVP Story Example): As the system, I want to identify channels/teams a user is part of based on the communication integration **and link the user node to relevant channel/team nodes on the map**.*
  * *(Post-MVP Story Example): As a user, I want to see recent messages from connected channels relevant to a specific project **when viewing that project's node/panel on the map**.*

### Epic: Integration - Document Storage (MVP Scaffolding)

* **Goal:** Integrate with a core document storage provider to **establish the connection and enable future knowledge linking on the Living Map**. (Note: MVP functionality limited to auth).
* **User Stories (MVP Focus):**
  * As a user, I want to authenticate my company's Google Drive account with KnowledgePlane so the platform can eventually surface relevant documents **as knowledge asset nodes on the map**.
  * As a user, I want to authenticate my company's OneDrive/SharePoint account with KnowledgePlane so the platform can eventually surface relevant documents **as knowledge asset nodes on the map**.
  * *(Post-MVP Story Example): As a user, I want to link a specific task or note in my workspace to a document in Google Drive/OneDrive, **creating a visible link on the map**.*
  * *(Post-MVP Story Example): As the system, I want to suggest relevant documents from connected storage based on the context of the project or task I'm viewing **within the map's briefing panel**.*

---

## Future Epics (Post-MVP - Examples)

* **Epic: Living Map - Advanced Visualization & Interaction**
  * **Goal:** Enhance the Living Map's usability and clarity, especially for larger, more complex organizations. Address visual polish and scalability challenges.
  * **Key Features/Stories (Examples):**
    *   Implement advanced **filtering** controls (by type, status, custom attributes, relationships).
    *   Introduce automatic **node clustering/grouping** at higher zoom levels (e.g., collapsing team members into a team node).
    *   Develop **semantic zooming** capabilities (showing different levels of detail based on zoom).
    *   Implement **focus & context** views (expanding neighbors, dimming the rest).
    *   Integrate powerful **search functionality** to find and highlight nodes/edges on the map.
    *   Explore and implement more sophisticated **layout algorithms** (hierarchical, constrained force-directed, potentially user-selectable).
    *   Add a **mini-map/overview** component for large graph navigation.
    *   Refine **visual aesthetics** for an enterprise-grade experience (custom node/edge rendering, smooth animations, potentially evaluating alternative libraries like GoJS or yFiles if react-flow limitations are hit).
    *   Implement the **Org Time Machine** feature.
* **Epic: Scenario Simulator & Predictive Insights** (What-if analysis on the map, AI-driven forecasts) _(Directly addresses needs of R&D Director, Head of Innovation)_
* **Epic: Emergent Organizational Model - Enrichment & Visualization** (Visualizing inferred structure, allowing manual edits/suggestions directly on the map) _(Helps all personas understand the real network)_
* **Epic: Individual AI Workspace - Advanced Features** (AI suggestions within map context, goal tracking linked to map nodes) _(Builds on Scientist/PI needs)_
* **Epic: Team Collaboration Features** (Shared spaces visualized on map, contextual discussions linked to map nodes)
* **Epic: Strategic Alignment Engine** (Goal definition (OKRs) visualized and tracked on the map, linking work to goals visually) _(Key for PI, Director, Innovation Head)_
* **Epic: Native Tool Augmentation** (Building integrated tools like project registry, knowledge base represented as nodes/panels within the map)
* **Epic: Adaptive Intelligence & Insights** (Proactive suggestions surfaced on map, risk detection highlighted on map, cross-functional insights visualized) _(Core value for all personas, especially PI, Director, Translational Lead, Innovation Head)_
  * _(Example Future Story): As a Research Scientist, I want the AI assistant (in the briefing panel or contextually on the map) to suggest potential causes or related internal experiments when it detects anomalies in my recently logged data._
  * _(Example Future Story): As a PI, I want the AI to proactively surface relevant findings or newly created knowledge assets (notes, reports) from other internal projects that share keywords or concepts with my active projects._
  * _(Example Future Story): As a Translational Lead, I want the AI to automatically compare key biomarker results between linked preclinical asset nodes and incoming clinical data nodes, flagging significant discrepancies in the Briefing Panel or directly on the map._
  * _(Example Future Story): As an R&D Director, I want the Adaptive Intelligence system to highlight projects on the map that are showing early indicators of risk (based on historical patterns) or drifting from their aligned strategic goals._
* **Epic: Advanced Integrations** (Project Management tools like Jira/Asana, CRM tools, etc. - represented as nodes and links on the map) _(Further addresses tool fragmentation)_
* **Epic: Administration & Configuration** (Tenant settings, integration management, user roles/permissions impacting map visibility)
