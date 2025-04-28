/**
 * KnowledgePlane AI Color System
 *
 * This file defines the color palette used throughout the application.
 * Colors are organized into:
 * - Base colors (grays, primary, secondary, accent)
 * - Semantic colors (success, error, warning, info)
 * - UI component specific colors
 */

// Core palette - main brand colors with refined, sophisticated tones
export const palette = {
  // Brand colors - refined blue with slightly desaturated tones for enterprise feel
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Primary brand color - slightly more vibrant but still professional
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },

  // Secondary color palette - more subdued purple for sophistication
  secondary: {
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6', // Secondary brand color
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
    950: '#3B0764',
  },

  // Accent color - refined teal that complements the primary blue
  accent: {
    50: '#F0FDFA',
    100: '#CCFBF1',
    200: '#99F6E4',
    300: '#5EEAD4',
    400: '#2DD4BF',
    500: '#14B8A6', // Accent color - more sophisticated teal
    600: '#0D9488',
    700: '#0F766E',
    800: '#115E59',
    900: '#134E4A',
    950: '#042F2E',
  },

  // Neutral/gray scale - refined with subtle blue undertones for a more sophisticated look
  gray: {
    50: '#F8FAFC',  // Lightest gray with subtle blue undertone
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Semantic colors - refined for better visual harmony
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Main success color - slightly more vibrant
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },

  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444', // Main error color
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },

  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B', // Main warning color
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
  },

  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Main info color - aligned with primary for consistency
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },

  // Entity-specific colors for the Living Map
  entity: {
    user: '#3B82F6',       // Primary blue
    team: '#8B5CF6',       // Secondary purple
    project: '#F59E0B',    // Warning amber
    goal: '#14B8A6',       // Accent teal
    knowledge: '#22C55E',  // Success green
    department: '#64748B', // Gray
  },
};

// Semantic colors for UI components - refined for better visual hierarchy and readability
export const semanticColors = {
  // Text colors - improved contrast and readability
  text: {
    primary: palette.gray[900],
    secondary: palette.gray[700],
    tertiary: palette.gray[500],
    subtle: palette.gray[400],
    disabled: palette.gray[400],
    inverse: palette.gray[50],
    link: palette.primary[600],
    linkHover: palette.primary[700],
    error: palette.error[600],
    success: palette.success[600],
    warning: palette.warning[600],
    info: palette.info[600],
    accent: palette.accent[600],
  },

  // Background colors - more subtle and refined
  background: {
    primary: '#FFFFFF',
    secondary: palette.gray[50],
    tertiary: palette.gray[100],
    subtle: palette.gray[50],
    inverse: palette.gray[900],
    success: palette.success[50],
    error: palette.error[50],
    warning: palette.warning[50],
    info: palette.info[50],
    highlight: palette.primary[50],
    accent: palette.accent[50],
    card: '#FFFFFF',
    modal: '#FFFFFF',
    tooltip: palette.gray[900],
    glass: 'rgba(255, 255, 255, 0.8)', // For glassmorphism effects
  },

  // Border colors - refined for subtlety and clarity
  border: {
    default: palette.gray[200],
    strong: palette.gray[300],
    light: palette.gray[100],
    focus: palette.primary[400],
    active: palette.primary[500],
    error: palette.error[300],
    success: palette.success[300],
    warning: palette.warning[300],
    info: palette.info[300],
    accent: palette.accent[300],
    subtle: palette.gray[100], // Very subtle border
    divider: palette.gray[200], // For dividers and separators
  },

  // Button colors - refined for better visual hierarchy and interaction states
  button: {
    primary: {
      bg: palette.primary[500],
      hover: palette.primary[600],
      active: palette.primary[700],
      text: '#FFFFFF',
      border: 'transparent',
      disabled: {
        bg: palette.gray[200],
        text: palette.gray[400],
      },
      focus: {
        ring: palette.primary[200], // Subtle focus ring
      },
    },
    secondary: {
      bg: '#FFFFFF',
      hover: palette.gray[50],
      active: palette.gray[100],
      text: palette.gray[800],
      border: palette.gray[300],
      disabled: {
        bg: palette.gray[50],
        text: palette.gray[400],
        border: palette.gray[200],
      },
      focus: {
        ring: palette.gray[200], // Subtle focus ring
      },
    },
    tertiary: {
      bg: 'transparent',
      hover: palette.gray[50],
      active: palette.gray[100],
      text: palette.primary[600],
      border: 'transparent',
      disabled: {
        text: palette.gray[400],
      },
      focus: {
        ring: palette.primary[100], // Very subtle focus ring
      },
    },
    accent: {
      bg: palette.accent[500],
      hover: palette.accent[600],
      active: palette.accent[700],
      text: '#FFFFFF',
      border: 'transparent',
      disabled: {
        bg: palette.gray[200],
        text: palette.gray[400],
      },
      focus: {
        ring: palette.accent[200], // Subtle focus ring
      },
    },
    danger: {
      bg: palette.error[500],
      hover: palette.error[600],
      active: palette.error[700],
      text: '#FFFFFF',
      border: 'transparent',
      disabled: {
        bg: palette.gray[200],
        text: palette.gray[400],
      },
      focus: {
        ring: palette.error[200], // Subtle focus ring
      },
    },
    ghost: {
      bg: 'transparent',
      hover: 'rgba(0, 0, 0, 0.05)',
      active: 'rgba(0, 0, 0, 0.1)',
      text: palette.gray[700],
      border: 'transparent',
      disabled: {
        text: palette.gray[400],
      },
      focus: {
        ring: palette.gray[200], // Very subtle focus ring
      },
    },
  },

  // Input colors - refined for better visual feedback and states
  input: {
    bg: '#FFFFFF',
    text: palette.gray[900],
    placeholder: palette.gray[500],
    border: palette.gray[300],
    hoverBorder: palette.gray[400],
    focusBorder: palette.primary[500],
    focusRing: palette.primary[100], // Subtle focus ring
    errorBorder: palette.error[500],
    errorText: palette.error[600],
    errorBg: palette.error[50], // Subtle error background
    successBorder: palette.success[500],
    successText: palette.success[600],
    successBg: palette.success[50], // Subtle success background
    disabledBg: palette.gray[100],
    disabledText: palette.gray[500],
    disabledBorder: palette.gray[200],
    icon: palette.gray[400], // For input icons
    iconFocus: palette.primary[500], // For input icons when focused
  },

  // Status colors for UI feedback - refined for better visual hierarchy
  status: {
    success: palette.success[500],
    successLight: palette.success[100],
    successDark: palette.success[700],
    error: palette.error[500],
    errorLight: palette.error[100],
    errorDark: palette.error[700],
    warning: palette.warning[500],
    warningLight: palette.warning[100],
    warningDark: palette.warning[700],
    info: palette.info[500],
    infoLight: palette.info[100],
    infoDark: palette.info[700],
    neutral: palette.gray[500],
    neutralLight: palette.gray[100],
    neutralDark: palette.gray[700],
  },
};

// Color modes (light/dark) - currently only light mode is fully defined
export const colorModes = {
  light: {
    ...semanticColors,
  },
  dark: {
    // Dark mode overrides would go here
    // This is a placeholder for future dark mode implementation
  },
};

export default {
  palette,
  semanticColors,
  colorModes,
};