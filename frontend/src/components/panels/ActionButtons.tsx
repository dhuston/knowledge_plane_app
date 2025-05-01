import React from 'react';
import {
  Box,
  Button,
  HStack,
  Divider,
  Tooltip,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import {
  FiMail,
  FiMessageSquare,
  FiShare2,
  FiEdit,
  FiPlus,
  FiStar,
  FiCalendar,
  FiTrash2,
  FiFlag,
  FiUsers,
} from 'react-icons/fi';
import { MapNodeTypeEnum } from '../../types/map';

interface ActionButtonsProps {
  entityType: MapNodeTypeEnum;
  entityId: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ entityType, entityId }) => {
  const toast = useToast();
  const buttonBg = useColorModeValue('white', 'gray.800');
  const buttonHoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Function to handle button clicks
  const handleAction = (action: string) => {
    // Emit a custom event that parent components can listen for
    const actionEvent = new CustomEvent('entity-action', {
      detail: {
        action,
        entityType,
        entityId,
      },
      bubbles: true
    });
    document.dispatchEvent(actionEvent);
    
    // Display a toast message for feedback
    toast({
      title: `${action} action triggered`,
      description: `${action} for ${entityType} ${entityId}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Get actions based on entity type
  const getActions = (): { icon: React.ElementType; label: string; action: string }[] => {
    switch (entityType) {
      case MapNodeTypeEnum.USER:
        return [
          { icon: FiMail, label: 'Send Message', action: 'Message' },
          { icon: FiCalendar, label: 'Schedule Meeting', action: 'Schedule' },
          { icon: FiStar, label: 'Add to Favorites', action: 'Favorite' },
          { icon: FiShare2, label: 'Share Profile', action: 'Share' },
        ];
      case MapNodeTypeEnum.TEAM:
        return [
          { icon: FiUsers, label: 'View Members', action: 'Members' },
          { icon: FiPlus, label: 'Join Team', action: 'Join' },
          { icon: FiMessageSquare, label: 'Team Chat', action: 'Chat' },
          { icon: FiShare2, label: 'Share Team', action: 'Share' },
        ];
      case MapNodeTypeEnum.PROJECT:
        return [
          { icon: FiEdit, label: 'Edit Project', action: 'Edit' },
          { icon: FiFlag, label: 'Set Goal', action: 'Goal' },
          { icon: FiPlus, label: 'Add Task', action: 'Task' },
          { icon: FiShare2, label: 'Share Project', action: 'Share' },
        ];
      case MapNodeTypeEnum.GOAL:
        return [
          { icon: FiEdit, label: 'Edit Goal', action: 'Edit' },
          { icon: FiPlus, label: 'Add Project', action: 'Project' },
          { icon: FiStar, label: 'Mark as Priority', action: 'Priority' },
          { icon: FiShare2, label: 'Share Goal', action: 'Share' },
        ];
      default:
        return [
          { icon: FiEdit, label: 'Edit', action: 'Edit' },
          { icon: FiShare2, label: 'Share', action: 'Share' },
          { icon: FiTrash2, label: 'Delete', action: 'Delete' },
        ];
    }
  };
  
  const actions = getActions();

  return (
    <Box>
      <Divider mb={3} />
      <HStack spacing={2} justifyContent="center" flexWrap="wrap">
        {actions.map((action) => (
          <Tooltip key={action.action} label={action.label} hasArrow>
            <Button
              leftIcon={<action.icon />}
              size="sm"
              variant="outline"
              bg={buttonBg}
              _hover={{ bg: buttonHoverBg }}
              onClick={() => handleAction(action.action)}
            >
              {action.label}
            </Button>
          </Tooltip>
        ))}
      </HStack>
    </Box>
  );
};

export default ActionButtons;