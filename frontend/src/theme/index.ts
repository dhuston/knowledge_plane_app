// KnowledgePlane AI Theme
// Main theme configuration with brand identity and enterprise styling

import { extendTheme } from '@chakra-ui/react';
import { palette } from './foundations/colors';
import components from './components';

// Typography system - using modern, clean fonts
const typography = {
  fonts: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    mono: '"JetBrains Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
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
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    normal: 'normal',
    none: 1,
    shorter: 1.25,
    short: 1.375,
    base: 1.5,
    tall: 1.625,
    taller: 2,
  },
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Spacing system - updated for more generous Airbnb-like whitespace
const space = {
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',      // 16px
  5: '1.25rem',
  6: '1.5rem',    // 24px - Airbnb uses this as a common spacing unit
  7: '1.75rem',
  8: '2rem',      // 32px - Airbnb uses this for section spacing
  9: '2.25rem',
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px - Airbnb uses this for large vertical spacing
  14: '3.5rem',
  16: '4rem',     // 64px
  20: '5rem',     // 80px - Airbnb section spacing
  24: '6rem',     // 96px
  28: '7rem',
  32: '8rem',     // 128px - Very large spacing
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
  
  // Semantic spacing for specific use cases
  'card-padding': '24px',  // Consistent card padding like Airbnb
  'section-y': '80px',     // Vertical section spacing
  'container-x': '24px',   // Horizontal container padding on mobile
  'container-x-md': '48px' // Horizontal container padding on tablets and up
};

// Theme configuration
const config = {
  initialColorMode: 'light',
  useSystemColorMode: true, // Enable system preference detection
};

// Global styles with improved aesthetics
const styles = {
  global: (props: { colorMode: string }) => ({
    // Base styles
    'html, body': {
      color: props.colorMode === 'dark' ? 'secondary.400' : '#262626', // Off-white/cream : Button color
      bg: props.colorMode === 'dark' ? '#262626' : 'secondary.400', // Button color : Off-white/cream
      lineHeight: 'base',
      fontFamily: 'body',
      fontSize: 'md',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
      textRendering: 'optimizeLegibility',
    },

    // Default text selection
    '::selection': {
      bg: props.colorMode === 'dark' ? 'primary.600' : 'primary.300', // Sage green : Light mint green
      color: props.colorMode === 'dark' ? 'secondary.400' : '#262626', // Off-white/cream : Button color
    },

    // Scrollbar styling - thinner, more modern
    '::-webkit-scrollbar': {
      width: '6px',
      height: '6px',
    },
    '::-webkit-scrollbar-track': {
      bg: props.colorMode === 'dark' ? '#363636' : 'secondary.400', // Lighter button color : Off-white/cream
    },
    '::-webkit-scrollbar-thumb': {
      bg: props.colorMode === 'dark' ? '#565656' : 'primary.300', // Button variant : Light mint green
      borderRadius: 'full',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: props.colorMode === 'dark' ? 'primary.600' : 'primary.400', // Sage green : Lighter mint green
    },

    // Focus outline - more subtle
    '*:focus': {
      outline: 'none',
      boxShadow: '0 0 0 2px rgba(197, 212, 202, 0.5)', // Light mint green with transparency
    },
    '*:focus:not(:focus-visible)': {
      boxShadow: 'none',
    },
    '*:focus-visible': {
      boxShadow: '0 0 0 2px rgba(141, 162, 148, 0.5)', // Sage green with transparency
    },

    // Default transitions - smoother
    '*': {
      borderColor: props.colorMode === 'dark' ? 'primary.600' : 'primary.300', // Sage green : Light mint green
      transitionProperty: 'all',
      transitionDuration: '0.2s',
      transitionTimingFunction: 'ease-in-out',
    },

    // Placeholder styling
    '::placeholder': {
      color: props.colorMode === 'dark' ? '#565656' : 'primary.600', // Button variant : Sage green
    },

    // Disabled state
    ':disabled': {
      cursor: 'not-allowed',
      opacity: 0.6,
    },

    // Headings - more modern typography
    'h1, h2, h3, h4, h5, h6': {
      fontFamily: 'heading',
      fontWeight: 'semibold',
      letterSpacing: 'tight',
      lineHeight: 'shorter',
      color: props.colorMode === 'dark' ? 'secondary.400' : '#262626', // Off-white/cream : Button color
    },

    // Links - more vibrant
    a: {
      color: props.colorMode === 'dark' ? 'primary.400' : 'primary.600', // Lighter mint green : Sage green
      textDecoration: 'none',
      _hover: {
        color: props.colorMode === 'dark' ? 'primary.300' : 'primary.700', // Light mint green : Darker sage green
        textDecoration: 'none',
      },
    },

    // Code blocks - better contrast
    'pre, code': {
      fontFamily: 'mono',
      fontSize: '0.9em',
      padding: '0.2em 0.4em',
      borderRadius: 'md',
      bg: props.colorMode === 'dark' ? '#363636' : 'secondary.400', // Lighter button color : Off-white/cream
    },
  }),
};

