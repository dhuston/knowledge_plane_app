/**
 * HierarchyItem.tsx
 * Component for displaying individual hierarchy items in the navigator
 */
import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  useColorModeValue,
  Badge,
  useDisclosure,
} from '@chakra-ui/react';
import { FiUser, FiUsers, FiBriefcase, FiHome, FiGrid, FiCompass } from 'react-icons/fi';
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

// Map unit types to icons
const getUnitIcon = (type: OrganizationalUnitTypeEnum) => {
  switch (type) {
    case OrganizationalUnitTypeEnum.ORGANIZATION:
      return FiCompass;
    case OrganizationalUnitTypeEnum.DIVISION:
      return FiGrid;
    case OrganizationalUnitTypeEnum.DEPARTMENT:
      return FiBriefcase;
    case OrganizationalUnitTypeEnum.TEAM:
      return FiUsers;
    case OrganizationalUnitTypeEnum.USER:
      return FiUser;
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
  
  // Handle mouse enter/leave for hover state
  const handleMouseEnter = () => {
    setIsHovered(true);
    openPopover();
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    closePopover();
  };
  
  return (
    <Box position="relative">
      <Tooltip
        label={unit.name}
        placement="right"
        isDisabled={isPopoverOpen}
        hasArrow
        openDelay={0}
        animation="none"
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
          onClick={onClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          _hover={{ bg: hoverBgColor }}
          borderLeft={isActive ? '3px solid' : '0px solid'}
          borderLeftColor={borderColor}
          role="button"
          aria-selected={isActive}
          aria-expanded={isExpanded}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <UnitIcon size="20px" />
          
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
        </Box>
      </Tooltip>
      
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