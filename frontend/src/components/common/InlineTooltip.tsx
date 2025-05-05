/**
 * InlineTooltip.tsx
 * A tooltip component that avoids portal usage entirely
 * Now using the SimpleTooltip component for consistent behavior
 */
import React, { ReactElement } from 'react';
import { SimpleTooltip } from '../ui/SimpleTooltip';
import type { SimpleTooltipProps } from '../ui/SimpleTooltip';

interface InlineTooltipProps {
  label: string;
  children: ReactElement;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  isDisabled?: boolean;
  hasArrow?: boolean;
  delay?: number;
}

/**
 * InlineTooltip is now a wrapper around SimpleTooltip for backward compatibility
 */
export const InlineTooltip: React.FC<InlineTooltipProps> = ({
  label,
  children,
  placement = 'right',
  isDisabled = false,
  hasArrow = true,
  delay
}) => {
  // Convert the props to SimpleTooltipProps
  const tooltipProps: Partial<SimpleTooltipProps> = {
    label,
    isDisabled,
    hasArrow,
    placement,
    openDelay: delay,
  };

  return <SimpleTooltip {...tooltipProps}>{children}</SimpleTooltip>;
};