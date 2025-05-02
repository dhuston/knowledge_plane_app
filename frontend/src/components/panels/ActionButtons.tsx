import React, { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Divider,
  Tooltip,
  useColorModeValue,
  useToast,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Badge,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Flex,
  Heading,
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
  FiMoreVertical,
  FiCheck,
  FiClock,
  FiBriefcase,
  FiLink,
  FiBook,
  FiAlertTriangle,
  FiFileText,
  FiChevronDown,
  FiActivity
} from 'react-icons/fi';
import { MapNodeTypeEnum } from '../../types/map';

interface ActionButtonsProps {
  entityType: MapNodeTypeEnum;
  entityId: string;
}

// Define action type
interface Action {
  icon: React.ElementType; 
  label: string; 
  action: string;
  primary?: boolean;
  destructive?: boolean;
  hasDynamicForm?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ entityType, entityId }) => {
  const toast = useToast();
  const buttonBg = useColorModeValue('white', 'gray.800');
  const buttonHoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  // Modal states for various action forms
  const { isOpen: isActionModalOpen, onOpen: onActionModalOpen, onClose: onActionModalClose } = useDisclosure();
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  
  // Function to handle button clicks
  const handleAction = (action: Action) => {
    setSelectedAction(action);
    
    // For actions with forms, open the modal
    if (action.hasDynamicForm) {
      onActionModalOpen();
      return;
    }
    
    // Emit a custom event that parent components can listen for
    const actionEvent = new CustomEvent('entity-action', {
      detail: {
        action: action.action,
        entityType,
        entityId,
      },
      bubbles: true
    });
    document.dispatchEvent(actionEvent);
    
    // Display a toast message for feedback
    toast({
      title: `${action.label} action initiated`,
      description: `${action.action} for ${entityType} ${entityId}`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Function to handle form submission from modal
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock form submission - in a real app, this would send the form data
    const formData = new FormData(e.target as HTMLFormElement);
    const formValues: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      formValues[key] = value as string;
    });
    
    // Log the form data (for demo purposes)
    console.log('Form submitted:', formValues);
    
    // Emit event with form data
    const actionEvent = new CustomEvent('entity-action', {
      detail: {
        action: selectedAction?.action,
        entityType,
        entityId,
        formData: formValues,
      },
      bubbles: true
    });
    document.dispatchEvent(actionEvent);
    
    // Show success message
    toast({
      title: `${selectedAction?.label} completed`,
      description: `Action was processed successfully`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    // Close modal
    onActionModalClose();
  };
  
  // Get actions based on entity type
  const getActions = (): Action[] => {
    switch (entityType) {
      case MapNodeTypeEnum.USER:
        return [
          { icon: FiMail, label: 'Send Message', action: 'Message', primary: true, hasDynamicForm: true },
          { icon: FiCalendar, label: 'Schedule Meeting', action: 'Schedule', hasDynamicForm: true },
          { icon: FiStar, label: 'Add to Favorites', action: 'Favorite' },
          { icon: FiPlus, label: 'Assign to Team', action: 'AssignTeam', hasDynamicForm: true },
          { icon: FiShare2, label: 'Share Profile', action: 'Share', hasDynamicForm: true },
          { icon: FiFileText, label: 'View Reports', action: 'Reports' },
          { icon: FiActivity, label: 'View Activity', action: 'ViewActivity' },
        ];
      case MapNodeTypeEnum.TEAM:
        return [
          { icon: FiUsers, label: 'View Members', action: 'Members', primary: true },
          { icon: FiPlus, label: 'Join Team', action: 'Join' },
          { icon: FiMessageSquare, label: 'Team Chat', action: 'Chat' },
          { icon: FiShare2, label: 'Share Team', action: 'Share', hasDynamicForm: true },
          { icon: FiBriefcase, label: 'Department Info', action: 'Department' },
          { icon: FiEdit, label: 'Edit Team', action: 'Edit', hasDynamicForm: true },
          { icon: FiActivity, label: 'Team Analytics', action: 'Analytics' },
        ];
      case MapNodeTypeEnum.PROJECT:
        return [
          { icon: FiEdit, label: 'Edit Project', action: 'Edit', primary: true, hasDynamicForm: true },
          { icon: FiFlag, label: 'Set Goal', action: 'Goal', hasDynamicForm: true },
          { icon: FiPlus, label: 'Add Task', action: 'Task', hasDynamicForm: true },
          { icon: FiUsers, label: 'Team Members', action: 'Members' },
          { icon: FiLink, label: 'Link Resources', action: 'Link', hasDynamicForm: true },
          { icon: FiShare2, label: 'Share Project', action: 'Share', hasDynamicForm: true },
          { icon: FiClock, label: 'View Timeline', action: 'Timeline' },
          { icon: FiActivity, label: 'Project Health', action: 'Health' },
          { icon: FiAlertTriangle, label: 'Report Issue', action: 'Issue', hasDynamicForm: true },
          { icon: FiTrash2, label: 'Archive Project', action: 'Archive', destructive: true, hasDynamicForm: true },
        ];
      case MapNodeTypeEnum.GOAL:
        return [
          { icon: FiEdit, label: 'Edit Goal', action: 'Edit', primary: true, hasDynamicForm: true },
          { icon: FiPlus, label: 'Add Project', action: 'Project', hasDynamicForm: true },
          { icon: FiStar, label: 'Mark as Priority', action: 'Priority' },
          { icon: FiShare2, label: 'Share Goal', action: 'Share', hasDynamicForm: true },
          { icon: FiCheck, label: 'Update Status', action: 'Status', hasDynamicForm: true },
          { icon: FiActivity, label: 'View Progress', action: 'Progress' },
          { icon: FiLink, label: 'Link Dependencies', action: 'Dependencies', hasDynamicForm: true },
        ];
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return [
          { icon: FiEdit, label: 'Edit Asset', action: 'Edit', primary: true, hasDynamicForm: true },
          { icon: FiBook, label: 'View Document', action: 'View' },
          { icon: FiShare2, label: 'Share Asset', action: 'Share', hasDynamicForm: true },
          { icon: FiLink, label: 'Add Reference', action: 'Reference', hasDynamicForm: true },
          { icon: FiStar, label: 'Add to Collection', action: 'Collection', hasDynamicForm: true },
        ];
      case MapNodeTypeEnum.DEPARTMENT:
        return [
          { icon: FiUsers, label: 'View Teams', action: 'Teams', primary: true },
          { icon: FiBriefcase, label: 'Department Info', action: 'Info' },
          { icon: FiEdit, label: 'Edit Department', action: 'Edit', hasDynamicForm: true },
          { icon: FiActivity, label: 'Department Analytics', action: 'Analytics' },
        ];
      default:
        return [
          { icon: FiEdit, label: 'Edit', action: 'Edit', primary: true },
          { icon: FiShare2, label: 'Share', action: 'Share', hasDynamicForm: true },
          { icon: FiTrash2, label: 'Delete', action: 'Delete', destructive: true },
        ];
    }
  };
  
  const renderActionForm = () => {
    if (!selectedAction) return null;
    
    // Common form controls based on action type
    switch (selectedAction.action) {
      case 'Message':
        return (
          <>
            <FormControl id="recipient" isRequired mb={4}>
              <FormLabel>To</FormLabel>
              <Input type="text" value="User Name" isReadOnly />
            </FormControl>
            <FormControl id="subject" isRequired mb={4}>
              <FormLabel>Subject</FormLabel>
              <Input type="text" placeholder="Message subject" />
            </FormControl>
            <FormControl id="message" isRequired mb={4}>
              <FormLabel>Message</FormLabel>
              <Textarea placeholder="Type your message here..." rows={5} />
            </FormControl>
          </>
        );
        
      case 'Schedule':
        return (
          <>
            <FormControl id="title" isRequired mb={4}>
              <FormLabel>Meeting Title</FormLabel>
              <Input type="text" placeholder="Enter meeting title" />
            </FormControl>
            <FormControl id="date" isRequired mb={4}>
              <FormLabel>Date</FormLabel>
              <Input type="date" />
            </FormControl>
            <FormControl id="time" isRequired mb={4}>
              <FormLabel>Time</FormLabel>
              <Input type="time" />
            </FormControl>
            <FormControl id="participants" isRequired mb={4}>
              <FormLabel>Participants</FormLabel>
              <Input type="text" value="User Name" isReadOnly />
            </FormControl>
            <FormControl id="description" mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea placeholder="Meeting details..." rows={3} />
            </FormControl>
          </>
        );
        
      case 'Share':
        return (
          <>
            <FormControl id="share_with" isRequired mb={4}>
              <FormLabel>Share with</FormLabel>
              <Select placeholder="Select option">
                <option value="user">Specific User</option>
                <option value="team">Team</option>
                <option value="department">Department</option>
                <option value="org">Organization</option>
              </Select>
            </FormControl>
            <FormControl id="recipient" mb={4}>
              <FormLabel>Recipient</FormLabel>
              <Input type="text" placeholder="Enter name or email" />
            </FormControl>
            <FormControl id="permission" isRequired mb={4}>
              <FormLabel>Permission Level</FormLabel>
              <Select defaultValue="view">
                <option value="view">View only</option>
                <option value="comment">Comment</option>
                <option value="edit">Edit</option>
                <option value="admin">Admin</option>
              </Select>
            </FormControl>
            <FormControl id="note" mb={4}>
              <FormLabel>Note (optional)</FormLabel>
              <Textarea placeholder="Add a personal note..." rows={3} />
            </FormControl>
          </>
        );
        
      case 'Edit':
        // Generic edit form - in a real app this would be tailored to the entity type
        return (
          <>
            <FormControl id="name" isRequired mb={4}>
              <FormLabel>Name</FormLabel>
              <Input type="text" defaultValue={entityId} />
            </FormControl>
            <FormControl id="description" mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea placeholder="Entity description..." rows={4} />
            </FormControl>
            <FormControl id="status" mb={4}>
              <FormLabel>Status</FormLabel>
              <Select defaultValue="active">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="complete">Complete</option>
              </Select>
            </FormControl>
          </>
        );
        
      case 'Task':
      case 'Issue':
        return (
          <>
            <FormControl id="title" isRequired mb={4}>
              <FormLabel>Title</FormLabel>
              <Input type="text" placeholder="Enter title" />
            </FormControl>
            <FormControl id="description" mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea placeholder="Provide details..." rows={4} />
            </FormControl>
            <FormControl id="assignee" mb={4}>
              <FormLabel>Assign to</FormLabel>
              <Select placeholder="Select assignee">
                <option value="user1">User 1</option>
                <option value="user2">User 2</option>
                <option value="user3">User 3</option>
              </Select>
            </FormControl>
            <FormControl id="priority" isRequired mb={4}>
              <FormLabel>Priority</FormLabel>
              <Select defaultValue="medium">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </FormControl>
            <FormControl id="due_date" mb={4}>
              <FormLabel>Due Date</FormLabel>
              <Input type="date" />
            </FormControl>
          </>
        );
        
      default:
        return (
          <Text color="gray.500">
            Configure action settings for {selectedAction.label}
          </Text>
        );
    }
  };
  
  const allActions = getActions();
  
  // Separate primary actions from secondary actions
  const primaryActions = allActions.filter(action => action.primary);
  const secondaryActions = allActions.filter(action => !action.primary);
  const hasSecondaryActions = secondaryActions.length > 0;

  return (
    <Box>
      <Divider mb={4} />
      
      {/* Action buttons section header */}
      <Flex mb={3} align="center" justify="space-between">
        <Heading size="xs" color="gray.500">Quick Actions</Heading>
      </Flex>
      
      {/* Primary actions always visible */}
      <VStack spacing={3} align="stretch">
        {/* Important actions as full buttons */}
        <HStack spacing={2} justifyContent="center" flexWrap="wrap">
          {primaryActions.map((action) => (
            <Button
              key={action.action}
              leftIcon={<action.icon />}
              size="sm"
              colorScheme={action.destructive ? "red" : "blue"}
              variant={action.destructive ? "outline" : "solid"}
              onClick={() => handleAction(action)}
              flexGrow={1}
              maxW="160px"
            >
              {action.label}
            </Button>
          ))}
        </HStack>
        
        {/* Secondary actions in a row */}
        {hasSecondaryActions && (
          <HStack spacing={2} justifyContent="center" flexWrap="wrap" mt={1}>
            {secondaryActions.slice(0, 3).map((action) => (
              <Tooltip key={action.action} label={action.label} hasArrow>
                <IconButton
                  aria-label={action.label}
                  icon={<action.icon />}
                  size="sm"
                  variant="outline"
                  colorScheme={action.destructive ? "red" : undefined}
                  onClick={() => handleAction(action)}
                />
              </Tooltip>
            ))}
            
            {/* More menu for additional actions */}
            {secondaryActions.length > 3 && (
              <Menu>
                <Tooltip label="More actions">
                  <MenuButton
                    as={IconButton}
                    aria-label="More actions"
                    icon={<FiMoreVertical />}
                    size="sm"
                    variant="outline"
                  />
                </Tooltip>
                <Portal>
                  <MenuList>
                    {secondaryActions.slice(3).map((action) => (
                      <MenuItem 
                        key={action.action} 
                        icon={<action.icon />}
                        onClick={() => handleAction(action)}
                        color={action.destructive ? "red.500" : undefined}
                      >
                        {action.label}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Portal>
              </Menu>
            )}
          </HStack>
        )}
      </VStack>
      
      {/* Action Modal for forms */}
      <Modal isOpen={isActionModalOpen} onClose={onActionModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedAction && (
              <HStack>
                {selectedAction.icon && <selectedAction.icon />}
                <Text>{selectedAction.label}</Text>
              </HStack>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleFormSubmit}>
            <ModalBody pb={6}>
              {renderActionForm()}
            </ModalBody>

            <ModalFooter>
              <Button 
                colorScheme={selectedAction?.destructive ? "red" : "blue"} 
                mr={3} 
                type="submit"
              >
                {selectedAction?.destructive ? 'Confirm' : 'Submit'}
              </Button>
              <Button variant="ghost" onClick={onActionModalClose}>Cancel</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ActionButtons;