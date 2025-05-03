# KnowledgePlane AI Design System

## Overview

This directory contains the KnowledgePlane AI design system - a comprehensive set of design tokens, component styles, and documentation that defines the visual language and interaction patterns for the KnowledgePlane AI application.

## Design Principles

The design system follows these core principles:

1. **Consistency**: Unified visual language across the entire platform
2. **Accessibility**: WCAG 2.1 AA compliance for inclusive design
3. **Flexibility**: Adaptable components for different contexts
4. **Performance**: Optimized rendering and minimal CSS footprint
5. **Extensibility**: Easy to extend and customize for specific needs

## Directory Structure

- `/foundations` - Core design tokens and base styles
  - `colors.ts` - Color palette and semantic colors
  - `typography.ts` - Typography scale and text styles
  - `spacing.ts` - Spacing scale and layout values
  - `borders.ts` - Border styles, radii, and widths
  - `shadows.ts` - Shadow definitions for elevation
  - `breakpoints.ts` - Responsive breakpoints
  - `colorModes.ts` - Light and dark mode definitions
  - `animations.ts` - Animation duration and easing values
  - `index.ts` - Aggregates all foundation tokens

- `/components` - Component-specific styles and variants
  - `Button.ts` - Button component styles
  - `Card.ts` - Card component styles
  - `Input.ts` - Form input component styles
  - `modal.ts` - Modal dialog component styles
  - `Tag.ts` - Tag component styles
  - `map.ts` - Map visualization styles
  - `index.ts` - Aggregates all component styles

- `/docs` - Comprehensive design system documentation
  - `designTokens.md` - Reference for all design tokens
  - `accessibility.md` - Accessibility standards
  - `iconography.md` - Icon usage guidelines

## Color System

The color system consists of:

1. **Base Colors**: Primary brand colors and neutrals
2. **Semantic Colors**: Colors with specific meanings (success, error, etc.)
3. **Component Colors**: Specific colors for UI components
4. **Color Modes**: Light and dark mode variants

Example usage:
```tsx
import { Box, Text } from '@chakra-ui/react';

function Example() {
  return (
    <Box bg="primary.50" p={4} borderRadius="md">
      <Text fontSize="xl" color="primary.800">
        Using theme colors
      </Text>
    </Box>
  );
}
```

## Typography

The typography system includes:

1. **Font Families**: Primary and monospace fonts
2. **Font Sizes**: Consistent scale from xs to 4xl
3. **Font Weights**: Regular, medium, semibold, bold
4. **Line Heights**: Proportional to font sizes
5. **Letter Spacing**: Adjustments for different sizes

Example usage:
```tsx
<Text 
  fontSize="lg" 
  fontWeight="semibold" 
  lineHeight="tall"
>
  Styled text
</Text>
```

## Spacing

Spacing follows an 8-point grid system:

- 0 = 0
- 1 = 0.25rem (4px)
- 2 = 0.5rem (8px)
- 3 = 0.75rem (12px)
- 4 = 1rem (16px)
- ...

Example usage:
```tsx
<Box 
  p={4}        // 1rem padding
  mt={2}       // 0.5rem top margin
  mb={6}       // 1.5rem bottom margin
>
  Content
</Box>
```

## Responsive Design

The responsive system uses these breakpoints:

- sm: 30em (480px)
- md: 48em (768px)
- lg: 62em (992px)
- xl: 80em (1280px)
- 2xl: 96em (1536px)

Example usage:
```tsx
<Box
  width={{ base: "100%", md: "50%", lg: "33%" }}
  padding={{ base: 4, md: 6, lg: 8 }}
>
  Responsive content
</Box>
```

## Component Extensions

To extend or override component styles:

```tsx
import { extendTheme } from '@chakra-ui/react';
import { buttonStyles } from './components/Button';

const theme = extendTheme({
  components: {
    Button: buttonStyles,
    // Other component styles
  },
});
```

## Living Map Specific Styles

The map visualization has specialized styling:

1. **Node Styles**: Different styles for various entity types
2. **Edge Styles**: Line styles for different relationship types
3. **Interaction States**: Hover, selected, and active states
4. **Animation Styles**: Motion design for map interactions

Example component extension:
```tsx
// In map.ts
export const mapStyles = {
  baseStyle: {
    // Base styles for map components
  },
  variants: {
    user: {
      // User node styling
    },
    team: {
      // Team node styling
    },
    // etc.
  },
};
```

## Context Panel Styling

The Context Panel implements:

1. **Entity-specific Accents**: Color coding based on entity type
2. **Tab Styling**: Custom tab design with animations
3. **Panel Transitions**: Smooth animations for panel changes
4. **Expandable View**: Styling for both compact and expanded views

## Dark Mode

Dark mode is fully supported with:

1. **Automatic Color Mapping**: Colors automatically map to dark mode
2. **Manual Override**: Specific dark mode styles when needed
3. **User Preference Detection**: Respects system preferences
4. **Manual Toggle**: User can override system preference

Example usage:
```tsx
import { useColorModeValue } from '@chakra-ui/react';

function Component() {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  
  return (
    <Box bg={bgColor} color={textColor}>
      Content
    </Box>
  );
}
```

## Animation System

The animation system provides:

1. **Duration Tokens**: Consistent animation durations
2. **Easing Functions**: Standard easing curves
3. **Motion Variants**: Pre-defined animations for common patterns
4. **Reduced Motion Support**: Respects user preferences

Example with framer-motion:
```tsx
import { motion } from 'framer-motion';
import { animations } from '../theme/foundations/animations';

function AnimatedComponent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: animations.duration.normal,
        ease: animations.easing.easeOut
      }}
    >
      Animated content
    </motion.div>
  );
}
```

## Accessibility Features

The design system ensures accessibility with:

1. **Sufficient Color Contrast**: All color combinations meet WCAG AA standards
2. **Focus Indicators**: Visible focus states for keyboard navigation
3. **Motion Reduction**: Respects prefers-reduced-motion setting
4. **Text Scaling**: Layout handles text scaling gracefully
5. **Screen Reader Support**: Proper ARIA labeling

## Contributing Guidelines

When contributing to the design system:

1. **Token-First Approach**: Create or use existing tokens rather than hardcoded values
2. **Document Changes**: Update documentation when adding new components or tokens
3. **Maintain Consistency**: Ensure new additions follow established patterns
4. **Test Across Breakpoints**: Verify responsive behavior
5. **Check Both Color Modes**: Test in both light and dark modes

## Resources

- [Chakra UI Documentation](https://chakra-ui.com/docs/getting-started)
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [Framer Motion](https://www.framer.com/motion/)
- [React Icons](https://react-icons.github.io/react-icons/)