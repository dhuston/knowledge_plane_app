# Organizational Hierarchy Navigator UI Specifications

This document provides detailed UI specifications for the Organizational Hierarchy Navigator sidebar component to be implemented in the "My Work" area of the application.

## 1. Sidebar Container

### Dimensions and Layout
- **Width**: Fixed 60px width (compact design)
- **Height**: Full height of workspace area
- **Position**: Left side of "My Work" area
- **Z-index**: Above workspace content, below global header

### Visual Style
- **Background Color**: `--color-background-alt` (slightly darker than main workspace)
- **Border**: 1px solid `--color-border-light` on right side
- **Box Shadow**: `0 2px 8px rgba(0, 0, 0, 0.08)`
- **Border Radius**: 0px (left), 4px (right)
- **Padding**: 12px 8px

## 2. Navigation Elements

### User Position Card
- **Height**: 60px
- **Width**: 44px
- **Margin**: 0 0 16px 0
- **Border Radius**: 8px
- **Background**: Subtle gradient using primary color at 5% opacity
- **Layout**: 
  - Avatar (36px) centered
  - Small indicator dot showing online status
  - Current role icon below avatar

### Hierarchy Chevron Items
- **Height**: 44px per item
- **Width**: 44px
- **Margin**: 8px 0
- **Border Radius**: 6px
- **Icon**: 
  - Centered icon representing entity type (team, department, organization)
  - 20px size, `--color-text-secondary`
- **Indicator**: Small colored dot showing entity status or connection strength

#### States
- **Default**: `--color-background-default`
- **Hover**: `--color-background-hover`, cursor: pointer, shows tooltip
- **Active/Selected**: 
  - Left border: 3px solid `--color-primary`
  - Background: `--color-background-selected`
  - Icon color: `--color-primary`
- **Focus**: Standard focus ring using `--color-focus-ring`

### Entity Preview Tooltip/Popover
- **Trigger**: On hover or click of hierarchy item
- **Position**: Right of sidebar item
- **Width**: 240px
- **Padding**: 12px
- **Background**: `--color-background-default`
- **Border**: 1px solid `--color-border-light`
- **Border Radius**: 6px
- **Box Shadow**: `0 4px 12px rgba(0, 0, 0, 0.15)`
- **Arrow**: Points to the triggering sidebar item

## 3. Hierarchy Level Specifications

### Team Level
- **Icon**: Team icon (people group)
- **Popover Content**:
  - Team name (Heading 6)
  - Manager name with small avatar
  - Member count with "(+X more)" if applicable
  - Avatar stack showing up to 5 team members
  - Active projects count with icon
  - Upcoming deadlines count with icon
  - "View Team" button

### Department Level
- **Icon**: Department icon (building/office)
- **Popover Content**:
  - Department name (Heading 6)
  - Leader name with small avatar
  - Teams count
  - List of teams (first 3, with "View all" if more)
  - Key metrics visualization (small spark line)
  - Department goals progress indicator (circular)
  - "View Department" button

### Organization Level
- **Icon**: Building/organization icon (enterprise)
- **Popover Content**:
  - Organization name (Heading 6)
  - Executive name with small avatar
  - Departments count
  - Mini org structure visualization
  - Organization-wide KPI indicators
  - "View Organization" button

## 4. Interactive Elements

### Search Button
- **Position**: Top of sidebar
- **Size**: 44px × 44px
- **Icon**: Magnifying glass icon
- **States**:
  - Default: `--color-icon-secondary`
  - Hover: `--color-icon-primary`, background: `--color-background-hover`
  - Active: `--color-primary`
- **Tooltip**: "Search organization"
- **Action**: Opens search popover when clicked

### Search Popover
- **Trigger**: Click on search button
- **Position**: Right of sidebar
- **Width**: 280px
- **Padding**: 12px
- **Contents**:
  - Search field (full width)
  - Recent searches
  - Quick filters ("My Team" | "Department" | "All")
  - Search results with icons and highlighting

### Connection Indicators
- **Size**: 8px diameter
- **Position**: Bottom right of hierarchy items
- **Colors**:
  - Green: Strong connection (>75%)
  - Yellow: Medium connection (25-75%)
  - Gray: Weak connection (<25%)
