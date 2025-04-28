# KnowledgePlane AI Dark Mode Guide

This document outlines the principles, color adaptations, and implementation approach for dark mode in the KnowledgePlane AI application.

## Design Principles

1. **Reduce Eye Strain**: Use darker backgrounds and avoid pure white text to reduce eye strain in low-light environments.
2. **Maintain Hierarchy**: Preserve visual hierarchy and content prominence in dark mode.
3. **Ensure Readability**: Maintain sufficient contrast ratios for all text and interactive elements.
4. **Consistent Brand Identity**: Adapt the brand colors appropriately to maintain recognition and identity.
5. **Meaningful Contrast**: Ensure UI elements have appropriate contrast against backgrounds.

## Color Adaptations

### Background Colors

| Light Mode Token | Dark Mode Token | Dark Mode Value | Usage |
|------------------|-----------------|-----------------|-------|
| `gray.50` | `gray.900` | #111827 | Page background |
| `gray.100` | `gray.800` | #1F2937 | Card background |
| `white` | `gray.800` | #1F2937 | Component background |
| `gray.200` | `gray.700` | #374151 | Dividers, borders |

### Text Colors

| Light Mode Token | Dark Mode Token | Dark Mode Value | Usage |
|------------------|-----------------|-----------------|-------|
| `gray.900` | `gray.50` | #F9FAFB | Primary text |
| `gray.700` | `gray.200` | #E5E7EB | Secondary text |
| `gray.500` | `gray.400` | #9CA3AF | Tertiary text |

### Brand Colors

| Color Category | Light Mode Adjustment | Dark Mode Adjustment |
|----------------|------------------------|----------------------|
| Primary | Use as defined | Use lighter shades (+200 from base) |
| Secondary | Use as defined | Use lighter shades (+200 from base) |
| Accent | Use as defined | Use lighter shades (+200 from base) |

### Semantic Colors

| Color Category | Light Mode | Dark Mode |
|----------------|------------|-----------|
| Success | `success.500` | `success.300` |
| Error | `error.500` | `error.300` |
| Warning | `warning.500` | `warning.300` |
| Info | `info.500` | `info.300` |

## Component Adaptations

### Cards & Containers

- Use darker backgrounds (`gray.800`) instead of white
- Increase border contrast slightly
- Adjust shadow opacity to be more subtle (30-40% of light mode values)

### Buttons

- Primary: Maintain brand colors but use lighter shades
- Secondary: Use darker background with lighter border
- Tertiary: Use lighter text color for contrast

### Form Elements

- Input backgrounds: `gray.700`
- Input borders: `gray.600`
- Placeholder text: `gray.400`
- Focus states: Maintain brand colors but adjust intensity

### Map Elements

- Increase node stroke contrast
- Adjust edge colors for better visibility
- Use slightly brighter colors for nodes to stand out against dark background

## Implementation Guide

### Theme Configuration

Dark mode should be implemented through the Chakra UI theming system by defining color mode values:

```typescript
// Example color definition with dark mode support
const colors = {
  brand: {
    50: {
      default: '#EBF8FF',
      _dark: '#172554'
    },
    // other values
  }
}
```

### Toggle Component

Implement a toggle that allows users to:
- Switch between light and dark modes
- Follow system preferences (default)
- Remember preference in local storage

### User Preference Persistence

- Store user preference in local storage
- Use the `localStorage` API with a key like `kpai-color-mode`
- Provide option to follow system preferences

### System Preference Detection

Use the `prefers-color-scheme` media query to detect user's system preference:

```typescript
const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
```

### Test Cases

Test dark mode implementation across:
- All major components and states
- Different screen sizes and devices
- High contrast settings
- Different browsers

## Accessibility Considerations

1. **Contrast Ratios**: Ensure all text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
2. **Focus Indicators**: Make focus states clearly visible in dark mode
3. **Motion & Animation**: Respect reduced motion preferences
4. **Color Independence**: Don't rely solely on color to convey information

## Progressive Implementation

1. **Phase 1**: Core components and layout (navigation, cards, buttons, forms)
2. **Phase 2**: Data visualization components (charts, maps, tables)
3. **Phase 3**: Advanced components and edge cases

## Dark Mode Preview

Include a visual preview of key components in dark mode once implemented:

- Navigation and layout
- Core components (buttons, inputs, cards)
- Living Map visualization
- Notifications and alerts 