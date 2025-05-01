/**
 * KnowledgePlane AI Theme Foundations
 * 
 * This file aggregates all the foundation design tokens from individual files
 * to create a complete foundation object for the theme.
 */

import colors from './colors';
import typography from './typography';
import space from './spacing';
import borders from './borders';
import shadows from './shadows';
import breakpointsPackage from './breakpoints';

const { breakpoints, containers } = breakpointsPackage;

const foundations = {
  colors,
  ...typography,
  space,
  sizes: {
    ...space,
    containers,
  },
  ...borders,
  shadows,
  breakpoints,
  
  // Z-index scale
  zIndices: {
    base: 0,       // Default
    above: 1,      // Elements slightly above others
    hover: 100,    // Hover states, tooltips
    modal: 1000,   // Modal dialogs, popovers
    toast: 2000,   // Notifications, toasts
    top: 9999,     // Critical notifications, full overlays
  },
  
  // Transitions
  transition: {
    duration: {
      fast: '100ms',    // Micro-interactions, immediate feedback
      normal: '200ms',  // Standard transitions
      slow: '300ms',    // Emphasis, important state changes
    },
    easing: {
      standard: 'cubic-bezier(0.4, 0, 0.2, 1)',  // Most transitions
      decelerate: 'cubic-bezier(0, 0, 0.2, 1)',  // Elements entering the screen
      accelerate: 'cubic-bezier(0.4, 0, 1, 1)',  // Elements leaving the screen
    },
  },
}

export default foundations; 