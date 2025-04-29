/**
 * KnowledgePlane AI Color Modes
 *
 * This file defines color mode adaptations for light and dark themes.
 * It ensures that semantic colors are appropriately adapted in each mode
 * while maintaining brand identity and accessibility.
 */

// Define types for color mode values
interface ColorModeValue {
  _light: string;
  _dark: string;
}

// Type for nested color mode objects
interface NestedColorModeObject {
  [key: string]: ColorModeValue | NestedColorModeObject;
}

// Define semantic colors that change between modes
const semanticColors: NestedColorModeObject = {
  // Text colors
  text: {
    primary: {
      _light: '#262626', // Button color - dark gray/almost black
      _dark: 'secondary.400', // Off-white/cream
    },
    secondary: {
      _light: '#565656', // Button variant - medium gray
      _dark: 'secondary.300',
    },
    tertiary: {
      _light: 'primary.600', // Sage green
      _dark: 'primary.400',
    },
    disabled: {
      _light: 'gray.400',
      _dark: 'gray.600',
    },
    inverse: {
      _light: 'secondary.400', // Off-white/cream
      _dark: '#262626', // Button color - dark gray/almost black
    },
  },

  // Background colors
  bg: {
    primary: {
      _light: 'surface.500', // White
      _dark: '#262626', // Button color - dark gray/almost black
    },
    secondary: {
      _light: 'secondary.400', // Off-white/cream
      _dark: '#363636', // Slightly lighter than button color
    },
    tertiary: {
      _light: 'secondary.600', // Light gray
      _dark: '#464646', // Even lighter
    },
    inverse: {
      _light: '#262626', // Button color - dark gray/almost black
      _dark: 'surface.500', // White
    },
    highlight: {
      _light: 'primary.300', // Light mint green
      _dark: 'primary.600', // Sage green
    },
    card: {
      _light: 'surface.500', // White
      _dark: '#363636', // Slightly lighter than button color
    },
    modal: {
      _light: 'surface.500', // White
      _dark: '#363636', // Slightly lighter than button color
    },
    tooltip: {
      _light: '#262626', // Button color - dark gray/almost black
      _dark: 'secondary.400', // Off-white/cream
    },
  },

  // Border colors
  border: {
    default: {
      _light: 'primary.300', // Light mint green
      _dark: 'primary.600', // Sage green
    },
    strong: {
      _light: 'primary.600', // Sage green
      _dark: 'primary.400', // Lighter mint green
    },
    light: {
      _light: 'secondary.400', // Off-white/cream
      _dark: 'secondary.600', // Light gray
    },
    focus: {
      _light: 'primary.400',
      _dark: 'primary.300',
    },
  },

  // Entity colors - slightly brighter in dark mode for visibility
  entity: {
    user: {
      _light: 'primary.300', // Light mint green
      _dark: 'primary.200',
    },
    team: {
      _light: 'primary.600', // Sage green
      _dark: 'primary.500',
    },
    project: {
      _light: 'warning.500',
      _dark: 'warning.300',
    },
    goal: {
      _light: 'secondary.400', // Off-white/cream
      _dark: 'secondary.300',
    },
    knowledge: {
      _light: 'success.500',
      _dark: 'success.300',
    },
  },

  // Status colors - adjusted for dark mode visibility
  status: {
    success: {
      _light: 'success.500',
      _dark: 'success.300',
    },
    error: {
      _light: 'error.800', // Deep red
      _dark: 'error.600',
    },
    warning: {
      _light: 'warning.500',
      _dark: 'warning.300',
    },
    info: {
      _light: 'info.500',
      _dark: 'info.300',
    },
    inactive: {
      _light: '#565656', // Button variant - medium gray
      _dark: 'secondary.600', // Light gray
    },
  },
};

// Shadow adaptations for dark mode
const shadows: NestedColorModeObject = {
  // Make shadows more subtle in dark mode
  card: {
    _light: '0 4px 6px rgba(0, 0, 0, 0.1)',
    _dark: '0 4px 6px rgba(0, 0, 0, 0.3)',
  },
  'card-hover': {
    _light: '0 8px 12px rgba(0, 0, 0, 0.15)',
    _dark: '0 8px 12px rgba(0, 0, 0, 0.4)',
  },
  modal: {
    _light: '0 20px 25px rgba(0, 0, 0, 0.15)',
    _dark: '0 20px 25px rgba(0, 0, 0, 0.4)',
  },
  // Adjust focus shadow for dark mode
  focus: {
    _light: '0 0 0 3px rgba(197, 212, 202, 0.5)', // Light mint green with transparency
    _dark: '0 0 0 3px rgba(141, 162, 148, 0.5)', // Sage green with transparency
  },
};

/**
 * Helper function to transform the nested color mode object
 * into a flat structure compatible with Chakra UI's color mode
 *
 * @param {NestedColorModeObject} colorModeObject - Nested color mode object
 * @returns {Record<string, ColorModeValue>} - Flat semantic color object for Chakra UI
 */
function transformToColorModeObject(colorModeObject: NestedColorModeObject): Record<string, ColorModeValue> {
  const result: Record<string, ColorModeValue> = {};

  function processObject(obj: NestedColorModeObject, path: string[] = []): void {
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = [...path, key];

      if (value && typeof value === 'object' && '_light' in value && '_dark' in value) {
        // This is a color mode object, add it as a property
        const propPath = currentPath.join('.');
        result[propPath] = value as ColorModeValue;
      } else if (value && typeof value === 'object') {
        // This is a nested object, recurse
        processObject(value as NestedColorModeObject, currentPath);
      }
    });
  }

  processObject(colorModeObject);

  return result;
}

// Transform the semantic colors to the format Chakra UI expects
const colorModeValues = {
  ...transformToColorModeObject(semanticColors),
  ...transformToColorModeObject({ shadows }),
};

export default colorModeValues;