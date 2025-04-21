import React from 'react';
import {
    Box,
    Flex,
    Heading,
    Spacer,
    Button,
    useColorModeValue,
    // Add other necessary imports from Chakra UI or context
} from '@chakra-ui/react';

// Define expected props, e.g., functions passed from MainLayout
interface HeaderProps {
    onCreateProjectClick: () => void;
    onLogout: () => void;
    // Add other props like user info if needed
}

const Header: React.FC<HeaderProps> = ({ onCreateProjectClick, onLogout }) => {
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
                <Heading size="md">KnowledgePlane AI</Heading>
                <Spacer />
                <Button size="sm" colorScheme="brand" onClick={onCreateProjectClick} mr={2}>
                    Create Project
                </Button>
                <Button size="sm" onClick={onLogout}>
                    Logout
                </Button>
                {/* Add User Menu, Theme Toggle, etc. back here */}
            </Flex>
        </Box>
    );
};

export default Header; 