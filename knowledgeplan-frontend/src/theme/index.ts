// KnowledgePlane AI Theme
// Main theme configuration and integration

import { extendTheme } from '@chakra-ui/react';
import foundations from './foundations';
import components from './components';

// Theme configuration
const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Global styles
const styles = {
  global: {
    'html, body': {
      color: 'neutral.800',
      lineHeight: 'base',
      bg: 'neutral.50',
      fontFamily: 'body',
    },
    '*::placeholder': {
      color: 'neutral.400',
    },
    '*, *::before, *::after': {
      borderColor: 'neutral.200',
    },
  },
};

// Define theme structure
const theme = extendTheme({
  ...foundations,
  components,
  config,
  styles,
});

export default theme; 