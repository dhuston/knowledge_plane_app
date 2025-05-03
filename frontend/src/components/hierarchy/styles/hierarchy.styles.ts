/**
 * hierarchy.styles.ts
 * Styles and animations for the Organizational Hierarchy Navigator components
 */
import { Keyframes, keyframes } from '@emotion/react';

// Animation keyframes
export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-5px);
  }
`;

export const slideInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const pulseAnimation = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
`;

export const rotateChevron = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(90deg);
  }
`;

export const collapseChevron = keyframes`
  from {
    transform: rotate(90deg);
  }
  to {
    transform: rotate(0deg);
  }
`;

// Animation durations
export const animationDurations = {
  fadeIn: '250ms',
  fadeOut: '200ms',
  slideIn: '250ms',
  pulse: '2s', // Slower for subtle effect
  rotate: '200ms',
};

// Animation easings
export const animationEasings = {
  default: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Material Design standard easing
  enter: 'cubic-bezier(0.0, 0.0, 0.2, 1)',   // Material Design deceleration curve
  leave: 'cubic-bezier(0.4, 0.0, 1, 1)',     // Material Design acceleration curve
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Custom bounce effect
  airbnb: 'cubic-bezier(0.2, 0.8, 0.2, 1)',    // Airbnb-style smooth motion
};

// Hierarchy item style variants
export const itemVariants = {
  // Default state
  default: {
    width: '44px',
    height: '44px',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  // Active state
  active: {
    borderLeftWidth: '3px',
    borderLeftStyle: 'solid',
  },
  
  // Hover state
  hover: {
    transform: 'scale(1.05)',
  },
  
  // Animation variants for framer-motion
  motion: {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -5, transition: { duration: 0.2, ease: 'easeIn' } },
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
  },
};

// Popover style variants
export const popoverVariants = {
  // Default container
  container: {
    width: '240px',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  
  // Motion variants for framer-motion
  motion: {
    initial: { opacity: 0, scale: 0.95, x: -10 },
    animate: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } },
  },
};

// Navigator container style
export const navigatorStyle = {
  width: '60px',
  height: '100%',
  borderRightWidth: '1px',
  borderRightStyle: 'solid',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  borderRadius: '0px 4px 4px 0px',
  padding: '12px 8px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
};

// Z-index values for proper layering
export const zIndices = {
  navigator: 10,
  popover: 20,
  modal: 30,
};