# KnowledgePlane AI Design System

## Overview

This directory contains the KnowledgePlane AI design system - a comprehensive set of design tokens, component styles, and documentation that defines the visual language and interaction patterns for the KnowledgePlane AI application.

## Directory Structure

- `/foundations` - Core design tokens and base styles
  - `colors.ts` - Color palette and semantic colors
  - `typography.ts` - Typography scale and text styles
  - `spacing.ts` - Spacing scale and layout values
  - `borders.ts` - Border styles, radii, and widths
  - `shadows.ts` - Shadow definitions for elevation
  - `breakpoints.ts` - Responsive breakpoints
  - `index.ts` - Aggregates all foundation tokens

- `/components` - Component-specific styles and variants
  - `button.ts` - Button component styles
  - `Card.ts` - Card component styles
  - `Input.ts` - Form input component styles
  - `modal.ts` - Modal dialog component styles
  - `Tag.ts` - Tag component styles
  - `index.ts` - Aggregates all component styles

- `/docs` - Comprehensive design system documentation
  - `index.md` - Documentation overview and navigation
  - `designTokens.md` - Reference for all design tokens
  - `components.md` - Component usage guidelines
  - `responsive.md` - Responsive design guidelines
  - `darkMode.md` - Dark mode implementation
  - `iconography.md` - Icon usage and guidelines
  - `accessibility.md` - Accessibility standards
  - `mapComponents.md` - Map-specific components

- `index.ts` - Main theme configuration
- `designSystem.md` - Legacy design system documentation

## Usage

### Importing the Theme

```jsx
// In your main app file
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <YourApplication />
    </ChakraProvider>
  );
}
```

### Using Theme Tokens

```jsx
import { Box, Text, Button } from '@chakra-ui/react';

function Example() {
  return (
    <Box bg="primary.50" p={4} borderRadius="md">
      <Text fontSize="xl" color="primary.800">
        Using theme tokens
      </Text>
      <Button colorScheme="primary" size="md">
        Themed Button
      </Button>
    </Box>
  );
}
```

### Responsive Styles

```jsx
import { Box } from '@chakra-ui/react';

function ResponsiveExample() {
  return (
    <Box
      width={{ base: "100%", md: "50%", lg: "33%" }}
      padding={{ base: 4, md: 6, lg: 8 }}
      fontSize={{ base: "md", lg: "lg" }}
    >
      Responsive content
    </Box>
  );
}
```

## Contributing

When contributing to the design system:

1. **Consistency**: Follow existing naming conventions and patterns
2. **Documentation**: Update relevant documentation when adding or modifying components
3. **Accessibility**: Ensure all components meet accessibility standards
4. **Testing**: Test components across different screen sizes and in both light and dark modes

## Resources

- [Chakra UI Documentation](https://chakra-ui.com/docs/getting-started)
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [React Icons](https://react-icons.github.io/react-icons/) 