// KnowledgePlane AI Border Radius System
// Modern, consistent radius values for UI components

const radii = {
  // Base radii
  none: '0',
  '2xs': '0.125rem',  // 2px
  xs: '0.25rem',      // 4px
  sm: '0.375rem',     // 6px
  md: '0.5rem',       // 8px
  lg: '0.75rem',      // 12px
  xl: '1rem',         // 16px
  '2xl': '1.5rem',    // 24px
  '3xl': '2rem',      // 32px
  full: '9999px',

  // Component-specific radii
  button: '0.375rem',     // 6px - matches sm
  input: '0.375rem',      // 6px - matches sm
  card: '0.5rem',         // 8px - matches md
  modal: '0.75rem',       // 12px - matches lg
  badge: '0.25rem',       // 4px - matches xs
  tooltip: '0.25rem',     // 4px - matches xs
  avatar: '0.5rem',       // 8px - matches md
  'avatar-lg': '0.75rem', // 12px - matches lg
  tag: '0.25rem',         // 4px - matches xs
  toast: '0.5rem',        // 8px - matches md
  
  // Special cases
  'top-left': {
    none: '0',
    '2xs': '0.125rem',
    xs: '0.25rem',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
  },
  'top-right': {
    none: '0',
    '2xs': '0.125rem',
    xs: '0.25rem',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
  },
  'bottom-left': {
    none: '0',
    '2xs': '0.125rem',
    xs: '0.25rem',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
  },
  'bottom-right': {
    none: '0',
    '2xs': '0.125rem',
    xs: '0.25rem',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
  },
};

export default radii; 