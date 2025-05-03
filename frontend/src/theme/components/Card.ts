// KnowledgePlane AI Card Component
// Airbnb-inspired clean, airy card styles with generous spacing

import { defineStyleConfig } from '@chakra-ui/react';

const Card = defineStyleConfig({
  // Base styles applied to all cards
  baseStyle: {
    container: {
      bg: 'white',
      borderRadius: '12px', // More rounded corners like Airbnb
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)', // Subtle shadow
      transition: 'all 0.2s ease',
      position: 'relative',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid',
      borderColor: '#DDDDDD', // Airbnb-style light border
      overflow: 'hidden',
    },
    header: {
      padding: '20px 24px', // More generous padding
      borderBottom: '1px solid',
      borderColor: '#EBEBEB', // Airbnb-style divider
    },
    body: {
      padding: '24px', // More generous padding
      flex: 1,
    },
    footer: {
      padding: '16px 24px', // More generous padding
      borderTop: '1px solid',
      borderColor: '#EBEBEB', // Airbnb-style divider
    },
  },

  // Variations
  variants: {
    // Default card - clean, minimalist
    elevated: {
      container: {
        _hover: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.10)',
        },
      },
    },

    // Outlined card - subtle border only
    outlined: {
      container: {
        boxShadow: 'none',
        border: '1px solid',
        borderColor: '#DDDDDD', // Airbnb-style border
      },
    },

    // Filled card - subtle background
    filled: {
      container: {
        bg: 'secondary.100', // Light cream background
        boxShadow: 'none',
        border: '1px solid',
        borderColor: '#DDDDDD', // Airbnb-style border
      },
    },

    // Interactive card - with hover effects
    interactive: {
      container: {
        cursor: 'pointer',
        _hover: {
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.12)',
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
        borderTop: '3px solid',
        borderColor: 'primary.500', // Airbnb coral
        _hover: {
          boxShadow: '0 8px 28px rgba(0, 0, 0, 0.12)',
        },
      },
    },

    // Success card
    success: {
      container: {
        borderLeft: '3px solid',
        borderColor: 'success.500',
        bg: 'success.50',
      },
    },

    // Warning card
    warning: {
      container: {
        borderLeft: '3px solid',
        borderColor: 'warning.500',
        bg: 'warning.50',
      },
    },

    // Error card
    error: {
      container: {
        borderLeft: '3px solid',
        borderColor: 'error.500',
        bg: 'error.50',
      },
    },

    // Info card
    info: {
      container: {
        borderLeft: '3px solid',
        borderColor: 'info.500',
        bg: 'info.50',
      },
    },
  },

  // Sizes
  sizes: {
    sm: {
      container: {
        borderRadius: '8px', // Slightly rounded
      },
      header: {
        padding: '12px 16px',
      },
      body: {
        padding: '16px',
      },
      footer: {
        padding: '12px 16px',
      },
    },
    md: {
      container: {
        borderRadius: '12px', // Medium rounded corners
      },
      header: {
        padding: '20px 24px',
      },
      body: {
        padding: '24px',
      },
      footer: {
        padding: '16px 24px',
      },
    },
    lg: {
      container: {
        borderRadius: '16px', // More rounded corners
      },
      header: {
        padding: '24px 32px',
      },
      body: {
        padding: '32px',
      },
      footer: {
        padding: '20px 32px',
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