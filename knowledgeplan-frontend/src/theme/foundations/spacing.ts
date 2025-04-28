/**
 * KnowledgePlane AI Spacing System
 * 
 * This file defines the spacing values used throughout the application.
 * - Base scale for consistent spacing increments
 * - Named spacings for semantic usage
 * - Layout-specific spacings for components and sections
 */

// Base spacing scale (rem-based for accessibility)
// Uses a 4px (0.25rem) base unit, scaling up with a consistent pattern
export const spacing = {
  // Absolute zero spacing
  '0': '0',
  
  // Core spacing scale
  '0.5': '0.125rem',  // 2px
  '1': '0.25rem',     // 4px
  '1.5': '0.375rem',  // 6px
  '2': '0.5rem',      // 8px
  '2.5': '0.625rem',  // 10px
  '3': '0.75rem',     // 12px
  '3.5': '0.875rem',  // 14px
  '4': '1rem',        // 16px
  '5': '1.25rem',     // 20px
  '6': '1.5rem',      // 24px
  '7': '1.75rem',     // 28px
  '8': '2rem',        // 32px
  '9': '2.25rem',     // 36px
  '10': '2.5rem',     // 40px
  '11': '2.75rem',    // 44px
  '12': '3rem',       // 48px
  '14': '3.5rem',     // 56px
  '16': '4rem',       // 64px
  '20': '5rem',       // 80px
  '24': '6rem',       // 96px
  '28': '7rem',       // 112px
  '32': '8rem',       // 128px
  '36': '9rem',       // 144px
  '40': '10rem',      // 160px
  '44': '11rem',      // 176px
  '48': '12rem',      // 192px
  '52': '13rem',      // 208px
  '56': '14rem',      // 224px
  '60': '15rem',      // 240px
  '64': '16rem',      // 256px
  '72': '18rem',      // 288px
  '80': '20rem',      // 320px
  '96': '24rem',      // 384px
};

// Semantic spacing aliases 
// These provide meaningful names for common spacing values
export const semanticSpacing = {
  // Element spacings (within components)
  elementXxs: spacing['0.5'],  // Minimal spacing within tight elements
  elementXs: spacing['1'],     // Extra small element spacing
  elementSm: spacing['2'],     // Small element spacing 
  elementMd: spacing['3'],     // Medium element spacing
  elementLg: spacing['4'],     // Large element spacing
  elementXl: spacing['6'],     // Extra large element spacing
  
  // Component spacings (between components)
  componentXs: spacing['2'],   // Extra small component spacing
  componentSm: spacing['4'],   // Small component spacing
  componentMd: spacing['6'],   // Medium component spacing
  componentLg: spacing['8'],   // Large component spacing
  componentXl: spacing['12'],  // Extra large component spacing
  
  // Section spacings (between larger sections)
  sectionXs: spacing['6'],     // Extra small section spacing
  sectionSm: spacing['8'],     // Small section spacing
  sectionMd: spacing['12'],    // Medium section spacing
  sectionLg: spacing['16'],    // Large section spacing
  sectionXl: spacing['24'],    // Extra large section spacing
  
  // Page spacings (page margins, large containers)
  pageXs: spacing['4'],        // Extra small page margin
  pageSm: spacing['6'],        // Small page margin
  pageMd: spacing['8'],        // Medium page margin
  pageLg: spacing['10'],       // Large page margin
  pageXl: spacing['16'],       // Extra large page margin
};

// Component-specific spacing
export const componentSpacing = {
  // Form elements
  inputPaddingX: spacing['3'],
  inputPaddingY: spacing['2'],
  inputMarginBottom: spacing['4'],
  labelMarginBottom: spacing['1'],
  
  // Buttons
  buttonPaddingX: spacing['4'],
  buttonPaddingY: spacing['2'],
  buttonSmPaddingX: spacing['3'],
  buttonSmPaddingY: spacing['1'],
  buttonLgPaddingX: spacing['6'],
  buttonLgPaddingY: spacing['3'],
  buttonGroupGap: spacing['2'],
  
  // Cards
  cardPadding: spacing['4'],
  cardHeaderPadding: spacing['3'],
  cardBodyPadding: spacing['4'],
  cardFooterPadding: spacing['3'],
  
  // Navigation
  navItemPaddingX: spacing['3'],
  navItemPaddingY: spacing['2'],
  navItemGap: spacing['1'],
  
  // Dialog/Modal
  modalPadding: spacing['6'],
  modalHeaderPadding: spacing['4'],
  modalBodyPadding: spacing['6'],
  modalFooterPadding: spacing['4'],
  
  // Tables
  tableCellPaddingX: spacing['3'],
  tableCellPaddingY: spacing['2'],
  tableHeaderPaddingX: spacing['3'],
  tableHeaderPaddingY: spacing['2'],
  
  // Lists
  listItemPaddingY: spacing['2'],
  listItemGap: spacing['1'],
  
  // Alerts/Notifications
  alertPadding: spacing['4'],
  
  // Tabs
  tabPaddingX: spacing['4'],
  tabPaddingY: spacing['2'],
  
  // Tooltips
  tooltipPadding: spacing['2'],
};

// Layout specific spacings
export const layoutSpacing = {
  // Page container
  containerPaddingX: semanticSpacing.pageMd,
  containerMaxWidth: '1280px',
  
  // Grid system
  gridGap: spacing['4'],
  gridGapSm: spacing['2'],
  gridGapLg: spacing['6'],
  
  // Sidebar
  sidebarWidth: spacing['64'],
  sidebarCollapsedWidth: spacing['16'],
  sidebarPadding: spacing['4'],
  
  // Header
  headerHeight: spacing['16'],
  headerPaddingX: spacing['4'],
  headerPaddingY: spacing['2'],
  
  // Footer
  footerPaddingX: spacing['6'],
  footerPaddingY: spacing['8'],
  
  // Main content area
  mainPadding: spacing['6'],
};

export default {
  spacing,
  semanticSpacing,
  componentSpacing,
  layoutSpacing,
}; 