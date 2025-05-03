/**
 * StyledTooltip.tsx
 * A consistent tooltip component for the application without animations
 */
import React, { ReactElement } from 'react';
import { Tooltip, TooltipProps } from '@chakra-ui/react';

interface StyledTooltipProps extends Omit<TooltipProps, 'children'> {
  label: string;
  children: ReactElement;
}

/**
 * A consistent tooltip component with standardized styling and immediate appearance
 */
export const StyledTooltip: React.FC<StyledTooltipProps> = ({
  label,
  children,
  placement = 'right',
  ...rest
}) => {
  return (
    <Tooltip
      label={label}
      placement={placement}
      hasArrow
      openDelay={0}
      closeDelay={0}
      animation="none"
      offset={[0, 0]}
      bg="gray.700"
      color="white"
      fontSize="sm"
      borderRadius="md"
      portalProps={{ appendToParentPortal: false }}
      {...rest}
    >
      {children}
    </Tooltip>
  );
};