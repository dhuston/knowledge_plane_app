import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Box, useColorModeValue, usePrefersReducedMotion } from '@chakra-ui/react';
import { MapNodeTypeEnum } from '../../types/map';
import animations, { entityTypeAnimations } from '../panels/animations';

// Define animation variants
const transitionVariants: Record<string, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } }
  },
  fadeSlideIn: {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: 10, transition: { duration: 0.2, ease: 'easeIn' } }
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } }
  },
  slideInRight: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2, ease: 'easeIn' } }
  },
  slideInLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2, ease: 'easeIn' } }
  },
  slideInUp: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: 'easeIn' } }
  },
  slideInDown: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.2, ease: 'easeIn' } }
  },
  staggerItems: {
    hidden: { opacity: 0, y: 10 },
    visible: (custom: number) => ({
      opacity: 1, 
      y: 0, 
      transition: {
        delay: custom * 0.1,
        duration: 0.3,
        ease: 'easeOut'
      }
    }),
    exit: { opacity: 0, y: 10, transition: { duration: 0.2, ease: 'easeIn' } }
  },
  panelEntry: {
    hidden: { opacity: 0, x: 30 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { 
        duration: 0.5, 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      }
    },
    exit: { 
      opacity: 0, 
      x: 30, 
      transition: { 
        duration: 0.3, 
        ease: "easeIn" 
      } 
    }
  },
  contentFade: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.3, 
        ease: "easeOut", 
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      transition: { 
        duration: 0.2, 
        ease: "easeIn" 
      } 
    }
  },
  entityCard: {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1, 
      transition: { 
        duration: 0.4, 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      }
    },
    exit: { 
      opacity: 0, 
      y: 10, 
      scale: 0.95, 
      transition: { 
        duration: 0.2, 
        ease: "easeIn" 
      } 
    }
  }
};

// Entity-specific animation variants
const entityVariants: Record<MapNodeTypeEnum, Variants> = {
  [MapNodeTypeEnum.USER]: {
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { 
        duration: 0.35, 
        ease: "easeOut" 
      } 
    },
    exit: { 
      opacity: 0, 
      x: -20, 
      transition: { 
        duration: 0.25, 
        ease: "easeIn" 
      } 
    }
  },
  [MapNodeTypeEnum.TEAM]: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.4, 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      transition: { 
        duration: 0.25, 
        ease: "easeIn" 
      } 
    }
  },
  [MapNodeTypeEnum.PROJECT]: {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.45, 
        ease: "easeOut" 
      } 
    },
    exit: { 
      opacity: 0, 
      y: 20, 
      transition: { 
        duration: 0.25, 
        ease: "easeIn" 
      } 
    }
  },
  [MapNodeTypeEnum.GOAL]: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.5, 
        type: "spring", 
        stiffness: 100, 
        damping: 12 
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.95, 
      transition: { 
        duration: 0.3, 
        ease: "easeIn" 
      } 
    }
  },
  [MapNodeTypeEnum.DEPARTMENT]: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.5,
        ease: "easeOut" 
      } 
    },
    exit: { 
      opacity: 0, 
      transition: { 
        duration: 0.3, 
        ease: "easeIn" 
      } 
    }
  },
  [MapNodeTypeEnum.KNOWLEDGE_ASSET]: {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { 
        duration: 0.35, 
        ease: "easeOut" 
      } 
    },
    exit: { 
      opacity: 0, 
      x: 20, 
      transition: { 
        duration: 0.25, 
        ease: "easeIn" 
      } 
    }
  },
  [MapNodeTypeEnum.TEAM_CLUSTER]: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.4, 
        type: "spring", 
        stiffness: 100, 
        damping: 15 
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      transition: { 
        duration: 0.25, 
        ease: "easeIn" 
      } 
    }
  },
  [MapNodeTypeEnum.UNKNOWN]: {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { 
        duration: 0.3, 
        ease: "easeOut" 
      } 
    },
    exit: { 
      opacity: 0, 
      transition: { 
        duration: 0.2, 
        ease: "easeIn" 
      } 
    }
  }
};

export interface EnhancedAnimatedTransitionProps {
  children: React.ReactNode;
  in: boolean;
  unmountOnExit?: boolean;
  variant?: string;
  entityType?: MapNodeTypeEnum;
  customIndex?: number;
  transitionKey?: string;
  duration?: number;
  delay?: number;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Enhanced animated transition component with entity-specific animations
 * This component uses Framer Motion for high-performance animations
 */
export const EnhancedAnimatedTransition: React.FC<EnhancedAnimatedTransitionProps> = ({
  children,
  in: isVisible,
  unmountOnExit = true,
  variant = 'fadeIn',
  entityType,
  customIndex = 0,
  transitionKey,
  duration,
  delay = 0,
  style,
  className
}) => {
  const [isShown, setIsShown] = useState<boolean>(isVisible);
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // Update internal state when visible prop changes
  useEffect(() => {
    if (isVisible) {
      setIsShown(true);
    } else if (unmountOnExit) {
      const timer = setTimeout(() => setIsShown(false), (duration || 0.3) * 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, unmountOnExit, duration]);
  
  // If reduced motion is preferred, simplify animations
  if (prefersReducedMotion) {
    return (
      <Box
        opacity={isVisible ? 1 : 0}
        transition={`opacity ${duration || 0.3}s ease`}
        style={{ ...style, display: isShown ? 'block' : 'none' }}
        className={className}
      >
        {children}
      </Box>
    );
  }
  
  // Select animation variant based on props
  let selectedVariant = transitionVariants[variant] || transitionVariants.fadeIn;
  
  // If entityType is provided, use entity-specific animations
  if (entityType) {
    selectedVariant = entityVariants[entityType] || selectedVariant;
  }
  
  return (
    <AnimatePresence mode="wait">
      {isShown && (
        <motion.div
          key={transitionKey || `transition-${variant}-${customIndex}`}
          initial="hidden"
          animate={isVisible ? "visible" : "exit"}
          exit="exit"
          variants={selectedVariant}
          custom={customIndex}
          style={style}
          className={className}
          transition={{
            duration: duration || undefined,
            delay: delay || undefined
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Animated container component with hover effects
 */
export const AnimatedContainer: React.FC<{
  children: React.ReactNode;
  entityType?: MapNodeTypeEnum;
  isActive?: boolean;
  hoverEffect?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}> = ({
  children,
  entityType,
  isActive = false,
  hoverEffect = true,
  style,
  className,
  onClick
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // Define hover animations
  const hoverAnimation = entityType && !prefersReducedMotion ? 
    entityTypeAnimations[entityType.toString()]?.hover : undefined;
    
  // Define active animations
  const activeAnimation = entityType && isActive && !prefersReducedMotion ? 
    entityTypeAnimations[entityType.toString()]?.active : undefined;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={hoverEffect && !prefersReducedMotion ? { 
        scale: 1.02, 
        transition: { duration: 0.2 } 
      } : undefined}
      onClick={onClick}
      style={{ 
        background: isActive ? activeBg : bgColor,
        borderRadius: '0.375rem',
        boxShadow: isActive ? '0 0 0 1px rgba(66, 153, 225, 0.5)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        animation: isActive ? activeAnimation : hoverEffect ? hoverAnimation : undefined,
        ...style
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default EnhancedAnimatedTransition;