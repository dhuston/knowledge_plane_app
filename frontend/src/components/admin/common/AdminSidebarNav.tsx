import React from 'react';
import {
  Box,
  VStack,
  Text,
  Flex,
  HStack,
  Divider,
  useColorModeValue,
  Button
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactElement;
}

interface AdminSidebarNavProps {
  items: NavItem[];
  activeItemId: string;
  onItemClick: (itemId: string) => void;
}

const AdminSidebarNav: React.FC<AdminSidebarNavProps> = ({ 
  items, 
  activeItemId, 
  onItemClick 
}) => {
  // Theme colors
  const bgColor = useColorModeValue('surface.500', '#262626'); // Use the same colors as the app
  const borderColor = useColorModeValue('primary.300', 'primary.600'); // Light mint green : Sage green
  const activeColor = useColorModeValue('primary.500', 'primary.300'); // Airbnb coral : Light coral
  const activeBgColor = useColorModeValue('primary.50', 'primary.900'); // Very light coral : Very dark coral
  const hoverBgColor = useColorModeValue('secondary.500', 'gray.700'); // Light background hover
  const textColor = useColorModeValue('#484848', 'secondary.400'); // Airbnb dark gray : Off-white/cream
  const iconColor = useColorModeValue('primary.500', 'primary.400'); // Airbnb coral : Light coral
  const secondaryTextColor = useColorModeValue('#717171', 'gray.400'); // Medium gray
  
  return (
    <Box
      w="240px"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      h="full"
      py={4}
      overflowY="auto"
      boxShadow="sm"
    >
      <VStack spacing={2} align="start" w="full">
        <Text 
          fontSize="sm" 
          fontWeight="medium" 
          color={secondaryTextColor}
          px={4} 
          mb={2}
        >
          ADMIN CONSOLE
        </Text>
        
        {items.map((item) => (
          <Flex
            key={item.id}
            w="full"
            px={4}
            py={3}
            align="center"
            cursor="pointer"
            borderLeftWidth={activeItemId === item.id ? "4px" : "0px"}
            borderColor={activeColor}
            bg={activeItemId === item.id ? activeBgColor : "transparent"}
            color={activeItemId === item.id ? activeColor : textColor}
            _hover={{
              bg: activeItemId === item.id ? activeBgColor : hoverBgColor,
            }}
            onClick={() => onItemClick(item.id)}
            role="group"
          >
            <HStack spacing={3}>
              <Box 
                color={activeItemId === item.id ? activeColor : iconColor}
                _groupHover={{ color: activeItemId === item.id ? activeColor : activeColor }}
              >
                {item.icon}
              </Box>
              <Text fontWeight={activeItemId === item.id ? "medium" : "normal"}>
                {item.label}
              </Text>
            </HStack>
          </Flex>
        ))}
        
        <Divider my={4} borderColor={borderColor} />
        
        {/* Back to App Button */}
        <Flex
          w="full"
          px={4}
          py={3}
          align="center"
        >
          <Button
            as={RouterLink}
            to="/workspace"
            variant="outline"
            size="sm"
            leftIcon={<FiHome />}
            width="full"
            colorScheme="primary"
          >
            Back to App
          </Button>
        </Flex>
        
      </VStack>
    </Box>
  );
};

export default AdminSidebarNav;