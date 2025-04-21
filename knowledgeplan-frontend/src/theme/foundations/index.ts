// KnowledgePlane AI Theme Foundations
// Export all foundational design tokens

import colors from './colors';
import typography from './typography';
import spacing from './spacing';
import radii from './radii';
import shadows from './shadows';
import animations from './animations';

const foundations = {
  colors,
  ...typography,
  ...spacing,
  radii,
  shadows,
  ...animations,
};

export default foundations; 