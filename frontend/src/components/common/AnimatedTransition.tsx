/**
 * AnimatedTransition.tsx
 * A reusable component for animated transitions between different views
 */
import React, { useEffect, useState, createContext, useContext } from 'react';
import { motion, AnimatePresence, MotionProps, Variant } from 'framer-motion';
import { usePrefersReducedMotion } from '@chakra-ui/react';

// Predefined animation variants
export const transitionVariants = {
  // Fade in/out with slight scale
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  },
  
  // Slide from bottom
  slideUp: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 10, transition: { duration: 0.2 } }
  },

  // Slide from top
  slideDown: {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  },
  
  // Slide from right
  slideRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
  },
  
  // Slide from left
  slideLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  },
  
  // Scale with fade
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  },
  
  // For list items that stagger their appearance
  stagger: {
    initial: { opacity: 0, y: 5 },
    animate: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.05,
        duration: 0.3
      }
    }),
    exit: { opacity: 0, transition: { duration: 0.2 } }
  },

  // Spring animation with bounce
  spring: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        type: "spring", 
        stiffness: 260, 
        damping: 20
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      transition: { 
        duration: 0.2 
      } 
    }
  },

  // Minimal animation for subtle elements
  subtle: {
    initial: { opacity: 0.8 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0.8, transition: { duration: 0.1 } }
  }
};

// Type for variant names
export type AnimationVariantName = keyof typeof transitionVariants;

// Custom transition options
export interface TransitionOptions {
  duration?: number;
  delay?: number;
  ease?: string;
}

// Context for sharing animation preferences
interface AnimationContextValue {
  animated: boolean;
  setAnimated: (value: boolean) => void;
  defaultDuration: number;
}

const AnimationContext = createContext<AnimationContextValue>({
  animated: true,
  setAnimated: () => {},
  defaultDuration: 0.3
});

// Provider component for animation preferences
export const AnimationProvider: React.FC<{
  children: React.ReactNode;
  defaultAnimated?: boolean;
  defaultDuration?: number;
}> = ({ 
  children, 
  defaultAnimated = true,
  defaultDuration = 0.3
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [animated, setAnimated] = useState(defaultAnimated && !prefersReducedMotion);

  // Update animation state if user preferences change
  useEffect(() => {
    setAnimated(defaultAnimated && !prefersReducedMotion);
  }, [prefersReducedMotion, defaultAnimated]);

  return (
    <AnimationContext.Provider value={{ animated, setAnimated, defaultDuration }}>
      {children}
    </AnimationContext.Provider>
  );
};

// Hook to access animation preferences
export const useAnimation = () => useContext(AnimationContext);

// Props for the AnimatedTransition component
export interface AnimatedTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the component is visible */
  in: boolean;
  /** Animation variant to use */
  variant?: AnimationVariantName;
  /** Custom animation variants */
  customVariants?: { [key: string]: Variant };
  /** Value for custom staggered animations */
  customIndex?: number;
  /** Custom transition options */
  transition?: TransitionOptions;
  /** Layout animation (for automatic positioning) */
  layout?: boolean | string;
  /** Whether to unmount children when not visible */
  unmountOnExit?: boolean;
  /** Additional props for the motion component */
  motionProps?: MotionProps;
  /** Key for transition tracking */
  transitionKey?: string | number;
  /** Whether to force animation even when reduced motion is preferred */
  forceAnimation?: boolean;
  /** Children to render */
  children: React.ReactNode;
}

/**
 * AnimatedTransition component for wrapping elements with consistent animations
 */
export const AnimatedTransition: React.FC<AnimatedTransitionProps> = ({
  in: isVisible,
  variant = 'fade',
  customVariants,
  customIndex = 0,
  transition,
  layout = false,
  unmountOnExit = false,
  motionProps = {},
  transitionKey,
  forceAnimation = false,
  children,
  ...rest
}) => {
  const { animated, defaultDuration } = useAnimation();
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // Determine if animations should be shown
  const shouldAnimate = forceAnimation || (animated && !prefersReducedMotion);
  
  // Get the variants to use
  const variants = customVariants || transitionVariants[variant];
  
  // Apply custom transition options if provided
  const finalTransition = transition 
    ? {
        duration: transition.duration || defaultDuration,
        delay: transition.delay || 0,
        ease: transition.ease || 'easeOut'
      }
    : undefined;

  return (
    <AnimatePresence mode="wait">
      {(isVisible || !unmountOnExit) && (
        <motion.div
          key={transitionKey}
          initial={shouldAnimate ? "initial" : false}
          animate={isVisible ? "animate" : "exit"}
          exit="exit"
          variants={variants}
          custom={customIndex}
          layout={layout}
          transition={finalTransition}
          style={{ display: isVisible ? 'block' : 'none' }}
          {...motionProps}
          {...rest}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnimatedTransition;