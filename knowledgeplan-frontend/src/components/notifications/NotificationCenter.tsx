import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Text,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Badge,
  HStack,
  Icon,
  Button,
  useColorModeValue,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FiBell, FiFilter, FiCheck, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { useApiClient } from '../../hooks/useApiClient';

export interface Notification {
  id: string;
  type: 'collaboration_gap' | 'goal_risk' | 'project_overlap' | 'system';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const apiClient = useApiClient();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.post(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return FiAlertTriangle;
      case 'warning':
        return FiAlertTriangle;
      default:
        return FiInfo;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'collaboration_gap':
        return 'Collaboration Gap';
      case 'goal_risk':
        return 'Goal Risk';
      case 'project_overlap':
        return 'Project Overlap';
      default:
        return 'System';
    }
  };

  const filteredNotifications = notifications.filter(notification => 
    filter === 'all' || notification.type === filter
  );

  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={onClose}
      size="md"
    >
      <DrawerOverlay />
      <DrawerContent bg={bgColor}>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
          <HStack justify="space-between" align="center">
            <HStack>
              <Icon as={FiBell} boxSize={5} />
              <Text>Notifications</Text>
            </HStack>
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiFilter />}
                variant="ghost"
                size="sm"
                aria-label="Filter notifications"
              />
              <MenuList>
                <MenuItem onClick={() => setFilter('all')}>
                  <HStack>
                    {filter === 'all' && <Icon as={FiCheck} />}
                    <Text>All Notifications</Text>
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => setFilter('collaboration_gap')}>
                  <HStack>
                    {filter === 'collaboration_gap' && <Icon as={FiCheck} />}
                    <Text>Collaboration Gaps</Text>
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => setFilter('goal_risk')}>
                  <HStack>
                    {filter === 'goal_risk' && <Icon as={FiCheck} />}
                    <Text>Goal Risks</Text>
                  </HStack>
                </MenuItem>
                <MenuItem onClick={() => setFilter('project_overlap')}>
                  <HStack>
                    {filter === 'project_overlap' && <Icon as={FiCheck} />}
                    <Text>Project Overlaps</Text>
                  </HStack>
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </DrawerHeader>

        <DrawerBody p={0}>
          <VStack spacing={0} align="stretch" divider={<Divider />}>
            {filteredNotifications.map((notification) => (
              <Box
                key={notification.id}
                p={4}
                cursor="pointer"
                _hover={{ bg: hoverBgColor }}
                opacity={notification.read ? 0.7 : 1}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <HStack spacing={3} align="flex-start">
                  <Icon
                    as={getSeverityIcon(notification.severity)}
                    color={`${getSeverityColor(notification.severity)}.500`}
                    boxSize={5}
                  />
                  <Box flex={1}>
                    <HStack justify="space-between" mb={1}>
                      <Text fontWeight="medium">{notification.title}</Text>
                      <Badge variant="subtle" colorScheme={getSeverityColor(notification.severity)}>
                        {getTypeLabel(notification.type)}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.300' }}>
                      {notification.message}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {new Date(notification.timestamp).toLocaleString()}
                    </Text>
                    {notification.actionUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="primary"
                        mt={2}
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = notification.actionUrl!;
                        }}
                      >
                        View Details
                      </Button>
                    )}
                  </Box>
                  {!notification.read && (
                    <Tooltip label="Mark as read">
                      <IconButton
                        icon={<FiCheck />}
                        aria-label="Mark as read"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      />
                    </Tooltip>
                  )}
                </HStack>
              </Box>
            ))}
            {filteredNotifications.length === 0 && (
              <Box p={8} textAlign="center" color="gray.500">
                <Text>No notifications to display</Text>
              </Box>
            )}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
} 