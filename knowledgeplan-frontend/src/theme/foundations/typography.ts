/**
 * KnowledgePlane AI Typography System
 * 
 * This file defines the typography styles used throughout the application.
 * - Font families for different text categories
 * - Font sizes with a scalable system
 * - Line heights, weights, and letter spacing
 * - Text styles for common UI components
 */

// Font family definitions
export const fontFamily = {
  // System font stack with sans-serif fallbacks
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
  
  // Monospace font stack for code and technical content
  mono: "'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  
  // Serif font stack for specific content that needs a more formal look
  serif: "'Georgia', 'Times New Roman', serif",
};

// Font size system (rem-based for accessibility)
export const fontSize = {
  // Core sizes (mobile-first approach)
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  md: '1rem',        // 16px (base)
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
  '6xl': '3.75rem',  // 60px
  '7xl': '4.5rem',   // 72px
  '8xl': '6rem',     // 96px
  
  // Special cases
  caption: '0.75rem',      // 12px
  button: '0.875rem',      // 14px
  input: '1rem',           // 16px
  smallHeader: '1.25rem',  // 20px
  header: '1.5rem',        // 24px
  title: '2.25rem',        // 36px
  display: '3rem',         // 48px
};

// Font weight definitions
export const fontWeight = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

// Line height settings for different text contexts
export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
  
  // Special cases for specific UI needs
  heading: 1.2,
  body: 1.5,
  code: 1.7,
  caption: 1.4,
};

// Letter spacing (tracking) options
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
  
  // Special cases
  heading: '-0.02em',
  button: '0.02em',
  caps: '0.05em',
};

// Text transformation utilities
export const textTransform = {
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  capitalize: 'capitalize',
  normalCase: 'none',
};

// Text decoration utilities
export const textDecoration = {
  underline: 'underline',
  lineThrough: 'line-through',
  noDecoration: 'none',
};

// Text styles for common components
export const textStyles = {
  // Headings
  h1: {
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.heading,
    marginBottom: '1.5rem',
  },
  h2: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.heading,
    marginBottom: '1.25rem',
  },
  h3: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.heading,
    marginBottom: '1rem',
  },
  h4: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.heading,
    marginBottom: '0.75rem',
  },
  h5: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.heading,
    marginBottom: '0.5rem',
  },
  h6: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.heading,
    marginBottom: '0.5rem',
  },
  
  // Body text
  bodyLarge: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body,
  },
  bodyDefault: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body,
  },
  bodySmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body,
  },
  
  // Special text styles
  caption: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.caption,
    color: 'var(--text-secondary)',
  },
  button: {
    fontSize: fontSize.button,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.button,
  },
  overline: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.wider,
    textTransform: textTransform.uppercase,
  },
  code: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.code,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.normal,
    marginBottom: '0.5rem',
  },
  link: {
    color: 'var(--text-link)',
    textDecoration: textDecoration.underline,
    _hover: {
      color: 'var(--text-link-hover)',
    },
  },
};

export default {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  textTransform,
  textDecoration,
  textStyles,
}; 