/**
 * containerStyles.ts
 * Container and layout styles for hierarchy components
 */

// Navigator container style
export const navigatorStyles = {
  width: '64px',
  height: '100%',
  borderRightWidth: '1px',
  borderRightStyle: 'solid',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  borderRadius: '0px 4px 4px 0px',
  padding: '12px 8px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'space-between',
};

// Popover style variants
export const popoverStyles = {
  // Default container
  container: {
    width: '240px',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  
  // Header section
  header: {
    px: 4,
    py: 3,
    borderBottomWidth: '1px',
  },
  
  // Body and content
  body: {
    p: 4,
  },
  
  // Footer with actions
  footer: {
    p: 3,
    borderTopWidth: '1px',
  },
  
  // Motion variants for framer-motion
  motion: {
    initial: { opacity: 0, scale: 0.95, x: -10 },
    animate: { opacity: 1, scale: 1, x: 0, transition: { duration: 0.25, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } },
  },
};

// Search popover styles
export const searchPopoverStyles = {
  container: {
    width: '280px',
    maxHeight: '400px',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  
  resultItem: {
    p: 2,
    borderRadius: 'md',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  
  filterButton: {
    flex: 1,
    fontSize: 'xs',
  },
};

// Z-index values for proper layering
export const zIndices = {
  navigator: 10,
  popover: 20,
  modal: 30,
};