import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Button,
    useColorModeValue,
    Avatar,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    MenuDivider,
    Container,
    Text,
    VStack,
    Portal,
    Heading,
    IconButton,
    HStack,
    Tooltip,
    useDisclosure,
} from '@chakra-ui/react';
import {
    FiUser,
    FiLogOut,
    FiSettings,
    FiHelpCircle,
    FiBook,
    FiStar,
    FiClock,
    FiUsers,
    FiBell,
    FiGrid,
} from 'react-icons/fi';
import { useLocation, Link } from 'react-router-dom';
import { User } from '../../context/AuthContext';
import ViewToggle from '../ui/ViewToggle';
import useNotifications from '../../hooks/useNotifications';
import NotificationBadge from '../notifications/NotificationBadge';
import NotificationCenter from '../notifications/NotificationCenter';
import AtomIcon from '../ui/AtomIcon';

interface HeaderProps {
    onCreateProjectClick?: () => void;
    onLogout: () => void;
    onViewChange?: (view: 'myWork' | 'explore') => void;
    activeView?: 'myWork' | 'explore';
    user: User | null;
}

const Header: React.FC<HeaderProps> = ({
    onCreateProjectClick,
    onLogout,
    onViewChange,
    activeView = 'myWork',
    user
}) => {
    const location = useLocation();
    const bgColor = useColorModeValue('surface.500', '#262626'); // White : Button color
    const borderColor = useColorModeValue('primary.300', 'primary.600'); // Light mint green : Sage green
    const logoColor = useColorModeValue('#262626', 'secondary.400'); // Button color : Off-white/cream
    const { isOpen: isNotificationsOpen, onOpen: openNotifications, onClose: closeNotifications } = useDisclosure();
    const { notifications, unreadCount } = useNotifications();
    
    // State to control logo visibility
    const [logoOpacity, setLogoOpacity] = useState(1);
    
    // Effect to fade out the logo after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setLogoOpacity(0);
        }, 5000);
        
        return () => clearTimeout(timer);
    }, []);

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
            {/* Main Header - Simplified */}
            <Container maxW="container.xl" py={3}>
                <Flex alignItems="center" justifyContent="space-between" height="48px">
                    {/* Left section - Logo */}
                    <Box width="200px">
                        <HStack spacing={3} align="center" 
                            opacity={logoOpacity} 
                            transition="opacity 1.5s ease-out"
                        >
                            <Box display="flex" alignItems="center" justifyContent="center">
                                <AtomIcon size={24} color="#FF5A5F" />
                            </Box>
                            <Heading 
                                size="md" 
                                color="#FF5A5F"
                                fontWeight="bold"
                                whiteSpace="nowrap"
                                lineHeight="1.2"
                            >
                                Research Biosphere
                            </Heading>
                        </HStack>
                    </Box>

                    {/* Center section - View Toggle */}
                    <Box>
                        <ViewToggle
                            activeView={activeView}
                            onViewChange={(view) => onViewChange?.(view)}
                        />
                    </Box>

                    {/* Right section - Notifications & User Profile */}
                    <Box width="200px" display="flex" justifyContent="flex-end">
                        <HStack spacing={2}>
                            {/* Notification Bell */}
                            <Box position="relative">
                                <Tooltip label="Notifications" placement="bottom">
                                    <IconButton
                                        aria-label="Notifications"
                                        icon={<FiBell />}
                                        variant="ghost"
                                        size="md"
                                        onClick={openNotifications}
                                        borderRadius="full"
                                    />
                                </Tooltip>
                                {unreadCount > 0 && (
                                    <NotificationBadge count={unreadCount} />
                                )}
                            </Box>
                            
                            {/* User Profile */}
                            <Menu>
                                <MenuButton
                                    as={Button}
                                    variant="ghost"
                                    rounded="full"
                                    cursor="pointer"
                                    minW={0}
                                    px={2}
                                >
                                    <Avatar
                                        size="sm"
                                        name={user?.name || 'User'}
                                        src={user?.avatar_url || undefined}
                                        bg="#262626" // Button color
                                        color="white" // White text for contrast
                                        getInitials={(name) => name.split(' ').map(n => n[0]).join('')}
                                    />
                                </MenuButton>
                                <Portal>
                                    <MenuList zIndex={1001} p={2}>
                                    <VStack align="stretch" spacing={2}>
                                        <Box px={3} py={2} borderRadius="md" bg={useColorModeValue('secondary.400', '#363636')}>
                                            <Text fontWeight="medium">{user?.name}</Text>
                                            <Text fontSize="sm" color={useColorModeValue('#565656', 'secondary.300')}>{user?.email}</Text>
                                        </Box>
                                        <MenuDivider my={1} />
                                        <MenuItem icon={<FiUser />} command="⌘P">Profile</MenuItem>
                                        <MenuItem
                                            icon={<FiUsers />}
                                            as={Link}
                                            to={user?.team_id ? `/team/${user.team_id}` : '#'}
                                            onClick={(e) => {
                                                if (!user?.team_id) {
                                                    e.preventDefault();
                                                    alert("You are not currently assigned to a team.");
                                                }
                                            }}
                                        >
                                            My Team
                                        </MenuItem>
                                        <MenuItem icon={<FiSettings />} command="⌘,">Settings</MenuItem>
                                        {/* Only show Admin Console for superusers */}
                                        {user?.is_superuser && (
                                          <MenuItem 
                                            icon={<FiGrid />} 
                                            as={Link} 
                                            to="/admin"
                                          >
                                            Admin Console
                                          </MenuItem>
                                        )}
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
                    </Box>
                </Flex>
            </Container>
            
            {/* Notification Center */}
            <NotificationCenter 
                isOpen={isNotificationsOpen} 
                onClose={closeNotifications} 
            />
        </Box>
    );
};

export default Header;