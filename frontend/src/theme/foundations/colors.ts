/**
 * KnowledgePlane AI Color System
 *
 * This file defines the color palette used throughout the application.
 * Colors are organized into:
 * - Base colors (grays, primary, secondary, accent)
 * - Semantic colors (success, error, warning, info)
 * - UI component specific colors
 */

// Core palette - Airbnb-inspired warm, welcoming colors
export const palette = {
  // Brand colors - warm reddish palette inspired by Airbnb
  primary: {
    50: '#FFF5F5',
    100: '#FFE5E5',
    200: '#FFD5D5',
    300: '#FFA8A8', // Light coral
    400: '#FF7A7A',
    500: '#FF5A5F', // Airbnb-inspired coral/red
    600: '#E63946', // Deeper red
    700: '#D03444',
    800: '#B91C1C',
    900: '#A51C30',
    950: '#881337',
  },

  // Secondary color palette - warm neutral background colors
  secondary: {
    50: '#FFFAF0', // Lightest cream
    100: '#FEF3E2', // Light cream
    200: '#FEEBC8',
    300: '#FBE0AF',
    400: '#F7F7F7', // Off-white background (like Airbnb)
    500: '#F5F5F4', // Secondary light background
    600: '#E7E5E4', // Light beige
    700: '#D6D3D1',
    800: '#A8A29E',
    900: '#78716C',
    950: '#57534E',
  },

  // Surface colors - clean whites and off-whites
  surface: {
    50: '#FFFFFF',
    100: '#FEFEFE',
    200: '#FDFDFD',
    300: '#FCFCFC',
    400: '#FAFAFA',
    500: '#FFFFFF', // Pure white surface
    600: '#FFFBF5', // Warm white
    700: '#FFF8F1', // Warmer white
    800: '#FFF4E6', // Slightly cream
    900: '#FFF1D7', // Light cream
    950: '#FFE9C8', // Cream
  },

  // Neutral/gray scale - warmer grays for a cozier feel
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
    950: '#030712',
  },

  // Semantic colors - refined for better visual harmony
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#00C38A', // Minty green - more Airbnb-like
    600: '#00A76F',
    700: '#008557',
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
    500: '#EF4444', // Bright red
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
    500: '#F59E0B', // Amber
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
    500: '#008489', // Airbnb teal accent color
    600: '#00676B',
    700: '#005357',
    800: '#0E7490',
    900: '#155E75',
    950: '#083344',
  },

  // Entity-specific colors for the Living Map - updated with warmer tones
  entity: {
    user: '#FF5A5F',       // Airbnb coral
    team: '#008489',       // Airbnb teal
    project: '#F59E0B',    // Amber
    goal: '#F7F7F7',       // Off-white
    knowledge: '#00C38A',  // Minty green
    department: '#6B7280', // Medium warm gray
  },
};

// Semantic colors for UI components - refined for Airbnb-inspired aesthetic
export const semanticColors = {
  // Text colors - warm, friendly and readable
  text: {
    primary: '#484848', // Airbnb-inspired dark gray
    secondary: '#717171', // Medium gray
    tertiary: palette.gray[500],
    subtle: palette.gray[400],
    disabled: palette.gray[400],
    inverse: palette.secondary[100], // Light cream for contrast
    link: palette.primary[500], // Airbnb coral
    linkHover: palette.primary[600],
    error: palette.error[600], // Bright red
    success: palette.success[600],
    warning: palette.warning[600],
    info: palette.info[600],
    accent: palette.surface[900], // Light cream
  },

  // Background colors - clean, airy whites and light creams
  background: {
    primary: palette.surface[500], // Pure white
    secondary: palette.secondary[400], // Off-white (F7F7F7) like Airbnb
    tertiary: palette.secondary[500], // Light background
    subtle: palette.secondary[100], // Light cream
    inverse: palette.primary[500], // Airbnb coral
    success: palette.success[50],
    error: palette.error[50],
    warning: palette.warning[50],
    info: palette.info[50],
    highlight: palette.primary[300], // Light coral
    accent: palette.surface[900], // Light cream
    card: palette.surface[500], // Pure white
    modal: palette.surface[500], // Pure white
    tooltip: '#484848', // Airbnb dark gray
    glass: 'rgba(255, 255, 255, 0.85)', // For glassmorphism effects
  },

  // Border colors - subtle, lighter for an airier feel
  border: {
    default: '#DDDDDD', // Airbnb-style light gray border
    strong: palette.gray[300],
    light: palette.secondary[300],
    focus: palette.primary[400],
    active: palette.primary[500],
    error: palette.error[500],
    success: palette.success[300],
    warning: palette.warning[300],
    info: palette.info[300],
    accent: palette.surface[800],
    subtle: '#EBEBEB', // Very subtle border like Airbnb
    divider: '#EBEBEB', // For dividers and separators
  },

  // Button colors - Airbnb-inspired style with rounded corners and clear states
  button: {
    primary: {
      bg: palette.primary[500], // Airbnb coral
      hover: palette.primary[600],
      active: palette.primary[700],
      text: '#FFFFFF',
      border: 'transparent',
      disabled: {
        bg: palette.gray[200],
        text: palette.gray[400],
      },
      focus: {
        ring: palette.primary[300],
      },
    },
    secondary: {
      bg: '#FFFFFF', // White background
      hover: palette.secondary[100],
      active: palette.secondary[200],
      text: '#484848', // Airbnb-inspired dark gray
      border: '#DDDDDD', // Airbnb-style border
      disabled: {
        bg: palette.gray[50],
        text: palette.gray[400],
        border: palette.gray[200],
      },
      focus: {
        ring: palette.primary[200],
      },
    },
    tertiary: {
      bg: 'transparent',
      hover: 'rgba(0, 0, 0, 0.03)',
      active: 'rgba(0, 0, 0, 0.06)',
      text: palette.primary[500], // Airbnb coral
      border: 'transparent',
      disabled: {
        text: palette.gray[400],
      },
      focus: {
        ring: palette.primary[100],
      },
    },
    accent: {
      bg: palette.info[500], // Airbnb teal
      hover: palette.info[600],
      active: palette.info[700],
      text: '#FFFFFF',
      border: 'transparent',
      disabled: {
        bg: palette.gray[200],
        text: palette.gray[400],
      },
      focus: {
        ring: palette.info[300],
      },
    },
    danger: {
      bg: palette.error[500], // Bright red
      hover: palette.error[600],
      active: palette.error[700],
      text: '#FFFFFF',
      border: 'transparent',
      disabled: {
        bg: palette.gray[200],
        text: palette.gray[400],
      },
      focus: {
        ring: palette.error[200],
      },
    },
    ghost: {
      bg: 'transparent',
      hover: 'rgba(0, 0, 0, 0.03)',
      active: 'rgba(0, 0, 0, 0.06)',
      text: '#484848', // Airbnb-inspired dark gray
      border: 'transparent',
      disabled: {
        text: palette.gray[400],
      },
      focus: {
        ring: palette.gray[200],
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