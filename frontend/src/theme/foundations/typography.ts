/**
 * KnowledgePlane AI Typography System
 *
 * This file defines the typography styles used throughout the application.
 * - Font families for different text categories
 * - Font sizes with a scalable system
 * - Line heights, weights, and letter spacing
 * - Text styles for common UI components
 */

// Font family definitions - refined for better readability and enterprise feel
export const fontFamily = {
  // System font stack with sans-serif fallbacks - using Inter as primary font for clean, modern look
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",

  // Alternate sans-serif for headings - slightly more distinctive
  heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",

  // Monospace font stack for code and technical content - using JetBrains Mono for better readability
  mono: "'JetBrains Mono', 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",

  // Serif font stack for specific content that needs a more formal look
  serif: "'Georgia', 'Times New Roman', serif",
};

// Font size system (rem-based for accessibility) - refined for better readability and hierarchy
export const fontSize = {
  // Core sizes (mobile-first approach) - slightly adjusted for better visual rhythm
  '2xs': '0.625rem',   // 10px - for very small text like badges
  xs: '0.75rem',       // 12px
  sm: '0.875rem',      // 14px
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

// Line height settings for different text contexts - refined for better readability
export const lineHeight = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,

  // Special cases for specific UI needs - adjusted for better readability
  heading: 1.2,       // Slightly tighter for headings
  subheading: 1.3,    // For subheadings
  body: 1.6,          // Slightly more relaxed for better readability
  code: 1.7,          // For code blocks
  caption: 1.4,       // For captions and small text
  data: 1.3,          // For data visualization

  // Semantic line heights for specific UI elements
  button: 1.4,        // For buttons
  input: 1.5,         // For form inputs
  title: 1.15,        // For large titles (tighter)
  display: 1.1,       // For very large display text (tightest)
};

// Letter spacing (tracking) options - refined for better readability and visual appeal
export const letterSpacing = {
  tightest: '-0.06em', // For very large display text
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',

  // Special cases - adjusted for better visual harmony
  heading: '-0.015em',    // Slightly tighter for headings
  subheading: '-0.01em',  // For subheadings
  body: '0.01em',         // Slightly wider for body text
  button: '0.02em',       // For buttons
  caps: '0.05em',         // For all-caps text
  title: '-0.03em',       // For large titles
  display: '-0.04em',     // For very large display text
  code: '0em',            // For code blocks (monospace)
  caption: '0.01em',      // For captions and small text
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

// Text styles for common components - refined for better visual hierarchy and readability
export const textStyles = {
  // Headings - refined for better visual hierarchy
  h1: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.title,
    letterSpacing: letterSpacing.title,
    marginBottom: '1.5rem',
    color: 'var(--text-primary)',
  },
  h2: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.heading,
    marginBottom: '1.25rem',
    color: 'var(--text-primary)',
  },
  h3: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.heading,
    letterSpacing: letterSpacing.heading,
    marginBottom: '1rem',
    color: 'var(--text-primary)',
  },
  h4: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.subheading,
    letterSpacing: letterSpacing.subheading,
    marginBottom: '0.75rem',
    color: 'var(--text-primary)',
  },
  h5: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.subheading,
    letterSpacing: letterSpacing.subheading,
    marginBottom: '0.5rem',
    color: 'var(--text-primary)',
  },
  h6: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.subheading,
    letterSpacing: letterSpacing.subheading,
    marginBottom: '0.5rem',
    color: 'var(--text-primary)',
  },

  // Body text - refined for better readability
  bodyLarge: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.body,
    color: 'var(--text-primary)',
  },
  bodyDefault: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.body,
    color: 'var(--text-primary)',
  },
  bodySmall: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.body,
    letterSpacing: letterSpacing.body,
    color: 'var(--text-secondary)',
  },

  // Special text styles for specific UI elements
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.caption,
    letterSpacing: letterSpacing.caption,
    color: 'var(--text-tertiary)',
  },

  code: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    lineHeight: lineHeight.code,
    letterSpacing: letterSpacing.code,
    backgroundColor: 'var(--bg-subtle)',
    padding: '0.2em 0.4em',
    borderRadius: '0.25em',
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