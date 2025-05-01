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
  // Brand colors - modern blue palette
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD', // Primary brand color - light blue
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB', // Primary variant - deeper blue
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },

  // Secondary color palette - clean, neutral background
  secondary: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#F8F9FA', // Secondary brand color - light gray/almost white
    500: '#E2E8F0',
    600: '#CBD5E1', // Secondary variant - light gray
    700: '#94A3B8',
    800: '#64748B',
    900: '#475569',
    950: '#334155',
  },

  // Surface colors
  surface: {
    50: '#FFFFFF',
    100: '#FCFCFC',
    200: '#F9F9F9',
    300: '#F6F6F6',
    400: '#F3F3F3',
    500: '#FFFFFF', // Surface color - white
    600: '#F5F8FF',
    700: '#EEF2FF',
    800: '#E0E7FF',
    900: '#C7D2FE', // Surface variant - very light indigo
    950: '#A5B4FC',
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
    50: '#FDEAED',
    100: '#FBD5DB',
    200: '#F8C0C9',
    300: '#F5ABB7',
    400: '#F296A5',
    500: '#EF8193',
    600: '#D25A6B',
    700: '#B53344',
    800: '#B00020', // Main error color
    900: '#8A001A',
    950: '#630013',
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
    user: '#93C5FD',       // Primary light blue
    team: '#2563EB',       // Primary variant deeper blue
    project: '#F59E0B',    // Warning amber
    goal: '#F8F9FA',       // Secondary light gray/almost white
    knowledge: '#22C55E',  // Success green
    department: '#565656', // Button variant gray
  },
};

// Semantic colors for UI components - refined for better visual hierarchy and readability
export const semanticColors = {
  // Text colors - improved contrast and readability
  text: {
    primary: '#262626', // Button color - dark gray/almost black
    secondary: '#565656', // Button variant - medium gray
    tertiary: palette.gray[500],
    subtle: palette.gray[400],
    disabled: palette.gray[400],
    inverse: palette.secondary[400], // Light gray/almost white
    link: palette.primary[600], // Deeper blue
    linkHover: palette.primary[700],
    error: palette.error[800], // Deep red
    success: palette.success[600],
    warning: palette.warning[600],
    info: palette.info[600],
    accent: palette.surface[900], // Very light indigo
  },

  // Background colors - more subtle and refined
  background: {
    primary: palette.surface[500], // White
    secondary: palette.secondary[400], // Light gray/almost white
    tertiary: palette.secondary[600], // Light gray
    subtle: palette.secondary[400], // Light gray/almost white
    inverse: palette.primary[600], // Deeper blue
    success: palette.success[50],
    error: palette.error[50],
    warning: palette.warning[50],
    info: palette.info[50],
    highlight: palette.primary[300], // Light blue
    accent: palette.surface[900], // Very light indigo
    card: palette.surface[500], // White
    modal: palette.surface[500], // White
    tooltip: '#262626', // Button color - dark gray/almost black
    glass: 'rgba(255, 255, 255, 0.8)', // For glassmorphism effects
  },

  // Border colors - refined for subtlety and clarity
  border: {
    default: palette.primary[300], // Light blue
    strong: palette.primary[600], // Deeper blue
    light: palette.secondary[400], // Light gray/almost white
    focus: palette.primary[400],
    active: palette.primary[500],
    error: palette.error[800], // Deep red
    success: palette.success[300],
    warning: palette.warning[300],
    info: palette.info[300],
    accent: palette.surface[900], // Very light indigo
    subtle: palette.secondary[300], // Very subtle border
    divider: palette.primary[200], // For dividers and separators
  },

  // Button colors - refined for better visual hierarchy and interaction states
  button: {
    primary: {
      bg: '#262626', // Button color - dark gray/almost black
      hover: '#363636',
      active: '#464646',
      text: '#FFFFFF',
      border: 'transparent',
      disabled: {
        bg: palette.gray[200],
        text: palette.gray[400],
      },
      focus: {
        ring: '#565656', // Button variant - medium gray
      },
    },
    secondary: {
      bg: palette.secondary[400], // Light gray/almost white
      hover: palette.secondary[500],
      active: palette.secondary[600],
      text: '#262626', // Button color - dark gray/almost black
      border: palette.primary[300], // Light blue
      disabled: {
        bg: palette.gray[50],
        text: palette.gray[400],
        border: palette.gray[200],
      },
      focus: {
        ring: palette.primary[200], // Subtle focus ring
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
      bg: palette.surface[900], // Very light indigo
      hover: palette.surface[800],
      active: palette.surface[700],
      text: '#262626', // Button color - dark gray/almost black
      border: 'transparent',
      disabled: {
        bg: palette.gray[200],
        text: palette.gray[400],
      },
      focus: {
        ring: palette.surface[700], // Subtle focus ring
      },
    },
    danger: {
      bg: palette.error[800], // Deep red
      hover: palette.error[900],
      active: palette.error[950],
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
    error: palette.error[800], // Deep red
    errorLight: palette.error[100],
    errorDark: palette.error[900],
    warning: palette.warning[500],
    warningLight: palette.warning[100],
    warningDark: palette.warning[700],
    info: palette.info[500],
    infoLight: palette.info[100],
    infoDark: palette.info[700],
    neutral: '#565656', // Button variant - medium gray
    neutralLight: palette.secondary[400], // Light gray/almost white
    neutralDark: '#262626', // Button color - dark gray/almost black
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