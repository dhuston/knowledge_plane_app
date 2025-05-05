import React from 'react';
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  Switch,
  Divider,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { FaArrowLeft, FaBell, FaLightbulb, FaClock, FaCog, FaAt, FaProjectDiagram } from 'react-icons/fa';
import useNotifications from '../../hooks/useNotifications';

interface NotificationPreferencesProps {
  onBack: () => void;
}

// Notification type metadata
const notificationTypes = [
  {
    type: 'activity',
    label: 'Activity Notifications',
    description: 'Notifications about team, project, and goal activities',
    icon: FaBell,
    color: 'blue',
  },
  {
    type: 'insight',
    label: 'AI Insights',
    description: 'AI-generated insights about organizational patterns',
    icon: FaLightbulb,
    color: 'yellow',
  },
  {
    type: 'reminder',
    label: 'Reminders',
    description: 'Reminders about approaching deadlines and events',
    icon: FaClock,
    color: 'purple',
  },
  {
    type: 'system',
    label: 'System Updates',
    description: 'Updates about the platform and features',
    icon: FaCog,
    color: 'gray',
  },
  {
    type: 'mention',
    label: 'Mentions',
    description: 'When you are mentioned in notes or comments',
    icon: FaAt,
    color: 'green',
  },
  {
    type: 'relationship',
    label: 'Relationship Changes',
    description: 'Changes to organizational relationships that affect you',
    icon: FaProjectDiagram,
    color: 'cyan',
  },
];

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ onBack }) => {
  const { preferences = [], updatePreference, isLoading } = useNotifications();
  const toast = useToast();
  
  // Log preferences for debugging
  console.log('[Debug] NotificationPreferences component - preferences:', preferences);
  
  // Function to get preference value for a type
  const getPreferenceValue = (notificationType: string, field: 'enabled' | 'email_enabled') => {
    // Add null/undefined check for preferences
    if (!Array.isArray(preferences)) {
      console.warn('[Debug] preferences is not an array in NotificationPreferences');
      return true; // Default to true if preferences is not an array
    }
    
    const pref = preferences.find(p => p && p.notification_type === notificationType);
    return pref ? pref[field] : true; // Default to true if not found
  };
  
  // Handler for toggling app notifications
  const handleToggleApp = async (notificationType: string) => {
    try {
      const currentValue = getPreferenceValue(notificationType, 'enabled');
      const emailEnabled = getPreferenceValue(notificationType, 'email_enabled');
      
      await updatePreference(notificationType, !currentValue, emailEnabled);
      
      toast({
        title: 'Preference updated',
        description: `${currentValue ? 'Disabled' : 'Enabled'} ${notificationType} notifications`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating preference',
        description: 'Failed to update notification preference',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Handler for toggling email notifications
  const handleToggleEmail = async (notificationType: string) => {
    try {
      const appEnabled = getPreferenceValue(notificationType, 'enabled');
      const currentValue = getPreferenceValue(notificationType, 'email_enabled');
      
      await updatePreference(notificationType, appEnabled, !currentValue);
      
      toast({
        title: 'Preference updated',
        description: `${currentValue ? 'Disabled' : 'Enabled'} email notifications for ${notificationType}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating preference',
        description: 'Failed to update email notification preference',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Box p={4}>
      <HStack mb={4}>
        <Button leftIcon={<FaArrowLeft />} variant="ghost" onClick={onBack}>
          Back to notifications
        </Button>
      </HStack>
      
      <Heading size="md" mb={4}>Notification Preferences</Heading>
      
      {isLoading ? (
        <Box textAlign="center" py={10}>
          <Text>Loading preferences...</Text>
        </Box>
      ) : !Array.isArray(preferences) ? (
        <Box textAlign="center" py={10}>
          <Text>Could not load notification preferences. Please try again later.</Text>
          <Button mt={4} onClick={() => window.location.reload()}>
            Reload
          </Button>
        </Box>
      ) : (
        <VStack spacing={4} align="stretch" divider={<Divider />}>
          {notificationTypes.map(({ type, label, description, icon, color }) => (
            <Box key={type}>
              <HStack mb={2}>
                <Icon as={icon} color={`${color}.500`} boxSize={5} />
                <Text fontWeight="bold">{label}</Text>
              </HStack>
              
              <Text fontSize="sm" color="gray.500" mb={3}>
                {description}
              </Text>
              
              <HStack justifyContent="space-between" mt={2}>
                <Text>Receive in app</Text>
                <Switch
                  isChecked={getPreferenceValue(type, 'enabled')}
                  onChange={() => handleToggleApp(type)}
                  colorScheme={color}
                />
              </HStack>
              
              <HStack justifyContent="space-between" mt={2}>
                <Text>Receive by email</Text>
                <Switch
                  isChecked={getPreferenceValue(type, 'email_enabled')}
                  onChange={() => handleToggleEmail(type)}
                  colorScheme={color}
                  isDisabled={!getPreferenceValue(type, 'enabled')}
                />
              </HStack>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default NotificationPreferences;