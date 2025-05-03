/**
 * KnowledgePlane AI Button Component
 *
 * This file defines the button component styles, variants, and sizes
 * based on the Airbnb-inspired design system.
 */

import { defineStyleConfig } from '@chakra-ui/react';

const Button = defineStyleConfig({
  // Base style applied to all button variants - Airbnb-inspired rounded buttons
  baseStyle: {
    fontWeight: 'medium', // Airbnb uses medium weight for buttons
    borderRadius: '8px',  // More rounded corners like Airbnb
    lineHeight: '1.5',    // Slightly taller line height for better text alignment
    transition: 'all 0.2s ease',
    letterSpacing: '0.01em',
    textAlign: 'center',
    _focus: {
      boxShadow: '0 0 0 2px rgba(255, 90, 95, 0.4)', // Airbnb coral for focus ring
    },
    _disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
      boxShadow: 'none',
    },
    _hover: {
      transform: 'translateY(-1px)',
      _disabled: {
        bg: 'initial',
        transform: 'none',
      },
    },
  },

  // Sizes - adjusted for more generous padding like Airbnb
  sizes: {
    xs: {
      fontSize: 'xs',
      px: 3,
      py: 1.5,
      h: 7,
      minW: 7,
    },
    sm: {
      fontSize: 'sm',
      px: 4,
      py: 1.5,
      h: 9,
      minW: 9,
    },
    md: {
      fontSize: 'sm',
      px: 5,
      py: 2,
      h: 12,    // Taller button height like Airbnb
      minW: 12,
    },
    lg: {
      fontSize: 'md',
      px: 6,
      py: 2.5,
      h: 14,
      minW: 14,
    },
    xl: {
      fontSize: 'lg',
      px: 7,
      py: 3,
      h: 16,
      minW: 16,
    },
  },

  // Variants - updated with Airbnb-inspired colors and styles
  variants: {
    // Primary button (solid with Airbnb coral)
    primary: {
      bg: 'primary.500', // Airbnb coral
      color: 'white',
      _hover: {
        bg: 'primary.600',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        _disabled: {
          bg: 'primary.500',
          boxShadow: 'none',
        },
      },
      _active: {
        bg: 'primary.700',
        transform: 'translateY(0)',
      },
    },

    // Secondary button (outlined with subtle border)
    secondary: {
      bg: 'white',
      color: '#484848', // Airbnb dark gray
      border: '1px solid',
      borderColor: '#DDDDDD', // Airbnb border color
      _hover: {
        borderColor: '#BBBBBB',
        bg: 'gray.50',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      },
      _active: {
        bg: 'gray.100',
        transform: 'translateY(0)',
      },
    },

    // Tertiary button (ghost style with coral text)
    tertiary: {
      bg: 'transparent',
      color: 'primary.500', // Airbnb coral
      _hover: {
        bg: 'rgba(255, 90, 95, 0.05)',
        textDecoration: 'underline',
      },
      _active: {
        bg: 'rgba(255, 90, 95, 0.1)',
        transform: 'translateY(0)',
      },
    },

    // Danger button (solid with error color)
    danger: {
      bg: 'error.500',
      color: 'white',
      _hover: {
        bg: 'error.600',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        _disabled: {
          bg: 'error.500',
          boxShadow: 'none',
        },
      },
      _active: {
        bg: 'error.700',
        transform: 'translateY(0)',
      },
    },

    // Success button (solid with success color)
    success: {
      bg: 'success.500', // Airbnb mint green
      color: 'white',
      _hover: {
        bg: 'success.600',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        _disabled: {
          bg: 'success.500',
          boxShadow: 'none',
        },
      },
      _active: {
        bg: 'success.700',
        transform: 'translateY(0)',
      },
    },

    // Link style - Airbnb style links
    link: {
      padding: 0,
      height: 'auto',
      lineHeight: 'normal',
      color: 'primary.500', // Airbnb coral
      fontWeight: 'medium',
      _hover: {
        textDecoration: 'underline',
        color: 'primary.600',
      },
      _active: {
        color: 'primary.700',
      },
    },

    // Subtle (low emphasis) - Light background
    subtle: {
      bg: 'secondary.100', // Light cream
      color: '#484848', // Airbnb dark gray
      _hover: {
        bg: 'secondary.200',
      },
      _active: {
        bg: 'secondary.300',
        transform: 'translateY(0)',
      },
    },

    // Ghost variant (transparent with hover effect)
    ghost: {
      bg: 'transparent',
      color: '#484848', // Airbnb dark gray
      _hover: {
        bg: 'rgba(0, 0, 0, 0.03)', // Very subtle hover
      },
      _active: {
        bg: 'rgba(0, 0, 0, 0.06)',
        transform: 'translateY(0)',
      },
    },

    // Map control button - Airbnb-inspired map controls
    mapControl: {
      bg: 'white',
      color: '#484848', // Airbnb dark gray
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
      borderRadius: 'full', // Circular button
      height: '36px',
      minWidth: '36px',
      _hover: {
        bg: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
      },
      _active: {
        bg: 'gray.50',
        transform: 'translateY(0)',
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