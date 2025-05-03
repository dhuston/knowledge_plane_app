# Context Panel Component

## Overview

The Context Panel is a critical UI component in the KnowledgePlane AI platform that displays detailed information about selected entities in the Living Map. It provides users with rich, contextual information about people, teams, projects, goals, and other entity types.

## Features

- **Entity Details**: Comprehensive information about the selected entity
- **Relationship Visualization**: Visual representation of connections to other entities
- **Activity Timeline**: Historical activity related to the entity
- **Rich Content Support**: Markdown rendering for descriptions and notes
- **Entity Suggestions**: ML-based suggestions for related entities
- **Action Buttons**: Entity-specific actions (e.g., message user, join team)
- **Breadcrumb Navigation**: Navigation path showing exploration history
- **Expandable View**: Toggle between standard and expanded panel sizes

## Component Structure

The Context Panel follows a modular architecture with several specialized components:

```
components/panels/
├── ContextPanel.tsx            # Main panel container
├── ContextDrawer.tsx           # Drawer-based implementation
├── EntityDetails.tsx           # Shared details component
├── RelationshipList.tsx        # Relationships visualization
├── ActivityTimeline.tsx        # Activity history component
├── ActionButtons.tsx           # Entity-specific actions
├── header/                     # Header components
│   ├── PanelHeader.tsx         # Panel title and controls
│   └── BreadcrumbNav.tsx       # Navigation breadcrumbs
├── tabs/                       # Tab navigation
│   └── PanelTabs.tsx           # Tab controls
├── entity-panels/              # Entity-specific panels
│   ├── UserPanel.tsx           # User details panel
│   ├── TeamPanel.tsx           # Team details panel 
│   ├── ProjectPanel.tsx        # Project details panel
│   ├── GoalPanel.tsx           # Goal details panel
│   ├── DepartmentPanel.tsx     # Department details panel
│   └── KnowledgeAssetPanel.tsx # Knowledge asset panel
└── suggestions/                # Suggestion components
    ├── EntitySuggestions.tsx   # Suggestions UI
    └── RecentlyViewedEntities.tsx  # Recently viewed entities
```

## Usage

### Basic Usage

```tsx
import ContextPanel from '../components/panels/ContextPanel';
import { MapNode } from '../types/map';

function MyComponent() {
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  
  return (
    <div>
      {selectedNode && (
        <ContextPanel
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
```

### With Drawer Implementation

```tsx
import ContextDrawer from '../components/panels/ContextDrawer';
import { NodeSelectionProvider } from '../context/NodeSelectionContext';

function MyComponent() {
  return (
    <NodeSelectionProvider>
      {/* Your other components */}
      <ContextDrawer />
    </NodeSelectionProvider>
  );
}
```

## API Reference

### ContextPanel Props

| Prop | Type | Description |
|------|------|-------------|
| `selectedNode` | `MapNode \| null` | The currently selected node |
| `onClose` | `() => void` | Callback when the panel is closed |
| `projectOverlaps?` | `Record<string, string[]>` | Project overlap information |
| `getProjectNameById?` | `(id: string) => string \| undefined` | Function to get project name |
| `initialExpandedState?` | `boolean` | Whether panel starts expanded |
| `onToggleExpand?` | `(isExpanded: boolean) => void` | Callback when panel expands/collapses |
| `containerWidth?` | `number` | Width of the container in pixels |

### ContextDrawer Props

| Prop | Type | Description |
|------|------|-------------|
| `projectOverlaps?` | `Record<string, string[]>` | Project overlap information |
| `getProjectNameById?` | `(id: string) => string \| undefined` | Function to get project name |
| `defaultContainerWidth?` | `number` | Default width of the drawer |
| `allowExpand?` | `boolean` | Whether to allow expanding the panel |

## Performance Optimizations

The Context Panel includes several performance optimizations:

1. **React.memo**: The component uses `React.memo` with custom comparison to avoid unnecessary re-renders
2. **Caching**: Entity data is cached at both component and application level
3. **Lazy Loading**: Secondary content is loaded with a delay to prioritize critical path rendering
4. **Suspense**: Heavy components use React Suspense for code splitting
5. **Memoized Props**: Functions and objects passed as props are memoized to prevent unnecessary re-renders
6. **Framer Motion Animations**: Animations are optimized for performance and include reduced motion support
7. **Lazy Tabs**: Content in inactive tabs is not rendered until needed
8. **Relationship Limiting**: Large relationship lists are truncated to prevent performance degradation

## Accessibility Features

- **Keyboard Navigation**: The panel is fully navigable with keyboard
- **Focus Management**: Focus is properly trapped inside the panel
- **ARIA Attributes**: Appropriate ARIA roles and attributes
- **Reduced Motion**: Supports the prefers-reduced-motion media query
- **Color Contrast**: Follows WCAG guidelines for contrast
- **Screen Reader Support**: Properly labeled elements for screen readers

## Animations

The panel includes smooth animations for improved user experience:

1. **Panel Entry/Exit**: Scale and fade animations when opening/closing
2. **Tab Transitions**: Smooth transitions between tabs
3. **Content Staggering**: Sequential animation of content sections
4. **Entity Type Transitions**: Smooth transitions when switching entity types

## Customization

The Context Panel can be customized through several methods:

1. **Feature Flags**: Various features can be toggled via the `useFeatureFlags` hook
2. **Theme Customization**: Appearance follows the Chakra UI theme
3. **Container Width**: Adjustable width for different layouts
4. **Expandable Mode**: Toggle between standard and expanded view

## Integration with Other Components

The Context Panel integrates with several other components:

1. **Living Map**: Receives selected nodes from the map visualization
2. **NodeSelectionContext**: For drawer implementation, uses shared selection state
3. **Entity Suggestions**: Provides ML-based entity suggestions
4. **Relationship Graph**: Shows connections between entities
5. **Activity Feed**: Displays historical activity