// Layer styles for common patterns - more modern and refined
const layerStyles = {
  card: {
    bg: 'surface.500', // White
    borderRadius: 'lg',
    boxShadow: 'sm',
    borderWidth: '1px',
    borderColor: 'primary.300', // Light mint green
    p: 4,
    transition: 'all 0.2s',
    _dark: {
      bg: '#363636', // Lighter button color
      borderColor: 'primary.600', // Sage green
    }
  },
  'card-hover': {
    bg: 'surface.500', // White
    borderRadius: 'lg',
    boxShadow: 'sm',
    borderWidth: '1px',
    borderColor: 'primary.300', // Light mint green
    p: 4,
    transition: 'all 0.2s',
    _dark: {
      bg: '#363636', // Lighter button color
      borderColor: 'primary.600', // Sage green
    },
    _hover: {
      boxShadow: 'md',
      transform: 'translateY(-2px)',
      borderColor: 'primary.400', // Lighter mint green
      _dark: {
        borderColor: 'primary.500', // Darker sage green
      }
    },
  },
  'glass-panel': {
    bg: 'whiteAlpha.900',
    backdropFilter: 'blur(10px)',
    borderRadius: 'xl',
    boxShadow: 'lg',
    borderWidth: '1px',
    borderColor: 'primary.300', // Light mint green
    _dark: {
      bg: 'blackAlpha.700',
      borderColor: 'primary.600', // Sage green
    },
  },
  'feature-card': {
    bg: 'surface.500', // White
    borderRadius: 'xl',
    boxShadow: 'md',
    p: 6,
    borderWidth: '1px',
    borderColor: 'primary.300', // Light mint green
    transition: 'all 0.3s',
    _dark: {
      bg: '#363636', // Lighter button color
      borderColor: 'primary.600', // Sage green
    },
    _hover: {
      transform: 'translateY(-4px)',
      boxShadow: 'lg',
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

// Shadows - Airbnb-inspired subtle, clean shadows
const shadows = {
  xs: '0 0 0 1px rgba(0, 0, 0, 0.04)',
  sm: '0 1px 2px rgba(0, 0, 0, 0.08)',
  base: '0 2px 4px rgba(0, 0, 0, 0.12)',
  md: '0 4px 8px rgba(0, 0, 0, 0.12)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.12)',  // Airbnb-style card shadow
  xl: '0 12px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
  '2xl': '0 20px 32px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  outline: '0 0 0 2px rgba(255, 90, 95, 0.3)',  // Coral (primary) outline for focus
  'outline-primary': '0 0 0 2px rgba(255, 90, 95, 0.3)',  // Coral outline
  'outline-success': '0 0 0 2px rgba(0, 195, 138, 0.3)',  // Success outline
  'outline-error': '0 0 0 2px rgba(239, 68, 68, 0.3)',    // Error outline
  'outline-warning': '0 0 0 2px rgba(245, 158, 11, 0.3)', // Warning outline
  'card-hover': '0 8px 20px rgba(0, 0, 0, 0.12)',         // Airbnb-style hover shadow
  'card-focus': '0 0 0 2px rgba(255, 90, 95, 0.3), 0 6px 12px rgba(0, 0, 0, 0.1)',
  'elevation-1': '0 1px 2px rgba(0, 0, 0, 0.08)',        // Subtle elevation
  'elevation-2': '0 3px 10px rgba(0, 0, 0, 0.1)',        // Medium elevation
  'elevation-3': '0 8px 20px rgba(0, 0, 0, 0.12)',       // Heavy elevation like Airbnb
  'dropdown': '0 2px 16px rgba(0, 0, 0, 0.12)',          // Airbnb dropdown shadow
  'modal': '0 12px 28px rgba(0, 0, 0, 0.16)',            // Modal shadow
  none: 'none',
};

// Animation tokens - smooth Airbnb-inspired transitions
const transition = {
  property: {
    common: 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
    colors: 'background-color, border-color, color, fill, stroke',
    dimensions: 'width, height',
    position: 'left, right, top, bottom',
    background: 'background-color, background-image, background-position',
    transform: 'transform',
    filter: 'filter, backdrop-filter',
    visibility: 'opacity, visibility',
  },
  easing: {
    // Airbnb uses smoother, more natural easing curves
    'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
    'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
    'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    // New easing curves for more natural motion
    'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',   // Slight bounce effect
    'soft': 'cubic-bezier(0.4, 0.6, 0.1, 1)',        // Soft acceleration/deceleration
    'gentle': 'cubic-bezier(0.33, 0.66, 0.66, 1)',   // Gentle easing
    'airbnb': 'cubic-bezier(0.2, 0.8, 0.2, 1)',      // Airbnb-style smooth motion
  },
  duration: {
    'ultra-fast': '50ms',
    faster: '100ms',
    fast: '150ms',
    normal: '200ms',       // Airbnb standard transition time
    slow: '300ms',
    slower: '400ms',
    'ultra-slow': '500ms',
    'enter': '200ms',      // Enter animations
    'leave': '150ms',      // Leave animations faster than enter (Airbnb behavior)
    'hover': '120ms',      // Quick hover transitions
    'expand': '250ms',     // Panel expansions
  },
};

// Combine all tokens into the theme
const theme = extendTheme({
  colors: {
    primary: palette.primary,
    secondary: palette.secondary,
    surface: palette.surface,
    error: palette.error,
    warning: palette.warning,
    info: palette.info,
    success: palette.success,
    gray: palette.gray,
  },
  ...typography,
  space,
  ...layout,
  shadows,
  transition,
  components,
  styles,
  layerStyles,
  textStyles,
  config,
});

export default theme;