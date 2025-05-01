import React, { useState } from 'react';
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Heading,
  Icon,
  IconButton,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Badge,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react';
import { FaBell, FaCheck, FaTrash, FaEllipsisV, FaFilter } from 'react-icons/fa';
import useNotifications, { Notification } from '../../hooks/useNotifications';
import NotificationItem from './NotificationItem';
import NotificationBadge from './NotificationBadge';
import NotificationPreferences from './NotificationPreferences';
import EmptyState from '../common/EmptyState';

interface NotificationCenterProps {
  // Props if needed
}

const NotificationCenter: React.FC<NotificationCenterProps> = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    dismiss,
    markAllAsRead,
    dismissAll
  } = useNotifications();
  
  // Filter notifications by type if a filter is selected
  const filteredNotifications = selectedType 
    ? notifications.filter(notification => notification.type === selectedType)
    : notifications;
  
  // Handle notification actions
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  const handleDismiss = async (id: string) => {
    try {
      await dismiss(id);
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };
  
  const handleDismissAll = async () => {
    try {
      await dismissAll();
    } catch (error) {
      console.error('Failed to dismiss all notifications:', error);
    }
  };
  
  // Toggle preferences view
  const togglePreferences = () => {
    setShowPreferences(!showPreferences);
  };
  
  // Get unique notification types for filtering
  const notificationTypes = Array.from(new Set(notifications.map(n => n.type)));
  
  return (
    <>
      {/* Notification Bell Icon with Badge */}
      <Box position="relative" display="inline-block">
        <IconButton
          ref={btnRef}
          aria-label="Notifications"
          icon={<FaBell />}
          onClick={onOpen}
          variant="ghost"
          size="md"
        />
        {unreadCount > 0 && (
          <NotificationBadge count={unreadCount} />
        )}
      </Box>
      
      {/* Notification Drawer */}
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        finalFocusRef={btnRef}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            <Flex justifyContent="space-between" alignItems="center">
              <Heading size="md">Notifications</Heading>
              <HStack spacing={2}>
                {/* Filter Menu */}
                <Menu>
                  <Tooltip label="Filter notifications">
                    <MenuButton
                      as={IconButton}
                      aria-label="Filter notifications"
                      icon={<FaFilter />}
                      size="sm"
                      variant="ghost"
                    />
                  </Tooltip>
                  <MenuList>
                    <MenuItem onClick={() => setSelectedType(null)}>
                      All Notifications
                    </MenuItem>
                    <Divider />
                    {notificationTypes.map(type => (
                      <MenuItem 
                        key={type}
                        onClick={() => setSelectedType(type)}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>
                
                {/* Actions Menu */}
                <Menu>
                  <MenuButton
                    as={IconButton}
                    aria-label="Notification options"
                    icon={<FaEllipsisV />}
                    size="sm"
                    variant="ghost"
                  />
                  <MenuList>
                    <MenuItem icon={<FaCheck />} onClick={handleMarkAllAsRead}>
                      Mark all as read
                    </MenuItem>
                    <MenuItem icon={<FaTrash />} onClick={handleDismissAll}>
                      Dismiss all
                    </MenuItem>
                    <MenuItem onClick={togglePreferences}>
                      Notification settings
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Flex>
            
            {/* Filter indicator */}
            {selectedType && (
              <Flex mt={2}>
                <Badge colorScheme="blue" borderRadius="full" px={2}>
                  Filtering: {selectedType}
                  <IconButton
                    aria-label="Clear filter"
                    icon={<Icon as={FaTrash} boxSize={2} />}
                    size="xs"
                    ml={1}
                    variant="ghost"
                    onClick={() => setSelectedType(null)}
                  />
                </Badge>
              </Flex>
            )}
          </DrawerHeader>
          
          <DrawerBody p={0}>
            {showPreferences ? (
              <NotificationPreferences onBack={togglePreferences} />
            ) : (
              <Box>
                {filteredNotifications.length > 0 ? (
                  <VStack spacing={0} align="stretch" divider={<Divider />}>
                    {filteredNotifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={handleMarkAsRead}
                        onDismiss={handleDismiss}
                      />
                    ))}
                  </VStack>
                ) : (
                  <EmptyState
                    title="No notifications"
                    description={selectedType 
                      ? `No ${selectedType} notifications found` 
                      : "You're all caught up!"
                    }
                    icon={FaBell}
                    mt={10}
                  />
                )}
              </Box>
            )}
          </DrawerBody>
          
          <DrawerFooter borderTopWidth="1px" justifyContent="center">
            <Button variant="outline" mr={3} onClick={onClose}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default NotificationCenter;