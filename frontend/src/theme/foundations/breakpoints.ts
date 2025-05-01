/**
 * KnowledgePlane AI Breakpoint System
 * 
 * Defines the responsive breakpoints used for media queries throughout the application.
 */

const breakpoints = {
  sm: '640px',   // Small screens, mobile portrait
  md: '768px',   // Medium screens, mobile landscape
  lg: '1024px',  // Large screens, tablets
  xl: '1280px',  // Extra large, small desktops
  '2xl': '1536px' // 2X large, large desktops
}

// Container sizes matching breakpoints for consistency
const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

export default { breakpoints, containers }; 