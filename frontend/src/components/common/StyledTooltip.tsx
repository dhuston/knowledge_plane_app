/**
 * StyledTooltip.tsx
 * A consistent tooltip component for the application
 */
import React, { ReactElement } from 'react';
import { Tooltip, TooltipProps } from '@chakra-ui/react';

interface StyledTooltipProps extends Omit<TooltipProps, 'children'> {
  label: string;
  children: ReactElement;
}

/**
 * A consistent tooltip component with standardized styling and behavior
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
      openDelay={300}
      closeDelay={100}
      gutter={10}
      animation="scale"
      bg="gray.700"
      color="white"
      fontSize="sm"
      borderRadius="md"
      {...rest}
    >
      {children}
    </Tooltip>
  );
};