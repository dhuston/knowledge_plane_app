import React from 'react';
import {
  Box,
  Text,
  HStack,
  useColorModeValue,
  BoxProps,
  Icon,
} from '@chakra-ui/react';
import { FiCheck, FiX, FiAlertTriangle, FiInfo } from 'react-icons/fi';

// Define badge variants
type BadgeVariant = 
  // Status types
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info'
  // Entity types
  | 'user'
  | 'team'
  | 'project'
  | 'goal'
  | 'knowledge'
  // Visual variants
  | 'solid'
  | 'subtle'
  | 'outline';

type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends Omit<BoxProps, 'size'> {
  /**
   * The badge variant
   * @default 'subtle'
   */
  variant?: BadgeVariant;
  
  /**
   * The badge size
   * @default 'md'
   */
  size?: BadgeSize;
  
  /**
   * If true, adds a icon based on the variant
   * @default false
   */
  withIcon?: boolean;
  
  /**
   * The badge label
   */
  children: React.ReactNode;
}

/**
 * Badge component
 * 
 * Used to highlight status, entity types, or categories with
 * distinctive visual styling.
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'subtle',
  size = 'md',
  withIcon = false,
  children,
  ...rest
}) => {
  // Define all color mode values up front
  // Success colors
  const successBg = useColorModeValue('success.100', 'success.900');
  const successColor = useColorModeValue('success.700', 'success.200');
  const successBorder = useColorModeValue('success.500', 'success.600');
  
  // Error colors
  const errorBg = useColorModeValue('error.100', 'error.900');
  const errorColor = useColorModeValue('error.700', 'error.200');
  const errorBorder = useColorModeValue('error.500', 'error.600');
  
  // Warning colors
  const warningBg = useColorModeValue('warning.100', 'warning.900');
  const warningColor = useColorModeValue('warning.700', 'warning.200');
  const warningBorder = useColorModeValue('warning.500', 'warning.600');
  
  // Info colors
  const infoBg = useColorModeValue('info.100', 'info.900');
  const infoColor = useColorModeValue('info.700', 'info.200');
  const infoBorder = useColorModeValue('info.500', 'info.600');
  
  // User colors
  const userBg = useColorModeValue('primary.100', 'primary.900');
  const userColor = useColorModeValue('primary.700', 'primary.200');
  const userBorder = useColorModeValue('primary.500', 'primary.600');
  
  // Team colors
  const teamBg = useColorModeValue('purple.100', 'purple.900');
  const teamColor = useColorModeValue('purple.700', 'purple.200');
  const teamBorder = useColorModeValue('purple.500', 'purple.600');
  
  // Project colors
  const projectBg = useColorModeValue('orange.100', 'orange.900');
  const projectColor = useColorModeValue('orange.700', 'orange.200');
  const projectBorder = useColorModeValue('orange.500', 'orange.600');
  
  // Goal colors
  const goalBg = useColorModeValue('green.100', 'green.900');
  const goalColor = useColorModeValue('green.700', 'green.200');
  const goalBorder = useColorModeValue('green.500', 'green.600');
  
  // Knowledge colors
  const knowledgeBg = useColorModeValue('cyan.100', 'cyan.900');
  const knowledgeColor = useColorModeValue('cyan.700', 'cyan.200');
  const knowledgeBorder = useColorModeValue('cyan.500', 'cyan.600');
  
  // Solid colors
  const solidBg = useColorModeValue('gray.500', 'gray.500');
  const solidBorder = useColorModeValue('gray.500', 'gray.500');
  
  // Outline colors
  const outlineColor = useColorModeValue('gray.700', 'gray.200');
  const outlineBorder = useColorModeValue('gray.300', 'gray.600');
  
  // Subtle colors
  const subtleBg = useColorModeValue('gray.100', 'gray.700');
  const subtleColor = useColorModeValue('gray.700', 'gray.200');
  const subtleBorder = useColorModeValue('gray.300', 'gray.600');

  // Get variant-specific properties
  const variantProps = (() => {
    // Define colors based on variant
    switch (variant) {
      case 'success':
        return {
          bg: successBg,
          color: successColor,
          borderColor: successBorder,
          icon: FiCheck,
        };
      case 'error':
        return {
          bg: errorBg,
          color: errorColor,
          borderColor: errorBorder,
          icon: FiX,
        };
      case 'warning':
        return {
          bg: warningBg,
          color: warningColor,
          borderColor: warningBorder,
          icon: FiAlertTriangle,
        };
      case 'info':
        return {
          bg: infoBg,
          color: infoColor,
          borderColor: infoBorder,
          icon: FiInfo,
        };
      case 'user':
        return {
          bg: userBg,
          color: userColor,
          borderColor: userBorder,
          icon: null,
        };
      case 'team':
        return {
          bg: teamBg,
          color: teamColor,
          borderColor: teamBorder,
          icon: null,
        };
      case 'project':
        return {
          bg: projectBg,
          color: projectColor,
          borderColor: projectBorder,
          icon: null,
        };
      case 'goal':
        return {
          bg: goalBg,
          color: goalColor,
          borderColor: goalBorder,
          icon: null,
        };
      case 'knowledge':
        return {
          bg: knowledgeBg,
          color: knowledgeColor,
          borderColor: knowledgeBorder,
          icon: null,
        };
      case 'solid':
        return {
          bg: solidBg,
          color: 'white',
          borderColor: solidBorder,
          icon: null,
        };
      case 'outline':
        return {
          bg: 'transparent',
          color: outlineColor,
          borderColor: outlineBorder,
          icon: null,
        };
      default: // subtle
        return {
          bg: subtleBg,
          color: subtleColor,
          borderColor: subtleBorder,
          icon: null,
        };
    }
  })();

  // Get size properties
  const sizeProps = (() => {
    switch (size) {
      case 'sm':
        return {
          px: 2,
          py: 0.5,
          fontSize: 'xs',
          fontWeight: 'medium',
          borderRadius: 'sm',
          iconSize: 3,
        };
      case 'lg':
        return {
          px: 3,
          py: 1,
          fontSize: 'sm',
          fontWeight: 'medium',
          borderRadius: 'md',
          iconSize: 4,
        };
      default: // md
        return {
          px: 2.5,
          py: 0.5,
          fontSize: 'xs',
          fontWeight: 'semibold',
          borderRadius: 'md',
          iconSize: 3.5,
        };
    }
  })();

  // Apply styling based on variant (solid, subtle, outline)
  const styleProps = (() => {
    if (variant === 'outline') {
      return {
        bg: 'transparent',
        color: variantProps.color,
        borderWidth: '1px',
        borderColor: variantProps.borderColor,
      };
    } else { // solid or subtle
      return {
        bg: variantProps.bg,
        color: variantProps.color,
      };
    }
  })();

  return (
    <Box
      as="span"
      display="inline-flex"
      verticalAlign="top"
      whiteSpace="nowrap"
      px={sizeProps.px}
      py={sizeProps.py}
      fontSize={sizeProps.fontSize}
      fontWeight={sizeProps.fontWeight}
      borderRadius={sizeProps.borderRadius}
      textTransform="uppercase"
      letterSpacing="0.02em"
      {...styleProps}
      {...rest}
    >
      {withIcon && variantProps.icon ? (
        <HStack spacing={1} alignItems="center">
          <Icon as={variantProps.icon} w={sizeProps.iconSize} h={sizeProps.iconSize} />
          <Text>{children}</Text>
        </HStack>
      ) : (
        children
      )}
    </Box>
  );
};

export default Badge; 