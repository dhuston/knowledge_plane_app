import React from 'react';
import {
  VStack,
  Icon,
  Tooltip,
  Box,
  Divider,
  useColorModeValue,
  IconButton,
} from '@chakra-ui/react';
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
  
  const primaryItems: NavItem[] = [
    { label: 'Home', icon: FiHome, path: '/' },
    { label: 'Teams', icon: FiUsers, path: '/teams' },
    { label: 'Projects', icon: FiFolder, path: '/projects' },
    { label: 'Goals', icon: FiTarget, path: '/goals' },
  ];
  
  const insightItems: NavItem[] = [
    { label: 'Insights', icon: MdOutlineInsights, path: '/insights' },
    { label: 'Analytics', icon: FiPieChart, path: '/analytics' },
  ];
  
  const resourceItems: NavItem[] = [
    { label: 'Knowledge Base', icon: FiBook, path: '/knowledge' },
    { label: 'Favorites', icon: FiStar, path: '/favorites' },
    { label: 'Settings', icon: FiSettings, path: '/settings' },
  ];

  const iconColor = useColorModeValue('gray.600', 'gray.400');
  const activeColor = useColorModeValue('primary.500', 'primary.300');
  const activeBgColor = useColorModeValue('primary.50', 'primary.900');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');
  const dividerColor = useColorModeValue('gray.200', 'gray.700');

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path || 
                    (item.path !== '/' && location.pathname.startsWith(item.path));
    
    return (
      <Tooltip 
        key={item.path} 
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
      </Tooltip>
    );
  };

  const renderViewControls = () => (
    <VStack spacing={2} w="full">
      <Tooltip label="Command Center View" placement="right" hasArrow>
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
      </Tooltip>
      
      <Tooltip label="Map Focus View" placement="right" hasArrow>
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
      </Tooltip>
      
      <Tooltip label="Grid View" placement="right" hasArrow>
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
      </Tooltip>
    </VStack>
  );

  return (
    <Box 
      as="nav" 
      h="100%" 
      py={4} 
      overflowY="auto"
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
    >
      <VStack spacing={4} align="center" w="full">
        {/* View/Mode Controls - Command Center, Map Focus, Grid */}
        {renderViewControls()}
        
        <Divider borderColor={dividerColor} />
        
        {/* Primary Navigation Items */}
        <VStack spacing={2} align="center" w="full">
          {primaryItems.map(renderNavItem)}
        </VStack>
        
        <Divider borderColor={dividerColor} />
        
        {/* Insight Navigation Items */}
        <VStack spacing={2} align="center" w="full">
          {insightItems.map(renderNavItem)}
        </VStack>
        
        <Divider borderColor={dividerColor} />
        
        {/* Resource Navigation Items */}
        <VStack spacing={2} align="center" w="full">
          {resourceItems.map(renderNavItem)}
        </VStack>
      </VStack>
    </Box>
  );
}; 