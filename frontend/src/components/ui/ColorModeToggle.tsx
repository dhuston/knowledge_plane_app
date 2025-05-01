/**
 * Color Mode Toggle Component
 * 
 * This component provides a button to toggle between light and dark mode.
 * It respects the user's system preferences while allowing manual override.
 */

import React from 'react';
import { IconButton, useColorMode, useColorModeValue, Tooltip } from '@chakra-ui/react';
import { MdLightMode, MdDarkMode } from 'react-icons/md';

interface ColorModeToggleProps {
  /**
   * Size of the toggle button (xs, sm, md, lg)
   */
  size?: 'xs' | 'sm' | 'md' | 'lg';

  /**
   * Whether to show tooltip on hover
   */
  showTooltip?: boolean;
  
  /**
   * Additional props to pass to the IconButton
   */
  buttonProps?: React.ComponentProps<typeof IconButton>;
}

/**
 * ColorModeToggle
 * 
 * Button that toggles between light and dark mode with appropriate icons
 */
const ColorModeToggle: React.FC<ColorModeToggleProps> = ({
  size = 'md',
  showTooltip = true,
  buttonProps,
}) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  
  // Colors adapt based on color mode
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('gray.800', 'yellow.300');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  
  // Tooltip text changes based on current mode
  const tooltipLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  
  const toggle = (
    <IconButton
      aria-label={tooltipLabel}
      icon={isDark ? <MdLightMode /> : <MdDarkMode />}
      onClick={toggleColorMode}
      variant="ghost"
      size={size}
      color={color}
      bg={bg}
      _hover={{
        bg: hoverBg,
      }}
      {...buttonProps}
    />
  );
  
  // Conditionally wrap with tooltip
  if (showTooltip) {
    return (
      <Tooltip label={tooltipLabel} hasArrow placement="bottom">
        {toggle}
      </Tooltip>
    );
  }
  
  return toggle;
};

export default ColorModeToggle;

/**
 * Usage Example:
 * 
 * ```jsx
 * // In your Header component
 * const Header = () => (
 *   <Flex as="header" p={4} justifyContent="space-between">
 *     <Logo />
 *     <Flex gap={2}>
 *       <ColorModeToggle />
 *       <UserMenu />
 *     </Flex>
 *   </Flex>
 * );
 * ```
 */ 