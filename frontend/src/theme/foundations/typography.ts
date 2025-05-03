/**
 * KnowledgePlane AI Typography System
 *
 * This file defines the typography styles used throughout the application.
 * - Font families for different text categories
 * - Font sizes with a scalable system
 * - Line heights, weights, and letter spacing
 * - Text styles for common UI components
 */

// Font family definitions - Airbnb-inspired clean, approachable typography
export const fontFamily = {
  // System font stack with Airbnb-like font preferences
  sans: "'Circular', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",

  // Heading font - same as body for consistency (Airbnb approach)
  heading: "'Circular', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif",

  // Monospace font stack for code and technical content
  mono: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",

  // Serif font stack for specific content that needs a more formal look
  serif: "'Georgia', 'Times New Roman', serif",
};

// Font size system (rem-based for accessibility) - clean, approachable sizing
export const fontSize = {
  // Core sizes (mobile-first approach) - slightly adjusted for better visual rhythm
  '2xs': '0.625rem',   // 10px - for very small text like badges
  xs: '0.75rem',       // 12px
  sm: '0.875rem',      // 14px - Airbnb uses this for most body text
  md: '1rem',          // 16px (base)
  lg: '1.125rem',      // 18px
  xl: '1.25rem',       // 20px
  '2xl': '1.5rem',     // 24px
  '3xl': '1.875rem',   // 30px
  '4xl': '2.25rem',    // 36px
  '5xl': '3rem',       // 48px
  '6xl': '3.75rem',    // 60px
  '7xl': '4.5rem',     // 72px
  '8xl': '6rem',       // 96px

  // Special cases - semantic naming for specific UI elements
  caption: '0.75rem',      // 12px - for captions and helper text
  button: '0.875rem',      // 14px - for buttons
  input: '1rem',           // 16px - for form inputs
  smallHeader: '1.25rem',  // 20px - for card headers and section titles
  header: '1.5rem',        // 24px - for page headers
  title: '2.25rem',        // 36px - for main titles
  display: '3rem',         // 48px - for hero sections and large displays

  // Data visualization specific
  dataLabel: '0.75rem',    // 12px - for chart labels
  dataValue: '1.125rem',   // 18px - for chart values
};

// Font weight definitions - Airbnb uses a narrower range of weights for consistency
export const fontWeight = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,        // Regular body text
  medium: 500,        // Emphasized text
  semibold: 600,      // Subheadings
  bold: 700,          // Headings - Airbnb typically uses this as max weight
  extrabold: 800,
  black: 900,
};

// Line height settings for different text contexts - airy, readable spacing
export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,         // Default
  relaxed: 1.625,
  loose: 2,

  // Special cases for specific UI needs - adjusted for better readability
  heading: 1.25,       // More breathing room for headings (Airbnb-style)
  subheading: 1.35,    // For subheadings
  body: 1.5,           // Airbnb-like body text line height
  code: 1.7,           // For code blocks
  caption: 1.5,        // For captions and small text
  data: 1.4,           // For data visualization

  // Semantic line heights for specific UI elements
  button: 1.5,        // For buttons
  input: 1.5,         // For form inputs
  title: 1.2,         // For large titles
  display: 1.15,      // For very large display text
};

// Letter spacing (tracking) options - clean and legible
export const letterSpacing = {
  tightest: '-0.03em', // For very large display text
  tighter: '-0.025em',
  tight: '-0.01em',
  normal: '0em',       // Airbnb typically uses normal letter spacing
  wide: '0.01em',
  wider: '0.025em',
  widest: '0.05em',

  // Special cases - adjusted for better visual harmony
  heading: '-0.01em',     // Very slightly tighter for headings
  subheading: '0em',      // For subheadings
  body: '0em',            // Normal spacing for body text (Airbnb approach)
  button: '0.01em',       // For buttons
  caps: '0.05em',         // For all-caps text
  title: '-0.01em',       // For large titles
  display: '-0.02em',     // For very large display text
  code: '0em',            // For code blocks
  caption: '0em',         // For captions and small text
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

// Text styles for common components - styled for clean, approachable look
export const textStyles = {
  // Headings - refined for Airbnb-like hierarchy
  h1: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.title,
    letterSpacing: letterSpacing.title,
    marginBottom: '1.5rem',
    color: '#484848', // Airbnb primary text color
  },
  h2: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.heading,
    marginBottom: '1.25rem',
    color: '#484848',
  },
  h3: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.heading,
    marginBottom: '1rem',
    color: '#484848',
  },
  h4: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.subheading,
    letterSpacing: letterSpacing.subheading,
    marginBottom: '0.75rem',
    color: '#484848',
  },
  h5: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.subheading,
    letterSpacing: letterSpacing.subheading,
    marginBottom: '0.5rem',
    color: '#484848',
  },
  h6: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.subheading,
    letterSpacing: letterSpacing.subheading,
    marginBottom: '0.5rem',
    color: '#484848',
  },

  // Body text - clean and readable like Airbnb
  bodyLarge: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md, // 16px
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.body,
    color: '#484848',
  },
  bodyDefault: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.sm, // 14px - Airbnb's typical body size
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.body,
    color: '#484848',
  },
  bodySmall: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xs, // 12px
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.body,
    color: '#717171', // Airbnb secondary text
  },

  // Special text styles for specific UI elements
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.caption,
    letterSpacing: letterSpacing.caption,
    color: '#717171',
  },

  code: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.code,
    letterSpacing: letterSpacing.code,
    backgroundColor: '#F7F7F7', // Light background
    padding: '0.2em 0.4em',
    borderRadius: '4px',
  },

  // Special text styles
  caption: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.caption,
    color: '#717171',
  },
  button: {
    fontSize: fontSize.button,
    fontWeight: fontWeight.medium, // Airbnb uses medium weight for buttons
    lineHeight: lineHeight.button,
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
    color: '#484848',
  },
  link: {
    color: '#FF5A5F', // Airbnb link color (coral)
    textDecoration: textDecoration.noDecoration, // Airbnb typically uses no underline
    _hover: {
      color: '#E93844', // Darker on hover
      textDecoration: textDecoration.underline, // Underline on hover
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