- **Tooltip**: Shows connection strength and basis

## 5. States and Transitions

### Loading State
- **Loading Skeleton**:
  - Animated gradient shimmer effect for icons
  - Preserves layout structure
  - 200-300ms minimum display time to prevent flashes
- **Progress Indicator**:
  - Small circular loader for longer operations
  - Located at center of affected area

### Empty State
- **Illustration**: Simple organizational chart icon
- **Tooltip Message**: "No organizational data available"
- **Action**: Click opens setup modal
- **Background**: Subtle light pattern

## 6. Responsive Behavior

### Desktop (>992px)
- Full functionality as described
- Fixed 60px width sidebar
- Popover previews on hover/click

### Tablet (768px-992px)
- Maintains fixed 60px width sidebar
- Touch-optimized hit areas (min 44px)
- Popover previews on tap

### Mobile (<768px)
- Transforms to bottom navigation bar
- Height: 60px
- Full width of screen
- Horizontal scrolling for hierarchy items
- Popovers open upward from navigation items

## 7. Accessibility Features

### Keyboard Navigation
- Tab: Navigate between interactive elements
- Space/Enter: Activate buttons, expand/collapse sections
- Arrow keys: Navigate within hierarchy levels
- Esc: Collapse expanded sections, close sidebar on mobile

### Screen Reader Support
- ARIA landmarks for navigation regions
- aria-expanded for expandable sections
- aria-controls relationships for related content
- Meaningful element sequence for logical navigation
- Descriptive labels for all interactive elements

### Focus Management
- Visible focus indicators for all interactive elements
- Focus trap in modal views on smaller screens
- Focus restoration when closing expanded views
- Skip link to bypass sidebar navigation

## 8. Theme Support

### Light Mode Colors
- Background: #F8F9FA (sidebar), #FFFFFF (entity previews)
- Text: #1A1A1A (primary), #666666 (secondary)
- Borders: #E1E4E8
- Primary: #0066CC
- Selected: #E6F0FA

### Dark Mode Colors
- Background: #252A31 (sidebar), #1E222A (entity previews)
- Text: #FFFFFF (primary), #A0A8B4 (secondary)
- Borders: #3A4049
- Primary: #5B9FEF
- Selected: #2D3C50

## 9. Animation Specifications

### Sidebar Expansion/Collapse
- **Duration**: 250ms
- **Easing**: cubic-bezier(0.4, 0.0, 0.2, 1)
- **Properties**: width, opacity, transform

### Chevron Rotation
- **Duration**: 200ms
- **Easing**: ease-out
- **Properties**: transform (rotate 90 degrees)

### Content Transitions
- **Duration**: 150ms
- **Easing**: ease-in-out
- **Properties**: opacity, height

### Hover Effects
- **Duration**: 100ms
- **Easing**: ease-out
- **Properties**: background-color, border-color

## 10. Implementation Guidelines

### Component Architecture
- Use React function components with hooks
- Implement context for hierarchy state management
- Create reusable sub-components for repeated elements
- Use CSS-in-JS approach consistent with existing system

### Performance Considerations
- Virtualize long lists of hierarchy items
- Implement component memoization for pure rendering
- Use skeleton UI during data loading
- Defer non-critical data loading

### Code Organization
```
components/
├── hierarchy/
│   ├── HierarchyNavigator.tsx (main container)
│   ├── HierarchyChevron.tsx (nav item)
│   ├── UserPositionCard.tsx
│   ├── EntityPreview.tsx
│   ├── QuickFilters.tsx
│   ├── HierarchySearch.tsx
│   └── styles/
│       ├── hierarchy.styles.ts
```

## 11. Design Assets

- UI component designs are available in the design system Figma library
- Icons should be imported from the existing icon library
- Animations should follow existing motion guidelines
- Custom illustrations should match the product's visual language

## 12. Mockups Reference

- High-fidelity designs in Figma: [link placeholder]
- Interactive prototype: [link placeholder]
- Motion specifications: [link placeholder]

These detailed UI specifications provide the blueprint for implementing the Organizational Hierarchy Navigator sidebar in the "My Work" area, ensuring a consistent and intuitive user experience integrated with the existing design system.