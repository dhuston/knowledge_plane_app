# KnowledgePlane AI Iconography Guide

This document defines the iconography standards for the KnowledgePlane AI application, ensuring consistent visual language across the platform.

## Icon System

The KnowledgePlane AI uses [React Icons](https://react-icons.github.io/react-icons/) as its primary icon library, with an emphasis on the Material Design icons (`md` prefix) for consistency. In specific cases, custom SVG icons are used for specialized purposes.

## Icon Categories

### UI/Navigation Icons

| Purpose | Icon Reference | Example Usage |
|---------|---------------|---------------|
| Menu | `MdMenu` | Main navigation toggle |
| Home | `MdHome` | Home/dashboard navigation |
| Settings | `MdSettings` | Application settings |
| Search | `MdSearch` | Search functionality |
| Notifications | `MdNotifications` | Notification center |
| User | `MdPerson` | User profile |
| Close | `MdClose` | Close modals/panels |
| More | `MdMoreVert` | Additional options menu |
| Back | `MdArrowBack` | Navigation back |
| Next | `MdArrowForward` | Navigation forward |
| Expand | `MdExpandMore` | Expandable sections |

### Entity Icons

| Entity Type | Icon Reference | Usage |
|-------------|---------------|-------|
| User | `MdOutlinePerson` | Represents individual users |
| Team | `MdOutlineGroup` | Represents teams |
| Project | `MdOutlineFolder` | Represents projects |
| Goal | `MdOutlineFlag` | Represents goals |
| Knowledge | `MdOutlineDescription` | Represents knowledge assets |
| Department | `MdOutlineBusinessCenter` | Represents departments |
| Event | `MdOutlineEvent` | Represents events/timeline |

### Action Icons

| Action | Icon Reference | Usage |
|--------|---------------|-------|
| Add | `MdAdd` | Add items or create new |
| Edit | `MdEdit` | Edit items |
| Delete | `MdDelete` | Delete items |
| Save | `MdSave` | Save changes |
| Download | `MdDownload` | Download files |
| Upload | `MdUpload` | Upload files |
| Share | `MdShare` | Share functionality |
| Link | `MdLink` | Link items or create relationships |
| Favorite | `MdFavoriteBorder` / `MdFavorite` | Mark as favorite |
| Filter | `MdFilterList` | Filter content |
| Sort | `MdSort` | Sort content |

### Status Icons

| Status | Icon Reference | Usage |
|--------|---------------|-------|
| Success | `MdCheckCircle` | Success status |
| Error | `MdError` | Error status |
| Warning | `MdWarning` | Warning status |
| Info | `MdInfo` | Information status |
| Loading | `MdRefresh` (with animation) | Loading state |
| Complete | `MdDone` | Completed task |
| Pending | `MdHourglassEmpty` | Pending state |
| Blocked | `MdBlock` | Blocked state |

### Map Node Icons

Custom SVG icons are used for map nodes, with careful consideration for clarity at various zoom levels:

| Node Type | Icon Description | Fill Color |
|-----------|-----------------|------------|
| User | Simplified person silhouette | `entity.user` |
| Team | Group silhouette | `entity.team` |
| Project | Folder symbol | `entity.project` |
| Goal | Flag symbol | `entity.goal` |
| Knowledge | Document symbol | `entity.knowledge` |
| Cluster | Multiple nodes indicator | Based on predominant entity type |

## Icon Sizes

| Size Name | Pixel Size | Usage |
|-----------|------------|-------|
| xs | 16px | Very small UI elements, tight spaces |
| sm | 20px | Most UI controls, buttons |
| md | 24px | Default size, navigation |
| lg | 32px | Feature highlights, large buttons |
| xl | 48px | Avatar placeholders, featured areas |

## Implementation Guidelines

### Basic Usage

```jsx
import { MdSearch } from 'react-icons/md';

function SearchButton() {
  return (
    <Button leftIcon={<MdSearch />}>
      Search
    </Button>
  );
}
```

### Size and Color

```jsx
import { MdPerson } from 'react-icons/md';
import { Icon } from '@chakra-ui/react';

function UserIcon() {
  return (
    <Icon
      as={MdPerson}
      boxSize={6} // 24px using Chakra's spacing scale
      color="entity.user"
    />
  );
}
```

### Accessibility

Always include appropriate aria labels for icons that serve as interactive elements:

```jsx
<IconButton
  aria-label="Search"
  icon={<MdSearch />}
  onClick={handleSearch}
/>
```

For decorative icons, ensure they're properly marked:

```jsx
<Icon as={MdInfo} aria-hidden="true" />
```

## Custom Icons

For custom icons not available in React Icons, create SVG components:

```jsx
function CustomMapNodeIcon(props) {
  return (
    <Icon viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      />
    </Icon>
  );
}
```

## Icon Style Guidelines

1. **Consistency**: Use icons from the same family for consistency
2. **Simplicity**: Prefer simple, recognizable icons over complex ones
3. **Purpose**: Use icons to enhance, not replace, text labels (except in space-constrained UIs)
4. **Responsive**: Ensure icons work well at different sizes and screen densities
5. **Meaningful**: Choose icons that clearly represent their function
6. **Interactive Feedback**: Provide visual feedback for interactive icons (hover, active states)

## Icon Best Practices

1. **Use Sparingly**: Avoid icon overload; use only where they add value
2. **Maintain Recognition**: Don't modify icons in ways that make them unrecognizable
3. **Consider Cultural Context**: Be aware of cultural interpretations of symbols
4. **Consistent Styling**: Use consistent weights, filled vs. outlined styles
5. **Performance**: Optimize SVG icons for performance
6. **Testing**: Test icon recognition with users from different backgrounds

## Map Node Icon Guidelines

For map node icons specifically:

1. **Distinctive Silhouettes**: Ensure each node type has a distinctive silhouette
2. **Scalability**: Design icons that work well at various zoom levels
3. **Context**: Consider how icons look both individually and in clusters
4. **State Indicators**: Define clear visual indicators for node states (selected, highlighted, etc.)
5. **Relationship to Color**: Ensure icons work well with their associated entity colors 