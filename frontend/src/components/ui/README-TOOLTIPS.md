# Tooltip System

## Overview

This document outlines the tooltip system in Biosphere Alpha. We've simplified the tooltip implementation to ensure consistent behavior across the application.

## Components

### 1. SimpleTooltip

`SimpleTooltip` is the primary tooltip component that should be used in most cases. It's a thin wrapper around Chakra UI's tooltip with consistent styling and behavior.

```tsx
import { SimpleTooltip } from '../components/ui';

// Usage
<SimpleTooltip label="This is a tooltip">
  <Button>Hover me</Button>
</SimpleTooltip>
```

### 2. SimpleNodeTooltip

A specialized tooltip for map nodes with rich content display. This is used internally by the NodeTooltip component.

### 3. NodeTooltip

An adapter component that maintains backward compatibility with the existing Living Map implementation.

## Best Practices

1. **Use SimpleTooltip for most cases**
   - This component provides consistent styling and behavior across the app

2. **Keep tooltip content concise**
   - Tooltips should provide brief, helpful information
   - Avoid long paragraphs or complex content

3. **Tooltip delay**
   - Tooltips have a 400ms delay before appearing to avoid flicker
   - This can be customized with the `openDelay` prop if needed

4. **Positioning**
   - Default placement is 'top'
   - Other options: 'bottom', 'left', 'right'
   - For specific cases, you can use the extended placements: 'top-start', 'top-end', etc.

5. **Use hasArrow**
   - The default is to show an arrow, but this can be disabled with `hasArrow={false}`

## Examples

### Basic Tooltip

```tsx
<SimpleTooltip label="Add to cart">
  <IconButton 
    aria-label="Add to cart" 
    icon={<FiShoppingCart />} 
  />
</SimpleTooltip>
```

### Tooltip with Custom Placement

```tsx
<SimpleTooltip 
  label="Click to view details" 
  placement="right"
>
  <Button>View Details</Button>
</SimpleTooltip>
```

### Disabled Tooltip

```tsx
<SimpleTooltip 
  label="This feature is unavailable" 
  isDisabled={!featureEnabled}
>
  <Button isDisabled={!featureEnabled}>
    Use Feature
  </Button>
</SimpleTooltip>
```

## Migrating from the Old System

1. Replace direct usage of Chakra UI's `<Tooltip>` with `<SimpleTooltip>`
2. Remove any complex tooltip implementations and use the standard components
3. For map-related tooltips, continue using `NodeTooltip` which now uses our simplified implementation internally

## Troubleshooting

Common issues:

1. **Tooltip not appearing**: Check that the label prop is provided and not empty
2. **Tooltip appearing in wrong position**: Check the placement prop and ensure the parent container doesn't have overflow issues
3. **Flickering tooltips**: This should be resolved with the new implementation, but if it persists, check for mouse event conflicts