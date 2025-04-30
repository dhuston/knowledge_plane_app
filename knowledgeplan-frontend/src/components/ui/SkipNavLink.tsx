/**
 * Skip Navigation Link Component
 * 
 * This component provides an accessibility feature that allows keyboard users
 * to skip navigation and jump directly to the main content.
 * It's visually hidden until focused, making it only available to keyboard users.
 */

import React from 'react';
import { Link, useColorModeValue } from '@chakra-ui/react';

interface SkipNavLinkProps {
  /**
   * The ID of the element to skip to (without the #)
   */
  targetId: string;
  
  /**
   * Custom text for the skip link
   */
  text?: string;
  
  /**
   * Z-index for the skip link when focused
   */
  zIndex?: number;
}

/**
 * SkipNavLink Component
 * 
 * Provides a visually hidden link that appears on focus,
 * allowing keyboard users to skip navigation elements.
 */
const SkipNavLink: React.FC<SkipNavLinkProps> = ({
  targetId,
  text = 'Skip to main content',
  zIndex = 10,
}) => {
  // Adapt colors for dark mode support
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('primary.700', 'primary.300');
  
  return (
    <Link
      href={`#${targetId}`}
      position="absolute"
      top="-40px"
      left="0"
      p="3"
      bg={bg}
      color={color}
      fontWeight="semibold"
      outline="none"
      transition="top 0.2s"
      zIndex={zIndex}
      borderRadius="0 0 md md"
      boxShadow="md"
      _focus={{
        top: '0',
        boxShadow: 'outline',
      }}
    >
      {text}
    </Link>
  );
};

export default SkipNavLink;

/**
 * Usage Example:
 * 
 * ```jsx
 * // In your layout component
 * const Layout = ({ children }) => (
 *   <>
 *     <SkipNavLink targetId="main-content" />
 *     <Header />
 *     <Navigation />
 *     <main id="main-content">
 *       {children}
 *     </main>
 *     <Footer />
 *   </>
 * );
 * ```
 */ 