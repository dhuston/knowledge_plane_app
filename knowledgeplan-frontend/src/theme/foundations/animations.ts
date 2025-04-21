// KnowledgePlane AI Animation System
// Consistent animation styles for UI elements

const animations = {
  // Transition properties
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
  
  // Common keyframe animations
  keyframes: {
    spin: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    ping: {
      '0%': { transform: 'scale(1)', opacity: 1 },
      '75%, 100%': { transform: 'scale(2)', opacity: 0 },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    bounce: {
      '0%, 100%': {
        transform: 'translateY(0)',
        animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
      },
      '50%': {
        transform: 'translateY(-25%)',
        animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
    fadeIn: {
      '0%': { opacity: 0 },
      '100%': { opacity: 1 },
    },
    fadeOut: {
      '0%': { opacity: 1 },
      '100%': { opacity: 0 },
    },
    slideInRight: {
      '0%': { transform: 'translateX(100%)' },
      '100%': { transform: 'translateX(0)' },
    },
    slideOutRight: {
      '0%': { transform: 'translateX(0)' },
      '100%': { transform: 'translateX(100%)' },
    },
    slideInBottom: {
      '0%': { transform: 'translateY(100%)' },
      '100%': { transform: 'translateY(0)' },
    },
    slideOutBottom: {
      '0%': { transform: 'translateY(0)' },
      '100%': { transform: 'translateY(100%)' },
    },
  },
};

export default animations; 