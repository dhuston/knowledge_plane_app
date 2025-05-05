/**
 * Tooltip component theme configuration
 * Provides consistent styling and behavior for all tooltips
 */
export const Tooltip = {
  baseStyle: {
    bg: 'gray.700',
    color: 'white',
    borderRadius: 'md',
    fontWeight: 'normal',
    fontSize: 'xs',
    px: 2,
    py: 1,
    boxShadow: 'md',
    maxW: '320px',
    '--popper-arrow-bg': 'var(--chakra-colors-gray-700)',
  },
  defaultProps: {
    hasArrow: true,
    openDelay: 400,
    placement: 'top',
    gutter: 8,
  },
};

export default Tooltip;