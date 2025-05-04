import React from 'react';
import { Box } from '@chakra-ui/react';

interface AtomIconProps {
  size?: number;
  color?: string;
}

const AtomIcon: React.FC<AtomIconProps> = ({ size = 24, color = "#FF5A5F" }) => {
  return (
    <Box 
      width={`${size}px`} 
      height={`${size}px`} 
      minWidth={`${size}px`}
      minHeight={`${size}px`}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 32 32" 
        width="100%" 
        height="100%"
        style={{ minWidth: size, minHeight: size }}
      >
        {/* Electron orbits */}
        <ellipse cx="16" cy="16" rx="15" ry="6" fill="none" stroke={color} strokeWidth="1" transform="rotate(60 16 16)"/>
        <ellipse cx="16" cy="16" rx="15" ry="6" fill="none" stroke={color} strokeWidth="1" transform="rotate(0 16 16)"/>
        <ellipse cx="16" cy="16" rx="15" ry="6" fill="none" stroke={color} strokeWidth="1" transform="rotate(-60 16 16)"/>
        
        {/* Nucleus */}
        <circle cx="16" cy="16" r="4" fill={color}/>
        
        {/* Electrons */}
        <circle cx="30" cy="16" r="1.5" fill={color}/>
        <circle cx="9" cy="27" r="1.5" fill={color}/>
        <circle cx="9" cy="5" r="1.5" fill={color}/>
      </svg>
    </Box>
  );
};

export default AtomIcon;