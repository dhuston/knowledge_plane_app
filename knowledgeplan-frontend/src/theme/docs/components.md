# KnowledgePlane AI Component Guide

This document provides a comprehensive guide to all components used in the KnowledgePlane AI interface, including their variants, sizes, and usage guidelines.

## Button

Buttons are used to trigger actions, submit forms, or navigate between pages.

### Variants

| Variant | Usage | Description |
|---------|-------|-------------|
| `primary` | Primary actions | Solid button with brand color |
| `secondary` | Secondary actions | Outlined button with brand color |
| `tertiary` | Tertiary actions | Text-only button with brand color |
| `danger` | Destructive actions | Red button for destructive actions |
| `success` | Confirmations | Green button for confirmations |
| `link` | Inline links | Button that looks like a link |
| `subtle` | Low-emphasis actions | Subdued button for less important actions |

### Sizes

| Size | Height | Usage |
|------|--------|-------|
| `xs` | 24px | Very compact UI areas |
| `sm` | 32px | Compact UI areas |
| `md` | 40px | Default size |
| `lg` | 48px | Primary CTAs |
| `xl` | 56px | Featured CTAs |

### Usage Guidelines

- Use `primary` variant for the main action on a page or in a section
- Use `secondary` variant for alternative actions
- Use `tertiary` variant for less important actions
- Limit the number of primary buttons on a page to avoid confusion
- Maintain consistent button hierarchy across the application

## Card

Cards are used to group related information and actions.

### Variants

| Variant | Usage | Description |
|---------|-------|-------------|
| `elevated` | Default card | Card with shadow |
| `outlined` | Secondary card | Card with border |
| `filled` | Grouped content | Card with background color |
| `interactive` | Clickable card | Card with hover effects |
| `feature` | Featured content | Card with accent border |
| `success` | Success state | Card with success indicator |
| `warning` | Warning state | Card with warning indicator |
| `error` | Error state | Card with error indicator |
| `info` | Information | Card with info indicator |

### Sizes

| Size | Padding | Usage |
|------|---------|-------|
| `sm` | 12px | Compact cards |
| `md` | 16px | Default size |
| `lg` | 24px | Featured cards |

### Usage Guidelines

- Use cards to visually separate distinct sections of content
- Maintain consistent padding and spacing within cards
- Use appropriate variant based on the card's purpose
- Nest cards sparingly to avoid visual complexity

## Input

Input fields allow users to enter text or select options.

### Variants

| Variant | Usage | Description |
|---------|-------|-------------|
| `outline` | Default | Input with outline |
| `filled` | Secondary | Input with background |
| `flushed` | Minimal | Input with only bottom border |
| `unstyled` | Custom | Input without styling |

### Sizes

| Size | Height | Usage |
|------|--------|-------|
| `sm` | 32px | Compact forms |
| `md` | 40px | Default size |
| `lg` | 48px | Featured forms |

### States

| State | Visual Indicator |
|-------|------------------|
| Default | Gray border |
| Focus | Blue shadow and border |
| Error | Red border and helper text |
| Disabled | Gray background, lighter text |
| Read-only | Gray background, normal text |

### Usage Guidelines

- Use appropriate input type for the data being collected
- Provide clear labels for all input fields
- Use helper text to provide context or instructions
- Show validation errors inline with specific guidance
- Group related inputs together

## Modal

Modals present content or require user action in a layer above the main interface.

### Variants

| Variant | Usage | Description |
|---------|-------|-------------|
| `standard` | Default | Standard modal with header, body, and footer |
| `form` | Data collection | Modal optimized for forms |
| `alert` | Confirmations | Modal for alerts and confirmations |

### Sizes

| Size | Width | Usage |
|------|-------|-------|
| `xs` | 20rem (320px) | Simple alerts |
| `sm` | 24rem (384px) | Simple dialogs |
| `md` | 32rem (512px) | Default size |
| `lg` | 40rem (640px) | Complex forms |
| `xl` | 48rem (768px) | Rich content |
| `full` | 100% | Full-screen experience |

### Usage Guidelines

- Use modals sparingly to avoid disrupting the user's flow
- Keep modal content focused on a single task or piece of information
- Provide clear actions in the footer
- Ensure modals can be dismissed via close button, escape key, and background click
- Consider mobile viewports when designing modal content

## Tag

Tags categorize or organize items and provide a visual indicator of status.

### Variants

| Variant | Usage | Description |
|---------|-------|-------------|
| `solid` | High emphasis | Tag with solid background |
| `subtle` | Default | Tag with subtle background |
| `outline` | Alternative | Tag with border |
| `user` | User entities | Tag for user entities |
| `team` | Team entities | Tag for team entities |
| `project` | Project entities | Tag for project entities |
| `goal` | Goal entities | Tag for goal entities |
| `knowledge` | Knowledge entities | Tag for knowledge entities |
| `success` | Success state | Tag with success styling |
| `warning` | Warning state | Tag with warning styling |
| `error` | Error state | Tag with error styling |
| `info` | Information | Tag with info styling |

### Sizes

| Size | Height | Usage |
|------|--------|-------|
| `sm` | 1.5rem | Compact UI areas |
| `md` | 1.75rem | Default size |
| `lg` | 2rem | Featured tags |

### Usage Guidelines

- Use tags consistently for similar types of information
- Limit the number of tags in a single view to avoid visual noise
- Use appropriate color variants based on the tag's purpose
- Consider using icons with tags to enhance visual recognition

## Navigation Components

### Top Bar

- Fixed position at the top of the viewport
- Contains logo, primary navigation, search, and user menu
- Responsive design that collapses to a menu icon on mobile

### Sidebar

- Collapsible sidebar for secondary navigation
- Contains links to main sections of the application
- Can be pinned open or collapsed to icons only

### Breadcrumbs

- Show location in the application hierarchy
- Allow quick navigation to parent sections
- Truncate middle sections when space is limited

### Tab Bar

- Used for switching between related views
- Horizontal layout with equal width or content-based width
- Underline indicates the active tab
- Available in sizes: `sm`, `md`, `lg`

## Data Display Components

### Table

- Used for displaying structured data in rows and columns
- Supports sorting, filtering, and pagination
- Responsive designs collapse to cards on mobile
- Variants: `simple`, `striped`, `bordered`

### List

- Used for displaying collections of similar items
- Variants: `ordered`, `unordered`, `icon`, `avatar`
- Can be nested for hierarchical data

### Timeline

- Used for displaying chronological events
- Vertical layout with connecting line
- Events can be grouped by date or category

## Feedback Components

### Alert

- Used to communicate status or provide feedback
- Variants: `success`, `error`, `warning`, `info`
- Can include actions and be dismissible

### Toast

- Non-modal notifications that appear temporarily
- Used for success messages, errors, or information
- Position: top, top-right, bottom, etc.
- Auto-dismiss after a timeout

### Progress Indicators

- **Spinner**: For indeterminate loading states
- **Progress Bar**: For determinate loading states
- **Skeleton**: For content loading states

## Map-Specific Components

### Node

- Visual representation of entities in the Living Map
- Variants based on entity type: `user`, `team`, `project`, `goal`, `knowledge`
- States: `default`, `hover`, `selected`, `highlighted`, `faded`

### Edge

- Visual representation of relationships between nodes
- Line styles: `solid`, `dashed`, `dotted`
- Can include directional arrows
- Colors indicate relationship type or status

### Node Cluster

- Visual representation of grouped nodes
- Shows count of contained nodes
- Expands on click to reveal contained nodes

### Mini-Map

- Small overview of the entire map
- Highlights current viewport
- Draggable viewport indicator for quick navigation 