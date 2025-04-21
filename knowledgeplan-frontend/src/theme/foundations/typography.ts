// KnowledgePlane AI Typography System
// Consistent typography scales and text styles

const typography = {
  // Font families
  fonts: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    mono: '"Roboto Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  
  // Font sizes
  fontSizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    md: '1rem',        // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem',  // 60px
    '7xl': '4.5rem',   // 72px
    '8xl': '6rem',     // 96px
    '9xl': '8rem',     // 128px
  },
  
  // Font weights
  fontWeights: {
    hairline: 100,
    thin: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  
  // Line heights
  lineHeights: {
    normal: 'normal',
    none: 1,
    shorter: 1.25,
    short: 1.375,
    base: 1.5,
    tall: 1.625,
    taller: 2,
  },
  
  // Letter spacings
  letterSpacings: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  // Text styles for consistent typography
  textStyles: {
    // Display styles
    display1: {
      fontSize: ['4xl', null, '5xl'],
      fontWeight: 'bold',
      lineHeight: 'shorter',
      letterSpacing: 'tight',
    },
    display2: {
      fontSize: ['3xl', null, '4xl'],
      fontWeight: 'bold',
      lineHeight: 'shorter',
      letterSpacing: 'tight',
    },
    
    // Heading styles
    h1: {
      fontSize: ['3xl', null, '4xl'],
      fontWeight: 'bold',
      lineHeight: 'shorter',
      letterSpacing: 'tight',
    },
    h2: {
      fontSize: ['2xl', null, '3xl'],
      fontWeight: 'semibold',
      lineHeight: 'shorter',
      letterSpacing: 'tight',
    },
    h3: {
      fontSize: ['xl', null, '2xl'],
      fontWeight: 'semibold',
      lineHeight: 'base',
    },
    h4: {
      fontSize: ['lg', null, 'xl'],
      fontWeight: 'semibold',
      lineHeight: 'base',
    },
    h5: {
      fontSize: 'md',
      fontWeight: 'semibold',
      lineHeight: 'base',
    },
    h6: {
      fontSize: 'sm',
      fontWeight: 'semibold',
      lineHeight: 'base',
    },
    
    // Body styles
    body1: {
      fontSize: 'md',
      fontWeight: 'normal',
      lineHeight: 'base',
    },
    body2: {
      fontSize: 'sm',
      fontWeight: 'normal',
      lineHeight: 'base',
    },
    
    // Caption and small text
    caption: {
      fontSize: 'xs',
      fontWeight: 'normal',
      lineHeight: 'base',
    },
  },
};

export default typography; 