// KnowledgePlane AI Card Component
// Modern, professional card styles with brand identity

import { defineStyleConfig } from '@chakra-ui/react';

const Card = defineStyleConfig({
  // Base styles applied to all cards
  baseStyle: {
    container: {
      bg: 'white',
      borderRadius: 'card',
      boxShadow: 'card',
      transition: 'all 0.2s',
      position: 'relative',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      padding: 'card-padding',
      borderBottom: '1px solid',
      borderColor: 'neutral.200',
    },
    body: {
      padding: 'card-padding',
      flex: 1,
    },
    footer: {
      padding: 'card-padding',
      borderTop: '1px solid',
      borderColor: 'neutral.200',
    },
  },

  // Variations
  variants: {
    // Default card
    elevated: {
      container: {
        _hover: {
          boxShadow: 'card-hover',
        },
      },
    },

    // Outlined card
    outlined: {
      container: {
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'neutral.200',
      },
    },

    // Filled card
    filled: {
      container: {
        bg: 'neutral.50',
        boxShadow: 'none',
      },
    },

    // Interactive card
    interactive: {
      container: {
        cursor: 'pointer',
        _hover: {
          boxShadow: 'card-hover',
          transform: 'translateY(-2px)',
        },
        _active: {
          transform: 'translateY(0)',
        },
      },
    },

    // Feature card with accent
    feature: {
      container: {
        borderTop: '4px solid',
        borderColor: 'brand.500',
        _hover: {
          boxShadow: 'card-hover',
        },
      },
    },

    // Success card
    success: {
      container: {
        borderLeft: '4px solid',
        borderColor: 'success.500',
        bg: 'success.50',
      },
    },

    // Warning card
    warning: {
      container: {
        borderLeft: '4px solid',
        borderColor: 'warning.500',
        bg: 'warning.50',
      },
    },

    // Error card
    error: {
      container: {
        borderLeft: '4px solid',
        borderColor: 'error.500',
        bg: 'error.50',
      },
    },

    // Info card
    info: {
      container: {
        borderLeft: '4px solid',
        borderColor: 'info.500',
        bg: 'info.50',
      },
    },
  },

  // Sizes
  sizes: {
    sm: {
      container: {
        borderRadius: 'sm',
      },
      header: {
        padding: 3,
      },
      body: {
        padding: 3,
      },
      footer: {
        padding: 3,
      },
    },
    md: {
      container: {
        borderRadius: 'card',
      },
      header: {
        padding: 'card-padding',
      },
      body: {
        padding: 'card-padding',
      },
      footer: {
        padding: 'card-padding',
      },
    },
    lg: {
      container: {
        borderRadius: 'lg',
      },
      header: {
        padding: 6,
      },
      body: {
        padding: 6,
      },
      footer: {
        padding: 6,
      },
    },
  },

  // Default values
  defaultProps: {
    variant: 'elevated',
    size: 'md',
  },
});

export default Card; 