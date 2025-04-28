/**
 * KnowledgePlane AI Button Component
 * 
 * This file defines the button component styles, variants, and sizes
 * based on the design system.
 */

import { defineStyleConfig } from '@chakra-ui/react';

const Button = defineStyleConfig({
  // Base style applied to all button variants
  baseStyle: {
    fontWeight: 'semibold',
    borderRadius: 'md',
    lineHeight: 'button',
    transition: 'all 0.2s',
    _focus: {
      boxShadow: 'focus',
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

  // Sizes
  sizes: {
    xs: {
      fontSize: 'xs',
      px: 2,
      py: 1,
      h: 6,
      minW: 6,
    },
    sm: {
      fontSize: 'sm',
      px: 3,
      py: 1,
      h: 8,
      minW: 8,
    },
    md: {
      fontSize: 'sm',
      px: 4,
      py: 2,
      h: 10,
      minW: 10,
    },
    lg: {
      fontSize: 'md',
      px: 5,
      py: 2,
      h: 12,
      minW: 12,
    },
    xl: {
      fontSize: 'lg',
      px: 6,
      py: 3,
      h: 14,
      minW: 14,
    },
  },

  // Variants
  variants: {
    // Primary button (solid with brand color)
    primary: {
      bg: 'primary.500',
      color: 'white',
      _hover: {
        bg: 'primary.600',
        _disabled: {
          bg: 'primary.500',
        },
      },
      _active: {
        bg: 'primary.700',
      },
    },

    // Secondary button (outlined with brand color)
    secondary: {
      bg: 'white',
      color: 'primary.500',
      border: '1px solid',
      borderColor: 'primary.500',
      _hover: {
        bg: 'primary.50',
      },
      _active: {
        bg: 'primary.100',
      },
    },

    // Tertiary button (ghost style with brand color)
    tertiary: {
      bg: 'transparent',
      color: 'primary.500',
      _hover: {
        bg: 'primary.50',
      },
      _active: {
        bg: 'primary.100',
      },
    },

    // Danger button (solid with error color)
    danger: {
      bg: 'error.500',
      color: 'white',
      _hover: {
        bg: 'error.600',
        _disabled: {
          bg: 'error.500',
        },
      },
      _active: {
        bg: 'error.700',
      },
    },

    // Success button (solid with success color)
    success: {
      bg: 'success.500',
      color: 'white',
      _hover: {
        bg: 'success.600',
        _disabled: {
          bg: 'success.500',
        },
      },
      _active: {
        bg: 'success.700',
      },
    },

    // Link style
    link: {
      padding: 0,
      height: 'auto',
      lineHeight: 'normal',
      color: 'primary.500',
      _hover: {
        textDecoration: 'underline',
        color: 'primary.600',
      },
      _active: {
        color: 'primary.700',
      },
    },

    // Subtle (low emphasis)
    subtle: {
      bg: 'primary.50',
      color: 'primary.700',
      _hover: {
        bg: 'primary.100',
      },
      _active: {
        bg: 'primary.200',
      },
    },
  },

  // Default values
  defaultProps: {
    size: 'md',
    variant: 'primary',
  },
});

export default Button; 