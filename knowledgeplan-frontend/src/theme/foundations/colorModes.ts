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
      _light: 'gray.900',
      _dark: 'gray.50',
    },
    secondary: {
      _light: 'gray.700',
      _dark: 'gray.300',
    },
    tertiary: {
      _light: 'gray.500',
      _dark: 'gray.400',
    },
    disabled: {
      _light: 'gray.400',
      _dark: 'gray.600',
    },
    inverse: {
      _light: 'gray.50',
      _dark: 'gray.900',
    },
  },
  
  // Background colors
  bg: {
    primary: {
      _light: 'white',
      _dark: 'gray.900',
    },
    secondary: {
      _light: 'gray.50',
      _dark: 'gray.800',
    },
    tertiary: {
      _light: 'gray.100',
      _dark: 'gray.700',
    },
    inverse: {
      _light: 'gray.900',
      _dark: 'white',
    },
    highlight: {
      _light: 'primary.50',
      _dark: 'primary.900',
    },
    card: {
      _light: 'white',
      _dark: 'gray.800',
    },
    modal: {
      _light: 'white',
      _dark: 'gray.800',
    },
    tooltip: {
      _light: 'gray.900',
      _dark: 'gray.200',
    },
  },
  
  // Border colors
  border: {
    default: {
      _light: 'gray.200',
      _dark: 'gray.700',
    },
    strong: {
      _light: 'gray.300',
      _dark: 'gray.600',
    },
    light: {
      _light: 'gray.100',
      _dark: 'gray.800',
    },
    focus: {
      _light: 'primary.400',
      _dark: 'primary.300',
    },
  },
  
  // Entity colors - slightly brighter in dark mode for visibility
  entity: {
    user: {
      _light: 'primary.500',
      _dark: 'primary.300',
    },
    team: {
      _light: 'secondary.500',
      _dark: 'secondary.300',
    },
    project: {
      _light: 'warning.500',
      _dark: 'warning.300',
    },
    goal: {
      _light: 'error.500',
      _dark: 'error.300',
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
      _light: 'error.500',
      _dark: 'error.300',
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
      _light: 'gray.400',
      _dark: 'gray.500',
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
    _light: '0 0 0 3px rgba(66, 153, 225, 0.5)',
    _dark: '0 0 0 3px rgba(99, 179, 237, 0.5)',
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