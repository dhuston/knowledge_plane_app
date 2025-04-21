// KnowledgePlane AI Card Component
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

// Create helpers for card component
const helpers = createMultiStyleConfigHelpers(['container', 'header', 'body', 'footer']);

const Card = helpers.defineMultiStyleConfig({
  // Base styles for all card parts
  baseStyle: {
    container: {
      bg: 'white',
      borderRadius: 'lg',
      boxShadow: 'card',
      overflow: 'hidden',
      position: 'relative',
      transition: 'all 0.2s',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      px: 6,
      pt: 6,
      pb: 4,
      display: 'flex',
      flexDirection: 'column',
    },
    body: {
      px: 6,
      py: 2,
      flex: 1,
    },
    footer: {
      px: 6,
      pt: 4,
      pb: 6,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 2,
    },
  },
  
  // Card variants
  variants: {
    // Elevated card with shadow
    elevated: {
      container: {
        boxShadow: 'lg',
      },
    },
    
    // Outlined card with border instead of shadow
    outline: {
      container: {
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'neutral.200',
      },
    },
    
    // Filled card with background color
    filled: {
      container: {
        bg: 'neutral.50',
        boxShadow: 'none',
      },
    },
    
    // Unstyled card without padding for custom content
    unstyled: {
      container: {
        boxShadow: 'none',
        bg: 'transparent',
        p: 0,
      },
      header: {
        p: 0,
      },
      body: {
        p: 0,
      },
      footer: {
        p: 0,
      },
    },
    
    // Entity-specific card variants with top borders
    user: {
      container: {
        borderTop: '3px solid',
        borderTopColor: 'entity.user',
      },
    },
    team: {
      container: {
        borderTop: '3px solid',
        borderTopColor: 'entity.team',
      },
    },
    department: {
      container: {
        borderTop: '3px solid',
        borderTopColor: 'entity.department',
      },
    },
    project: {
      container: {
        borderTop: '3px solid',
        borderTopColor: 'entity.project',
      },
    },
    goal: {
      container: {
        borderTop: '3px solid',
        borderTopColor: 'entity.goal',
      },
    },
    knowledge: {
      container: {
        borderTop: '3px solid',
        borderTopColor: 'entity.knowledge',
      },
    },
  },
  
  // Card sizes
  sizes: {
    sm: {
      container: {
        borderRadius: 'md',
      },
      header: {
        px: 4,
        pt: 4,
        pb: 2,
      },
      body: {
        px: 4,
        py: 2,
      },
      footer: {
        px: 4,
        pt: 2,
        pb: 4,
      },
    },
    md: {
      container: {
        borderRadius: 'lg',
      },
      header: {
        px: 6,
        pt: 6,
        pb: 4,
      },
      body: {
        px: 6,
        py: 2,
      },
      footer: {
        px: 6,
        pt: 4,
        pb: 6,
      },
    },
    lg: {
      container: {
        borderRadius: 'xl',
      },
      header: {
        px: 8,
        pt: 8,
        pb: 4,
      },
      body: {
        px: 8,
        py: 4,
      },
      footer: {
        px: 8,
        pt: 4,
        pb: 8,
      },
    },
  },
  
  // Default props
  defaultProps: {
    variant: 'elevated',
    size: 'md',
  },
});

export default Card; 