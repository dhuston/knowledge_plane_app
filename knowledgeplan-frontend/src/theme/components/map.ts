// KnowledgePlane AI Map Component Theme
// Styling for the Living Map visualization and related components

import { defineStyleConfig } from '@chakra-ui/react';

// Map container styling
const MapContainer = defineStyleConfig({
  baseStyle: {
    bg: 'secondary.400', // Off-white/cream
    borderRadius: 'md',
    overflow: 'hidden',
    position: 'relative',
    _dark: {
      bg: '#363636', // Lighter button color
    },
  },
  variants: {
    default: {},
    bordered: {
      border: '1px solid',
      borderColor: 'primary.300', // Light mint green
      _dark: {
        borderColor: 'primary.600', // Sage green
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
    bg: 'surface.500', // White
    borderRadius: 'md',
    boxShadow: 'sm',
    p: 2,
    _dark: {
      bg: '#363636', // Lighter button color
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
    bg: 'surface.500', // White
    borderRadius: 'md',
    boxShadow: 'sm',
    p: 2,
    fontSize: 'xs',
    borderWidth: '1px',
    borderColor: 'primary.300', // Light mint green
    _dark: {
      bg: '#363636', // Lighter button color
      color: 'secondary.400', // Off-white/cream
      borderColor: 'primary.600', // Sage green
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
    bg: 'surface.500', // White
    borderRadius: 'md',
    boxShadow: 'sm',
    p: 2,
    borderWidth: '1px',
    borderColor: 'primary.300', // Light mint green
    _dark: {
      bg: '#363636', // Lighter button color
      borderColor: 'primary.600', // Sage green
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
    bg: 'surface.500', // White
    borderRadius: 'md',
    boxShadow: 'md',
    p: 3,
    maxWidth: '300px',
    zIndex: 1000,
    borderWidth: '1px',
    borderColor: 'primary.300', // Light mint green
    color: '#262626', // Button color - dark gray/almost black
    _dark: {
      bg: '#363636', // Lighter button color
      color: 'secondary.400', // Off-white/cream
      borderColor: 'primary.600', // Sage green
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
