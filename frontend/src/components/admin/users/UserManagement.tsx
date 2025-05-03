import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  HStack,
  VStack,
  InputGroup,
  InputLeftElement,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Avatar,
  Flex,
  Skeleton,
  TableContainer,
  useDisclosure,
  Tooltip
} from '@chakra-ui/react';
import { 
  FiSearch, 
  FiFilter, 
  FiMoreVertical,
  FiUserPlus,
  FiEdit2,
  FiTrash2,
  FiMail,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import { useApiClient } from '../../../hooks/useApiClient';
import AdminLayout from '../common/AdminLayout';

// Mock user data
interface User {
  id: string;
  name: string;
  email: string;
  title?: string;
  avatar_url?: string;
  team_id?: string;
  teamName?: string;
  status: 'active' | 'inactive' | 'pending';
  role: string;
  lastLogin?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const apiClient = useApiClient();
  
  // Load users
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data while endpoint is being implemented
        const mockUsers: User[] = [
          {
            id: '1',
            name: 'John Smith',
            email: 'john.smith@example.com',
            title: 'Senior Research Scientist',
            avatar_url: '',
            team_id: 'team-1',
            teamName: 'Core Research Team',
            status: 'active',
            role: 'user',
            lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
          },
          {
            id: '2',
            name: 'Jane Doe',
            email: 'jane.doe@example.com',
            title: 'Team Lead',
            avatar_url: '',
            team_id: 'team-1',
            teamName: 'Core Research Team',
            status: 'active',
            role: 'admin',
            lastLogin: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
          },
          {
            id: '3',
            name: 'Robert Johnson',
            email: 'robert.johnson@example.com',
            title: 'Research Associate',
            avatar_url: '',
            team_id: 'team-2',
            teamName: 'Analytics Team',
            status: 'active',
            role: 'user',
            lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
          },
          {
            id: '4',
            name: 'Emily Chen',
            email: 'emily.chen@example.com',
            title: 'Data Scientist',
            avatar_url: '',
            team_id: 'team-2',
            teamName: 'Analytics Team',
            status: 'pending',
            role: 'user'
          },
          {
            id: '5',
            name: 'Michael Brown',
            email: 'michael.brown@example.com',
            title: 'Product Manager',
            avatar_url: '',
            team_id: 'team-3',
            teamName: 'Product Team',
            status: 'inactive',
            role: 'user',
            lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString() // 15 days ago
          }
        ];
        
        setUsers(mockUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.title && user.title.toLowerCase().includes(query)) ||
      (user.teamName && user.teamName.toLowerCase().includes(query))
    );
  });
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <AdminLayout title="User Management">
      <Box mb={6}>
        <HStack spacing={4}>
          <InputGroup maxW="400px">
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          
          <Button leftIcon={<FiFilter />} variant="outline">
            Filter
          </Button>
          
          <Button leftIcon={<FiUserPlus />} colorScheme="blue" ml="auto">
            Add User
          </Button>
        </HStack>
      </Box>
      
      {isLoading ? (
        // Loading state
        <VStack spacing={4} align="stretch">
          <Skeleton height="40px" />
          <Skeleton height="40px" />
          <Skeleton height="40px" />
          <Skeleton height="40px" />
          <Skeleton height="40px" />
        </VStack>
      ) : filteredUsers.length === 0 ? (
        // Empty state
        <Box textAlign="center" py={8}>
          <Text mb={4}>No users found matching your search criteria</Text>
          <Button onClick={() => setSearchQuery('')}>Clear Search</Button>
        </Box>
      ) : (
        // User table
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Team</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Last Login</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredUsers.map(user => (
                <Tr key={user.id}>
                  <Td>
                    <Flex align="center">
                      <Avatar size="sm" name={user.name} src={user.avatar_url} mr={2} />
                      <Box>
                        <Text fontWeight="medium">{user.name}</Text>
                        <Text fontSize="xs" color="gray.500">{user.title}</Text>
                      </Box>
                    </Flex>
                  </Td>
                  <Td>{user.email}</Td>
                  <Td>{user.teamName || '—'}</Td>
                  <Td>
                    <Badge colorScheme={user.role === 'admin' ? 'purple' : 'gray'}>
                      {user.role}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={
                        user.status === 'active' 
                          ? 'green' 
                          : user.status === 'inactive' 
                            ? 'red' 
                            : 'yellow'
                      }
                    >
                      {user.status}
                    </Badge>
                  </Td>
                  <Td fontSize="sm">{formatDate(user.lastLogin)}</Td>
                  <Td isNumeric>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        aria-label="Options"
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                      />
                      <MenuList>
                        <MenuItem icon={<FiEdit2 />}>Edit</MenuItem>
                        {user.status !== 'active' ? (
                          <MenuItem icon={<FiCheckCircle />}>Activate</MenuItem>
                        ) : (
                          <MenuItem icon={<FiXCircle />}>Deactivate</MenuItem>
                        )}
                        <MenuItem icon={<FiMail />}>Send Password Reset</MenuItem>
                        <MenuItem icon={<FiTrash2 />} color="red.500">Delete</MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      )}
      
      {/* Pagination controls would go here */}
      {!isLoading && filteredUsers.length > 0 && (
        <Flex justify="space-between" align="center" mt={4}>
          <Text fontSize="sm">
            Showing {filteredUsers.length} of {users.length} users
          </Text>
          <HStack>
            <Button size="sm" variant="outline" isDisabled>
              Previous
            </Button>
            <Button size="sm" variant="outline" isDisabled>
              Next
            </Button>
          </HStack>
        </Flex>
      )}
    </AdminLayout>
  );
};

export default UserManagement;