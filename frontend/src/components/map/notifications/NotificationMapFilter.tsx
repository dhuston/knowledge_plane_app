import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuGroup,
  MenuOptionGroup,
  MenuItemOption,
  Icon,
  Badge,
  HStack,
  Text,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaBell, FaFilter, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import useNotifications from '../../../hooks/useNotifications';
import useNotificationFilter from '../../../hooks/useNotificationFilter';

interface NotificationMapFilterProps {
  onFilterChange: (params: {
    enabled: boolean;
    type?: string;
    severity?: string;
    includeRead: boolean;
  }) => void;
}

/**
 * Component for filtering map nodes based on notifications.
 * Provides UI controls for filtering by notification type, severity, and read status.
 */
const NotificationMapFilter: React.FC<NotificationMapFilterProps> = ({ onFilterChange }) => {
  const { unreadCount } = useNotifications();
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedSeverity, setSelectedSeverity] = useState<string | undefined>(undefined);
  const [includeRead, setIncludeRead] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  
  // Apply filters when any option changes
  const handleFilterChange = (options: {
    enabled?: boolean;
    type?: string | undefined;
    severity?: string | undefined;
    includeRead?: boolean;
  }) => {
    const newEnabled = options.enabled !== undefined ? options.enabled : isEnabled;
    const newType = options.type !== undefined ? options.type : selectedType;
    const newSeverity = options.severity !== undefined ? options.severity : selectedSeverity;
    const newIncludeRead = options.includeRead !== undefined ? options.includeRead : includeRead;
    
    // Update state
    setIsEnabled(newEnabled);
    setSelectedType(newType === 'all' ? undefined : newType);
    setSelectedSeverity(newSeverity === 'all' ? undefined : newSeverity);
    setIncludeRead(newIncludeRead);
    
    // Notify parent component
    onFilterChange({
      enabled: newEnabled,
      type: newType === 'all' ? undefined : newType,
      severity: newSeverity === 'all' ? undefined : newSeverity,
      includeRead: newIncludeRead,
    });
  };
  
  // Toggle filter on/off
  const toggleFilter = () => {
    const newEnabled = !isEnabled;
    handleFilterChange({ enabled: newEnabled });
  };
  
  // Reset all filters
  const resetFilters = () => {
    handleFilterChange({
      type: undefined,
      severity: undefined,
      includeRead: false,
    });
  };
  
  // Get severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Icon as={FaExclamationCircle} color="red.500" mr={2} />;
      case 'warning':
        return <Icon as={FaExclamationTriangle} color="yellow.500" mr={2} />;
      case 'info':
      default:
        return <Icon as={FaInfoCircle} color="blue.500" mr={2} />;
    }
  };
  
  // Define notification types
  const notificationTypes = [
    { value: 'activity', label: 'Activities' },
    { value: 'insight', label: 'Insights' },
    { value: 'reminder', label: 'Reminders' },
    { value: 'system', label: 'System' },
    { value: 'mention', label: 'Mentions' },
    { value: 'relationship', label: 'Relationships' },
  ];
  
  // Define severity levels
  const severityLevels = [
    { value: 'info', label: 'Information' },
    { value: 'warning', label: 'Warning' },
    { value: 'critical', label: 'Critical' },
  ];
  
  return (
    <Box>
      <Menu closeOnSelect={false}>
        <Tooltip
          label={isEnabled ? 'Notification filter active' : 'Filter nodes by notifications'}
          placement="top"
        >
          <MenuButton
            as={Button}
            size="sm"
            leftIcon={<FaBell />}
            rightIcon={<FaFilter />}
            colorScheme={isEnabled ? 'blue' : 'gray'}
            variant={isEnabled ? 'solid' : 'outline'}
            onClick={() => {
              // If there are no active filters, just toggle the filter
              if (!isEnabled && !selectedType && !selectedSeverity) {
                toggleFilter();
              }
            }}
          >
            {isEnabled && (
              <Badge ml={1} colorScheme="blue" borderRadius="full">
                {unreadCount}
              </Badge>
            )}
          </MenuButton>
        </Tooltip>
        <MenuList zIndex={10}>
          <MenuGroup title="Notification Filter">
            <MenuItem onClick={toggleFilter}>
              <HStack justify="space-between" width="100%">
                <Text>{isEnabled ? 'Disable Filter' : 'Enable Filter'}</Text>
                <Badge colorScheme={isEnabled ? 'blue' : 'gray'}>
                  {isEnabled ? 'ON' : 'OFF'}
                </Badge>
              </HStack>
            </MenuItem>
            <MenuDivider />
            <MenuGroup title="Notification Type">
              <MenuOptionGroup
                type="radio"
                value={selectedType || 'all'}
                onChange={(value) => handleFilterChange({ type: value as string })}
              >
                <MenuItemOption value="all">All Types</MenuItemOption>
                {notificationTypes.map((type) => (
                  <MenuItemOption key={type.value} value={type.value}>
                    {type.label}
                  </MenuItemOption>
                ))}
              </MenuOptionGroup>
            </MenuGroup>
            <MenuDivider />
            <MenuGroup title="Severity">
              <MenuOptionGroup
                type="radio"
                value={selectedSeverity || 'all'}
                onChange={(value) => handleFilterChange({ severity: value as string })}
              >
                <MenuItemOption value="all">All Severities</MenuItemOption>
                {severityLevels.map((severity) => (
                  <MenuItemOption key={severity.value} value={severity.value}>
                    <HStack>
                      {getSeverityIcon(severity.value)}
                      <Text>{severity.label}</Text>
                    </HStack>
                  </MenuItemOption>
                ))}
              </MenuOptionGroup>
            </MenuGroup>
            <MenuDivider />
            <MenuGroup title="Status">
              <MenuItem
                onClick={() => handleFilterChange({ includeRead: !includeRead })}
              >
                <HStack justify="space-between" width="100%">
                  <Text>Include Read Notifications</Text>
                  <Badge colorScheme={includeRead ? 'green' : 'gray'}>
                    {includeRead ? 'YES' : 'NO'}
                  </Badge>
                </HStack>
              </MenuItem>
            </MenuGroup>
            <MenuDivider />
            <MenuItem onClick={resetFilters}>Reset Filters</MenuItem>
          </MenuGroup>
        </MenuList>
      </Menu>
    </Box>
  );
};

export default NotificationMapFilter;