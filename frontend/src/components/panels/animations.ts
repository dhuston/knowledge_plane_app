/**
 * animations.ts
 * Common animations for context panels and entity transitions
 */

import { keyframes } from '@emotion/react';

// Define standard animations for reusability
export const fadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

export const fadeOut = keyframes`
  0% { opacity: 1; }
  100% { opacity: 0; }
`;

export const slideInRight = keyframes`
  0% { transform: translateX(20px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
`;

export const slideOutRight = keyframes`
  0% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(20px); opacity: 0; }
`;

export const slideInLeft = keyframes`
  0% { transform: translateX(-20px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
`;

export const slideOutLeft = keyframes`
  0% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(-20px); opacity: 0; }
`;

export const slideInUp = keyframes`
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

export const slideOutDown = keyframes`
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(20px); opacity: 0; }
`;

export const scaleIn = keyframes`
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

export const scaleOut = keyframes`
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0; }
`;

export const rotate360 = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

export const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Advanced animations for specific effects
export const breathe = keyframes`
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.02); opacity: 1; }
  100% { transform: scale(1); opacity: 0.9; }
`;

export const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const ripple = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(66, 153, 225, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(66, 153, 225, 0); }
  100% { box-shadow: 0 0 0 0 rgba(66, 153, 225, 0); }
`;

export const slideDownFade = keyframes`
  0% { 
    transform: translateY(-10px); 
    opacity: 0; 
  }
  100% { 
    transform: translateY(0); 
    opacity: 1; 
  }
`;

export const slideUpFade = keyframes`
  0% { 
    transform: translateY(10px); 
    opacity: 0; 
  }
  100% { 
    transform: translateY(0); 
    opacity: 1; 
  }
`;

// Entity type specific animations
export interface EntityAnimationConfig {
  entrance: string;
  hover: string;
  active: string;
  exit: string;
}

export const entityTypeAnimations: Record<string, EntityAnimationConfig> = {
  user: {
    entrance: `${slideInRight} 0.3s ease forwards`,
    hover: `${pulse} 1s infinite ease-in-out`,
    active: `${breathe} 2s infinite ease-in-out`,
    exit: `${slideOutLeft} 0.2s ease forwards`
  },
  team: {
    entrance: `${scaleIn} 0.3s ease forwards`,
    hover: `${pulse} 1.2s infinite ease-in-out`,
    active: `${breathe} 2.5s infinite ease-in-out`,
    exit: `${scaleOut} 0.2s ease forwards`
  },
  project: {
    entrance: `${slideInUp} 0.3s ease forwards`,
    hover: `${pulse} 1.4s infinite ease-in-out`,
    active: `${breathe} 2.2s infinite ease-in-out`,
    exit: `${slideOutDown} 0.2s ease forwards`
  },
  goal: {
    entrance: `${scaleIn} 0.4s ease forwards`,
    hover: `${pulse} 1.3s infinite ease-in-out`,
    active: `${breathe} 2.3s infinite ease-in-out`,
    exit: `${fadeOut} 0.3s ease forwards`
  },
  knowledge_asset: {
    entrance: `${slideInLeft} 0.3s ease forwards`,
    hover: `${pulse} 1.5s infinite ease-in-out`,
    active: `${breathe} 2.1s infinite ease-in-out`,
    exit: `${slideOutRight} 0.2s ease forwards`
  },
  department: {
    entrance: `${fadeIn} 0.5s ease forwards`,
    hover: `${pulse} 1.6s infinite ease-in-out`,
    active: `${breathe} 2.4s infinite ease-in-out`,
    exit: `${fadeOut} 0.3s ease forwards`
  }
};

// Animation utility for staggered children
export const staggeredEntrance = (delayBase: number = 0.05) => {
  return (index: number) => ({
    animation: `${slideUpFade} 0.3s ease forwards`,
    animationDelay: `${index * delayBase}s`,
    opacity: 0
  });
};

// Animation utility for transition between tabs
export const tabTransition = (isActive: boolean, delay: number = 0) => {
  return {
    animation: isActive 
      ? `${fadeIn} 0.3s ease forwards ${delay}s` 
      : `${fadeOut} 0.2s ease forwards`,
    opacity: 0
  };
};

// Animation utility for content swap
export const contentSwap = (isVisible: boolean, direction: 'left' | 'right' | 'up' | 'down' = 'right') => {
  let enterAnimation, exitAnimation;
  
  switch (direction) {
    case 'left':
      enterAnimation = slideInLeft;
      exitAnimation = slideOutLeft;
      break;
    case 'right':
      enterAnimation = slideInRight;
      exitAnimation = slideOutRight;
      break;
    case 'up':
      enterAnimation = slideInUp;
      exitAnimation = slideOutDown;
      break;
    case 'down':
      enterAnimation = slideDownFade;
      exitAnimation = slideOutDown;
      break;
  }
  
  return {
    animation: isVisible
      ? `${enterAnimation} 0.3s ease forwards`
      : `${exitAnimation} 0.2s ease forwards`
  };
};

// Animation settings for panel transitions
export const panelTransitions = {
  open: `${slideInRight} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`,
  close: `${slideOutRight} 0.3s cubic-bezier(0.36, 0, 0.66, -0.56)`,
  expand: `${scaleIn} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)`,
  collapse: `${scaleOut} 0.2s cubic-bezier(0.36, 0, 0.66, -0.56)`,
  fadeIn: `${fadeIn} 0.3s ease-in-out`,
  fadeOut: `${fadeOut} 0.2s ease-in-out`
};

// Button animations
export const buttonEffects = {
  hover: {
    transform: 'translateY(-2px)',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease'
  },
  click: {
    transform: 'translateY(1px)',
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.1s ease'
  },
  focus: {
    boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.5)',
    transition: 'box-shadow 0.2s ease'
  }
};

// Loading state animations
export const loadingEffects = {
  spinner: `${rotate360} 1s linear infinite`,
  shimmer: `${shimmer} 1.5s infinite linear`,
  pulse: `${pulse} 1.5s infinite ease-in-out`,
  ripple: `${ripple} 1.5s infinite`
};

export default {
  fadeIn,
  fadeOut,
  slideInRight,
  slideOutRight,
  slideInLeft,
  slideOutLeft,
  slideInUp,
  slideOutDown,
  scaleIn,
  scaleOut,
  rotate360,
  pulse,
  breathe,
  shimmer,
  ripple,
  slideDownFade,
  slideUpFade,
  entityTypeAnimations,
  staggeredEntrance,
  tabTransition,
  contentSwap,
  panelTransitions,
  buttonEffects,
  loadingEffects
};