# KnowledgePlane AI - Slice 0: Vision Demo Frontend Tasks

**Goal:** Build a visually compelling frontend prototype demonstrating the core value proposition using mocked data. Focus on UI/UX polish and speed.

**Related Document:** See "Slice 0: The Vision Demo" section in `PRODUCT_BACKLOG.md` for scope and simulation strategy.

**Technology:** React (TypeScript), Chakra UI.

---

## Task Breakdown

### Setup & Core Layout

* **FE-TASK-001: Initialize React Project:** Set up a new React project using Create React App or Vite, configured with TypeScript.
* **FE-TASK-002: Install & Configure Chakra UI:** Integrate Chakra UI and set up basic theme provider/customization.
* **FE-TASK-003: Basic Routing Setup:** Implement basic client-side routing (e.g., using `react-router-dom`) for login, workspace, profile, and example hub pages.
* **FE-TASK-004: Create Core App Layout:** Build the main application shell (e.g., top navigation bar, sidebar if applicable, main content area) using Chakra UI components.

### Login/Onboarding Simulation

* **FE-TASK-005: Build Fake Login Page:** Create the login page UI with "Login with Google" and "Login with Microsoft" buttons (visually styled but non-functional).
* **FE-TASK-006: Implement Fake Login Flow:** Make login buttons navigate directly to the main workspace route upon click (no actual authentication).

### Workspace View & AI Daily Briefing

* **FE-TASK-007: Build Workspace View Layout:** Structure the main workspace page UI, including a prominent area for the Daily Briefing.
* **FE-TASK-008: Display Static AI Daily Briefing:** Populate the briefing area with pre-written, styled static text (using Chakra UI for formatting) simulating the AI summary. Include examples of highlighted entities (bold text, maybe placeholder links).
* **FE-TASK-009 (Optional): Style Key Entities:** Apply specific visual styles (color, font weight, icons) to the simulated entities (people, projects, meetings) within the briefing text.

### Basic Org Context Display

* **FE-TASK-010: Build Profile Page/Section:** Create a simple UI section or page to display user profile information.
* **FE-TASK-011: Display Hardcoded Profile Data:** Populate the profile section with static demo user data (name, email, title, fake manager name, fake team name).

### Minimal Collaboration Hub Simulation

* **FE-TASK-012: Build Example Project Hub List:** Create a UI element (e.g., in a sidebar or main view) listing 1-2 clickable, static example Project Hub names.
* **FE-TASK-013: Build Static Project Hub Page:** Create the UI for a single Project Hub page.
* **FE-TASK-014: Populate Static Hub Content:** Fill the example hub page(s) with hardcoded content (e.g., static notes/updates, list of fake members).
* **FE-TASK-015: Implement "Create Hub" Button (Visual Only):** Add a "Create Hub" button that perhaps navigates to a blank or generic version of the static hub page (or does nothing significant).
* **FE-TASK-016: Add Non-functional Input Fields:** Include text areas/buttons for "Add Note" or "Invite User" within the hub page, but without any associated logic or state changes.

### Integration Placeholders

* **FE-TASK-017: Add Integration Icons/Placeholders:** Incorporate visual elements (icons, labeled sections) into the workspace UI representing future integrations (Calendar, Slack, Jira, Drive, etc.). These should be clearly non-functional placeholders.

### General

* **FE-TASK-018: Ensure Responsiveness (Basic):** Apply basic responsive design principles using Chakra UI's utilities so the demo looks acceptable on common screen sizes.
* **FE-TASK-019: Code Cleanup & Review:** Basic code formatting, linting, and internal review before finalizing the demo build.

---

## Slice 0.5: Vision Demo - Organizational Context (Target: + ~1-2 Weeks)

**Goal:** Enhance the Slice 0 demo with mocked UI views that illustrate organizational context, alignment (Goals/OKRs), and multi-level value, using static data.

**Epics Involved (Conceptual):** Emergent Organizational Model, Strategic Alignment Engine.

**Tasks:**

* **FE-TASK-020:** Define Static Goal Data: Create a static data structure (e.g., in `WorkspacePage.tsx` or a separate mock data file) representing a simple goal hierarchy (Enterprise -> Dept -> Team -> Project).
* **FE-TASK-021:** Create Goals Page Component (`src/pages/GoalsPage.tsx`): Build a new page component that renders the static goal hierarchy visually (e.g., using nested Cards or a simple list structure).
* **FE-TASK-022:** Add Goals Page Route: Update routing in `App.tsx` to include the `/goals` route rendering `GoalsPage`.
* **FE-TASK-023:** Add Goals Link to Main Nav: Update `MainLayout.tsx` to include a link to the new `/goals` page in the top navigation.
* **FE-TASK-024 (Revised Scope):** Enhance Workspace Page (Add My Context Widget): Replace the "Your Team" card with a more detailed "My Context" card showing user's team, dept, manager, key goal/project links (using static data and linking to relevant entity pages).
* **FE-TASK-025:** Enhance Hub Page (Link Goal Tag): Modify `HubPage.tsx` to make the "Goal" tag (displaying `alignedGoal`) a link, potentially linking to an anchor on the `/goals` page (simulation).
* **FE-TASK-026 (New):** Define Static Team/Dept Data: Augment mock data structures to include team leads, department leads, and relationships between teams and departments.
* **FE-TASK-027 (New):** Create Mocked Team Page Component (`src/pages/TeamPage.tsx`) & Route: Build page showing team name, lead, members, projects, goals, department link.
* **FE-TASK-028 (New):** Create Mocked Department Page Component (`src/pages/DepartmentPage.tsx`) & Route: Build page showing dept name, lead, team list.
* **FE-TASK-029 (New - was implicit in FE-TASK-030):** Update Contextual Links: Ensure links on Profile, Hub, Team, Dept pages point correctly to the relevant simulated entity pages.
* **FE-TASK-030 (New - was FE-TASK-031):** Add "Explore Organization" Link & Placeholder Page: Add link in main nav leading to a static page explaining the future org graph vision.
