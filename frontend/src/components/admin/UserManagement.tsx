import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Button,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Badge,
  Avatar,
  Heading,
  useColorModeValue,
  IconButton,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Select,
  Stack
} from '@chakra-ui/react';
import { FiSearch, FiRefreshCw, FiUserCheck, FiUserMinus, FiUserPlus } from 'react-icons/fi';
import { useApiClient } from '../../hooks/useApiClient';

interface User {
  id: string;
  name: string;
  email: string;
  title: string;
  avatar_url: string | null;
  is_superuser?: boolean;
  team_id: string | null;
}

const UserManagement: React.FC = () => {
  const apiClient = useApiClient();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // For role change confirmation dialog
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<boolean>(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  // Fetch users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users when search query changes
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.title?.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  // Function to load users from API
  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get('/api/v1/admin/users');
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh users data
  const handleRefresh = () => {
    loadUsers();
  };

  // Function to handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Open confirmation dialog for role change
  const handleRoleChangeClick = (user: User, makeAdmin: boolean) => {
    setSelectedUser(user);
    setNewRole(makeAdmin);
    onOpen();
  };

  // Submit role change to API
  const handleRoleChangeConfirm = async () => {
    if (!selectedUser) return;

    try {
      await apiClient.put(`/api/v1/admin/users/${selectedUser.id}/role`, {
        is_superuser: newRole
      });

      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, is_superuser: newRole } 
          : user
      ));

      onClose();
    } catch (err) {
      console.error('Failed to update user role:', err);
      setError('Failed to update user role. Please try again.');
      onClose();
    }
  };

  return (
    <Box
      p={5}
      borderWidth="1px"
      borderRadius="lg"
      bg={bgColor}
      borderColor={borderColor}
      width="100%"
      shadow="md"
    >
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">User Management</Heading>
        <Button
          leftIcon={<FiRefreshCw />}
          onClick={handleRefresh}
          isLoading={isLoading}
          size="sm"
        >
          Refresh
        </Button>
      </Flex>

      <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={5}>
        {/* Search input */}
        <InputGroup maxW={{ base: '100%', md: '300px' }}>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </InputGroup>

        <Select 
          placeholder="All Teams" 
          maxW={{ base: '100%', md: '200px' }}
          onChange={(e) => console.log('Filter by team:', e.target.value)}
        >
          <option value="team1">Team 1</option>
          <option value="team2">Team 2</option>
          <option value="team3">Team 3</option>
        </Select>
      </Stack>

      {isLoading ? (
        <Flex justifyContent="center" alignItems="center" py={10}>
          <Spinner size="xl" />
        </Flex>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>User</Th>
                <Th>Email</Th>
                <Th>Title</Th>
                <Th>Role</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <Tr key={user.id} _hover={{ bg: hoverBgColor }}>
                    <Td>
                      <Flex alignItems="center">
                        <Avatar
                          size="sm"
                          name={user.name}
                          src={user.avatar_url || undefined}
                          mr={2}
                        />
                        <Text fontWeight="medium">{user.name}</Text>
                      </Flex>
                    </Td>
                    <Td>{user.email}</Td>
                    <Td>{user.title || '-'}</Td>
                    <Td>
                      {user.is_superuser ? (
                        <Badge colorScheme="purple">Admin</Badge>
                      ) : (
                        <Badge colorScheme="gray">User</Badge>
                      )}
                    </Td>
                    <Td>
                      {user.is_superuser ? (
                        <Tooltip label="Remove admin privileges">
                          <IconButton
                            aria-label="Remove admin privileges"
                            icon={<FiUserMinus />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleRoleChangeClick(user, false)}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip label="Grant admin privileges">
                          <IconButton
                            aria-label="Grant admin privileges"
                            icon={<FiUserPlus />}
                            size="sm"
                            colorScheme="green"
                            variant="ghost"
                            onClick={() => handleRoleChangeClick(user, true)}
                          />
                        </Tooltip>
                      )}
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={5} textAlign="center" py={4}>
                    No users found
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Role change confirmation dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructive={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {newRole ? 'Grant Admin Privileges' : 'Remove Admin Privileges'}
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to {newRole ? 'grant admin privileges to' : 'remove admin privileges from'}{' '}
              <strong>{selectedUser?.name}</strong>?
              {newRole && (
                <Text mt={2} color="red.500">
                  Admin users have full access to all parts of the system including sensitive data.
                </Text>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme={newRole ? 'green' : 'red'}
                onClick={handleRoleChangeConfirm}
                ml={3}
              >
                Confirm
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default UserManagement;