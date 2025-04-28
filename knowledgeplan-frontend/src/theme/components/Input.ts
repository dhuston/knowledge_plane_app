// KnowledgePlane AI Input Component
// Modern, professional input styles with brand identity

import { defineStyleConfig } from '@chakra-ui/react';

const Input = defineStyleConfig({
  // Base styles applied to all inputs
  baseStyle: {
    field: {
      width: '100%',
      minWidth: 0,
      outline: 0,
      position: 'relative',
      appearance: 'none',
      transition: 'all 0.2s',
      fontFamily: 'body',
    },
    element: {
      height: 'input-height',
      borderRadius: 'input',
      px: 'input-padding-x',
      py: 'input-padding-y',
      fontSize: 'md',
      bg: 'white',
      border: '1px solid',
      borderColor: 'neutral.300',
      _hover: {
        borderColor: 'neutral.400',
      },
      _focus: {
        borderColor: 'brand.500',
        boxShadow: 'focus',
      },
      _disabled: {
        opacity: 0.6,
        cursor: 'not-allowed',
        bg: 'neutral.50',
      },
      _invalid: {
        borderColor: 'error.500',
        boxShadow: 'focus-error',
      },
      _placeholder: {
        color: 'neutral.400',
      },
    },
    addon: {
      height: 'input-height',
      fontSize: 'md',
      px: 'input-padding-x',
      borderRadius: 'input',
    },
  },

  // Variations
  variants: {
    // Default outline style
    outline: {
      field: {
        bg: 'white',
        border: '1px solid',
        borderColor: 'neutral.300',
        _hover: {
          borderColor: 'neutral.400',
        },
        _focus: {
          borderColor: 'brand.500',
          boxShadow: 'focus',
        },
      },
    },

    // Filled style
    filled: {
      field: {
        bg: 'neutral.50',
        border: '2px solid',
        borderColor: 'transparent',
        _hover: {
          bg: 'neutral.100',
        },
        _focus: {
          bg: 'white',
          borderColor: 'brand.500',
          boxShadow: 'focus',
        },
      },
    },

    // Flushed style (borderless with bottom border)
    flushed: {
      field: {
        bg: 'transparent',
        borderRadius: 0,
        px: 0,
        borderBottom: '1px solid',
        borderColor: 'neutral.300',
        _hover: {
          borderColor: 'neutral.400',
        },
        _focus: {
          borderColor: 'brand.500',
          boxShadow: 'none',
          borderBottom: '2px solid',
        },
      },
    },

    // Unstyled
    unstyled: {
      field: {
        bg: 'transparent',
        px: 0,
        height: 'auto',
      },
      addon: {
        bg: 'transparent',
        px: 0,
        height: 'auto',
      },
    },
  },

  // Sizes
  sizes: {
    xs: {
      field: {
        fontSize: 'xs',
        px: 2,
        h: 6,
        borderRadius: 'sm',
      },
      addon: {
        fontSize: 'xs',
        px: 2,
        h: 6,
        borderRadius: 'sm',
      },
    },
    sm: {
      field: {
        fontSize: 'sm',
        px: 3,
        h: 8,
        borderRadius: 'sm',
      },
      addon: {
        fontSize: 'sm',
        px: 3,
        h: 8,
        borderRadius: 'sm',
      },
    },
    md: {
      field: {
        fontSize: 'md',
        px: 4,
        h: 10,
        borderRadius: 'md',
      },
      addon: {
        fontSize: 'md',
        px: 4,
        h: 10,
        borderRadius: 'md',
      },
    },
    lg: {
      field: {
        fontSize: 'lg',
        px: 6,
        h: 12,
        borderRadius: 'lg',
      },
      addon: {
        fontSize: 'lg',
        px: 6,
        h: 12,
        borderRadius: 'lg',
      },
    },
  },

  // Default values
  defaultProps: {
    size: 'md',
    variant: 'outline',
  },
});

export default Input; 