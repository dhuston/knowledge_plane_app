// KnowledgePlane AI Button Component
import { defineStyleConfig } from '@chakra-ui/react';

const Button = defineStyleConfig({
  // Base style applied to all variants
  baseStyle: {
    fontWeight: 'semibold',
    borderRadius: 'md',
    _focus: {
      boxShadow: 'outline',
    },
    _disabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
      boxShadow: 'none',
    },
    _hover: {
      _disabled: {
        bg: 'initial',
      },
    },
  },
  
  // Variants
  variants: {
    // Primary button - solid with brand color
    primary: {
      bg: 'brand.500',
      color: 'white',
      _hover: {
        bg: 'brand.600',
        _disabled: {
          bg: 'brand.500',
        },
      },
      _active: { bg: 'brand.700' },
    },
    
    // Secondary button - lighter background
    secondary: {
      bg: 'neutral.100',
      color: 'neutral.800',
      _hover: {
        bg: 'neutral.200',
        _disabled: {
          bg: 'neutral.100',
        },
      },
      _active: { bg: 'neutral.300' },
    },
    
    // Tertiary button - transparent with colored text
    tertiary: {
      bg: 'transparent',
      color: 'brand.500',
      _hover: {
        bg: 'brand.50',
        _disabled: {
          bg: 'transparent',
        },
      },
      _active: { bg: 'brand.100' },
    },
    
    // Outline button - bordered
    outline: {
      bg: 'transparent',
      color: 'brand.500',
      borderWidth: '1px',
      borderColor: 'brand.500',
      _hover: {
        bg: 'brand.50',
        _disabled: {
          bg: 'transparent',
        },
      },
      _active: { bg: 'brand.100' },
    },
    
    // Danger button - for destructive actions
    danger: {
      bg: 'accent.500',
      color: 'white',
      _hover: {
        bg: 'accent.600',
        _disabled: {
          bg: 'accent.500',
        },
      },
      _active: { bg: 'accent.700' },
    },
    
    // Success button
    success: {
      bg: 'tertiary.500',
      color: 'white',
      _hover: {
        bg: 'tertiary.600',
        _disabled: {
          bg: 'tertiary.500',
        },
      },
      _active: { bg: 'tertiary.700' },
    },
    
    // Ghost button - only shows on hover
    ghost: {
      bg: 'transparent',
      color: 'neutral.700',
      _hover: {
        bg: 'neutral.100',
        _disabled: {
          bg: 'transparent',
        },
      },
      _active: { bg: 'neutral.200' },
    },
    
    // Map control button with shadow
    mapControl: {
      bg: 'white',
      color: 'neutral.800',
      boxShadow: 'md',
      borderRadius: 'lg',
      fontSize: 'sm',
      _hover: {
        bg: 'neutral.50',
      },
      _active: { bg: 'neutral.100' },
    },
  },
  
  // Sizes
  sizes: {
    xs: {
      h: 8,
      minW: 8,
      fontSize: 'xs',
      px: 3,
    },
    sm: {
      h: 9,
      minW: 9,
      fontSize: 'sm',
      px: 4,
    },
    md: {
      h: 10,
      minW: 10,
      fontSize: 'md',
      px: 4,
    },
    lg: {
      h: 12,
      minW: 12,
      fontSize: 'lg',
      px: 6,
    },
    xl: {
      h: 14,
      minW: 14,
      fontSize: 'xl',
      px: 6,
    },
  },
  
  // Default values
  defaultProps: {
    variant: 'primary',
    size: 'md',
  },
});

export default Button; 