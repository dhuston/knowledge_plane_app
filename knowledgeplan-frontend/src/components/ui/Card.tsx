import React from 'react';
import {
  Box,
  BoxProps,
  useColorModeValue,
  StyleProps,
  useStyleConfig,
} from '@chakra-ui/react';

export interface CardProps extends BoxProps {
  /**
   * Card variant
   * @default 'elevated'
   */
  variant?: 'elevated' | 'outlined' | 'filled' | 'interactive' | 'feature' | 'success' | 'warning' | 'error' | 'info';
  
  /**
   * Card size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * If true, the card will have hover effects when variant is 'interactive'
   * @default true
   */
  isHoverable?: boolean;
  
  /**
   * If true, the card will be disabled
   * @default false
   */
  isDisabled?: boolean;
}

/**
 * Card component
 * 
 * A flexible container component that groups related content and actions.
 * Cards support multiple variants and sizes.
 */
export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  size = 'md',
  isHoverable = true,
  isDisabled = false,
  children,
  ...rest
}) => {
  // Get styles from theme
  const styles = useStyleConfig('Card', { variant, size }) as StyleProps;
  
  // Calculate dynamic styles based on props
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Colors for various variants
  const primaryColor = useColorModeValue('primary.500', 'primary.400');
  const successColor = useColorModeValue('success.500', 'success.400');
  const warningColor = useColorModeValue('warning.500', 'warning.400');
  const errorColor = useColorModeValue('error.500', 'error.400');
  const infoColor = useColorModeValue('info.500', 'info.400');
  
  // Interactive hover styles
  const hoverStyles = variant === 'interactive' && isHoverable && !isDisabled ? {
    transform: 'translateY(-2px)',
    boxShadow: 'lg',
    transition: 'all 0.2s',
  } : {};
  
  // Feature variant accent border
  const featureBorderStyles = variant === 'feature' ? {
    borderTop: '4px solid',
    borderTopColor: primaryColor,
  } : {};
  
  // Semantic variants styling
  const semanticStyles = (() => {
    switch (variant) {
      case 'success':
        return {
          borderLeft: '4px solid',
          borderLeftColor: successColor,
        };
      case 'warning':
        return {
          borderLeft: '4px solid',
          borderLeftColor: warningColor,
        };
      case 'error':
        return {
          borderLeft: '4px solid',
          borderLeftColor: errorColor,
        };
      case 'info':
        return {
          borderLeft: '4px solid',
          borderLeftColor: infoColor,
        };
      default:
        return {};
    }
  })();
  
  return (
    <Box
      bg={bg}
      borderWidth={variant === 'outlined' || variant === 'feature' ? '1px' : '0'}
      borderColor={borderColor}
      borderRadius="md"
      overflow="hidden"
      transition="all 0.2s"
      opacity={isDisabled ? 0.6 : 1}
      cursor={isDisabled ? 'not-allowed' : 'default'}
      _hover={hoverStyles}
      {...semanticStyles}
      {...featureBorderStyles}
      {...styles}
      {...rest}
    >
      {children}
    </Box>
  );
};

// Card Header component
export const CardHeader: React.FC<BoxProps> = ({ children, ...rest }) => {
  return (
    <Box
      pt={4}
      px={4}
      pb={3}
      borderBottomWidth="1px"
      borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
      fontWeight="semibold"
      {...rest}
    >
      {children}
    </Box>
  );
};

// Card Body component
export const CardBody: React.FC<BoxProps> = ({ children, ...rest }) => {
  return (
    <Box p={4} {...rest}>
      {children}
    </Box>
  );
};

// Card Footer component
export const CardFooter: React.FC<BoxProps> = ({ children, ...rest }) => {
  return (
    <Box
      p={3}
      borderTopWidth="1px"
      borderTopColor={useColorModeValue('gray.200', 'gray.700')}
      {...rest}
    >
      {children}
    </Box>
  );
};

export default Card; 