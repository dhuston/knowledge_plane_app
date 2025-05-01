import React from 'react';
import {
  Box,
  Button,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  HStack,
  useColorModeValue,
  Portal,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiUsers,
  FiTarget,
  FiFolder,
  FiLink,
  FiClock,
  FiStar,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  action: () => void;
  category: 'create' | 'navigate' | 'favorite';
}

export default function QuickActions() {
  const navigate = useNavigate();
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuBorder = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const quickActions: QuickAction[] = [
    // Create Actions
    {
      id: 'create-team',
      label: 'New Team',
      icon: FiUsers,
      description: 'Create a new team',
      action: () => navigate('/teams/new'),
      category: 'create',
    },
    {
      id: 'create-project',
      label: 'New Project',
      icon: FiFolder,
      description: 'Start a new project',
      action: () => navigate('/projects/new'),
      category: 'create',
    },
    {
      id: 'create-goal',
      label: 'New Goal',
      icon: FiTarget,
      description: 'Set a new goal',
      action: () => navigate('/goals/new'),
      category: 'create',
    },
    {
      id: 'create-knowledge',
      label: 'New Knowledge Asset',
      icon: FiLink,
      description: 'Add knowledge or resource',
      action: () => navigate('/knowledge/new'),
      category: 'create',
    },
    // Navigate Actions
    {
      id: 'nav-recent',
      label: 'Recent Items',
      icon: FiClock,
      description: 'View recently accessed items',
      action: () => navigate('/recent'),
      category: 'navigate',
    },
    // Favorite Actions
    {
      id: 'favorites',
      label: 'Favorites',
      icon: FiStar,
      description: 'View your favorite items',
      action: () => navigate('/favorites'),
      category: 'favorite',
    },
  ];

  const createActions = quickActions.filter(action => action.category === 'create');
  const navigateActions = quickActions.filter(action => action.category === 'navigate');
  const favoriteActions = quickActions.filter(action => action.category === 'favorite');

  return (
    <Box>
      <Menu placement="bottom-end">
        <Tooltip label="Quick Actions">
          <MenuButton
            as={Button}
            size="lg"
            leftIcon={<Icon as={FiPlus} />}
            colorScheme="primary"
            variant="solid"
          >
            Create
          </MenuButton>
        </Tooltip>
        <Portal>
          <MenuList
            bg={menuBg}
            borderColor={menuBorder}
            boxShadow="lg"
            width="300px"
            py={2}
          >
            {/* Create Actions */}
            {createActions.map((action) => (
              <MenuItem
                key={action.id}
                onClick={action.action}
                _hover={{ bg: hoverBg }}
                py={3}
              >
                <HStack spacing={3}>
                  <Icon as={action.icon} boxSize={5} />
                  <Box>
                    <Text fontWeight="medium">{action.label}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {action.description}
                    </Text>
                  </Box>
                </HStack>
              </MenuItem>
            ))}

            <MenuDivider />

            {/* Navigate Actions */}
            {navigateActions.map((action) => (
              <MenuItem
                key={action.id}
                onClick={action.action}
                _hover={{ bg: hoverBg }}
                py={3}
              >
                <HStack spacing={3}>
                  <Icon as={action.icon} boxSize={5} />
                  <Box>
                    <Text fontWeight="medium">{action.label}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {action.description}
                    </Text>
                  </Box>
                </HStack>
              </MenuItem>
            ))}

            {/* Favorite Actions */}
            {favoriteActions.length > 0 && (
              <>
                <MenuDivider />
                {favoriteActions.map((action) => (
                  <MenuItem
                    key={action.id}
                    onClick={action.action}
                    _hover={{ bg: hoverBg }}
                    py={3}
                  >
                    <HStack spacing={3}>
                      <Icon as={action.icon} boxSize={5} />
                      <Box>
                        <Text fontWeight="medium">{action.label}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {action.description}
                        </Text>
                      </Box>
                    </HStack>
                  </MenuItem>
                ))}
              </>
            )}
          </MenuList>
        </Portal>
      </Menu>
    </Box>
  );
} 