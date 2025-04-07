# Kanban - Done

Tasks that have been reviewed and meet the definition of done (e.g., PR merged).

*(Move tasks here from KANBAN_REVIEW.md upon completion. Include Task ID, Description, Completion Date)*

---

*   **FE-TASK-001:** Initialize React Project: Set up a new React project using Create React App or Vite, configured with TypeScript.
    *   Completion Date: [Current Date]
*   **FE-TASK-002:** Install & Configure Chakra UI: Integrate Chakra UI and set up basic theme provider/customization.
    *   Completion Date: [Current Date] 
*   **FE-TASK-003:** Basic Routing Setup: Implement basic client-side routing (e.g., using `react-router-dom`) for login, workspace, profile, and example hub pages.
    *   Completion Date: [Current Date] 
*   **FE-TASK-004:** Create Core App Layout: Build the main application shell (e.g., top navigation bar, sidebar if applicable, main content area) using Chakra UI components.
    *   Completion Date: [Current Date] 
*   **FE-TASK-005:** Build Fake Login Page: Create the login page UI with "Login with Google" and "Login with Microsoft" buttons (visually styled but non-functional).
    *   Completion Date: [Current Date]
*   **FE-TASK-006:** Implement Fake Login Flow: Make login buttons navigate directly to the main workspace route upon click (no actual authentication).
    *   Completion Date: [Current Date] (Completed as part of FE-TASK-005)
*   **FE-TASK-007:** Build Workspace View Layout: Structure the main workspace page UI, including a prominent area for the Daily Briefing.
    *   Completion Date: [Current Date]
*   **FE-TASK-008:** Display Static AI Daily Briefing: Populate the briefing area with pre-written, styled static text (using Chakra UI for formatting) simulating the AI summary. Include examples of highlighted entities (bold text, maybe placeholder links).
    *   Completion Date: [Current Date]
*   **FE-TASK-009 (Optional):** Style Key Entities: Apply specific visual styles (color, font weight, icons) to the simulated entities (people, projects, meetings) within the briefing text.
    *   Completion Date: [Current Date]
*   **FE-TASK-010:** Build Profile Page/Section: Create a simple UI section or page to display user profile information.
    *   Completion Date: [Current Date]
*   **FE-TASK-011:** Display Hardcoded Profile Data: Populate the profile section with static demo user data (name, email, title, manager, team).
    *   Completion Date: [Current Date] (Completed as part of FE-TASK-010)
*   **FE-TASK-012:** Build Example Project Hub List: Create a UI element (e.g., in a sidebar or main view) listing 1-2 clickable, static example Project Hub names.
    *   Completion Date: [Current Date]
*   **FE-TASK-013:** Build Static Project Hub Page: Create the UI for a single Project Hub page.
    *   Completion Date: [Current Date] (Updated by user)
*   **FE-TASK-014:** Populate Static Hub Content: Fill the example hub page(s) with hardcoded content (e.g., static notes/updates, list of fake members).
    *   Completion Date: [Current Date] (Updated by user)
*   **FE-TASK-015:** Implement "Create Hub" Button (Visual Only): Add a "Create Hub" button that perhaps navigates to a blank or generic version of the static hub page (or does nothing significant).
    *   Completion Date: [Current Date]
*   **FE-TASK-016:** Add Non-functional Input Fields: Include text areas/buttons for "Add Note" or "Invite User" within the hub page, but without any associated logic or state changes.
    *   Completion Date: [Current Date]
*   **FE-TASK-017:** Add Integration Icons/Placeholders: Incorporate visual elements (icons, labeled sections) into the workspace UI representing future integrations (Calendar, Slack, Jira, Drive, etc.). These should be clearly non-functional placeholders.
    *   Completion Date: [Current Date]
*   **FE-TASK-018:** Ensure Responsiveness (Basic): Apply basic responsive design principles using Chakra UI's utilities so the demo looks acceptable on common screen sizes.
    *   Completion Date: [Current Date]
*   **FE-TASK-019:** Code Cleanup & Review: Basic code formatting, linting, and internal review before finalizing the demo build.
    *   Completion Date: [Current Date]
*   **FE-TASK-020:** Define Static Goal Data: Create a static data structure (e.g., in `WorkspacePage.tsx` or a separate mock data file) representing a simple goal hierarchy (Enterprise -> Dept -> Team -> Project).
    *   Completion Date: [Current Date] (Completed as prerequisite for FE-TASK-021)
*   **FE-TASK-021:** Create Goals Page Component (`src/pages/GoalsPage.tsx`): Build a new page component that renders the static goal hierarchy visually (e.g., using nested Cards or a simple list structure).
    *   Completion Date: [Current Date]
*   **FE-TASK-022:** Add Goals Page Route: Update routing in `App.tsx` to include the `/goals` route rendering `GoalsPage`.
    *   Completion Date: [Current Date]
*   **FE-TASK-023:** Add Goals Link to Main Nav: Update `MainLayout.tsx` to include a link to the new `/goals` page in the top navigation.
    *   Completion Date: [Current Date]
*   **FE-TASK-024:** Enhance Workspace Page (Add Goals Widget): Modify `WorkspacePage.tsx` to include a new Card/section displaying 1-2 relevant goals (e.g., "Your Team's Goals") linked to the main `/goals` page. Adjust layout if needed.
    *   Completion Date: [Current Date]
*   **FE-TASK-025:** Enhance Hub Page (Link Goal Tag): Modify `HubPage.tsx` to make the "Goal" tag (displaying `alignedGoal`) a link, potentially linking to an anchor on the `/goals` page (simulation).
    *   Completion Date: [Current Date]
*   **FE-TASK-026:** Define Static Team/Dept Data: Augment mock data structures to include team leads, department leads, and relationships between teams and departments.
    *   Completion Date: [Current Date]
*   **FE-TASK-027 (New):** Create Mocked Team Page Component (`src/pages/TeamPage.tsx`) & Route: Build page showing team name, lead, members, projects, goals, department link.
    *   Completion Date: [Current Date]
*   **FE-TASK-028 (New):** Create Mocked Department Page Component (`src/pages/DepartmentPage.tsx`) & Route: Build page showing dept name, lead, team list.
    *   Completion Date: [Current Date]
*   **FE-TASK-029 (New - was implicit in FE-TASK-030):** Update Contextual Links: Ensure links on Profile, Hub, Team, Dept pages point correctly to the relevant simulated entity pages.
    *   Completion Date: [Current Date]
*   **FE-TASK-030 (New - was FE-TASK-031):** Add "Explore Organization" Link & Placeholder Page: Add link in main nav leading to a static page explaining the future org graph vision.
    *   Completion Date: [Current Date]