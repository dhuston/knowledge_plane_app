/**
 * HierarchyPopover.tsx
 * Component that displays detailed information about an organizational unit
 */
import React from 'react';
import {
  Box,
  Heading,
  Button,
  useColorModeValue,
  Popover,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  PopoverFooter,
  Portal,
  Icon,
} from '@chakra-ui/react';
import { FiChevronRight } from 'react-icons/fi';

// Import types
import { 
  OrganizationalUnitEntity, 
  OrganizationalUnitTypeEnum 
} from '../../types/hierarchy';

// Import specialized popovers
import { TeamPopover } from './popovers/TeamPopover';
import { DepartmentPopover } from './popovers/DepartmentPopover';
import { OrganizationPopover } from './popovers/OrganizationPopover';
import { UserPopover } from './popovers/UserPopover';

// Props interface
interface HierarchyPopoverProps {
  unit: OrganizationalUnitEntity;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Component for rendering a popover with organizational unit details
 */
export const HierarchyPopover: React.FC<HierarchyPopoverProps> = ({
  unit,
  isOpen,
  onClose,
}) => {
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.700');
  
  // Get view button label based on unit type
  const getViewButtonLabel = () => {
    switch (unit.type) {
      case OrganizationalUnitTypeEnum.USER:
        return 'View Profile';
      case OrganizationalUnitTypeEnum.TEAM:
        return 'View Team';
      case OrganizationalUnitTypeEnum.DEPARTMENT:
        return 'View Department';
      case OrganizationalUnitTypeEnum.DIVISION:
        return 'View Division';
      case OrganizationalUnitTypeEnum.ORGANIZATION:
        return 'View Organization';
      default:
        return 'View Details';
    }
  };
  
  // Render the appropriate content based on unit type
  const renderPopoverContent = () => {
    switch (unit.type) {
      case OrganizationalUnitTypeEnum.TEAM:
        return <TeamPopover unit={unit} />;
        
      case OrganizationalUnitTypeEnum.DEPARTMENT:
        return <DepartmentPopover unit={unit} />;
        
      case OrganizationalUnitTypeEnum.ORGANIZATION:
      case OrganizationalUnitTypeEnum.DIVISION:
        return <OrganizationPopover unit={unit} />;
        
      case OrganizationalUnitTypeEnum.USER:
        return <UserPopover unit={unit} />;
        
      default:
        // Fallback content
        return <Box>No details available for this unit type</Box>;
    }
  };
  
  return (
    <Portal>
      <Popover
        isOpen={isOpen}
        onClose={onClose}
        placement="right"
        closeOnBlur={true}
        closeOnEsc={true}
        gutter={12} // Gap between the trigger and the popover
        returnFocusOnClose={true}
      >
        <PopoverContent
          width="240px"
          bg={bgColor}
          borderColor={borderColor}
          borderRadius="6px"
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
          _focus={{ outline: 'none' }}
        >
          <PopoverArrow />
          <Box px={4} py={3} borderBottomWidth="1px" borderColor={borderColor}>
            <Heading size="xs">{unit.name}</Heading>
          </Box>
          <PopoverBody p={4}>
            {renderPopoverContent()}
          </PopoverBody>
          <PopoverFooter p={3} borderTopWidth="1px" borderColor={borderColor}>
            <Button
              size="sm"
              width="100%"
              variant="ghost"
              rightIcon={<Icon as={FiChevronRight} />}
              _hover={{ bg: buttonHoverBg }}
            >
              {getViewButtonLabel()}
            </Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    </Portal>
  );
};