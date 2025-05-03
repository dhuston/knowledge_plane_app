import React from 'react';
import {
  Box,
  VStack,
  Icon,
  Text,
  Flex,
  HStack,
  Divider,
  useColorModeValue
} from '@chakra-ui/react';

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
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const activeBgColor = useColorModeValue('blue.50', 'blue.900');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const iconColor = useColorModeValue('gray.500', 'gray.400');
  
  return (
    <Box
      w="240px"
      bg={bgColor}
      borderRight="1px"
      borderColor={borderColor}
      h="full"
      py={4}
      overflowY="auto"
    >
      <VStack spacing={2} align="start" w="full">
        <Text 
          fontSize="sm" 
          fontWeight="medium" 
          color="gray.500" 
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
                _groupHover={{ color: activeItemId === item.id ? activeColor : iconColor }}
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
        
        <Box px={4} py={2}>
          <Text fontSize="xs" color="gray.500">
            Version 0.1.0
          </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default AdminSidebarNav;