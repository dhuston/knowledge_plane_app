import React from 'react';
import {
  Outlet,
  Link as RouterLink,
  useLocation
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
  MenuGroup,
  useBreakpointValue,
  Icon,
  Spacer,
  Spinner,
  Center,
  useColorMode
} from "@chakra-ui/react"; 
import { 
  ChevronDownIcon, 
  SearchIcon, 
  MoonIcon, 
  SunIcon,
  HamburgerIcon
} from '@chakra-ui/icons';
import { TbAtom } from 'react-icons/tb';
import { useAuth } from '../../context/AuthContext';

export default function MainLayout() {
  const location = useLocation();
  const { user, isLoading, isAuthenticated, setToken } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const brandColor = useColorModeValue('brand.600', 'brand.400');
  const isMobile = useBreakpointValue({ base: true, md: false });
  const ThemeIconComponent = useColorModeValue(MoonIcon, SunIcon);
  const { toggleColorMode } = useColorMode();

  const handleLogout = () => {
    setToken(null);
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box w="100%">
      {/* Top Navigation Bar */}
      <Box 
        as="nav" 
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={1000}
        bg={bgColor}
        borderBottomWidth="1px"
        borderColor={borderColor}
        boxShadow="sm"
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
                to="/workspace"
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
                  <Button
                    as={RouterLink}
                    to="/workspace"
                    variant="ghost"
                    size="sm"
                    color={location.pathname === '/workspace' ? brandColor : undefined}
                    fontWeight={location.pathname === '/workspace' ? 'semibold' : 'normal'}
                  >
                    Workspace
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/goals"
                    variant="ghost"
                    size="sm"
                    color={location.pathname === '/goals' ? brandColor : undefined}
                    fontWeight={location.pathname === '/goals' ? 'semibold' : 'normal'}
                  >
                    Goals
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/explore"
                    variant="ghost"
                    size="sm"
                    color={location.pathname === '/explore' ? brandColor : undefined}
                    fontWeight={location.pathname === '/explore' ? 'semibold' : 'normal'}
                  >
                    Explore
                  </Button>
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
                    <MenuItem as={RouterLink} to="/workspace">Workspace</MenuItem>
                    <MenuItem as={RouterLink} to="/goals">Goals</MenuItem>
                    <MenuItem as={RouterLink} to="/explore">Explore</MenuItem>
                    <MenuDivider />
                    <MenuItem as={RouterLink} to="/profile">Profile</MenuItem>
                    <MenuItem>Settings</MenuItem>
                    <MenuItem as={RouterLink} to="/login">Logout</MenuItem>
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

      {/* Main Content Area */}
      <Box pt="60px">
        <Container maxW="container.xl" py={6}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
} 