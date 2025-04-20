import React, { useState } from 'react';
import {
  Link as RouterLink,
} from "react-router-dom";
import { 
  Box, 
  Heading, 
  Flex, 
  HStack,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Container,
  useColorModeValue,
  IconButton,
  Tooltip,
  MenuDivider,
  useBreakpointValue,
  Icon,
  Spacer,
  Spinner,
  Center,
  useColorMode,
  useDisclosure,
} from "@chakra-ui/react"; 
import { 
  ChevronDownIcon, 
  SearchIcon, 
  MoonIcon, 
  SunIcon,
  HamburgerIcon,
  AddIcon
} from '@chakra-ui/icons';
import { TbAtom } from 'react-icons/tb';
import { useAuth } from '../../context/AuthContext';
import CreateProjectModal from '../modals/CreateProjectModal';
import LivingMap from '../map/LivingMap';
import BriefingPanel from '../panels/BriefingPanel';
import { MapNode } from '../../types/map';

export default function MainLayout() {
  const { user, isLoading, isAuthenticated, setToken } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const brandColor = useColorModeValue('brand.600', 'brand.400');
  const isMobile = useBreakpointValue({ base: true, md: false });
  const ThemeIconComponent = useColorModeValue(MoonIcon, SunIcon);
  const { toggleColorMode } = useColorMode();
  const { isOpen: isCreateProjectOpen, onOpen: onCreateProjectOpen, onClose: onCreateProjectClose } = useDisclosure();

  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);

  const handleLogout = () => {
    setToken(null);
  };

  const handleNodeClick = (nodeData: MapNode | null) => {
    setSelectedNode(nodeData);
  };

  const handleBriefingPanelClose = () => {
    setSelectedNode(null);
  };

  const handleCreateProjectClick = () => {
    console.log("Create Project button clicked!");
    onCreateProjectOpen();
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box w="100vw" h="100vh" display="flex" flexDirection="column" overflow="hidden">
      {/* Top Navigation Bar */}
      <Box 
        as="nav" 
        zIndex={1000}
        bg={bgColor}
        borderBottomWidth="1px"
        borderColor={borderColor}
        boxShadow="sm"
        flexShrink={0}
      >
        <Container maxW="container.xl">
          <Flex 
            h="60px" 
            alignItems="center" 
            justifyContent="space-between"
          >
            {/* Logo and Main Nav */}
            <HStack spacing={8}>
              <HStack 
                spacing={2} 
                as={RouterLink} 
                to="/map" 
                _hover={{ color: 'brand.500' }}
              >
                <Icon 
                  as={TbAtom} 
                  boxSize={6} 
                  color="brand.500"
                  _dark={{ color: 'brand.400' }}
                />
                <Heading 
                  size="md" 
                  color={brandColor}
                >
                  KnowledgePlane AI
                </Heading>
              </HStack>
              
              {!isMobile && (
                <HStack spacing={1}>
                  {/* Removed old Nav Buttons (Workspace, Goals, Explore) */}
                  {/* We might add context-specific actions later */}
                  {/* <Button ... >Workspace</Button> */}
                  {/* <Button ... >Goals</Button> */}
                  {/* <Button ... >Explore</Button> */}
                </HStack>
              )}
            </HStack>

            <Spacer />

            {/* Right Side Actions */}
            <HStack spacing={2}>
              {/* Search */}
              <Tooltip label="Search (Coming Soon)">
                <IconButton
                  aria-label="Search"
                  icon={<SearchIcon />}
                  variant="ghost"
                  size="sm"
                  isDisabled
                />
              </Tooltip>

              {/* Create Project Button */}
              <Button 
                variant={'solid'}
                colorScheme={'brand'}
                size={'sm'}
                leftIcon={<AddIcon />}
                onClick={handleCreateProjectClick}
              >
                Create Project
              </Button>

              {/* Theme Toggle */}
              <Tooltip label="Toggle Theme">
                <IconButton
                  aria-label="Toggle Theme"
                  icon={<ThemeIconComponent />}
                  onClick={toggleColorMode}
                  variant="ghost"
                  size="sm"
                />
              </Tooltip>

              {/* Mobile Menu */}
              {isMobile && (
                <Menu>
                  <MenuButton
                    as={IconButton}
                    aria-label="Menu"
                    icon={<HamburgerIcon />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    {/* <MenuItem as={RouterLink} to="/workspace">Workspace</MenuItem> */}
                    <MenuItem as={RouterLink} to="/map">Map View</MenuItem>
                    <MenuItem as={RouterLink} to="/goals">Goals (TBD)</MenuItem>
                    <MenuItem as={RouterLink} to="/explore">Explore (TBD)</MenuItem>
                    <MenuDivider />
                    <MenuItem as={RouterLink} to={`/profile/${user?.id}`}>Profile</MenuItem>
                    <MenuItem>Settings</MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </MenuList>
                </Menu>
              )}

              {/* User Menu - Use real user data */}
              {isAuthenticated && user ? (
                <Menu>
                  <MenuButton 
                    as={Button} 
                    variant="ghost" 
                    size="sm" 
                    rightIcon={<ChevronDownIcon />}
                  >
                    <Flex alignItems="center">
                      <Avatar size="sm" name={user.name} src={user.avatar_url || undefined} mr={2} /> 
                      <Text >{user.name}</Text> 
                    </Flex>
                  </MenuButton>
                  <MenuList>
                    <MenuItem as={RouterLink} to={`/profile/${user.id}`}>Profile</MenuItem>
                    <MenuItem isDisabled>Settings (TBD)</MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <Button as={RouterLink} to="/login" size="sm">Login</Button>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content Area - Now holds the Map and Panel */}
      <Flex flex={1} position="relative" overflow="hidden">
        {/* Living Map takes up available space */}
        <Box flex={1} h="full">
          <LivingMap onNodeClick={handleNodeClick} /> 
        </Box>

        {/* Briefing Panel slides in from the right */}
        <BriefingPanel 
          nodeData={selectedNode} 
          isOpen={!!selectedNode}
          onClose={handleBriefingPanelClose} 
        />
      </Flex>

      <CreateProjectModal 
        isOpen={isCreateProjectOpen}
        onClose={onCreateProjectClose}
      />
    </Box>
  );
} 