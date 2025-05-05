import React, { ReactNode } from 'react';
import {
  Tooltip,
  TooltipProps,
  forwardRef,
  useColorModeValue
} from '@chakra-ui/react';

export interface SimpleTooltipProps extends Omit<TooltipProps, 'children'> {
  label: string;
  children: ReactNode;
  isDisabled?: boolean;
}

/**
 * SimpleTooltip - A streamlined tooltip component that wraps Chakra UI's Tooltip
 * with consistent styling and behavior across the application.
 */
export const SimpleTooltip = forwardRef<SimpleTooltipProps, 'div'>(
  ({ label, children, isDisabled = false, ...rest }, ref) => {
    // If disabled or no label, just return children
    if (isDisabled || !label) {
      return <>{children}</>;
    }

    return (
      <Tooltip
        label={label}
        hasArrow
        bg={useColorModeValue('gray.700', 'gray.700')}
        color="white"
        borderRadius="md"
        fontSize="xs"
        px={2}
        py={1}
        gutter={8}
        openDelay={400}
        placement="top"
        {...rest}
        ref={ref}
      >
        {children}
      </Tooltip>
    );
  }
);

SimpleTooltip.displayName = 'SimpleTooltip';

export default SimpleTooltip;