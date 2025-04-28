/**
 * KnowledgePlane AI Border System
 * 
 * Defines border radii, widths, and styles used throughout the application.
 */

const borders = {
  // Border radius
  radii: {
    'none': '0',
    'sm': '0.125rem',    // 2px
    'md': '0.25rem',     // 4px
    'lg': '0.5rem',      // 8px
    'xl': '0.75rem',     // 12px
    '2xl': '1rem',       // 16px
    'full': '9999px',    // Circle/pill
    
    // Semantic radii
    'button': '0.25rem', // 4px, same as md
    'card': '0.5rem',    // 8px, same as lg
    'input': '0.25rem',  // 4px, same as md
    'badge': '0.25rem',  // 4px, same as md
    'panel': '0.75rem',  // 12px, same as xl
  },
  
  // Border widths
  borderWidths: {
    'none': '0',
    'thin': '1px',
    'medium': '2px',
    'thick': '3px',
    'heavy': '4px',
    
    // Semantic widths
    'default': '1px',    // Default border width
    'focus': '2px',      // Focus state border width
    'active': '2px',     // Active state border width
    'selected': '3px',   // Selected state border width (e.g., for tabs)
  },
  
  // Border styles
  borderStyles: {
    'solid': 'solid',
    'dashed': 'dashed',
    'dotted': 'dotted',
  }
}

export default borders; 