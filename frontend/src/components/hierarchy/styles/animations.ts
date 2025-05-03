/**
 * animations.ts
 * Animation definitions for the hierarchy components
 */
import { keyframes } from '@emotion/react';

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

// Animation duration and easing presets
export const animationConfig = {
  durations: {
    fadeIn: '250ms',
    fadeOut: '200ms',
    slideIn: '250ms',
    pulse: '2s', // Slower for subtle effect
    rotate: '200ms',
  },
  easings: {
    default: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Material Design standard easing
    enter: 'cubic-bezier(0.0, 0.0, 0.2, 1)',   // Material Design deceleration curve
    leave: 'cubic-bezier(0.4, 0.0, 1, 1)',     // Material Design acceleration curve
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Custom bounce effect
    airbnb: 'cubic-bezier(0.2, 0.8, 0.2, 1)',    // Airbnb-style smooth motion
  }
};