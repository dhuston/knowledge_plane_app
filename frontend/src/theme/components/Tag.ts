// KnowledgePlane AI Tag Component
import { defineStyleConfig } from '@chakra-ui/react';

const Tag = defineStyleConfig({
  // Base style applied to all tag variants
  baseStyle: {
    container: {
      fontWeight: 'medium',
      lineHeight: 'shorter',
      outline: 0,
      borderRadius: 'md',
      display: 'inline-flex',
      alignItems: 'center',
      maxWidth: '100%',
      _focus: 'outline',
    },
    label: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    closeButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'full',
      opacity: 0.5,
      _hover: {
        opacity: 0.8,
      },
      _active: {
        opacity: 1,
      },
    },
  },
  
  // Tag variants
  variants: {
    // Solid tag with background color
    solid: {
      container: {
        bg: 'brand.500',
        color: 'white',
      },
      closeButton: {
        color: 'whiteAlpha.800',
        _hover: {
          color: 'white',
        },
      },
    },
    
    // Subtle tag with transparent background
    subtle: {
      container: {
        bg: 'brand.100',
        color: 'brand.800',
      },
    },
    
    // Outline tag with border
    outline: {
      container: {
        bg: 'transparent',
        color: 'brand.500',
        boxShadow: 'inset 0 0 0 1px currentColor',
      },
    },
    
    // Entity-based tag variants
    user: {
      container: {
        bg: 'rgba(9, 103, 210, 0.1)',
        color: 'entity.user',
      },
    },
    team: {
      container: {
        bg: 'rgba(128, 90, 213, 0.1)',
        color: 'entity.team',
      },
    },
    department: {
      container: {
        bg: 'rgba(107, 70, 193, 0.1)',
        color: 'entity.department',
      },
    },
    project: {
      container: {
        bg: 'rgba(221, 107, 32, 0.1)',
        color: 'entity.project',
      },
    },
    goal: {
      container: {
        bg: 'rgba(229, 62, 62, 0.1)',
        color: 'entity.goal',
      },
    },
    knowledge: {
      container: {
        bg: 'rgba(56, 161, 105, 0.1)',
        color: 'entity.knowledge',
      },
    },
    
    // Status-based tag variants
    success: {
      container: {
        bg: 'rgba(56, 161, 105, 0.1)',
        color: 'status.success',
      },
    },
    warning: {
      container: {
        bg: 'rgba(221, 107, 32, 0.1)',
        color: 'status.warning',
      },
    },
    error: {
      container: {
        bg: 'rgba(229, 62, 62, 0.1)',
        color: 'status.error',
      },
    },
    info: {
      container: {
        bg: 'rgba(66, 153, 225, 0.1)',
        color: 'status.info',
      },
    },
    inactive: {
      container: {
        bg: 'rgba(160, 174, 192, 0.1)',
        color: 'status.inactive',
      },
    },
  },
  
  // Tag sizes
  sizes: {
    sm: {
      container: {
        minH: '1.5rem',
        minW: '1.5rem',
        fontSize: 'xs',
        px: 2,
        py: '2px',
      },
      label: {
        lineHeight: 1.2,
      },
      closeButton: {
        marginInlineStart: '0.35rem',
        marginInlineEnd: '-0.05rem',
        boxSize: '1.25rem',
      },
    },
    md: {
      container: {
        minH: '1.75rem',
        minW: '1.75rem',
        fontSize: 'sm',
        px: 2,
        py: '3px',
      },
      label: {
        lineHeight: 1.2,
      },
      closeButton: {
        marginInlineStart: '0.35rem',
        marginInlineEnd: '-0.05rem',
        boxSize: '1.5rem',
      },
    },
    lg: {
      container: {
        minH: '2rem',
        minW: '2rem',
        fontSize: 'md',
        px: 3,
        py: '4px',
      },
      label: {
        lineHeight: 1.2,
      },
      closeButton: {
        marginInlineStart: '0.5rem',
        marginInlineEnd: '-0.05rem',
        boxSize: '1.75rem',
      },
    },
  },
  
  // Default values
  defaultProps: {
    size: 'md',
    variant: 'subtle',
    colorScheme: 'brand',
  },
});

export default Tag; 