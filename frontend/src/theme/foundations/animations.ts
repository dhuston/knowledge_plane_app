// KnowledgePlane AI Animation System
// Smooth, professional transitions and effects

const animations = {
  // Transition presets
  transition: {
    property: {
      common: 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
      colors: 'background-color, border-color, color, fill, stroke',
      dimensions: 'width, height',
      position: 'left, right, top, bottom',
      background: 'background-color, background-image, background-position',
    },
    easing: {
      'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
      'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
      'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      // Custom easings for more natural movement
      'spring-in': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
      'spring-out': 'cubic-bezier(0.165, 0.84, 0.44, 1)',
      'spring-in-out': 'cubic-bezier(0.87, 0, 0.13, 1)',
    },
    duration: {
      'ultra-fast': '50ms',
      faster: '100ms',
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '400ms',
      'ultra-slow': '500ms',
    },
  },
  
  // Keyframe animations
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    fadeOut: {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },
    scaleIn: {
      '0%': { transform: 'scale(0.95)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' },
    },
    scaleOut: {
      '0%': { transform: 'scale(1)', opacity: '1' },
      '100%': { transform: 'scale(0.95)', opacity: '0' },
    },
    slideInFromTop: {
      '0%': { transform: 'translateY(-1rem)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideOutToTop: {
      '0%': { transform: 'translateY(0)', opacity: '1' },
      '100%': { transform: 'translateY(-1rem)', opacity: '0' },
    },
    slideInFromBottom: {
      '0%': { transform: 'translateY(1rem)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideOutToBottom: {
      '0%': { transform: 'translateY(0)', opacity: '1' },
      '100%': { transform: 'translateY(1rem)', opacity: '0' },
    },
    slideInFromLeft: {
      '0%': { transform: 'translateX(-1rem)', opacity: '0' },
      '100%': { transform: 'translateX(0)', opacity: '1' },
    },
    slideOutToLeft: {
      '0%': { transform: 'translateX(0)', opacity: '1' },
      '100%': { transform: 'translateX(-1rem)', opacity: '0' },
    },
    slideInFromRight: {
      '0%': { transform: 'translateX(1rem)', opacity: '0' },
      '100%': { transform: 'translateX(0)', opacity: '1' },
    },
    slideOutToRight: {
      '0%': { transform: 'translateX(0)', opacity: '1' },
      '100%': { transform: 'translateX(1rem)', opacity: '0' },
    },
    spin: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    ping: {
      '0%': { transform: 'scale(1)', opacity: '1' },
      '75%, 100%': { transform: 'scale(2)', opacity: '0' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '.5' },
    },
    bounce: {
      '0%, 100%': {
        transform: 'translateY(-25%)',
        animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
      },
      '50%': {
        transform: 'translateY(0)',
        animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
  },

  // Animation variants for components
  variants: {
    fadeIn: {
      initial: { opacity: 0 },
      enter: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideIn: {
      initial: { transform: 'translateY(1rem)', opacity: 0 },
      enter: { transform: 'translateY(0)', opacity: 1 },
      exit: { transform: 'translateY(1rem)', opacity: 0 },
    },
    scaleIn: {
      initial: { transform: 'scale(0.95)', opacity: 0 },
      enter: { transform: 'scale(1)', opacity: 1 },
      exit: { transform: 'scale(0.95)', opacity: 0 },
    },
    fadeSlideIn: {
      initial: { transform: 'translateY(1rem)', opacity: 0 },
      enter: { transform: 'translateY(0)', opacity: 1 },
      exit: { transform: 'translateY(-1rem)', opacity: 0 },
    },
  },
};

export default animations; 