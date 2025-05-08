import React from 'react';
import {
  Tooltip,
  TooltipProps,
  PlacementWithLogical,
  useColorModeValue
} from '@chakra-ui/react';

export interface SimpleTooltipProps extends Omit<TooltipProps, 'children'> {
  label: React.ReactNode;
  placement?: PlacementWithLogical;
  children: React.ReactElement;
  hasArrow?: boolean;
  variant?: 'light' | 'dark' | 'auto';
}

export const SimpleTooltip: React.FC<SimpleTooltipProps> = ({
  label,
  placement = 'top',
  children,
  hasArrow = true,
  variant = 'auto',
  ...rest
}) => {
  // Determine colors based on variant and color mode
  const bg = useColorModeValue(
    variant === 'light' || variant === 'auto' ? 'white' : 'gray.700',
    variant === 'dark' || variant === 'auto' ? 'gray.700' : 'white'
  );
  
  const color = useColorModeValue(
    variant === 'light' || variant === 'auto' ? 'gray.800' : 'white',
    variant === 'dark' || variant === 'auto' ? 'white' : 'gray.800'
  );
  
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Tooltip
      label={label}
      placement={placement}
      hasArrow={hasArrow}
      bg={bg}
      color={color}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow="sm"
      px={3}
      py={2}
      {...rest}
    >
      {children}
    </Tooltip>
  );
};