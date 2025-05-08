/**
 * Map core components index
 * Export all core map components for easy importing
 */

// Core components
export { default as LivingMap } from './LivingMap';
export { default as SigmaGraphLoader } from './SigmaGraphLoader';

// Controls
export { default as MapControls } from './controls/MapControls';

// Tooltips
export { default as NodeTooltip } from './tooltips/NodeTooltip';

// Layouts
export { createLayoutEngine, defaultLayoutEngine } from './layouts';
export type { 
  LayoutType, 
  LayoutOptions, 
  CircularLayoutOptions,
  GridLayoutOptions,
  RadialLayoutOptions,
  ClusterLayoutOptions,
  ForceAtlas2Options
} from './layouts';

// Styles
export { 
  nodeStyles, 
  edgeStyles, 
  getEdgeStyleByNodeTypes,
  getAdaptiveNodeSize,
  getProgressColor,
  getStatusColor
} from './styles/MapStyles';

export type { NodeStyle, EdgeStyle } from './styles/MapStyles';

// Renderers
export { default as createNodeRenderer } from './renderers/NodeRenderer';

// Backwards compatibility aliases for legacy code
// These exports map old component names to new implementations
export { default as WebGLMap } from './LivingMap';
export { default as MapWithAnalytics } from './LivingMap';
export { default as BasicMap } from './LivingMap';