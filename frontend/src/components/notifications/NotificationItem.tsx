import React from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  IconButton,
  useColorModeValue,
  HStack,
  Badge,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { FaBell, FaLightbulb, FaClock, FaCog, FaAt, FaProjectDiagram, FaCheck, FaTrash, FaEllipsisV } from 'react-icons/fa';
import { Notification } from '../../hooks/useNotifications';
import { Link } from 'react-router-dom';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onMarkAsRead, 
  onDismiss 
}) => {
  const {
    id,
    type,
    severity,
    title,
    message,
    created_at,
    read_at,
    action_url,
  } = notification;
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const unreadBgColor = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Determine icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'activity':
        return FaBell;
      case 'insight':
        return FaLightbulb;
      case 'reminder':
        return FaClock;
      case 'system':
        return FaCog;
      case 'mention':
        return FaAt;
      case 'relationship':
        return FaProjectDiagram;
      default:
        return FaBell;
    }
  };
  
  // Determine color based on severity
  const getSeverityColor = () => {
    switch (severity) {
      case 'info':
        return 'blue';
      case 'warning':
        return 'yellow';
      case 'critical':
        return 'red';
      default:
        return 'blue';
    }
  };
  
  // Format relative time (e.g. "2 hours ago")
  const getRelativeTime = () => {
    const now = new Date();
    const createdDate = new Date(created_at);
    const diffMs = now.getTime() - createdDate.getTime();
    
    // Convert to seconds, minutes, hours, days
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  };
  
  // Format absolute time for tooltip (e.g. "Jan 15, 2023 at 2:30 PM")
  const getFormattedTime = () => {
    const date = new Date(created_at);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options);
  };
  
  // Handle click on notification
  const handleClick = () => {
    if (!read_at) {
      onMarkAsRead(id);
    }
  };
  
  // Notification wrapper component
  const NotificationWrapper = ({ children }: { children: React.ReactNode }) => {
    if (action_url) {
      return (
        <Box 
          as={Link} 
          to={action_url}
          display="block"
          _hover={{ textDecoration: 'none' }}
          onClick={handleClick}
        >
          {children}
        </Box>
      );
    }
    return <Box onClick={handleClick}>{children}</Box>;
  };
  
  return (
    <Box
      bg={read_at ? bgColor : unreadBgColor}
      p={4}
      _hover={{ bg: hoverBgColor }}
      borderLeft="4px solid"
      borderLeftColor={`${getSeverityColor()}.400`}
      position="relative"
    >
      <NotificationWrapper>
        <Flex>
          {/* Icon */}
          <Box mr={3} color={`${getSeverityColor()}.500`}>
            <Icon as={getIcon()} boxSize={5} />
          </Box>
          
          {/* Content */}
          <Box flex="1">
            <Flex justifyContent="space-between" alignItems="flex-start">
              <Text fontWeight="bold" mb={1}>{title}</Text>
              
              {/* Actions Menu */}
              <Menu placement="bottom-end">
                <MenuButton
                  as={IconButton}
                  size="sm"
                  variant="ghost"
                  icon={<FaEllipsisV />}
                  aria-label="More options"
                  onClick={e => e.stopPropagation()} // Prevent triggering the notification click
                />
                <MenuList onClick={e => e.stopPropagation()}>
                  {!read_at && (
                    <MenuItem 
                      icon={<FaCheck />} 
                      onClick={() => onMarkAsRead(id)}
                    >
                      Mark as read
                    </MenuItem>
                  )}
                  <MenuItem 
                    icon={<FaTrash />} 
                    onClick={() => onDismiss(id)}
                  >
                    Dismiss
                  </MenuItem>
                </MenuList>
              </Menu>
            </Flex>
            
            <Text fontSize="sm" color="gray.600" mb={2}>{message}</Text>
            
            <Flex justifyContent="space-between" alignItems="center">
              {/* Type Badge */}
              <Badge colorScheme={getSeverityColor()} fontSize="xs">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Badge>
              
              {/* Time */}
              <Tooltip label={getFormattedTime()}>
                <Text fontSize="xs" color="gray.500">
                  {getRelativeTime()}
                </Text>
              </Tooltip>
            </Flex>
          </Box>
        </Flex>
      </NotificationWrapper>
    </Box>
  );
};

export default NotificationItem;