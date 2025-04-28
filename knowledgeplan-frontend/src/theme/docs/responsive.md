# KnowledgePlane AI Responsive Design Guide

This document outlines the principles, breakpoints, and implementation approach for responsive design in the KnowledgePlane AI application.

## Design Principles

1. **Mobile-First Approach**: Design for mobile devices first, then progressively enhance for larger screens.
2. **Flexible Layouts**: Use flexbox and grid for flexible, adaptive layouts rather than fixed pixel dimensions.
3. **Content Priority**: Prioritize essential content and functionality for smaller screens.
4. **Progressive Disclosure**: Reveal more detailed information as screen size increases.
5. **Touch-Friendly**: Ensure interactive elements have adequate touch targets (minimum 44px × 44px).

## Breakpoints

| Breakpoint | Value | Description | Typical Devices |
|------------|-------|-------------|-----------------|
| `sm` | 640px | Small screens | Mobile phones (portrait) |
| `md` | 768px | Medium screens | Mobile phones (landscape), small tablets |
| `lg` | 1024px | Large screens | Tablets, small laptops |
| `xl` | 1280px | Extra large screens | Laptops, desktops |
| `2xl` | 1536px | 2X large screens | Large desktops, high-resolution displays |

## Layout Strategies

### Container Widths

| Breakpoint | Container Max Width | Padding |
|------------|---------------------|---------|
| Default | 100% | 1rem (16px) |
| `sm` | 640px | 1rem (16px) |
| `md` | 768px | 1.5rem (24px) |
| `lg` | 1024px | 2rem (32px) |
| `xl` | 1280px | 2.5rem (40px) |
| `2xl` | 1536px | 3rem (48px) |

### Grid System

- Use a 12-column grid for layout flexibility
- Column gutters: 1rem (16px) default, increasing at larger breakpoints
- Adjust column spans at different breakpoints

### Spacing Adjustments

| Element Type | Mobile | Tablet | Desktop |
|--------------|--------|--------|---------|
| Section spacing | 2rem (32px) | 3rem (48px) | 4rem (64px) |
| Component spacing | 1rem (16px) | 1.5rem (24px) | 2rem (32px) |
| Element spacing | 0.5rem (8px) | 0.75rem (12px) | 1rem (16px) |

## Component Adaptations

### Navigation

| Breakpoint | Adaptation |
|------------|------------|
| Mobile | Hamburger menu with slide-in drawer |
| Tablet | Collapsed sidebar with icons and tooltips |
| Desktop | Expanded sidebar with text labels |

### Cards

| Breakpoint | Adaptation |
|------------|------------|
| Mobile | Stack vertically, full-width |
| Tablet | 2-3 cards per row |
| Desktop | 3-4 cards per row |

### Tables

| Breakpoint | Adaptation |
|------------|------------|
| Mobile | Stack columns as rows or provide horizontal scroll |
| Tablet | Show priority columns, possible horizontal scroll |
| Desktop | Show all columns |

### Living Map

| Breakpoint | Adaptation |
|------------|------------|
| Mobile | Focus on selected node and immediate connections |
| Tablet | Show more context, enable mini-map |
| Desktop | Full visualization with side panel |

## Typography Scaling

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Heading 1 | 1.875rem (30px) | 2.25rem (36px) | 3rem (48px) |
| Heading 2 | 1.5rem (24px) | 1.875rem (30px) | 2.25rem (36px) |
| Heading 3 | 1.25rem (20px) | 1.5rem (24px) | 1.875rem (30px) |
| Body text | 1rem (16px) | 1rem (16px) | 1rem (16px) |
| Small text | 0.875rem (14px) | 0.875rem (14px) | 0.875rem (14px) |

## Implementation Guidelines

### Responsive Utilities

Use Chakra UI's responsive style props:

```jsx
<Box
  width={{ base: "100%", md: "50%", lg: "33%" }}
  padding={{ base: 4, md: 6, lg: 8 }}
>
  Responsive content
</Box>
```

### Media Queries

For more complex scenarios, use media queries:

```jsx
import { useBreakpointValue } from '@chakra-ui/react';

function ResponsiveComponent() {
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}
```

### Image Optimization

- Use responsive images with `srcset` and `sizes` attributes
- Implement lazy loading for images below the fold
- Consider serving WebP images with fallbacks

### Performance Considerations

- Prioritize critical CSS for above-the-fold content
- Defer non-critical JavaScript
- Test on actual devices, not just browser emulation
- Optimize for network conditions (consider connection-aware loading)

## Responsive Testing

Test responsive implementation across:

1. **Devices**: Various physical devices and screen sizes
2. **Browsers**: Chrome, Firefox, Safari, Edge
3. **Orientations**: Portrait and landscape
4. **Input Methods**: Touch, mouse, keyboard
5. **Network Conditions**: Fast and slow connections

## Accessibility in Responsive Design

1. **Zoom Compatibility**: Ensure the UI works at 200% zoom
2. **Touch Targets**: Ensure touch targets are at least 44px × 44px
3. **Contrast**: Maintain sufficient contrast at all sizes
4. **Keyboard Navigation**: Test keyboard navigation on all screen sizes
5. **Screen Readers**: Test with screen readers on mobile and desktop

## Common Patterns

### Responsive Panels

- Desktop: Side-by-side panels
- Mobile: Stacked panels or tabbed interface

### Responsive Forms

- Desktop: Multi-column layout
- Mobile: Single column with full-width inputs

### Responsive Dialogs

- Desktop: Centered modal with fixed width
- Mobile: Full-width or bottom sheet

### Responsive Data Visualization

- Desktop: Full visualization with detailed tooltips
- Mobile: Simplified visualization with touch-optimized interactions 