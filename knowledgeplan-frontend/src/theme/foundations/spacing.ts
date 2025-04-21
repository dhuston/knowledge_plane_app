// KnowledgePlane AI Spacing System
// Consistent spacing scale for margins, padding, and layout

const spacing = {
  // Base spacing units
  space: {
    px: '1px',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem',      // 384px
  },
  
  // Component density settings
  density: {
    compact: {
      buttonPadding: '0.5rem 1rem',
      inputPadding: '0.5rem',
      cardPadding: '1rem',
      modalPadding: '1rem',
    },
    comfortable: {
      buttonPadding: '0.75rem 1.5rem',
      inputPadding: '0.75rem',
      cardPadding: '1.5rem',
      modalPadding: '1.5rem',
    },
    spacious: {
      buttonPadding: '1rem 2rem',
      inputPadding: '1rem',
      cardPadding: '2rem',
      modalPadding: '2rem',
    },
  },
  
  // Layout sizing presets
  sizes: {
    // Container max widths
    container: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    
    // Modal sizes
    modal: {
      xs: '320px',
      sm: '384px',
      md: '448px',
      lg: '512px',
      xl: '576px',
      '2xl': '672px',
      '3xl': '768px',
      '4xl': '896px',
      '5xl': '1024px',
      '6xl': '1152px',
      full: '100%',
    },
    
    // Sidebar widths
    sidebar: {
      sm: '256px',
      md: '320px',
      lg: '384px',
    },
    
    // Common icon sizes
    icon: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.25rem',
      xl: '1.5rem',
      '2xl': '2rem',
      '3xl': '3rem',
    },
  },
};

export default spacing; 