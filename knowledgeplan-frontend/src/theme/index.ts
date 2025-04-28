// KnowledgePlane AI Theme
// Main theme configuration with brand identity and enterprise styling

import { extendTheme } from '@chakra-ui/react';
import colorModeValues from './foundations/colorModes';
import components from './components';

// Color palette following enterprise SaaS standards
const colors = {
  primary: {
    50: '#E6F6FF',
    100: '#BAE3FF',
    200: '#7CC4FA',
    300: '#47A3F3',
    400: '#2186EB',
    500: '#0967D2', // primary brand color
    600: '#0552B5',
    700: '#03449E',
    800: '#01337D',
    900: '#002159',
  },
  secondary: {
    50: '#F5F7FA',
    100: '#E4E7EB',
    200: '#CBD2D9',
    300: '#9AA5B1',
    400: '#7B8794',
    500: '#616E7C',
    600: '#52606D',
    700: '#3E4C59',
    800: '#323F4B',
    900: '#1F2933',
  },
  success: {
    500: '#27AB83',
    600: '#199473',
  },
  warning: {
    500: '#F7B955',
    600: '#F59F00',
  },
  error: {
    500: '#D64545',
    600: '#BA2525',
  },
  info: {
    500: '#4299E1',
    600: '#2B6CB0',
  },
};

// Typography system
const typography = {
  fonts: {
    heading: 'Inter, -apple-system, system-ui, sans-serif',
    body: 'Inter, -apple-system, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
};

// Spacing system
const space = {
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

// Theme configuration
const config = {
  initialColorMode: 'light',
  useSystemColorMode: true, // Enable system preference detection
};

// Global styles
const styles = {
  global: (props) => ({
    // Base styles
    'html, body': {
      color: props.colorMode === 'dark' ? 'gray.50' : 'gray.800',
      bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
      lineHeight: 'body',
      fontFamily: 'body',
      fontSize: 'md',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      textRendering: 'optimizeLegibility',
    },

    // Default text selection
    '::selection': {
      bg: props.colorMode === 'dark' ? 'brand.800' : 'brand.100',
      color: props.colorMode === 'dark' ? 'brand.100' : 'brand.900',
    },

    // Scrollbar styling
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.100',
    },
    '::-webkit-scrollbar-thumb': {
      bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.300',
      borderRadius: 'full',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
    },

    // Focus outline
    '*:focus': {
      outline: 'none',
      boxShadow: 'focus',
    },
    '*:focus:not(:focus-visible)': {
      boxShadow: 'none',
    },
    '*:focus-visible': {
      boxShadow: 'focus',
    },

    // Default transitions
    '*': {
      borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
      transitionProperty: 'common',
      transitionDuration: 'normal',
    },

    // Placeholder styling
    '::placeholder': {
      color: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
    },

    // Disabled state
    ':disabled': {
      cursor: 'not-allowed',
      opacity: 0.6,
    },

    // Headings
    'h1, h2, h3, h4, h5, h6': {
      fontFamily: 'heading',
      fontWeight: 'semibold',
      letterSpacing: 'tight',
      color: props.colorMode === 'dark' ? 'gray.100' : 'gray.900',
    },

    // Links
    a: {
      color: props.colorMode === 'dark' ? 'brand.300' : 'brand.500',
      textDecoration: 'none',
      _hover: {
        textDecoration: 'underline',
      },
    },

    // Code blocks
    'pre, code': {
      fontFamily: 'mono',
      bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.100',
    },
  }),
};

// Layer styles for common patterns
const layerStyles = {
  card: {
    bg: 'bg.card',
    borderRadius: 'card',
    boxShadow: 'card',
    p: 'card-padding',
  },
  'card-hover': {
    bg: 'bg.card',
    borderRadius: 'card',
    boxShadow: 'card',
    p: 'card-padding',
    _hover: {
      boxShadow: 'card-hover',
      transform: 'translateY(-2px)',
    },
    transition: 'all 0.2s',
  },
  'glass-panel': {
    bg: 'whiteAlpha.800',
    backdropFilter: 'blur(8px)',
    borderRadius: 'lg',
    boxShadow: 'lg',
    _dark: {
      bg: 'blackAlpha.600',
    },
  },
};

// Text styles for typography patterns
const textStyles = {
  h1: {
    fontSize: ['4xl', '5xl'],
    fontWeight: 'bold',
    lineHeight: 'heading',
    letterSpacing: 'tight',
  },
  h2: {
    fontSize: ['3xl', '4xl'],
    fontWeight: 'semibold',
    lineHeight: 'heading',
    letterSpacing: 'tight',
  },
  h3: {
    fontSize: ['2xl', '3xl'],
    fontWeight: 'semibold',
    lineHeight: 'heading',
  },
  h4: {
    fontSize: ['xl', '2xl'],
    fontWeight: 'semibold',
    lineHeight: 'heading',
  },
  'body-large': {
    fontSize: 'lg',
    lineHeight: 'body',
  },
  'body-default': {
    fontSize: 'md',
    lineHeight: 'body',
  },
  'body-small': {
    fontSize: 'sm',
    lineHeight: 'body',
  },
  caption: {
    fontSize: 'xs',
    lineHeight: 'normal',
  },
};

// Layout tokens
const layout = {
  sizes: {
    container: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
  },
  radii: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
};

// Shadows
const shadows = {
  xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  outline: '0 0 0 3px rgba(66, 153, 225, 0.6)',
  none: 'none',
};

// Animation tokens
const transition = {
  property: {
    common: 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
    colors: 'background-color, border-color, color, fill, stroke',
    dimensions: 'width, height',
    position: 'left, right, top, bottom',
    background: 'background-color, background-image, background-position',
  },
  easing: {
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  duration: {
    'ultra-fast': '50ms',
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
    'ultra-slow': '500ms',
  },
};

// Combine all tokens into the theme
const theme = extendTheme({
  colors,
  ...typography,
  space,
  components,
  ...layout,
  shadows,
  transition,
  styles,
  layerStyles,
  textStyles,
  semanticTokens: colorModeValues, // Add the color mode values
  config,
});

export default theme; 