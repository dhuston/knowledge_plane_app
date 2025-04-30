/**
 * KnowledgePlane AI Shadow System
 * 
 * Defines box shadows used throughout the application for elevation and focus states.
 */

const shadows = {
  // Base shadows for different elevation levels
  'xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
  'sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
  'md': '0 4px 6px rgba(0, 0, 0, 0.1)',
  'lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
  'xl': '0 20px 25px rgba(0, 0, 0, 0.15)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
  'inner': 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  'none': 'none',
  
  // Special shadows for specific states
  'focus': '0 0 0 3px rgba(66, 153, 225, 0.5)',  // Blue focus ring
  
  // Shadows for specific components
  'card': '0 4px 6px rgba(0, 0, 0, 0.1)',                // Same as md
  'card-hover': '0 8px 12px rgba(0, 0, 0, 0.15)',        // Elevated card on hover
  'dropdown': '0 10px 15px rgba(0, 0, 0, 0.1)',          // Same as lg
  'modal': '0 20px 25px rgba(0, 0, 0, 0.15)',            // Same as xl
  'tooltip': '0 4px 6px rgba(0, 0, 0, 0.15)',           // Similar to md but darker
  'popover': '0 10px 15px rgba(0, 0, 0, 0.12)',         // Similar to lg but slightly darker
}

export default shadows; 