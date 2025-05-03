/**
 * itemStyles.ts
 * Style variants for hierarchy item components
 */

// Hierarchy item style variants
export const itemStyles = {
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

// Connection indicator styles
export const connectionIndicatorStyles = {
  size: '8px',
  borderRadius: 'full',
  position: 'absolute',
  bottom: '3px',
  right: '3px',
  borderWidth: '1px',
  
  // Strength variants
  strong: {
    backgroundColor: 'green.500',
  },
  medium: {
    backgroundColor: 'yellow.500',
  },
  weak: {
    backgroundColor: 'gray.400',
  }
};

// Avatar and badge styles
export const avatarStyles = {
  container: {
    position: 'relative',
    cursor: 'pointer',
    borderRadius: '8px',
    padding: 1,
    width: '44px',
    height: '44px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.2s',
  },
  
  avatar: {
    size: 'sm',
    borderWidth: '2px',
    borderStyle: 'solid',
  },
  
  badge: {
    position: 'absolute',
    bottom: '-1px',
    right: '-1px',
    borderRadius: 'full',
    boxSize: '8px',
    borderWidth: '1px',
  }
};