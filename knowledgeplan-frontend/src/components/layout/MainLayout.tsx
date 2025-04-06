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
  Icon
} from "@chakra-ui/react"; 
import { 
  ChevronDownIcon, 
  SearchIcon, 
  MoonIcon, 
  SunIcon,
  HamburgerIcon
} from '@chakra-ui/icons';
import { TbAtom } from 'react-icons/tb';

export default function MainLayout() {
  const demoUserName = "Demo User";
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const brandColor = useColorModeValue('brand.600', 'brand.400');
  const isMobile = useBreakpointValue({ base: true, md: false });

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
                    to="/hub/phoenix"
                    variant="ghost"
                    size="sm"
                    color={location.pathname.startsWith('/hub') ? brandColor : undefined}
                    fontWeight={location.pathname.startsWith('/hub') ? 'semibold' : 'normal'}
                  >
                    Projects
                  </Button>
                </HStack>
              )}
            </HStack>

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
                  icon={useColorModeValue(<MoonIcon />, <SunIcon />)}
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
                    <MenuItem as={RouterLink} to="/hub/phoenix">Projects</MenuItem>
                    <MenuDivider />
                    <MenuItem as={RouterLink} to="/profile">Profile</MenuItem>
                    <MenuItem>Settings</MenuItem>
                    <MenuItem as={RouterLink} to="/login">Logout</MenuItem>
                  </MenuList>
                </Menu>
              )}

              {/* User Menu */}
              {!isMobile && (
                <Menu>
                  <MenuButton 
                    as={Button} 
                    variant="ghost" 
                    size="sm" 
                    rightIcon={<ChevronDownIcon />}
                  >
                    <HStack spacing={2}>
                      <Avatar size="sm" name={demoUserName} /> 
                      <Box textAlign="left">
                        <Text fontWeight="medium" fontSize="sm">{demoUserName}</Text>
                        <Text fontSize="xs" color="gray.500">Demo Account</Text>
                      </Box>
                    </HStack>
                  </MenuButton>
                  <MenuList>
                    <MenuGroup title="Account">
                      <MenuItem as={RouterLink} to="/profile" icon={<Avatar size="xs" name={demoUserName} />}>
                        Profile
                      </MenuItem>
                      <MenuItem>Settings</MenuItem>
                    </MenuGroup>
                    <MenuDivider />
                    <MenuItem as={RouterLink} to="/login" color="red.500">
                      Logout
                    </MenuItem>
                  </MenuList>
                </Menu>
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