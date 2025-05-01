/**
 * KnowledgePlane AI Badge Component
 * 
 * This file defines the badge component styles, variants, and sizes
 * based on the design system.
 */

import { defineStyleConfig } from '@chakra-ui/react';

const Badge = defineStyleConfig({
  // Base style applied to all badge variants
  baseStyle: {
    px: 2,
    py: 1,
    textTransform: 'normal',
    fontWeight: 'medium',
    lineHeight: 'shorter',
    borderRadius: 'md',
    fontSize: 'xs',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    textAlign: 'center',
  },

  // Badge sizes
  sizes: {
    sm: {
      px: 1.5,
      py: 0.5,
      fontSize: 'xs',
      borderRadius: 'sm',
    },
    md: {
      px: 2,
      py: 1,
      fontSize: 'xs',
      borderRadius: 'md',
    },
    lg: {
      px: 2.5,
      py: 1.5,
      fontSize: 'sm',
      borderRadius: 'md',
    },
  },

  // Badge variants
  variants: {
    // Solid badge with full background color
    solid: (props) => ({
      bg: `${props.colorScheme}.500`,
      color: 'white',
    }),

    // Subtle badge with light background
    subtle: (props) => ({
      bg: `${props.colorScheme}.100`,
      color: `${props.colorScheme}.800`,
    }),

    // Outlined badge with border
    outline: (props) => ({
      bg: 'transparent',
      color: `${props.colorScheme}.500`,
      boxShadow: `inset 0 0 0px 1px ${props.colorScheme}.500`,
    }),

    // Entity-specific badge variants
    user: {
      bg: 'rgba(37, 99, 235, 0.1)',
      color: 'entity.user',
    },
    team: {
      bg: 'rgba(139, 92, 246, 0.1)',
      color: 'entity.team',
    },
    project: {
      bg: 'rgba(245, 158, 11, 0.1)',
      color: 'entity.project',
    },
    goal: {
      bg: 'rgba(239, 68, 68, 0.1)',
      color: 'entity.goal',
    },
    knowledge: {
      bg: 'rgba(16, 185, 129, 0.1)',
      color: 'entity.knowledge',
    },

    // Status badge variants
    success: {
      bg: 'rgba(16, 185, 129, 0.1)',
      color: 'success.600',
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.1)',
      color: 'warning.600',
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.1)',
      color: 'error.600',
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.1)',
      color: 'info.600',
    },
    
    // Progress status badge variants
    'in-progress': {
      bg: 'rgba(59, 130, 246, 0.1)',
      color: 'info.600',
    },
    completed: {
      bg: 'rgba(16, 185, 129, 0.1)',
      color: 'success.600',
    },
    blocked: {
      bg: 'rgba(239, 68, 68, 0.1)',
      color: 'error.600',
    },
    planned: {
      bg: 'rgba(107, 114, 128, 0.1)',
      color: 'gray.600',
    },
    
    // Priority badge variants
    high: {
      bg: 'rgba(239, 68, 68, 0.1)',
      color: 'error.600',
      fontWeight: 'semibold',
    },
    medium: {
      bg: 'rgba(245, 158, 11, 0.1)',
      color: 'warning.600',
    },
    low: {
      bg: 'rgba(59, 130, 246, 0.1)',
      color: 'info.600',
    },
  },

  // Default values
  defaultProps: {
    variant: 'subtle',
    colorScheme: 'gray',
    size: 'md',
  },
});

export default Badge; 