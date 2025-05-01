// KnowledgePlane AI Modal Component
// Modern, professional modal styles with brand identity

import { modalAnatomy } from '@chakra-ui/anatomy';
import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(modalAnatomy.keys);

const Modal = defineMultiStyleConfig({
  // Base styles for all modal parts
  baseStyle: definePartsStyle({
    overlay: {
      bg: 'blackAlpha.600',
      backdropFilter: 'blur(4px)',
    },
    dialog: {
      borderRadius: 'modal',
      bg: 'white',
      boxShadow: 'modal',
      mx: 4,
    },
    header: {
      padding: 'modal-padding',
      borderBottom: '1px solid',
      borderColor: 'neutral.200',
      fontSize: 'xl',
      fontWeight: 'semibold',
    },
    closeButton: {
      top: 3,
      right: 3,
      position: 'absolute',
      width: 8,
      height: 8,
      borderRadius: 'md',
      color: 'neutral.500',
      _hover: {
        bg: 'neutral.100',
        color: 'neutral.800',
      },
      _active: {
        bg: 'neutral.200',
      },
    },
    body: {
      padding: 'modal-padding',
    },
    footer: {
      padding: 'modal-padding',
      borderTop: '1px solid',
      borderColor: 'neutral.200',
    },
  }),

  // Variations
  variants: {
    // Default modal
    primary: definePartsStyle({
      dialog: {
        boxShadow: 'modal',
      },
    }),

    // Feature announcement modal
    feature: definePartsStyle({
      dialog: {
        borderTop: '4px solid',
        borderColor: 'brand.500',
      },
    }),

    // Success modal
    success: definePartsStyle({
      dialog: {
        borderTop: '4px solid',
        borderColor: 'success.500',
      },
      header: {
        color: 'success.700',
      },
    }),

    // Warning modal
    warning: definePartsStyle({
      dialog: {
        borderTop: '4px solid',
        borderColor: 'warning.500',
      },
      header: {
        color: 'warning.700',
      },
    }),

    // Error modal
    error: definePartsStyle({
      dialog: {
        borderTop: '4px solid',
        borderColor: 'error.500',
      },
      header: {
        color: 'error.700',
      },
    }),

    // Info modal
    info: definePartsStyle({
      dialog: {
        borderTop: '4px solid',
        borderColor: 'info.500',
      },
      header: {
        color: 'info.700',
      },
    }),

    // Alert modal
    alert: definePartsStyle({
      dialog: {
        maxW: '28rem',
        borderTop: '4px solid',
        borderColor: 'warning.500',
      },
      header: {
        color: 'warning.700',
      },
      body: {
        paddingY: 6,
      },
      footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 3,
      },
    }),
  },

  // Sizes
  sizes: {
    xs: definePartsStyle({
      dialog: { maxW: '20rem' },
    }),
    sm: definePartsStyle({
      dialog: { maxW: '24rem' },
    }),
    md: definePartsStyle({
      dialog: { maxW: '32rem' },
    }),
    lg: definePartsStyle({
      dialog: { maxW: '40rem' },
    }),
    xl: definePartsStyle({
      dialog: { maxW: '48rem' },
    }),
    '2xl': definePartsStyle({
      dialog: { maxW: '56rem' },
    }),
    '3xl': definePartsStyle({
      dialog: { maxW: '64rem' },
    }),
    '4xl': definePartsStyle({
      dialog: { maxW: '72rem' },
    }),
    full: definePartsStyle({
      dialog: {
        maxW: '100vw',
        minH: '100vh',
        my: 0,
        borderRadius: 0,
      },
    }),
  },

  // Default values
  defaultProps: {
    size: 'md',
    variant: 'primary',
  },
});

export default Modal; 