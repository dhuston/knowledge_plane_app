# Context Panel Components Test Plan

This document outlines the testing strategy for the Context Panel components, which are critical UI elements that display details about selected nodes in the Living Map visualization.

## Components to Test

1. **ContextPanel.tsx**
   - Contains the overall panel structure and tab system
   - Already has tests, but coverage could be improved

2. **ContextDrawer.tsx**
   - Wrapper component that manages the drawer state and interaction with NodeSelectionContext
   - Already has tests, but coverage could be improved

3. **EntityDetails.tsx**
   - Displays detailed information about selected entities
   - Currently untested

4. **RelationshipList.tsx**
   - Shows connections between the selected entity and other entities
   - Has tests, but coverage could be improved

5. **ActivityTimeline.tsx**
   - Shows historical activity for the selected entity
   - Currently untested

6. **Entity-specific panels**
   - UserPanel.tsx
   - TeamPanel.tsx
   - ProjectPanel.tsx
   - GoalPanel.tsx
   - All currently untested

7. **Header components**
   - PanelHeader.tsx
   - BreadcrumbNav.tsx
   - Both currently untested

8. **Suggestions components**
   - EntitySuggestions.tsx
   - EntitySuggestionsContainer.tsx (has test)
   - RecentlyViewedEntities.tsx
   - Some have tests, but coverage is limited

## Testing Strategy

For each component, we'll implement the following types of tests:

### 1. Rendering Tests
- Verify components render without crashing
- Check for presence of key elements in the DOM
- Test different display states (loading, error, empty, populated)

### 2. Interactive Tests
- Test user interactions (clicks, expandable sections, modals)
- Verify tab switching and content display
- Test responsive behavior

### 3. Integration Tests
- Test integration with context providers
- Test data flow between components
- Test API interactions with mocked responses

## Test Implementation Plan

### Phase 1: Core Components

1. **EntityDetails.tsx Tests**
   - Test rendering with different entity types (user, team, project, goal)
   - Test handling of various data properties and formats
   - Test interactive elements like expandable sections
   - Test rich content rendering (markdown, links, images)
   - Test status badges and tag rendering

2. **ActivityTimeline.tsx Tests**
   - Test rendering with different activity types
   - Test loading states and empty states
   - Test filtering and interaction elements

### Phase 2: Entity-specific Panels

1. **UserPanel.tsx Tests**
   - Test user-specific data rendering
   - Test integration with EntityDetails
   - Test user-specific action buttons

2. **TeamPanel.tsx Tests**
   - Test team-specific data rendering
   - Test member list integration
   - Test team-specific actions

3. **ProjectPanel.tsx Tests**
   - Test project-specific data rendering
   - Test timeline display
   - Test participant list

4. **GoalPanel.tsx Tests**
   - Test goal-specific data rendering
   - Test progress tracking
   - Test related projects display

### Phase 3: Header and Suggestion Components

1. **PanelHeader.tsx & BreadcrumbNav.tsx Tests**
   - Test header rendering with different entity types
   - Test breadcrumb navigation
   - Test action buttons

2. **Suggestion Components Tests**
   - Test suggestion rendering and interaction
   - Test loading and empty states
   - Test selection behavior

## Detailed Test Cases for EntityDetails.tsx

1. **Basic Rendering**
   - Should render with minimal props
   - Should display entity title and type
   - Should render loading state correctly

2. **Property Display**
   - Should display entity properties in grid format
   - Should handle "show more/less" functionality
   - Should format property names correctly

3. **Description Display**
   - Should render markdown content correctly
   - Should handle expandable long descriptions
   - Should detect and display content type indicators (links, images, code)

4. **Link Handling**
   - Should extract links from description
   - Should render link modal when "View All" is clicked
   - Should correctly format and display links

5. **Status and Tags**
   - Should render status badge with correct color and icon
   - Should display tags with consistent styling
   - Should handle different status values appropriately

6. **Metadata**
   - Should display creation and update timestamps
   - Should handle missing timestamps gracefully

## Mock Data Requirements

The test implementation will need comprehensive mock data for:

1. User entities
2. Team entities
3. Project entities
4. Goal entities
5. Knowledge asset entities
6. Department entities

Each with variations including:
- With/without descriptions
- With/without links
- With/without tags
- Different status values
- Different property sets

## Coverage Targets

- Line coverage: >80%
- Branch coverage: >75%
- Function coverage: >90%
- Statement coverage: >80%