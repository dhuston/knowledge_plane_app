# Organizational Hierarchy Navigator

A fixed-width sidebar component that displays the formal organizational structure, complementing the Living Map visualization of emergent connections.

## Overview

The Organizational Hierarchy Navigator provides a way for users to navigate through their formal organizational structure (team → department → organization) and understand their place within it while working on their daily tasks. This component implements Epic 5.1 according to the specified requirements.

## Key Features

- Fixed 60px width sidebar with icon-based navigation
- Interactive chevron-style expandable navigation
- Popovers with detailed information about each organizational unit
- User position indicator at the top of the navigator
- Search functionality for finding teams, departments, and people
- Connection strength indicators showing relationship strengths

## Component Structure

The components follow a clear separation of concerns:

```
components/hierarchy/
├── HierarchyNavigator.tsx            # Container component with context provider
├── HierarchyNavigatorView.tsx        # Presentation component
├── HierarchyItem.tsx                 # Individual hierarchy item 
├── HierarchyPopover.tsx              # Main popover container
├── HierarchySearchPopover.tsx        # Search popover component
├── UserPositionCard.tsx              # User position display
├── index.ts                          # Public API exports
├── state/
│   ├── HierarchyContext.tsx          # Context provider
│   └── HierarchyReducer.ts           # State management
├── services/
│   └── HierarchyService.ts           # API integration
├── popovers/
│   ├── TeamPopover.tsx               # Team-specific popover content
│   ├── DepartmentPopover.tsx         # Department-specific popover content
│   ├── OrganizationPopover.tsx       # Organization-specific popover content
│   └── UserPopover.tsx               # User-specific popover content
├── search/
│   ├── SearchInput.tsx               # Search input field
│   ├── SearchFilters.tsx             # Filter buttons
│   ├── SearchResults.tsx             # Search results list
│   └── RecentSearches.tsx            # Recent searches list
├── styles/
│   ├── animations.ts                 # Animation definitions
│   ├── containerStyles.ts            # Container and layout styles
│   ├── itemStyles.ts                 # Item style variants
│   └── index.ts                      # Style exports
└── __tests__/
    ├── HierarchyComponents.test.tsx  # Component-specific tests
    └── HierarchyNavigator.test.tsx   # Integration tests
```

## Design Principles

The component architecture follows these principles:

1. **Separation of Concerns**: Each file has a single responsibility
2. **Container/Presentation Pattern**: Logic is separated from presentation
3. **Small, Focused Components**: Each component does one thing well
4. **Reusable Styles**: Styles are organized into focused modules
5. **Type Safety**: TypeScript is used throughout for type safety

## Usage

```tsx
import { HierarchyNavigator } from '../components/hierarchy';

// In your component
function MyWorkPage() {
  return (
    <Flex>
      {/* Include the navigator on the left side */}
      <HierarchyNavigator 
        onUnitSelected={(unitId) => {
          // Filter content based on selected organizational unit
          console.log(`Selected unit: ${unitId}`);
        }}
      />
      
      {/* Main content */}
      <Box flex="1">
        Content here...
      </Box>
    </Flex>
  );
}
```

## Feature Flag

This component can be enabled/disabled via the `enableHierarchyNavigator` feature flag in the admin panel.