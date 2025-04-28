# KnowledgePlane AI Map Components

This document provides detailed specifications and guidelines for the components used in the Living Map visualization, which is the central feature of the KnowledgePlane AI platform.

## Map Nodes

Map nodes represent entities in the organizational knowledge graph and are the primary interactive elements in the Living Map.

### Node Types

| Entity Type | Visual Style | Interactions |
|-------------|--------------|--------------|
| User | Circle with person icon<br>Color: `entity.user` (#2563EB)<br>Default size: 24px diameter | Hover: Show name tooltip<br>Click: Select node and open user details<br>Double-click: Center and expand connections |
| Team | Circle with group icon<br>Color: `entity.team` (#8B5CF6)<br>Default size: 28px diameter | Hover: Show name and member count<br>Click: Select node and open team details<br>Double-click: Center and expand team members |
| Project | Square with rounded corners<br>Color: `entity.project` (#F59E0B)<br>Default size: 24px | Hover: Show name and status<br>Click: Select node and open project details<br>Double-click: Center and expand related entities |
| Goal | Triangle with rounded corners<br>Color: `entity.goal` (#EF4444)<br>Default size: 24px | Hover: Show title and progress<br>Click: Select node and open goal details<br>Double-click: Center and expand related projects |
| Knowledge | Diamond shape<br>Color: `entity.knowledge` (#10B981)<br>Default size: 24px | Hover: Show title and type<br>Click: Select node and open knowledge details<br>Double-click: Center and expand related entities |

### Node States

| State | Visual Indicator | Purpose |
|-------|------------------|---------|
| Default | Standard styling | Normal state |
| Hover | +2px size increase<br>+0.2 opacity<br>Show tooltip | Provide feedback and preview information |
| Selected | +4px size increase<br>2px stroke in white<br>Drop shadow | Indicate the currently selected node |
| Related | +2px size increase<br>Connecting edge highlighted | Show relationship to selected node |
| Faded | -0.4 opacity<br>Grayscale effect | De-emphasize unrelated nodes when one is selected |
| Highlighted | Pulsing animation<br>Increased stroke width | Draw attention to specific nodes (e.g., search results) |
| New | Subtle entrance animation<br>Temporary badge | Indicate newly added nodes |

### Node Sizes

Nodes can appear at different sizes based on zoom level and importance:

| Size | Diameter/Width | Usage |
|------|----------------|-------|
| xs | 16px | Minimum size at furthest zoom level |
| sm | 20px | Far zoom levels |
| md | 24px | Default size at normal zoom |
| lg | 32px | Close zoom or emphasized nodes |
| xl | 40px | Key entities or closest zoom level |

### Node Labels

| Zoom Level | Label Visibility | Label Style |
|------------|------------------|-------------|
| Far (< 0.5) | Hidden | - |
| Medium (0.5 - 1.0) | Show on hover | Background: semi-transparent<br>Text: small, condensed |
| Close (> 1.0) | Always visible | Background: solid<br>Text: normal size |

## Map Edges

Edges represent relationships between entities in the knowledge graph.

### Edge Types

| Relationship | Visual Style | Interactions |
|--------------|--------------|--------------|
| Reports To | Solid line with arrow<br>1px width<br>Direction: child → parent | Hover: Highlight and show relationship type<br>Click: Select relationship |
| Member Of | Dashed line<br>1px width<br>Direction: user → team | Hover: Highlight and show role<br>Click: Select relationship |
| Works On | Solid line<br>1px width<br>Direction: user/team → project | Hover: Highlight and show role/contribution<br>Click: Select relationship |
| Aligns To | Dotted line with arrow<br>1px width<br>Direction: project → goal | Hover: Highlight and show alignment details<br>Click: Select relationship |
| Related To | Thin dotted line<br>0.5px width<br>No direction | Hover: Highlight and show relationship type<br>Click: Select relationship |
| Collaboration Gap | Red dashed line<br>1px width<br>Animation: pulsing | Hover: Show explanation of the gap<br>Click: Open collaboration recommendation |

### Edge States

| State | Visual Indicator | Purpose |
|-------|------------------|---------|
| Default | Standard styling at 60% opacity | Normal state, reduced visual noise |
| Hover | 100% opacity<br>+1px width<br>Show tooltip | Provide feedback and preview information |
| Selected | 100% opacity<br>+1px width<br>Elevated above other edges | Indicate the currently selected relationship |
| Highlighted | Animation: pulsing<br>100% opacity<br>+1px width | Draw attention to specific relationships |

## Node Clusters

Node clusters represent groups of related nodes that are collapsed to reduce visual complexity.

### Cluster Types

| Cluster | Visual Style | Interactions |
|---------|--------------|--------------|
| Team Cluster | Circle with number indicator<br>Color: `entity.team`<br>Icon: group symbol<br>Size based on node count | Hover: Show team and member count<br>Click: Expand cluster<br>Right-click: Show cluster actions |
| Project Cluster | Circle with number indicator<br>Color: `entity.project`<br>Icon: folder symbol<br>Size based on node count | Hover: Show projects summary<br>Click: Expand cluster<br>Right-click: Show cluster actions |
| Mixed Cluster | Circle with number indicator<br>Gradient color based on contents<br>Size based on node count | Hover: Show composition summary<br>Click: Expand cluster<br>Right-click: Show cluster actions |

### Cluster States

| State | Visual Indicator | Purpose |
|-------|------------------|---------|
| Default | Standard styling | Normal state |
| Hover | +2px size increase<br>Show tooltip with content preview | Provide feedback and preview cluster contents |
| Expanding | Animation: expansion<br>Fade in child nodes | Visual transition when expanding a cluster |
| Collapsing | Animation: contraction<br>Fade out child nodes | Visual transition when collapsing nodes into a cluster |

## Map Controls

| Control | Placement | Function |
|---------|-----------|----------|
| Zoom Controls | Bottom right | Zoom in/out buttons<br>Reset zoom button<br>Zoom percentage indicator |
| Search | Top center | Search input field<br>Results dropdown<br>Highlight matching nodes |
| Filters | Top right | Filter by entity type<br>Filter by attributes<br>Save filter presets |
| View Controls | Bottom left | Reset view button<br>Toggle fullscreen<br>Toggle mini-map |
| Context Menu | Right-click activation | Node-specific actions<br>Map actions<br>Navigation shortcuts |
| Expansion Controls | Per node (on hover) | Expand/collapse connections<br>Expand specific relationship types |

## Mini-Map

| Feature | Description |
|---------|-------------|
| Viewport Indicator | Rectangle showing current visible area |
| Node Density | Heat-map style visualization of node density |
| Selected Node | Highlighted dot showing selected node position |
| Interaction | Draggable viewport indicator<br>Click to navigate to specific areas<br>Zoom controls |
| Responsiveness | Always visible on large screens<br>Collapsible on medium screens<br>Hidden by default on small screens |

## Map Layout Algorithms

| Layout | Usage | Properties |
|--------|-------|------------|
| Force-Directed | Default layout | Nodes push/pull based on relationships<br>Natural clustering<br>Smooth transitions |
| Hierarchical | Organizational view | Top-down layout<br>Clear parent/child relationships<br>Levels clearly defined |
| Radial | Focus mode | Selected node at center<br>Related nodes in concentric circles<br>Distance based on relationship strength |
| Grid | Compact view | Regular spacing<br>Maximum density<br>Type-based grouping |

## Performance Considerations

| Feature | Implementation | Requirements |
|---------|----------------|--------------|
| Viewport-Based Rendering | Only render nodes in current viewport | Track viewport bounds<br>Buffer area around viewport<br>Quick node lookup by position |
| Level of Detail | Simplify rendering based on zoom level | Different detail levels for nodes<br>Hide labels at far zoom<br>Merge small clusters at far zoom |
| WebGL Rendering | Hardware-accelerated rendering | Compatible with 5,000+ nodes<br>60+ FPS performance<br>Smooth transitions |
| Incremental Loading | Load data as needed while navigating | Initial viewport data load<br>Load on-demand when panning/zooming<br>Pre-fetch adjacent areas |

## Accessibility Considerations

| Feature | Implementation |
|---------|----------------|
| Keyboard Navigation | Arrow keys to move focus between nodes<br>Tab navigation through interactive elements<br>Keyboard shortcuts for common actions |
| Screen Reader Support | ARIA labels for all map elements<br>Announcements for state changes<br>Text alternatives for visual relationships |
| Alternative Views | List view option with all relationships<br>Table view for structured data<br>Tree view for hierarchical relationships |
| Focus Indicators | Clear visual indicators for keyboard focus<br>High contrast focus styles<br>Persistent focus indication |

## Implementation Examples

### Node Component

```jsx
function MapNode({ 
  type, 
  data, 
  size = 'md', 
  state = 'default',
  onSelect 
}) {
  // Size mapping
  const sizeMap = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40
  };
  
  // Color mapping
  const colorMap = {
    user: 'entity.user',
    team: 'entity.team',
    project: 'entity.project',
    goal: 'entity.goal',
    knowledge: 'entity.knowledge'
  };
  
  // State styles
  const getStateStyles = (state) => {
    switch(state) {
      case 'hover':
        return { transform: 'scale(1.1)', opacity: 1 };
      case 'selected':
        return { 
          transform: 'scale(1.2)', 
          opacity: 1,
          stroke: 'white',
          strokeWidth: 2,
          boxShadow: 'lg'
        };
      case 'faded':
        return { opacity: 0.4, filter: 'grayscale(70%)' };
      default:
        return {};
    }
  };
  
  return (
    <Box
      as="button"
      aria-label={`${data.label}: ${type} node`}
      width={`${sizeMap[size]}px`}
      height={`${sizeMap[size]}px`}
      borderRadius={type === 'project' ? 'md' : 'full'}
      bg={colorMap[type]}
      transition="all 0.2s"
      position="relative"
      onClick={onSelect}
      {...getStateStyles(state)}
    >
      {/* Node icon */}
      <Icon 
        as={getIconForType(type)} 
        color="white" 
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        size={sizeMap[size] * 0.6}
      />
      
      {/* Label (conditionally rendered based on zoom) */}
      {showLabel && (
        <Text
          position="absolute"
          bottom="-20px"
          left="50%"
          transform="translateX(-50%)"
          fontSize="xs"
          bg="blackAlpha.700"
          color="white"
          px={1}
          borderRadius="sm"
          whiteSpace="nowrap"
        >
          {data.label}
        </Text>
      )}
    </Box>
  );
}
```

### Edge Component

```jsx
function MapEdge({
  type,
  source,
  target,
  state = 'default'
}) {
  // Line style mapping
  const lineStyleMap = {
    'reports-to': { strokeDasharray: 'none', arrowhead: true },
    'member-of': { strokeDasharray: '5,3', arrowhead: false },
    'works-on': { strokeDasharray: 'none', arrowhead: false },
    'aligns-to': { strokeDasharray: '1,3', arrowhead: true },
    'related-to': { strokeDasharray: '1,1', arrowhead: false },
    'collaboration-gap': { strokeDasharray: '5,3', arrowhead: false, stroke: 'error.500' }
  };
  
  // State styles
  const getStateStyles = (state) => {
    switch(state) {
      case 'hover':
        return { opacity: 1, strokeWidth: 2 };
      case 'selected':
        return { opacity: 1, strokeWidth: 2, zIndex: 10 };
      default:
        return { opacity: 0.6, strokeWidth: 1 };
    }
  };
  
  return (
    <Line
      x1={source.x}
      y1={source.y}
      x2={target.x}
      y2={target.y}
      stroke={lineStyleMap[type].stroke || 'gray.600'}
      strokeDasharray={lineStyleMap[type].strokeDasharray}
      markerEnd={lineStyleMap[type].arrowhead ? 'url(#arrowhead)' : undefined}
      transition="all 0.2s"
      {...getStateStyles(state)}
    />
  );
}
```

## Design Guidelines

1. **Visual Clarity**: Maintain clear visual distinction between different node types
2. **Reduced Visual Noise**: Keep edge opacity low by default to reduce clutter
3. **Progressive Disclosure**: Show more detail as users zoom in or interact with elements
4. **Consistent Interactions**: Maintain consistent interaction patterns across all map elements
5. **Performance First**: Optimize all rendering for smooth performance with large datasets
6. **Accessibility**: Ensure all map elements are accessible via keyboard and assistive technologies
7. **Responsive Adaptation**: Adjust detail and controls based on screen size and device capabilities 