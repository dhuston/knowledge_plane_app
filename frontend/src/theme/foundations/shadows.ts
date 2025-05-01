/**
 * KnowledgePlane AI Shadow System
 * 
 * This file defines the shadow tokens used throughout the application.
 * Shadows provide elevation and depth to UI elements.
 */

const shadows = {
  // Basic shadows with blue undertones for a more modern feel
  'xs': '0 0 0 1px rgba(59, 130, 246, 0.05)',
  'sm': '0 1px 3px rgba(59, 130, 246, 0.08), 0 1px 2px rgba(59, 130, 246, 0.04)',
  'base': '0 1px 4px rgba(59, 130, 246, 0.12), 0 1px 2px rgba(59, 130, 246, 0.06)',
  'md': '0 4px 8px rgba(59, 130, 246, 0.12), 0 2px 4px rgba(59, 130, 246, 0.06)',
  'lg': '0 10px 20px rgba(59, 130, 246, 0.12), 0 3px 6px rgba(59, 130, 246, 0.05)',
  'xl': '0 20px 25px rgba(59, 130, 246, 0.12), 0 10px 10px rgba(59, 130, 246, 0.04)',
  '2xl': '0 25px 50px rgba(59, 130, 246, 0.15)',
  'inner': 'inset 0 2px 4px rgba(59, 130, 246, 0.06)',
  'none': 'none',
  
  // Special shadows for specific states
  'focus': '0 0 0 3px rgba(59, 130, 246, 0.4)',  // Blue focus ring
  
  // Shadows for specific components
  'card': '0 4px 6px rgba(59, 130, 246, 0.08)',                // Same as md but lighter
  'card-hover': '0 8px 12px rgba(59, 130, 246, 0.12)',        // Elevated card on hover
  'dropdown': '0 10px 15px rgba(59, 130, 246, 0.1)',          // Same as lg but lighter
  'modal': '0 20px 25px rgba(59, 130, 246, 0.15)',            // Same as xl but stronger
  'tooltip': '0 4px 6px rgba(59, 130, 246, 0.15)',           // Similar to md but darker
  'popover': '0 10px 15px rgba(59, 130, 246, 0.12)',         // Similar to lg but slightly darker
}

export default shadows;