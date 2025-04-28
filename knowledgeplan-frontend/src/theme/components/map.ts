// KnowledgePlane AI Map Component Theme
// Styling for the Living Map visualization and related components

import { defineStyleConfig } from '@chakra-ui/react';

// Map container styling
const MapContainer = defineStyleConfig({
  baseStyle: {
    bg: 'gray.50',
    borderRadius: 'md',
    overflow: 'hidden',
    position: 'relative',
    _dark: {
      bg: 'gray.800',
    },
  },
  variants: {
    default: {},
    bordered: {
      border: '1px solid',
      borderColor: 'gray.200',
      _dark: {
        borderColor: 'gray.700',
      },
    },
  },
  defaultProps: {
    variant: 'default',
  },
});

// Map controls styling
const MapControls = defineStyleConfig({
  baseStyle: {
    bg: 'white',
    borderRadius: 'md',
    boxShadow: 'sm',
    p: 2,
    _dark: {
      bg: 'gray.700',
    },
  },
  variants: {
    compact: {
      p: 1,
    },
  },
  defaultProps: {
    variant: 'default',
  },
});

// Map legend styling
const MapLegend = defineStyleConfig({
  baseStyle: {
    bg: 'white',
    borderRadius: 'md',
    boxShadow: 'sm',
    p: 2,
    fontSize: 'xs',
    _dark: {
      bg: 'gray.700',
      color: 'white',
    },
  },
  variants: {
    expanded: {
      p: 3,
      fontSize: 'sm',
    },
  },
  defaultProps: {
    variant: 'default',
  },
});

// Map search styling
const MapSearch = defineStyleConfig({
  baseStyle: {
    bg: 'white',
    borderRadius: 'md',
    boxShadow: 'sm',
    p: 2,
    _dark: {
      bg: 'gray.700',
    },
  },
  variants: {
    expanded: {
      width: '300px',
    },
    compact: {
      width: '200px',
    },
  },
  defaultProps: {
    variant: 'compact',
  },
});

// Node tooltip styling
const NodeTooltip = defineStyleConfig({
  baseStyle: {
    bg: 'white',
    borderRadius: 'md',
    boxShadow: 'md',
    p: 3,
    maxWidth: '300px',
    zIndex: 1000,
    _dark: {
      bg: 'gray.700',
      color: 'white',
    },
  },
  variants: {
    default: {},
  },
  defaultProps: {
    variant: 'default',
  },
});

// Export all map-related component styles
export default {
  MapContainer,
  MapControls,
  MapLegend,
  MapSearch,
  NodeTooltip,
};
