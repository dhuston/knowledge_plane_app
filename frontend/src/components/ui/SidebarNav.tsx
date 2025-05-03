import React, { useState } from 'react';
import {
  VStack,
  Icon,
  Box,
  Divider,
  useColorModeValue,
  IconButton,
  Text,
  Flex,
  HStack,
  Badge,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react';
import { StyledTooltip } from '../common/StyledTooltip';
import {
  FiHome,
  FiUsers,
  FiFolder,
  FiBook,
  FiPieChart,
  FiTarget,
  FiStar,
  FiSettings,
  FiMap,
  FiGrid,
  FiChevronRight,
  FiClock,
  FiActivity,
  FiSearch,
  FiCommand,
} from 'react-icons/fi';
import { MdOutlineInsights } from 'react-icons/md';
import { NavLink, useLocation } from 'react-router-dom';

// Different workspace view types
type WorkspaceViewType = 'command-center' | 'map-focus' | 'grid';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  group?: string;
  badge?: string | number;
  badgeColor?: string;
  isNew?: boolean;
  children?: NavItem[];
}

interface SidebarNavProps {
  onViewChange?: (view: WorkspaceViewType) => void;
  activeView?: WorkspaceViewType;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  onViewChange = () => {},
  activeView = 'command-center'
}) => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const { isOpen: isRecentOpen, onToggle: onRecentToggle } = useDisclosure();

  // Enhanced primary items with badges and nested items
  const primaryItems: NavItem[] = [
    { label: 'Home', icon: FiHome, path: '/' },
    {
      label: 'Teams',
      icon: FiUsers,
      path: '/teams',
      badge: 3,
      badgeColor: 'blue',
      children: [
        { label: 'Design Team', icon: FiUsers, path: '/teams/design' },
        { label: 'Engineering', icon: FiUsers, path: '/teams/engineering' },
        { label: 'Marketing', icon: FiUsers, path: '/teams/marketing' },
      ]
    },
    {
      label: 'Projects',
      icon: FiFolder,
      path: '/projects',
      badge: 2,
      badgeColor: 'orange',
      children: [
        { label: 'Active Projects', icon: FiFolder, path: '/projects/active' },
        { label: 'Completed', icon: FiFolder, path: '/projects/completed' },
        { label: 'Archived', icon: FiFolder, path: '/projects/archived' },
      ]
    },
    {
      label: 'Goals',
      icon: FiTarget,
      path: '/goals',
      isNew: true,
    },
  ];

  // Enhanced insight items with badges
  const insightItems: NavItem[] = [
    {
      label: 'Insights',
      icon: MdOutlineInsights,
      path: '/insights',
      badge: 5,
      badgeColor: 'purple',
    },
    { label: 'Analytics', icon: FiPieChart, path: '/analytics' },
    { label: 'Activity', icon: FiActivity, path: '/activity', isNew: true },
  ];

  // Enhanced resource items
  const resourceItems: NavItem[] = [
    { label: 'Knowledge Base', icon: FiBook, path: '/knowledge' },
    { label: 'Favorites', icon: FiStar, path: '/favorites' },
    { label: 'Settings', icon: FiSettings, path: '/settings' },
  ];

  // Recent items for quick access
  const recentItems: NavItem[] = [
    { label: 'Design Team Meeting', icon: FiClock, path: '/teams/design/meetings/123' },
    { label: 'Q3 Strategy Document', icon: FiClock, path: '/knowledge/docs/456' },
    { label: 'Project Alpha', icon: FiClock, path: '/projects/789' },
  ];

  // Enhanced styling variables for better visual hierarchy
  const iconColor = useColorModeValue('gray.600', 'gray.400');
  const activeColor = useColorModeValue('primary.500', 'primary.300');
  const activeBgColor = useColorModeValue('primary.50', 'primary.900');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');
  const dividerColor = useColorModeValue('gray.200', 'gray.700');
  const badgeBg = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.200');
  const newBadgeBg = useColorModeValue('green.100', 'green.800');
  const newBadgeColor = useColorModeValue('green.800', 'green.100');
  const expandedBg = useColorModeValue('white', 'gray.800');
  const expandedShadow = useColorModeValue('lg', 'dark-lg');
  const expandedBorder = useColorModeValue('gray.200', 'gray.700');

  // Render nav item with enhanced styling and features
  const renderNavItem = (item: NavItem, isChild = false) => {
    const isActive = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path));

    // For compact mode (icon only)
    if (!isExpanded && !isChild) {
      return (
        <Box key={item.path} position="relative" w="full">
          <StyledTooltip
            label={item.label}
            placement="right"
            hasArrow
          >
            <IconButton
              as={NavLink}
              to={item.path}
              aria-label={item.label}
              icon={<Icon as={item.icon} boxSize={5} />}
              variant="ghost"
              colorScheme={isActive ? 'primary' : 'gray'}
              color={isActive ? activeColor : iconColor}
              bg={isActive ? activeBgColor : 'transparent'}
              size="lg"
              borderRadius="lg"
              _hover={{ bg: hoverBgColor }}
              _active={{ bg: activeBgColor }}
              w="full"
            />
          </StyledTooltip>

          {/* Badge indicator */}
          {item.badge && (
            <Badge
              position="absolute"
              top="0"
              right="0"
              transform="translate(30%, -30%)"
              borderRadius="full"
              colorScheme={item.badgeColor || 'gray'}
              fontSize="xs"
              minW="18px"
              h="18px"
              textAlign="center"
              p="2px"
            >
              {item.badge}
            </Badge>
          )}

          {/* New indicator */}
          {item.isNew && !item.badge && (
            <Box
              position="absolute"
              top="0"
              right="0"
              transform="translate(30%, -30%)"
              borderRadius="full"
              bg={newBadgeBg}
              w="8px"
              h="8px"
            />
          )}
        </Box>
      );
    }

    // For expanded mode or child items
    return (
      <Box key={item.path} w="full" position="relative">
        <Flex
          as={NavLink}
          to={item.path}
          px={3}
          py={2}
          borderRadius="md"
          align="center"
          justify="space-between"
          bg={isActive ? activeBgColor : 'transparent'}
          color={isActive ? activeColor : textColor}
          _hover={{ bg: hoverBgColor }}
          _active={{ bg: activeBgColor }}
          role="group"
          transition="all 0.2s"
          fontWeight={isActive ? "medium" : "normal"}
          pl={isChild ? 8 : 3}
        >
          <HStack spacing={3}>
            <Icon
              as={item.icon}
              boxSize={isChild ? 4 : 5}
              color={isActive ? activeColor : iconColor}
              _groupHover={{ color: activeColor }}
            />
            <Text fontSize={isChild ? "sm" : "md"}>{item.label}</Text>

            {/* New indicator as text */}
            {item.isNew && (
              <Badge
                colorScheme="green"
                variant="subtle"
                fontSize="xs"
                borderRadius="full"
              >
                New
              </Badge>
            )}
          </HStack>

          {/* Badge or children indicator */}
          {(item.badge || item.children) && (
            <Flex align="center">
              {item.badge && (
                <Badge
                  borderRadius="full"
                  colorScheme={item.badgeColor || 'gray'}
                  fontSize="xs"
                  minW="20px"
                  textAlign="center"
                >
                  {item.badge}
                </Badge>
              )}

              {item.children && (
                <Icon
                  as={FiChevronRight}
                  boxSize={4}
                  ml={1}
                  transform={isActive ? "rotate(90deg)" : "none"}
                  transition="transform 0.2s"
                />
              )}
            </Flex>
          )}
        </Flex>

        {/* Render children if active */}
        {item.children && isActive && (
          <VStack align="start" spacing={1} mt={1} w="full">
            {item.children.map(child => renderNavItem(child, true))}
          </VStack>
        )}
      </Box>
    );
  };

  // Enhanced view controls with better visual hierarchy
  const renderViewControls = () => {
    // For compact mode (icon only)
    if (!isExpanded) {
      return (
        <VStack spacing={2} w="full">
          <StyledTooltip label="Command Center View" placement="right" hasArrow>
            <IconButton
              aria-label="Command Center View"
              icon={<Icon as={FiHome} boxSize={5} />}
              variant="ghost"
              colorScheme={activeView === 'command-center' ? 'primary' : 'gray'}
              color={activeView === 'command-center' ? activeColor : iconColor}
              bg={activeView === 'command-center' ? activeBgColor : 'transparent'}
              size="lg"
              borderRadius="lg"
              _hover={{ bg: hoverBgColor }}
              _active={{ bg: activeBgColor }}
              w="full"
              onClick={() => onViewChange('command-center')}
            />
          </StyledTooltip>

          <StyledTooltip label="Map Focus View" placement="right" hasArrow>
            <IconButton
              aria-label="Map Focus View"
              icon={<Icon as={FiMap} boxSize={5} />}
              variant="ghost"
              colorScheme={activeView === 'map-focus' ? 'primary' : 'gray'}
              color={activeView === 'map-focus' ? activeColor : iconColor}
              bg={activeView === 'map-focus' ? activeBgColor : 'transparent'}
              size="lg"
              borderRadius="lg"
              _hover={{ bg: hoverBgColor }}
              _active={{ bg: activeBgColor }}
              w="full"
              onClick={() => onViewChange('map-focus')}
            />
          </StyledTooltip>

          <StyledTooltip label="Grid View" placement="right" hasArrow>
            <IconButton
              aria-label="Grid View"
              icon={<Icon as={FiGrid} boxSize={5} />}
              variant="ghost"
              colorScheme={activeView === 'grid' ? 'primary' : 'gray'}
              color={activeView === 'grid' ? activeColor : iconColor}
              bg={activeView === 'grid' ? activeBgColor : 'transparent'}
              size="lg"
              borderRadius="lg"
              _hover={{ bg: hoverBgColor }}
              _active={{ bg: activeBgColor }}
              w="full"
              onClick={() => onViewChange('grid')}
            />
          </StyledTooltip>

          <StyledTooltip label="Command Palette (⌘K)" placement="right" hasArrow>
            <IconButton
              aria-label="Command Palette"
              icon={<Icon as={FiCommand} boxSize={5} />}
              variant="ghost"
              colorScheme="gray"
              color={iconColor}
              bg="transparent"
              size="lg"
              borderRadius="lg"
              _hover={{ bg: hoverBgColor }}
              _active={{ bg: activeBgColor }}
              w="full"
              onClick={() => {/* Open command palette */}}
            />
          </StyledTooltip>

          <StyledTooltip label="Search (⌘F)" placement="right" hasArrow>
            <IconButton
              aria-label="Search"
              icon={<Icon as={FiSearch} boxSize={5} />}
              variant="ghost"
              colorScheme="gray"
              color={iconColor}
              bg="transparent"
              size="lg"
              borderRadius="lg"
              _hover={{ bg: hoverBgColor }}
              _active={{ bg: activeBgColor }}
              w="full"
              onClick={() => {/* Open search */}}
            />
          </StyledTooltip>
        </VStack>
      );
    }

    // For expanded mode
    return (
      <VStack spacing={2} w="full" align="start">
        <Text fontSize="xs" fontWeight="medium" color={secondaryTextColor} px={3} pt={2}>
          WORKSPACE VIEWS
        </Text>

        <Flex
          px={3}
          py={2}
          borderRadius="md"
          align="center"
          justify="space-between"
          bg={activeView === 'command-center' ? activeBgColor : 'transparent'}
          color={activeView === 'command-center' ? activeColor : textColor}
          _hover={{ bg: hoverBgColor }}
          w="full"
          cursor="pointer"
          onClick={() => onViewChange('command-center')}
          fontWeight={activeView === 'command-center' ? "medium" : "normal"}
        >
          <HStack spacing={3}>
            <Icon
              as={FiHome}
              boxSize={5}
              color={activeView === 'command-center' ? activeColor : iconColor}
            />
            <Text>Command Center</Text>
          </HStack>
        </Flex>

        <Flex
          px={3}
          py={2}
          borderRadius="md"
          align="center"
          justify="space-between"
          bg={activeView === 'map-focus' ? activeBgColor : 'transparent'}
          color={activeView === 'map-focus' ? activeColor : textColor}
          _hover={{ bg: hoverBgColor }}
          w="full"
          cursor="pointer"
          onClick={() => onViewChange('map-focus')}
          fontWeight={activeView === 'map-focus' ? "medium" : "normal"}
        >
          <HStack spacing={3}>
            <Icon
              as={FiMap}
              boxSize={5}
              color={activeView === 'map-focus' ? activeColor : iconColor}
            />
            <Text>Living Map</Text>
          </HStack>
        </Flex>

        <Flex
          px={3}
          py={2}
          borderRadius="md"
          align="center"
          justify="space-between"
          bg={activeView === 'grid' ? activeBgColor : 'transparent'}
          color={activeView === 'grid' ? activeColor : textColor}
          _hover={{ bg: hoverBgColor }}
          w="full"
          cursor="pointer"
          onClick={() => onViewChange('grid')}
          fontWeight={activeView === 'grid' ? "medium" : "normal"}
        >
          <HStack spacing={3}>
            <Icon
              as={FiGrid}
              boxSize={5}
              color={activeView === 'grid' ? activeColor : iconColor}
            />
            <Text>Grid View</Text>
          </HStack>
        </Flex>

        <Divider borderColor={dividerColor} my={2} />

        <Text fontSize="xs" fontWeight="medium" color={secondaryTextColor} px={3}>
          TOOLS
        </Text>

        <Flex
          px={3}
          py={2}
          borderRadius="md"
          align="center"
          justify="space-between"
          _hover={{ bg: hoverBgColor }}
          w="full"
          cursor="pointer"
          onClick={() => {/* Open command palette */}}
        >
          <HStack spacing={3}>
            <Icon as={FiCommand} boxSize={5} color={iconColor} />
            <Text>Command Palette</Text>
          </HStack>
          <Text fontSize="xs" color={secondaryTextColor}>⌘K</Text>
        </Flex>

        <Flex
          px={3}
          py={2}
          borderRadius="md"
          align="center"
          justify="space-between"
          _hover={{ bg: hoverBgColor }}
          w="full"
          cursor="pointer"
          onClick={() => {/* Open search */}}
        >
          <HStack spacing={3}>
            <Icon as={FiSearch} boxSize={5} color={iconColor} />
            <Text>Search</Text>
          </HStack>
          <Text fontSize="xs" color={secondaryTextColor}>⌘F</Text>
        </Flex>
      </VStack>
    );
  };

  // Define secondary text color for labels
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.500');

  return (
    <Box
      as="nav"
      h="100%"
      py={4}
      overflowY="auto"
      position="relative"
      width={isExpanded ? "240px" : "64px"}
      transition="width 0.3s ease"
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: useColorModeValue('gray.300', 'gray.700'),
          borderRadius: '24px',
        },
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Expand/Collapse Toggle */}
      <Box
        position="absolute"
        top="10px"
        right="-8px"
        zIndex="10"
        bg={expandedBg}
        borderRadius="full"
        boxSize="16px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        border="1px solid"
        borderColor={expandedBorder}
        cursor="pointer"
        onClick={() => setIsExpanded(!isExpanded)}
        opacity={isExpanded ? 1 : 0}
        transition="opacity 0.2s"
      >
        <Icon
          as={FiChevronRight}
          boxSize={3}
          transform={isExpanded ? "rotate(180deg)" : "rotate(0deg)"}
          transition="transform 0.2s"
        />
      </Box>

      <VStack spacing={4} align={isExpanded ? "start" : "center"} w="full">
        {/* View/Mode Controls - Command Center, Map Focus, Grid */}
        {renderViewControls()}

        <Divider borderColor={dividerColor} />

        {/* Recent Items - Only visible in expanded mode */}
        {isExpanded && (
          <>
            <Box w="full">
              <Flex
                px={3}
                justify="space-between"
                align="center"
                cursor="pointer"
                onClick={onRecentToggle}
              >
                <Text fontSize="xs" fontWeight="medium" color={secondaryTextColor}>
                  RECENT
                </Text>
                <Icon
                  as={FiChevronRight}
                  boxSize={3}
                  color={secondaryTextColor}
                  transform={isRecentOpen ? "rotate(90deg)" : "none"}
                  transition="transform 0.2s"
                />
              </Flex>

              <Collapse in={isRecentOpen} animateOpacity>
                <VStack align="start" spacing={1} mt={2} w="full">
                  {recentItems.map((item) => (
                    <Flex
                      key={item.path}
                      px={3}
                      py={2}
                      borderRadius="md"
                      align="center"
                      _hover={{ bg: hoverBgColor }}
                      w="full"
                      cursor="pointer"
                      as={NavLink}
                      to={item.path}
                    >
                      <HStack spacing={3}>
                        <Icon as={item.icon} boxSize={4} color={iconColor} />
                        <Text fontSize="sm" noOfLines={1}>{item.label}</Text>
                      </HStack>
                    </Flex>
                  ))}
                </VStack>
              </Collapse>
            </Box>

            <Divider borderColor={dividerColor} />
          </>
        )}

        {/* Primary Navigation Items */}
        <VStack spacing={2} align={isExpanded ? "start" : "center"} w="full">
          {isExpanded && (
            <Text fontSize="xs" fontWeight="medium" color={secondaryTextColor} px={3}>
              NAVIGATION
            </Text>
          )}
          {primaryItems.map(renderNavItem)}
        </VStack>

        <Divider borderColor={dividerColor} />

        {/* Insight Navigation Items */}
        <VStack spacing={2} align={isExpanded ? "start" : "center"} w="full">
          {isExpanded && (
            <Text fontSize="xs" fontWeight="medium" color={secondaryTextColor} px={3}>
              INSIGHTS
            </Text>
          )}
          {insightItems.map(renderNavItem)}
        </VStack>

        <Divider borderColor={dividerColor} />

        {/* Resource Navigation Items */}
        <VStack spacing={2} align={isExpanded ? "start" : "center"} w="full">
          {isExpanded && (
            <Text fontSize="xs" fontWeight="medium" color={secondaryTextColor} px={3}>
              RESOURCES
            </Text>
          )}
          {resourceItems.map(renderNavItem)}
        </VStack>
      </VStack>
    </Box>
  );
};