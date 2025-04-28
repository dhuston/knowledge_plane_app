/**
 * KnowledgePlane AI Color System
 * 
 * This file defines the color palette used throughout the application.
 * Colors are organized into:
 * - Base colors (grays, primary, secondary, accent)
 * - Semantic colors (success, error, warning, info)
 * - UI component specific colors
 */

// Core palette - main brand colors
export const palette = {
  // Brand colors
  primary: {
    50: '#EBF8FF',
    100: '#D1EBFF',
    200: '#A8D5FF',
    300: '#7AB5FF',
    400: '#4B91F7',
    500: '#2563EB', // Primary brand color
    600: '#1D4ED8',
    700: '#1E40AF',
    800: '#1E3A8A',
    900: '#1E3A72',
    950: '#172554',
  },
  
  // Secondary color palette
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
  
  // Accent color for highlights and CTAs
  accent: {
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4', // Accent color
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
    950: '#083344',
  },
  
  // Neutral/gray scale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#0A0F1A',
  },
  
  // Semantic colors
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981', // Main success color
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    950: '#022C22',
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
    500: '#3B82F6', // Main info color
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },
};

// Semantic colors for UI components
export const semanticColors = {
  // Text colors
  text: {
    primary: palette.gray[900],
    secondary: palette.gray[700],
    tertiary: palette.gray[500],
    disabled: palette.gray[400],
    inverse: palette.gray[50],
    link: palette.primary[600],
    linkHover: palette.primary[700],
    error: palette.error[600],
    success: palette.success[600],
    warning: palette.warning[600],
    info: palette.info[600],
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: palette.gray[50],
    tertiary: palette.gray[100],
    inverse: palette.gray[900],
    success: palette.success[50],
    error: palette.error[50],
    warning: palette.warning[50],
    info: palette.info[50],
    highlight: palette.primary[50],
    card: '#FFFFFF',
    modal: '#FFFFFF',
    tooltip: palette.gray[900],
  },
  
  // Border colors
  border: {
    default: palette.gray[200],
    strong: palette.gray[300],
    light: palette.gray[100],
    focus: palette.primary[400],
    error: palette.error[300],
    success: palette.success[300],
    warning: palette.warning[300],
    info: palette.info[300],
  },
  
  // Button colors
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
    },
  },
  
  // Input colors
  input: {
    bg: '#FFFFFF',
    text: palette.gray[900],
    placeholder: palette.gray[500],
    border: palette.gray[300],
    hoverBorder: palette.gray[400],
    focusBorder: palette.primary[500],
    errorBorder: palette.error[500],
    errorText: palette.error[600],
    disabledBg: palette.gray[100],
    disabledText: palette.gray[500],
    disabledBorder: palette.gray[200],
  },
  
  // Status colors for UI feedback
  status: {
    success: palette.success[500],
    error: palette.error[500],
    warning: palette.warning[500],
    info: palette.info[500],
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