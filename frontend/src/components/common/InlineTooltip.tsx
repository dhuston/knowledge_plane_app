/**
 * InlineTooltip.tsx
 * A tooltip component that avoids portal usage entirely
 */
import React, { ReactElement, useState, useRef, useEffect } from 'react';
import {
  Box,
  Text,
  useColorModeValue,
  useTheme,
} from '@chakra-ui/react';

interface InlineTooltipProps {
  label: string;
  children: ReactElement;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  isDisabled?: boolean;
  hasArrow?: boolean;
  delay?: number;
}

/**
 * A completely custom tooltip implementation without portal or animation issues
 */
export const InlineTooltip: React.FC<InlineTooltipProps> = ({
  label,
  children,
  placement = 'right',
  isDisabled = false,
  hasArrow = true,
  delay = 300
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipReady, setTooltipReady] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bg = useColorModeValue('gray.700', 'gray.900');
  const color = useColorModeValue('white', 'white');
  const theme = useTheme();
  
  // Clean up the timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // If disabled, just return children
  if (isDisabled) {
    return children;
  }

  // Position the tooltip based on placement
  const getTooltipStyles = () => {
    // Base styles
    const base = {
      position: 'absolute',
      zIndex: 9999,
      width: 'max-content',
      maxWidth: '200px',
      padding: '0.5rem',
      borderRadius: theme.radii.md,
      boxShadow: 'md',
      fontSize: 'sm',
      pointerEvents: 'none',
      bg,
      color,
      opacity: tooltipReady ? 1 : 0,
      transition: 'opacity 0.2s ease-in-out',
    };

    // Position based on placement
    switch (placement) {
      case 'top':
        return {
          ...base,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
        };
      case 'bottom':
        return {
          ...base,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '8px',
        };
      case 'left':
        return {
          ...base,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: '8px',
        };
      case 'right':
      default:
        return {
          ...base,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: '8px',
        };
    }
  };

  // Get Arrow styles based on placement
  const getArrowStyles = () => {
    const base = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    };

    switch (placement) {
      case 'top':
        return {
          ...base,
          bottom: '-4px',
          left: '50%',
          marginLeft: '-4px',
          borderWidth: '4px 4px 0 4px',
          borderColor: `${bg} transparent transparent transparent`,
        };
      case 'bottom':
        return {
          ...base,
          top: '-4px',
          left: '50%',
          marginLeft: '-4px',
          borderWidth: '0 4px 4px 4px',
          borderColor: `transparent transparent ${bg} transparent`,
        };
      case 'left':
        return {
          ...base,
          right: '-4px',
          top: '50%',
          marginTop: '-4px',
          borderWidth: '4px 0 4px 4px',
          borderColor: `transparent transparent transparent ${bg}`,
        };
      case 'right':
      default:
        return {
          ...base,
          left: '-4px',
          top: '50%',
          marginTop: '-4px',
          borderWidth: '4px 4px 4px 0',
          borderColor: `transparent ${bg} transparent transparent`,
        };
    }
  };
  
  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set a timeout to show tooltip
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Once the tooltip is positioned, make it visible with a fade-in effect
      setTimeout(() => setTooltipReady(true), 10);
    }, delay);
  };
  
  const handleMouseLeave = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Hide immediately
    setTooltipReady(false);
    setTimeout(() => setIsVisible(false), 200);
  };
  
  return (
    <Box
      position="relative"
      display="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <Box sx={getTooltipStyles()}>
          {hasArrow && <Box sx={getArrowStyles()} />}
          <Text>{label}</Text>
        </Box>
      )}
    </Box>
  );
};