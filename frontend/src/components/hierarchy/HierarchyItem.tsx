/**
 * HierarchyItem.tsx
 * Component for displaying individual hierarchy items in the navigator
 */
import React, { useState } from 'react';
import {
  Box,
  IconButton,
  useColorModeValue,
  Badge,
  useDisclosure,
} from '@chakra-ui/react';
import { InlineTooltip } from '../common/InlineTooltip';
import { 
  FiUser, 
  FiUsers, 
  FiBriefcase, 
  FiGrid, 
  FiCompass, 
  FiHome,
  FiLayers,
  FiCpu,
  FiGlobe,
  FiUserPlus 
} from 'react-icons/fi';
import { OrganizationalUnitEntity, OrganizationalUnitTypeEnum, ConnectionStrengthEnum } from '../../types/hierarchy';
import { motion } from 'framer-motion';

// Type imports
import { HierarchyPopover } from './HierarchyPopover';

// Props interface
interface HierarchyItemProps {
  unit: OrganizationalUnitEntity;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
  connectionStrength?: ConnectionStrengthEnum;
}

// Map unit types to more intuitive icons
const getUnitIcon = (type: OrganizationalUnitTypeEnum) => {
  switch (type) {
    case OrganizationalUnitTypeEnum.ORGANIZATION:
      return FiGlobe; // More intuitive than FiCompass - represents global organization
    case OrganizationalUnitTypeEnum.DIVISION:
      return FiLayers; // More intuitive than FiGrid - represents organizational layers
    case OrganizationalUnitTypeEnum.DEPARTMENT:
      return FiBriefcase; // Keep this one, it's intuitive
    case OrganizationalUnitTypeEnum.TEAM:
      return FiUsers; // Keep this one, it's intuitive
    case OrganizationalUnitTypeEnum.USER:
      return FiUser; // Keep this one, it's intuitive
    default:
      return FiBriefcase;
  }
};

// Map connection strength to colors
const getConnectionColor = (strength?: ConnectionStrengthEnum) => {
  switch (strength) {
    case ConnectionStrengthEnum.STRONG:
      return 'green.500';
    case ConnectionStrengthEnum.MEDIUM:
      return 'yellow.500';
    case ConnectionStrengthEnum.WEAK:
      return 'gray.400';
    default:
      return 'transparent';
  }
};

// Get level-specific styling
const getLevelStyles = (level: number) => {
  // Base styles that apply to all levels
  const baseStyles = {};
  
  // Level-specific adjustments
  switch(level) {
    case 0: // Organization
      return {
        ...baseStyles,
        fontSize: '22px',
        fontWeight: 'bold',
      };
    case 1: // Division
      return {
        ...baseStyles,
        fontSize: '20px',
      };
    case 2: // Department
      return {
        ...baseStyles,
        fontSize: '18px',
      };
    case 3: // Team
      return {
        ...baseStyles,
        fontSize: '16px',
      };
    case 4: // User
    default:
      return {
        ...baseStyles,
        fontSize: '14px',
      };
  }
};

export const HierarchyItem: React.FC<HierarchyItemProps> = ({
  unit,
  isActive,
  isExpanded,
  onClick,
  connectionStrength,
}) => {
  // Chakra hooks
  const { isOpen: isPopoverOpen, onOpen: openPopover, onClose: closePopover } = useDisclosure();
  
  // Local state
  const [isHovered, setIsHovered] = useState(false);
  
  // Theme colors
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const activeBgColor = useColorModeValue('gray.100', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');
  const activeColor = useColorModeValue('primary.600', 'primary.300');
  const defaultColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('primary.500', 'primary.300');
  
  // Get icon for unit type
  const UnitIcon = getUnitIcon(unit.type);
  
  // Get connection color
  const connectionColor = getConnectionColor(connectionStrength);
  
  // Get level-specific styles
  const levelStyles = getLevelStyles(unit.level);

  // Visual indicators for level
  const getLevelIndicator = () => {
    // Indentation by level
    const leftPadding = `${unit.level * 4}px`;
    
    return {
      paddingLeft: leftPadding,
      // Scale icon size slightly based on level (higher levels = larger icons)
      transform: `scale(${1.2 - (unit.level * 0.1)})`,
    };
  };
  
  // Handle mouse enter - only affects hover state, doesn't open popover
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  
  // Handle separate click for item selection
  const handleItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };
  
  // Handle separate click for popover activation
  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPopoverOpen) {
      closePopover();
    } else {
      openPopover();
    }
  };
  
  return (
    <Box position="relative">
      <InlineTooltip
        label={unit.name}
        placement="right"
        isDisabled={isPopoverOpen}
      >
        <Box
          as={motion.div}
          width="44px"
          height="44px"
          borderRadius="6px"
          display="flex"
          justifyContent="center"
          alignItems="center"
          bg={isActive ? activeBgColor : bgColor}
          color={isActive ? activeColor : defaultColor}
          cursor="pointer"
          transition="all 0.2s"
          onClick={handleItemClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          _hover={{ bg: hoverBgColor }}
          borderLeft={isActive ? '3px solid' : '0px solid'}
          borderLeftColor={borderColor}
          role="button"
          aria-selected={isActive}
          aria-expanded={isExpanded}
          aria-label={`Select ${unit.name}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          position="relative"
          // Apply level-specific styles
          {...levelStyles}
          // Side border indicator for level hierarchy
          borderRight={`${4 - unit.level}px solid ${unit.level === 0 ? activeColor : 'transparent'}`}
          opacity={1 - (unit.level * 0.1)} // Slightly reduce opacity for deeper levels
        >
          {/* Icon with level-specific sizing */}
          <Box {...getLevelIndicator()}>
            <UnitIcon size={`${20 - (unit.level * 2)}px`} />
          </Box>
          
          {/* Connection strength indicator */}
          {connectionStrength && (
            <Badge
              boxSize="8px"
              borderRadius="full"
              bg={connectionColor}
              position="absolute"
              bottom="3px"
              right="3px"
              border="1px solid"
              borderColor={useColorModeValue('white', 'gray.800')}
            />
          )}
          
          {/* Info button to trigger popover */}
          <Box
            position="absolute"
            top="-4px"
            right="-4px"
            width="14px" 
            height="14px"
            borderRadius="full"
            bg={isHovered ? 'gray.300' : 'transparent'}
            _dark={{ bg: isHovered ? 'gray.600' : 'transparent' }}
            display="flex"
            justifyContent="center"
            alignItems="center"
            fontSize="10px"
            fontWeight="bold"
            cursor="pointer"
            onClick={handleInfoClick}
            opacity={isHovered ? 1 : 0}
            transition="all 0.2s"
            role="button"
            aria-label={`Information about ${unit.name}`}
          >
            i
          </Box>
        </Box>
      </InlineTooltip>
      
      {/* Popover with unit details */}
      {isPopoverOpen && (
        <HierarchyPopover
          unit={unit}
          isOpen={isPopoverOpen}
          onClose={closePopover}
        />
      )}
    </Box>
  );
};