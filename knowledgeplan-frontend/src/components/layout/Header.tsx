import React from 'react';
import {
    Box,
    Flex,
    Heading,
    Button,
    useColorModeValue,
    HStack,
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    IconButton,
    Tooltip,
    Container,
    Badge,
    Text,
    VStack,
    Portal,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
} from '@chakra-ui/react';
import { AddIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { 
    MdOutlineInsights,
    MdWorkspaces,
    MdNotifications,
} from "react-icons/md";
import { 
    FiUser,
    FiLogOut, 
    FiSettings,
    FiHelpCircle,
    FiBook,
    FiStar,
    FiClock,
} from 'react-icons/fi';
import ColorModeToggle from '../ui/ColorModeToggle';
import { useLocation, Link } from 'react-router-dom';
import { User } from '../../context/AuthContext';

interface HeaderProps {
    onCreateProjectClick: () => void;
    onLogout: () => void;
    onOpenBriefing: () => void;
    onOpenNotifications: () => void;
    user: User | null;
}

const Header: React.FC<HeaderProps> = ({ 
    onCreateProjectClick, 
    onLogout, 
    onOpenBriefing,
    onOpenNotifications,
    user 
}) => {
    const location = useLocation();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const logoColor = useColorModeValue('primary.700', 'primary.300');
    const buttonVariant = useColorModeValue('solid', 'solid');
    const secondaryBgColor = useColorModeValue('gray.50', 'gray.700');
    
    // Generate breadcrumbs from current path
    const breadcrumbs = location.pathname.split('/')
        .filter(Boolean)
        .map(path => ({
            label: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
            path: `/${path}`
        }));

    return (
        <Box
            as="header"
            position="fixed"
            top={0}
            width="full"
            zIndex={1000}
            bg={bgColor}
            borderBottomWidth="1px"
            borderColor={borderColor}
            boxShadow="sm"
        >
            {/* Main Header */}
            <Container maxW="container.xl" py={3}>
                <Flex alignItems="center" justifyContent="space-between" height="48px">
                    <HStack spacing={8} alignItems="center">
                        <Heading 
                            size="md" 
                            color={logoColor}
                            fontWeight="bold"
                            letterSpacing="tight"
                            cursor="pointer"
                            as={Link}
                            to="/"
                            _hover={{ opacity: 0.8 }}
                        >
                            KnowledgePlane AI
                        </Heading>

                        <HStack spacing={2}>
                            <Tooltip label="Switch Workspace">
                                <IconButton
                                    aria-label="Switch Workspace"
                                    icon={<MdWorkspaces size="20px" />}
                                    variant="ghost"
                                    colorScheme="primary"
                                    size="md"
                                />
                            </Tooltip>
                        </HStack>
                    </HStack>
                    
                    <HStack spacing={4}>
                        <Button
                            variant={buttonVariant}
                            colorScheme="primary"
                            size="sm"
                            leftIcon={<AddIcon />}
                            onClick={onCreateProjectClick}
                            fontWeight="semibold"
                        >
                            Create Project
                        </Button>

                        <Tooltip label="Daily Briefing" placement="bottom">
                            <IconButton 
                                aria-label="Open Daily Briefing"
                                icon={<MdOutlineInsights size="20px" />}
                                variant="ghost"
                                colorScheme="primary"
                                size="md"
                                onClick={onOpenBriefing}
                            />
                        </Tooltip>

                        <Tooltip label="Notifications" placement="bottom">
                            <Box position="relative">
                                <IconButton
                                    aria-label="Notifications"
                                    icon={<MdNotifications size="20px" />}
                                    variant="ghost"
                                    colorScheme="primary"
                                    size="md"
                                    onClick={onOpenNotifications}
                                />
                                <Badge
                                    position="absolute"
                                    top="-1"
                                    right="-1"
                                    colorScheme="error"
                                    borderRadius="full"
                                    boxSize="5"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    3
                                </Badge>
                            </Box>
                        </Tooltip>
                        
                        <ColorModeToggle />
                        
                        <Menu>
                            <MenuButton
                                as={Button}
                                variant="ghost"
                                rounded="full"
                                cursor="pointer"
                                minW={0}
                                px={2}
                            >
                                <HStack spacing={2}>
                                    <Avatar 
                                        size="sm" 
                                        name={user?.name || 'User'} 
                                        src={user?.avatar_url}
                                        bg="primary.500"
                                    />
                                    <VStack
                                        display={{ base: 'none', md: 'flex' }}
                                        alignItems="flex-start"
                                        spacing={0}
                                        ml={2}
                                    >
                                        <Text fontSize="sm" fontWeight="medium">
                                            {user?.name || 'User'}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500">
                                            {user?.team?.name || user?.role || 'Guest'}
                                        </Text>
                                    </VStack>
                                </HStack>
                            </MenuButton>
                            <Portal>
                                <MenuList zIndex={1001} p={2}>
                                    <VStack align="stretch" spacing={2}>
                                        <Box px={3} py={2} bg={secondaryBgColor} borderRadius="md">
                                            <Text fontWeight="medium">{user?.name}</Text>
                                            <Text fontSize="sm" color="gray.500">{user?.email}</Text>
                                        </Box>
                                        <MenuDivider my={1} />
                                        <MenuItem icon={<FiUser />} command="⌘P">Profile</MenuItem>
                                        <MenuItem icon={<FiSettings />} command="⌘,">Settings</MenuItem>
                                        <MenuItem icon={<FiStar />}>Favorites</MenuItem>
                                        <MenuItem icon={<FiClock />}>Recent</MenuItem>
                                        <MenuDivider my={1} />
                                        <MenuItem icon={<FiHelpCircle />}>Help Center</MenuItem>
                                        <MenuItem icon={<FiBook />}>Documentation</MenuItem>
                                        <MenuDivider my={1} />
                                        <MenuItem 
                                            icon={<FiLogOut />} 
                                            onClick={onLogout}
                                            color="error.500"
                                            _hover={{ bg: 'error.50' }}
                                        >
                                            Logout
                                        </MenuItem>
                                    </VStack>
                                </MenuList>
                            </Portal>
                        </Menu>
                    </HStack>
                </Flex>
            </Container>

            {/* Breadcrumb Navigation */}
            {breadcrumbs.length > 0 && (
                <Box bg={secondaryBgColor} py={2} borderBottomWidth="1px" borderColor={borderColor}>
                    <Container maxW="container.xl">
                        <Breadcrumb spacing="8px" separator={<ChevronRightIcon color="gray.500" />}>
                            <BreadcrumbItem>
                                <BreadcrumbLink as={Link} to="/">Home</BreadcrumbLink>
                            </BreadcrumbItem>
                            {breadcrumbs.map((crumb, index) => (
                                <BreadcrumbItem key={index} isCurrentPage={index === breadcrumbs.length - 1}>
                                    <BreadcrumbLink as={Link} to={crumb.path}>
                                        {crumb.label}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            ))}
                        </Breadcrumb>
                    </Container>
                </Box>
            )}
        </Box>
    );
};

export default Header; 