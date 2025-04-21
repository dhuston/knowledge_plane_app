// KnowledgePlane AI Input Component
import { defineStyleConfig } from '@chakra-ui/react';

const Input = defineStyleConfig({
  // Base style for all inputs
  baseStyle: {
    field: {
      width: '100%',
      minWidth: 0,
      outline: 0,
      position: 'relative',
      appearance: 'none',
      transition: 'all 0.2s',
    },
  },
  
  // Input variants
  variants: {
    // Outlined input with border
    outline: {
      field: {
        border: '1px solid',
        borderColor: 'neutral.300',
        bg: 'white',
        _hover: {
          borderColor: 'neutral.400',
        },
        _readOnly: {
          boxShadow: 'none !important',
          userSelect: 'all',
        },
        _disabled: {
          opacity: 0.4,
          cursor: 'not-allowed',
        },
        _invalid: {
          borderColor: 'accent.500',
          boxShadow: `0 0 0 1px var(--chakra-colors-accent-500)`,
        },
        _focus: {
          zIndex: 1,
          borderColor: 'brand.500',
          boxShadow: `0 0 0 1px var(--chakra-colors-brand-500)`,
        },
      },
    },
    
    // Filled input with background
    filled: {
      field: {
        border: '2px solid',
        borderColor: 'transparent',
        bg: 'neutral.100',
        _hover: {
          bg: 'neutral.200',
        },
        _readOnly: {
          boxShadow: 'none !important',
          userSelect: 'all',
        },
        _disabled: {
          opacity: 0.4,
          cursor: 'not-allowed',
        },
        _invalid: {
          borderColor: 'accent.500',
        },
        _focus: {
          bg: 'transparent',
          borderColor: 'brand.500',
        },
      },
    },
    
    // Flushed input with only bottom border
    flushed: {
      field: {
        borderBottom: '1px solid',
        borderColor: 'neutral.300',
        borderRadius: 0,
        px: 0,
        bg: 'transparent',
        _hover: {
          borderColor: 'neutral.400',
        },
        _readOnly: {
          boxShadow: 'none !important',
          userSelect: 'all',
        },
        _disabled: {
          opacity: 0.4,
          cursor: 'not-allowed',
        },
        _invalid: {
          borderColor: 'accent.500',
          boxShadow: `0px 1px 0px 0px var(--chakra-colors-accent-500)`,
        },
        _focus: {
          borderColor: 'brand.500',
          boxShadow: `0px 1px 0px 0px var(--chakra-colors-brand-500)`,
        },
      },
    },
    
    // Unstyled input without styling
    unstyled: {
      field: {
        bg: 'transparent',
        px: 0,
        height: 'auto',
      },
    },
    
    // Search input with icon and rounded styling
    search: {
      field: {
        border: '1px solid',
        borderColor: 'neutral.200',
        bg: 'white',
        borderRadius: 'full',
        pl: 10, // Space for search icon
        pr: 4,
        _hover: {
          borderColor: 'neutral.300',
        },
        _focus: {
          borderColor: 'brand.500',
          boxShadow: `0 0 0 1px var(--chakra-colors-brand-500)`,
        },
      },
    },
  },
  
  // Input sizes
  sizes: {
    xs: {
      field: {
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
    },
    md: {
      field: {
        fontSize: 'md',
        px: 4,
        h: 10,
        borderRadius: 'md',
      },
    },
    lg: {
      field: {
        fontSize: 'lg',
        px: 4,
        h: 12,
        borderRadius: 'md',
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