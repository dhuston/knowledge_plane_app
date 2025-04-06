# KnowledgePlane AI - Slice 0: Vision Demo Frontend Tasks

**Goal:** Build a visually compelling frontend prototype demonstrating the core value proposition using mocked data. Focus on UI/UX polish and speed.

**Related Document:** See "Slice 0: The Vision Demo" section in `PRODUCT_BACKLOG.md` for scope and simulation strategy.

**Technology:** React (TypeScript), Chakra UI.

---

## Task Breakdown

### Setup & Core Layout

*   **FE-TASK-001: Initialize React Project:** Set up a new React project using Create React App or Vite, configured with TypeScript.
*   **FE-TASK-002: Install & Configure Chakra UI:** Integrate Chakra UI and set up basic theme provider/customization.
*   **FE-TASK-003: Basic Routing Setup:** Implement basic client-side routing (e.g., using `react-router-dom`) for login, workspace, profile, and example hub pages.
*   **FE-TASK-004: Create Core App Layout:** Build the main application shell (e.g., top navigation bar, sidebar if applicable, main content area) using Chakra UI components.

### Login/Onboarding Simulation

*   **FE-TASK-005: Build Fake Login Page:** Create the login page UI with "Login with Google" and "Login with Microsoft" buttons (visually styled but non-functional).
*   **FE-TASK-006: Implement Fake Login Flow:** Make login buttons navigate directly to the main workspace route upon click (no actual authentication).

### Workspace View & AI Daily Briefing

*   **FE-TASK-007: Build Workspace View Layout:** Structure the main workspace page UI, including a prominent area for the Daily Briefing.
*   **FE-TASK-008: Display Static AI Daily Briefing:** Populate the briefing area with pre-written, styled static text (using Chakra UI for formatting) simulating the AI summary. Include examples of highlighted entities (bold text, maybe placeholder links).
*   **FE-TASK-009 (Optional): Style Key Entities:** Apply specific visual styles (color, font weight, icons) to the simulated entities (people, projects, meetings) within the briefing text.

### Basic Org Context Display

*   **FE-TASK-010: Build Profile Page/Section:** Create a simple UI section or page to display user profile information.
*   **FE-TASK-011: Display Hardcoded Profile Data:** Populate the profile section with static demo user data (name, email, title, fake manager name, fake team name).

### Minimal Collaboration Hub Simulation

*   **FE-TASK-012: Build Example Project Hub List:** Create a UI element (e.g., in a sidebar or main view) listing 1-2 clickable, static example Project Hub names.
*   **FE-TASK-013: Build Static Project Hub Page:** Create the UI for a single Project Hub page.
*   **FE-TASK-014: Populate Static Hub Content:** Fill the example hub page(s) with hardcoded content (e.g., static notes/updates, list of fake members).
*   **FE-TASK-015: Implement "Create Hub" Button (Visual Only):** Add a "Create Hub" button that perhaps navigates to a blank or generic version of the static hub page (or does nothing significant).
*   **FE-TASK-016: Add Non-functional Input Fields:** Include text areas/buttons for "Add Note" or "Invite User" within the hub page, but without any associated logic or state changes.

### Integration Placeholders

*   **FE-TASK-017: Add Integration Icons/Placeholders:** Incorporate visual elements (icons, labeled sections) into the workspace UI representing future integrations (Calendar, Slack, Jira, Drive, etc.). These should be clearly non-functional placeholders.

### General

*   **FE-TASK-018: Ensure Responsiveness (Basic):** Apply basic responsive design principles using Chakra UI's utilities so the demo looks acceptable on common screen sizes.
*   **FE-TASK-019: Code Cleanup & Review:** Basic code formatting, linting, and internal review before finalizing the demo build. 