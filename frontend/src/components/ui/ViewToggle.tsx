import React from 'react';
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { FiHome, FiMap } from 'react-icons/fi';

interface ViewToggleProps {
  /**
   * Current active view
   */
  activeView: 'myWork' | 'explore';

  /**
   * Callback when view is changed
   */
  onViewChange: (view: 'myWork' | 'explore') => void;
}

/**
 * ViewToggle
 *
 * A toggle component for switching between "My Work" and "Explore" views
 * with a smooth sliding animation
 */
const ViewToggle: React.FC<ViewToggleProps> = ({
  activeView,
  onViewChange,
}) => {
  // Colors adapt based on color mode
  const bgColor = useColorModeValue('secondary.400', '#363636'); // Off-white/cream : Lighter button color
  const activeBgColor = useColorModeValue('surface.500', '#464646'); // White : Even lighter button color
  const textColor = useColorModeValue('#565656', 'secondary.300'); // Button variant : Lighter off-white
  const activeTextColor = useColorModeValue('#262626', 'secondary.400'); // Button color : Off-white/cream
  const borderColor = useColorModeValue('primary.300', 'primary.600'); // Light mint green : Sage green
  const activeBorderColor = useColorModeValue('#262626', 'secondary.400'); // Button color : Off-white/cream
  const shadowColor = useColorModeValue('rgba(197, 212, 202, 0.15)', 'rgba(141, 162, 148, 0.15)'); // Light mint green : Sage green with transparency

  return (
    <Flex
      bg={bgColor}
      borderRadius="full"
      p={1}
      width="380px"
      position="relative"
      justifyContent="space-between"
      boxShadow={`0 2px 6px ${shadowColor}`}
      borderWidth="1px"
      borderColor={borderColor}
      overflow="hidden" // Ensure the sliding background doesn't overflow
    >
      {/* Sliding background - this is the element that moves */}
      <Box
        position="absolute"
        top="1px"
        height="calc(100% - 2px)"
        width="50%"
        bg={activeBgColor}
        borderRadius="full"
        left={activeView === 'myWork' ? '1px' : 'calc(50% - 1px)'}
        transition="left 0.3s ease"
        boxShadow={`0 2px 4px ${shadowColor}`}
        borderWidth="1px"
        borderColor={activeBorderColor}
        zIndex={0}
      />

      {/* My Work Option */}
      <Box
        as="button"
        py={2}
        px={2}
        borderRadius="full"
        flex="1"
        textAlign="center"
        color={activeView === 'myWork' ? activeTextColor : textColor}
        fontWeight={activeView === 'myWork' ? 'medium' : 'normal'}
        transition="all 0.2s"
        onClick={() => onViewChange('myWork')}
        zIndex={1}
        position="relative" // Needed to appear above the sliding background
        bg="transparent" // Remove background as it's handled by the sliding element
        borderWidth="0"   // Remove border as it's handled by the sliding element
        _hover={{
          color: activeTextColor,
        }}
      >
        <Flex align="center" justify="center">
          <Icon as={FiHome} mr={1} />
          <Text fontSize="sm">My Work</Text>
        </Flex>
      </Box>

      {/* Explore Option */}
      <Box
        as="button"
        py={2}
        px={2}
        borderRadius="full"
        flex="1"
        textAlign="center"
        color={activeView === 'explore' ? activeTextColor : textColor}
        fontWeight={activeView === 'explore' ? 'medium' : 'normal'}
        transition="all 0.2s"
        onClick={() => onViewChange('explore')}
        zIndex={1}
        position="relative" // Needed to appear above the sliding background
        bg="transparent" // Remove background as it's handled by the sliding element
        borderWidth="0"   // Remove border as it's handled by the sliding element
        _hover={{
          color: activeTextColor,
        }}
      >
        <Flex align="center" justify="center">
          <Icon as={FiMap} mr={1} />
          <Text fontSize="sm">Explore</Text>
        </Flex>
      </Box>

    </Flex>
  );
};

export default ViewToggle;
