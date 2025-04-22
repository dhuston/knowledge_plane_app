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
    Text,
    IconButton
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';
import { AddIcon } from '@chakra-ui/icons';
import { MdOutlineInsights } from "react-icons/md";

// Define expected props, e.g., functions passed from MainLayout
interface HeaderProps {
    onCreateProjectClick: () => void;
    onLogout: () => void;
    onOpenBriefing: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCreateProjectClick, onLogout, onOpenBriefing }) => {
    const { user } = useAuth();
    const bgColor = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');

    return (
        <Box
            as="nav"
            zIndex={1000}
            bg={bgColor}
            borderBottomWidth="1px"
            borderColor={borderColor}
            boxShadow="sm"
            px={4} // Add some padding
        >
            <Flex h="60px" alignItems="center" justifyContent="space-between">
                <HStack spacing={8} alignItems={"center"}>
                    <Heading size="md" color="purple.600">KnowledgePlane AI</Heading>
                </HStack>
                <Flex alignItems={"center"}>
                    <IconButton 
                        aria-label="Open Daily Briefing"
                        icon={<MdOutlineInsights size="20px" />}
                        variant="ghost"
                        onClick={onOpenBriefing}
                        mr={3}
                    />
                    <Button
                        variant={'solid'}
                        colorScheme={'purple'}
                        size={'sm'}
                        mr={4}
                        leftIcon={<AddIcon />}
                        onClick={onCreateProjectClick}
                    >
                        Create Project
                    </Button>
                    {user && (
                        <Menu>
                            <MenuButton
                                as={Button}
                                rounded={'full'}
                                variant={'link'}
                                cursor={'pointer'}
                                minW={0}>
                                <Avatar
                                    size={'sm'}
                                    name={user.name || user.email}
                                    src={user.avatar_url || undefined}
                                />
                            </MenuButton>
                            <MenuList>
                                <MenuItem isDisabled> 
                                    <Text fontWeight="bold">{user.name}</Text>
                                </MenuItem>
                                <MenuItem isDisabled>
                                    <Text fontSize="sm" color="gray.500">{user.email}</Text>
                                </MenuItem>
                                <MenuDivider />
                                <MenuItem onClick={onLogout}>Logout</MenuItem>
                            </MenuList>
                        </Menu>
                    )}
                </Flex>
            </Flex>
        </Box>
    );
};

export default Header; 