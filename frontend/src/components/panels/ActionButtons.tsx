import React, { useState, useRef } from 'react';
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
  MenuDivider,
  MenuGroup,
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
  FormHelperText,
  FormErrorMessage,
  Input,
  Textarea,
  Select,
  Flex,
  Heading,
  Radio,
  RadioGroup,
  Stack,
  Checkbox,
  Switch,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Grid,
  GridItem,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Avatar,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Collapse,
  Kbd,
  Tag,
  TagLabel,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  Progress,
  useBoolean,
  Spinner,
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
  FiActivity,
  FiHelpCircle,
  FiInfo,
  FiSettings,
  FiClipboard,
  FiArrowRight,
  FiRotateCw,
  FiSearch,
  FiXCircle,
  FiUpload,
  FiDownload,
  FiRefreshCw,
  FiPause,
  FiPlay,
  FiBell,
  FiBookmark,
  FiCoffee,
  FiArchive,
  FiLayers,
  FiTag,
  FiGitPullRequest,
  FiGitMerge,
  FiUserPlus,
  FiBarChart2,
  FiGrid,
  FiList,
  FiSlash,
  FiSave,
  FiShield,
  FiKey,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';
import { MapNodeTypeEnum } from '../../types/map';

interface ActionButtonsProps {
  entityType: MapNodeTypeEnum;
  entityId: string;
  onActionComplete?: (action: string, result: any) => void;
  recentActions?: string[];
  favoriteActions?: string[];
  permissions?: {
    canEdit?: boolean;
    canDelete?: boolean;
    canShare?: boolean;
    isAdmin?: boolean;
    isOwner?: boolean;
  };
  compact?: boolean;
  showLabels?: boolean;
  maxVisibleActions?: number;
  actionLayout?: 'horizontal' | 'vertical' | 'grid';
  groupActions?: boolean;
  appearance?: {
    primaryColor?: string;
    buttonSize?: 'xs' | 'sm' | 'md' | 'lg';
    buttonVariant?: 'solid' | 'outline' | 'ghost';
    iconOnly?: boolean;
  };
}

// Define action type with enhanced metadata
interface Action {
  icon: React.ElementType;
  label: string; 
  action: string;
  primary?: boolean;
  destructive?: boolean;
  hasDynamicForm?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  requiredPermission?: 'edit' | 'delete' | 'share' | 'admin' | 'owner';
  group?: 'main' | 'collaboration' | 'edit' | 'view' | 'advanced' | 'danger';
  shortcutKey?: string;
  description?: string;
  badge?: string | number;
  badgeColor?: string;
  successMessage?: string;
  errorMessage?: string;
  isDisabled?: boolean;
  disabledReason?: string;
  formSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  isNew?: boolean;
  beta?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  entityType,
  entityId,
  onActionComplete,
  recentActions = [],
  favoriteActions = [],
  permissions = {
    canEdit: true,
    canDelete: true,
    canShare: true,
    isAdmin: false,
    isOwner: false
  },
  compact = false,
  showLabels = true,
  maxVisibleActions = 5,
  actionLayout = 'horizontal',
  groupActions = false,
  appearance = {
    buttonSize: 'sm',
    buttonVariant: 'solid',
    iconOnly: false
  }
}) => {
  // UI state hooks
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useBoolean(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useBoolean(false);
  
  // Refs for dialog/accessibility
  const cancelRef = useRef<HTMLButtonElement>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Theme values
  const buttonBg = useColorModeValue('white', 'gray.800');
  const buttonHoverBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');
  const dangerColor = useColorModeValue('red.500', 'red.300');
  const successColor = useColorModeValue('green.500', 'green.300');
  const newBadgeBg = useColorModeValue('purple.100', 'purple.800');
  const newBadgeColor = useColorModeValue('purple.700', 'purple.200');
  const betaBadgeBg = useColorModeValue('orange.100', 'orange.800');
  const betaBadgeColor = useColorModeValue('orange.700', 'orange.200');
  
  // Disclosure hooks for various modals and drawers
  const { 
    isOpen: isActionModalOpen, 
    onOpen: onActionModalOpen, 
    onClose: onActionModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isActionDrawerOpen, 
    onOpen: onActionDrawerOpen, 
    onClose: onActionDrawerClose 
  } = useDisclosure();
  
  const { 
    isOpen: isConfirmDialogOpen, 
    onOpen: onConfirmDialogOpen, 
    onClose: onConfirmDialogClose 
  } = useDisclosure();
  
  const {
    isOpen: isHelpDrawerOpen,
    onOpen: onHelpDrawerOpen,
    onClose: onHelpDrawerClose
  } = useDisclosure();
  
  // Track action state
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [actionHistory, setActionHistory] = useState<Array<{action: string, timestamp: number}>>([]);
  const [favoriteActionsList, setFavoriteActionsList] = useState<string[]>(favoriteActions);
  
  // Action success/error handling state
  const [actionResult, setActionResult] = useState<{
    status: 'success' | 'error' | 'info';
    message: string;
    data?: any;
  } | null>(null);
  
  // Determine if we should use a modal or drawer for actions
  const useDrawer = (action?: Action | null) => {
    if (!action) return false;
    return action.formSize === 'lg' || action.formSize === 'xl' || action.formSize === 'full';
  };
  
  // Function to handle button clicks
  const handleAction = (action: Action) => {
    // Skip if action is disabled
    if (action.isDisabled) {
      toast({
        title: 'Action unavailable',
        description: action.disabledReason || 'This action is currently unavailable',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Check permissions
    if (action.requiredPermission) {
      const hasPermission = 
        (action.requiredPermission === 'edit' && permissions.canEdit) ||
        (action.requiredPermission === 'delete' && permissions.canDelete) ||
        (action.requiredPermission === 'share' && permissions.canShare) ||
        (action.requiredPermission === 'admin' && permissions.isAdmin) ||
        (action.requiredPermission === 'owner' && permissions.isOwner);
        
      if (!hasPermission) {
        toast({
          title: 'Permission denied',
          description: `You don't have permission to ${action.label.toLowerCase()}`,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }
    
    // Set the selected action
    setSelectedAction(action);
    
    // Clear any previous form data
    setFormValues({});
    setFormErrors({});
    
    // Initialize form with default values based on action type
    const defaultValues = getDefaultFormValues(action);
    setFormValues(defaultValues);
    
    // For confirmation dialogs
    if (action.requiresConfirmation) {
      onConfirmDialogOpen();
      return;
    }
    
    // For actions with forms, open the modal or drawer
    if (action.hasDynamicForm) {
      if (useDrawer(action)) {
        onActionDrawerOpen();
      } else {
        onActionModalOpen();
      }
      return;
    }
    
    // For immediate actions, process directly
    executeAction(action);
  };
  
  // Get default form values based on action type
  const getDefaultFormValues = (action: Action): Record<string, any> => {
    switch (action.action) {
      case 'Message':
        return {
          recipient: entityId,
          subject: '',
          message: ''
        };
      case 'Schedule':
        return {
          title: '',
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          participants: entityId,
          description: ''
        };
      case 'Share':
        return {
          share_with: '',
          recipient: '',
          permission: 'view',
          note: ''
        };
      case 'Edit':
        return {
          name: entityId,
          description: '',
          status: 'active'
        };
      default:
        return {};
    }
  };
  
  // Execute the action
  const executeAction = (action: Action, formData?: Record<string, any>) => {
    setIsProcessing.on();
    
    // Add to action history
    setActionHistory(prev => [
      { action: action.action, timestamp: Date.now() },
      ...prev
    ]);
    
    // In a real implementation, this would call an API
    setTimeout(() => {
      // Simulate action processing
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        // Emit event with form data
        const actionEvent = new CustomEvent('entity-action', {
          detail: {
            action: action.action,
            entityType,
            entityId,
            formData,
            timestamp: Date.now()
          },
          bubbles: true
        });
        document.dispatchEvent(actionEvent);
        
        // Set success result
        setActionResult({
          status: 'success',
          message: action.successMessage || `${action.label} completed successfully`,
          data: formData
        });
        
        // Show success message
        toast({
          title: action.successMessage || `${action.label} completed`,
          description: `Action was processed successfully`,
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'bottom-right'
        });
        
        // Call onActionComplete callback if provided
        if (onActionComplete) {
          onActionComplete(action.action, { success: true, data: formData });
        }
      } else {
        // Set error result
        setActionResult({
          status: 'error',
          message: action.errorMessage || `Failed to complete ${action.label}`,
        });
        
        // Show error message
        toast({
          title: action.errorMessage || `${action.label} failed`,
          description: `There was an error processing your request`,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'bottom-right'
        });
        
        // Call onActionComplete callback if provided
        if (onActionComplete) {
          onActionComplete(action.action, { success: false, error: 'Action failed' });
        }
      }
      
      // Close any open dialogs
      onActionModalClose();
      onActionDrawerClose();
      onConfirmDialogClose();
      
      // Reset processing state
      setIsProcessing.off();
      setIsSubmitting.off();
    }, 1000); // Simulated delay
  };
  
  // Function to handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting.on();
    
    // If no selected action, do nothing
    if (!selectedAction) {
      setIsSubmitting.off();
      return;
    }
    
    // Validate form data
    const errors = validateForm(selectedAction, formValues);
    setFormErrors(errors);
    
    // If there are errors, stop submission
    if (Object.keys(errors).length > 0) {
      setIsSubmitting.off();
      return;
    }
    
    // Execute the action with form data
    executeAction(selectedAction, formValues);
  };
  
  // Form field change handler
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error for the field being edited
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Validate form data
  const validateForm = (action: Action, data: Record<string, any>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    // Common validations based on action type
    switch (action.action) {
      case 'Message':
        if (!data.subject || data.subject.trim() === '') {
          errors.subject = 'Subject is required';
        }
        if (!data.message || data.message.trim() === '') {
          errors.message = 'Message content is required';
        }
        break;
        
      case 'Schedule':
        if (!data.title || data.title.trim() === '') {
          errors.title = 'Meeting title is required';
        }
        if (!data.date) {
          errors.date = 'Date is required';
        }
        if (!data.time) {
          errors.time = 'Time is required';
        }
        break;
        
      case 'Share':
        if (!data.share_with || data.share_with.trim() === '') {
          errors.share_with = 'Share target is required';
        }
        if (data.share_with === 'user' && (!data.recipient || data.recipient.trim() === '')) {
          errors.recipient = 'Recipient is required';
        }
        break;
        
      case 'Edit':
        if (!data.name || data.name.trim() === '') {
          errors.name = 'Name is required';
        }
        break;
        
      case 'Task':
      case 'Issue':
        if (!data.title || data.title.trim() === '') {
          errors.title = 'Title is required';
        }
        break;
    }
    
    return errors;
  };
  
  // Function to handle confirmation dialog actions
  const handleConfirmAction = () => {
    if (selectedAction) {
      executeAction(selectedAction);
    }
  };
  
  // Toggle favorite status for an action
  const toggleFavoriteAction = (actionName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    setFavoriteActionsList(prev => {
      if (prev.includes(actionName)) {
        return prev.filter(a => a !== actionName);
      } else {
        return [...prev, actionName];
      }
    });
    
    toast({
      title: favoriteActionsList.includes(actionName) 
        ? 'Removed from favorites' 
        : 'Added to favorites',
      status: 'success',
      duration: 2000,
      isClosable: true,
      position: 'top-right'
    });
  };
  
  // Get actions based on entity type with enhanced metadata
  const getActions = (): Action[] => {
    switch (entityType) {
      case MapNodeTypeEnum.USER:
        return [
          {
            icon: FiMail, 
            label: 'Send Message', 
            action: 'Message', 
            primary: true, 
            hasDynamicForm: true, 
            group: 'collaboration',
            description: 'Send a direct message to this user',
            shortcutKey: 'M',
            successMessage: 'Message sent successfully',
            formSize: 'md'
          },
          { 
            icon: FiCalendar, 
            label: 'Schedule Meeting', 
            action: 'Schedule', 
            hasDynamicForm: true, 
            group: 'collaboration',
            description: 'Schedule a meeting with this user',
            shortcutKey: 'S',
            formSize: 'md'
          },
          { 
            icon: FiStar, 
            label: 'Add to Favorites', 
            action: 'Favorite', 
            group: 'main',
            description: 'Add this user to your favorites list',
            successMessage: 'Added to favorites'
          },
          { 
            icon: FiPlus, 
            label: 'Assign to Team', 
            action: 'AssignTeam', 
            hasDynamicForm: true, 
            requiresConfirmation: false,
            requiredPermission: 'admin',
            group: 'edit',
            formSize: 'sm',
            description: 'Assign this user to a different team'
          },
          { 
            icon: FiShare2, 
            label: 'Share Profile', 
            action: 'Share', 
            hasDynamicForm: true,
            group: 'collaboration',
            formSize: 'md',
            description: 'Share this user profile with others'
          },
          { 
            icon: FiFileText, 
            label: 'View Reports', 
            action: 'Reports',
            group: 'view',
            description: 'View reports related to this user'
          },
          { 
            icon: FiActivity, 
            label: 'View Activity', 
            action: 'ViewActivity',
            group: 'view',
            description: 'View recent activity history for this user'
          },
          { 
            icon: FiBarChart2, 
            label: 'Performance', 
            action: 'Performance',
            group: 'view',
            isNew: true,
            description: 'View performance metrics and analytics'
          },
          { 
            icon: FiLink, 
            label: 'Request Access', 
            action: 'RequestAccess',
            group: 'advanced',
            hasDynamicForm: true,
            formSize: 'md',
            beta: true,
            description: 'Request additional access permissions'
          },
        ];
      case MapNodeTypeEnum.TEAM:
        return [
          { 
            icon: FiUsers, 
            label: 'View Members', 
            action: 'Members', 
            primary: true,
            group: 'view',
            description: 'View all members of this team'
          },
          { 
            icon: FiPlus, 
            label: 'Join Team', 
            action: 'Join',
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to join this team?',
            group: 'main',
            successMessage: 'Team joined successfully',
            description: 'Request to join this team'
          },
          { 
            icon: FiMessageSquare, 
            label: 'Team Chat', 
            action: 'Chat',
            group: 'collaboration',
            description: 'Open the team chat channel'
          },
          { 
            icon: FiShare2, 
            label: 'Share Team', 
            action: 'Share', 
            hasDynamicForm: true,
            group: 'collaboration',
            formSize: 'md',
            description: 'Share this team with others'
          },
          { 
            icon: FiBriefcase, 
            label: 'Department Info', 
            action: 'Department',
            group: 'view',
            description: 'View parent department information'
          },
          { 
            icon: FiEdit, 
            label: 'Edit Team', 
            action: 'Edit', 
            hasDynamicForm: true,
            requiredPermission: 'edit',
            group: 'edit',
            formSize: 'lg',
            description: 'Edit team details and configuration'
          },
          { 
            icon: FiActivity, 
            label: 'Team Analytics', 
            action: 'Analytics',
            group: 'view',
            description: 'View team performance analytics'
          },
          { 
            icon: FiSettings, 
            label: 'Manage Settings', 
            action: 'Settings',
            requiredPermission: 'admin',
            group: 'advanced',
            hasDynamicForm: true,
            formSize: 'lg',
            description: 'Manage team settings and permissions'
          },
          { 
            icon: FiArchive, 
            label: 'Archive Team', 
            action: 'Archive',
            destructive: true,
            requiredPermission: 'admin',
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to archive this team? This action cannot be undone.',
            group: 'danger',
            description: 'Archive this team (can be restored by admin)'
          },
        ];
      case MapNodeTypeEnum.PROJECT:
        return [
          { 
            icon: FiEdit, 
            label: 'Edit Project', 
            action: 'Edit', 
            primary: true, 
            hasDynamicForm: true,
            requiredPermission: 'edit',
            group: 'edit',
            formSize: 'lg',
            description: 'Edit project details and configuration'
          },
          { 
            icon: FiFlag, 
            label: 'Set Goal', 
            action: 'Goal', 
            hasDynamicForm: true,
            group: 'edit',
            formSize: 'md',
            description: 'Set or modify project goals'
          },
          { 
            icon: FiPlus, 
            label: 'Add Task', 
            action: 'Task', 
            hasDynamicForm: true,
            group: 'main',
            formSize: 'md',
            description: 'Add a new task to this project'
          },
          { 
            icon: FiUsers, 
            label: 'Team Members', 
            action: 'Members',
            group: 'view',
            description: 'View and manage project team members'
          },
          { 
            icon: FiLink, 
            label: 'Link Resources', 
            action: 'Link', 
            hasDynamicForm: true,
            group: 'edit',
            formSize: 'md',
            description: 'Link external resources to this project'
          },
          { 
            icon: FiShare2, 
            label: 'Share Project', 
            action: 'Share', 
            hasDynamicForm: true,
            group: 'collaboration',
            formSize: 'md',
            description: 'Share this project with others'
          },
          { 
            icon: FiClock, 
            label: 'View Timeline', 
            action: 'Timeline',
            group: 'view',
            description: 'View project timeline and milestones'
          },
          { 
            icon: FiActivity, 
            label: 'Project Health', 
            action: 'Health',
            group: 'view',
            badge: 'Critical',
            badgeColor: 'red',
            description: 'View project health metrics and status'
          },
          { 
            icon: FiAlertTriangle, 
            label: 'Report Issue', 
            action: 'Issue', 
            hasDynamicForm: true,
            group: 'main',
            formSize: 'md',
            description: 'Report an issue with this project'
          },
          { 
            icon: FiBarChart2, 
            label: 'Analytics Dashboard', 
            action: 'Analytics',
            group: 'view',
            isNew: true,
            description: 'View comprehensive project analytics'
          },
          { 
            icon: FiGitPullRequest, 
            label: 'Request Changes', 
            action: 'RequestChanges',
            hasDynamicForm: true,
            group: 'advanced',
            beta: true,
            formSize: 'md',
            description: 'Submit a formal change request for this project'
          },
          { 
            icon: FiTrash2, 
            label: 'Archive Project', 
            action: 'Archive', 
            destructive: true, 
            hasDynamicForm: true,
            requiredPermission: 'admin',
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to archive this project? This will hide it from active views.',
            group: 'danger',
            formSize: 'sm',
            description: 'Archive this project (can be restored later)'
          },
        ];
      case MapNodeTypeEnum.GOAL:
        return [
          { 
            icon: FiEdit, 
            label: 'Edit Goal', 
            action: 'Edit', 
            primary: true, 
            hasDynamicForm: true,
            requiredPermission: 'edit',
            group: 'edit',
            formSize: 'md',
            description: 'Edit goal details and parameters'
          },
          { 
            icon: FiPlus, 
            label: 'Add Project', 
            action: 'Project', 
            hasDynamicForm: true,
            group: 'main',
            formSize: 'lg',
            description: 'Add a new project linked to this goal'
          },
          { 
            icon: FiStar, 
            label: 'Mark as Priority', 
            action: 'Priority',
            requiresConfirmation: true,
            confirmationMessage: 'Mark this goal as high priority?',
            group: 'main',
            description: 'Flag this goal as a high priority item'
          },
          { 
            icon: FiShare2, 
            label: 'Share Goal', 
            action: 'Share', 
            hasDynamicForm: true,
            group: 'collaboration',
            formSize: 'md',
            description: 'Share this goal with others'
          },
          { 
            icon: FiCheck, 
            label: 'Update Status', 
            action: 'Status', 
            hasDynamicForm: true,
            group: 'main',
            formSize: 'md',
            description: 'Update the current status of this goal'
          },
          { 
            icon: FiActivity, 
            label: 'View Progress', 
            action: 'Progress',
            group: 'view',
            description: 'View detailed progress metrics for this goal'
          },
          { 
            icon: FiLink, 
            label: 'Link Dependencies', 
            action: 'Dependencies', 
            hasDynamicForm: true,
            group: 'edit',
            formSize: 'lg',
            description: 'Define dependencies with other goals'
          },
          { 
            icon: FiTrendingUp, 
            label: 'Set Milestones', 
            action: 'Milestones',
            hasDynamicForm: true, 
            group: 'edit',
            isNew: true,
            formSize: 'lg',
            description: 'Create milestone tracking for this goal'
          },
          {
            icon: FiTrash2,
            label: 'Delete Goal',
            action: 'Delete',
            destructive: true,
            requiredPermission: 'admin',
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to delete this goal? This action cannot be undone.',
            group: 'danger',
            description: 'Permanently delete this goal'
          }
        ];
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return [
          { 
            icon: FiEdit, 
            label: 'Edit Asset', 
            action: 'Edit', 
            primary: true, 
            hasDynamicForm: true,
            requiredPermission: 'edit',
            group: 'edit',
            formSize: 'lg',
            description: 'Edit knowledge asset details'
          },
          { 
            icon: FiBook, 
            label: 'View Document', 
            action: 'View',
            group: 'view',
            description: 'Open and view this knowledge asset'
          },
          { 
            icon: FiShare2, 
            label: 'Share Asset', 
            action: 'Share', 
            hasDynamicForm: true,
            group: 'collaboration',
            formSize: 'md',
            description: 'Share this knowledge asset with others'
          },
          { 
            icon: FiLink, 
            label: 'Add Reference', 
            action: 'Reference', 
            hasDynamicForm: true,
            group: 'edit',
            formSize: 'md',
            description: 'Add external references to this asset'
          },
          { 
            icon: FiStar, 
            label: 'Add to Collection', 
            action: 'Collection', 
            hasDynamicForm: true,
            group: 'main',
            formSize: 'sm',
            description: 'Add this asset to a collection'
          },
          { 
            icon: FiDownload, 
            label: 'Download', 
            action: 'Download',
            group: 'main',
            description: 'Download this knowledge asset'
          },
          { 
            icon: FiTag, 
            label: 'Manage Tags', 
            action: 'Tags',
            hasDynamicForm: true,
            group: 'edit',
            formSize: 'md',
            description: 'Add or edit tags for this asset'
          },
          { 
            icon: FiShield, 
            label: 'Manage Permissions', 
            action: 'Permissions',
            requiredPermission: 'admin',
            hasDynamicForm: true,
            group: 'advanced',
            isNew: true,
            formSize: 'lg',
            description: 'Configure access permissions'
          },
          {
            icon: FiTrash2,
            label: 'Archive Asset',
            action: 'Archive',
            destructive: true,
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to archive this knowledge asset?',
            group: 'danger',
            description: 'Archive this knowledge asset'
          }
        ];
      case MapNodeTypeEnum.DEPARTMENT:
        return [
          { 
            icon: FiUsers, 
            label: 'View Teams', 
            action: 'Teams', 
            primary: true,
            group: 'view',
            description: 'View all teams in this department'
          },
          { 
            icon: FiBriefcase, 
            label: 'Department Info', 
            action: 'Info',
            group: 'view',
            description: 'View detailed department information'
          },
          { 
            icon: FiEdit, 
            label: 'Edit Department', 
            action: 'Edit', 
            hasDynamicForm: true,
            requiredPermission: 'admin',
            group: 'edit',
            formSize: 'lg',
            description: 'Edit department details and configuration'
          },
          { 
            icon: FiActivity, 
            label: 'Department Analytics', 
            action: 'Analytics',
            group: 'view',
            description: 'View department performance analytics'
          },
          { 
            icon: FiUserPlus, 
            label: 'Add Team', 
            action: 'AddTeam',
            hasDynamicForm: true,
            requiredPermission: 'admin',
            group: 'edit',
            formSize: 'lg',
            description: 'Create a new team in this department'
          },
          { 
            icon: FiBarChart2, 
            label: 'Resource Planning', 
            action: 'Resources',
            group: 'advanced',
            requiredPermission: 'admin',
            isNew: true,
            hasDynamicForm: true,
            formSize: 'full',
            description: 'Advanced resource planning tools'
          },
          {
            icon: FiArchive,
            label: 'Archive Department',
            action: 'Archive',
            destructive: true,
            requiredPermission: 'admin',
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to archive this department? This action will affect all teams within the department.',
            group: 'danger',
            description: 'Archive this department and all its contents'
          }
        ];
      default:
        return [
          { 
            icon: FiEdit, 
            label: 'Edit', 
            action: 'Edit', 
            primary: true,
            requiredPermission: 'edit',
            group: 'edit',
            hasDynamicForm: true,
            formSize: 'md',
            description: 'Edit this item'
          },
          { 
            icon: FiShare2, 
            label: 'Share', 
            action: 'Share', 
            hasDynamicForm: true,
            group: 'collaboration',
            formSize: 'md',
            description: 'Share this item with others'
          },
          { 
            icon: FiTrash2, 
            label: 'Delete', 
            action: 'Delete', 
            destructive: true,
            requiredPermission: 'delete',
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to delete this item? This action cannot be undone.',
            group: 'danger',
            description: 'Permanently delete this item'
          },
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
  
  // Group actions by their category
  const groupActionsByCategory = (actions: Action[]): Record<string, Action[]> => {
    // Only group if specified via prop
    if (!groupActions) {
      return { ungrouped: actions };
    }
    
    const groups: Record<string, Action[]> = {
      main: [],
      edit: [],
      view: [],
      collaboration: [],
      advanced: [],
      danger: []
    };
    
    // Push actions to their respective groups
    actions.forEach(action => {
      const group = action.group || 'main';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(action);
    });
    
    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });
    
    return groups;
  };
  
  // Get all available actions and group them
  const allActions = getActions();
  const groupedActions = groupActionsByCategory(allActions);
  
  // Prepare actions display based on layout
  const primaryActions = allActions.filter(action => action.primary);
  const nonPrimaryActions = allActions.filter(action => !action.primary);
  
  // For grid layout, separate actions into rows
  const actionRows = [];
  if (actionLayout === 'grid' && !groupActions) {
    // Create rows with up to 3 actions per row
    for (let i = 0; i < nonPrimaryActions.length; i += 3) {
      actionRows.push(nonPrimaryActions.slice(i, i + 3));
    }
  }
  
  // Get visible actions for compact display
  const visibleActions = nonPrimaryActions.slice(0, maxVisibleActions);
  const moreActions = nonPrimaryActions.slice(maxVisibleActions);
  
  // Function to render action button with appropriate styles
  const renderActionButton = (action: Action, buttonStyle: 'full' | 'icon' | 'menu' = 'full') => {
    // Set button style based on appearance and buttonStyle parameter
    const buttonSize = appearance.buttonSize || 'sm';
    const buttonVariant = action.destructive ? 'outline' : appearance.buttonVariant || 'solid';
    const colorScheme = action.destructive ? 'red' : (appearance.primaryColor ? appearance.primaryColor : 'blue');
    
    // Determine if action is disabled
    const isDisabled = action.isDisabled || 
      (action.requiredPermission === 'edit' && !permissions.canEdit) ||
      (action.requiredPermission === 'delete' && !permissions.canDelete) ||
      (action.requiredPermission === 'share' && !permissions.canShare) ||
      (action.requiredPermission === 'admin' && !permissions.isAdmin) ||
      (action.requiredPermission === 'owner' && !permissions.isOwner);
    
    // Define base content for all button types
    const actionLabel = action.label;
    const ActionIcon = action.icon;
    
    // Badge for new or beta features
    const renderBadges = () => (
      <>
        {action.isNew && (
          <Badge
            position="absolute"
            top="-6px"
            right="-6px"
            fontSize="0.6em"
            colorScheme="purple"
            borderRadius="full"
            zIndex={1}
          >
            NEW
          </Badge>
        )}
        {action.beta && (
          <Badge
            position="absolute"
            top="-6px"
            right="-6px"
            fontSize="0.6em"
            colorScheme="orange"
            borderRadius="full"
            zIndex={1}
          >
            BETA
          </Badge>
        )}
        {action.badge && (
          <Badge
            position="absolute"
            top="-6px"
            right="16px"
            fontSize="0.6em"
            colorScheme={action.badgeColor || 'blue'}
            borderRadius="full"
            zIndex={1}
          >
            {action.badge}
          </Badge>
        )}
      </>
    );
    
    // For icon-only buttons
    if (buttonStyle === 'icon' || appearance.iconOnly) {
      return (
        <Box position="relative">
          {renderBadges()}
          <Tooltip 
            hasArrow
            label={
              <Box>
                <Text fontWeight="medium">{actionLabel}</Text>
                {action.description && (
                  <Text fontSize="xs" opacity={0.8}>{action.description}</Text>
                )}
                {action.shortcutKey && (
                  <Text fontSize="xs" mt={1}>
                    Shortcut: <Kbd size="xs">{action.shortcutKey}</Kbd>
                  </Text>
                )}
              </Box>
            }
            placement="top"
          >
            <IconButton
              aria-label={actionLabel}
              icon={<ActionIcon />}
              size={buttonSize}
              variant={buttonVariant}
              colorScheme={colorScheme}
              isDisabled={isDisabled}
              onClick={() => handleAction(action)}
              opacity={isDisabled ? 0.6 : 1}
              _hover={!isDisabled ? { transform: 'scale(1.05)' } : undefined}
              transition="all 0.2s"
            />
          </Tooltip>
        </Box>
      );
    }
    
    // For menu items
    if (buttonStyle === 'menu') {
      return (
        <MenuItem
          icon={<ActionIcon />}
          onClick={() => handleAction(action)}
          isDisabled={isDisabled}
          color={action.destructive ? 'red.500' : undefined}
          position="relative"
        >
          <HStack justify="space-between" width="100%">
            <Text>{actionLabel}</Text>
            {action.shortcutKey && <Kbd size="xs">{action.shortcutKey}</Kbd>}
            {action.isNew && <Badge colorScheme="purple" fontSize="0.6rem">New</Badge>}
            {action.beta && <Badge colorScheme="orange" fontSize="0.6rem">Beta</Badge>}
            {action.badge && <Badge colorScheme={action.badgeColor || 'blue'} fontSize="0.6rem">{action.badge}</Badge>}
          </HStack>
        </MenuItem>
      );
    }
    
    // For full buttons (default)
    return (
      <Box position="relative">
        {renderBadges()}
        <Button
          leftIcon={<ActionIcon />}
          size={buttonSize}
          colorScheme={colorScheme}
          variant={buttonVariant}
          onClick={() => handleAction(action)}
          isDisabled={isDisabled}
          flexGrow={1}
          maxW="160px"
          opacity={isDisabled ? 0.6 : 1}
          _hover={!isDisabled ? { transform: 'scale(1.02)' } : undefined}
          transition="all 0.2s"
        >
          {actionLabel}
          {action.shortcutKey && <Kbd size="xs" ml={1}>{action.shortcutKey}</Kbd>}
        </Button>
      </Box>
    );
  };
  
  // Only render the favorites part if there are favorite actions
  const hasFavoriteActions = favoriteActionsList.length > 0;
  
  // Get all actions that are favorites
  const favoriteActionsObjects = allActions.filter(action => 
    favoriteActionsList.includes(action.action)
  );
  
  return (
    <Box>
      <Divider mb={4} />
      
      {/* Action buttons section header with help icon */}
      <Flex mb={3} align="center" justify="space-between">
        <Heading size="xs" color="gray.500">
          Quick Actions
        </Heading>
        <IconButton
          icon={<FiHelpCircle />}
          aria-label="Help for actions"
          size="xs"
          variant="ghost"
          onClick={onHelpDrawerOpen}
        />
      </Flex>
      
      {/* Favorite actions section (if any) */}
      {hasFavoriteActions && (
        <Box mb={4}>
          <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={2}>
            Favorites
          </Text>
          <HStack spacing={2} flexWrap="wrap">
            {favoriteActionsObjects.map(action => 
              renderActionButton(action, compact ? 'icon' : 'full')
            )}
          </HStack>
        </Box>
      )}
      
      {/* Primary actions */}
      {primaryActions.length > 0 && (
        <VStack spacing={3} align="stretch" mb={3}>
          <HStack spacing={2} justifyContent="center" flexWrap="wrap">
            {primaryActions.map(action => renderActionButton(action, 'full'))}
          </HStack>
        </VStack>
      )}
      
      {/* Secondary actions - different layouts based on props */}
      {nonPrimaryActions.length > 0 && (
        <>
          {/* Horizontal layout (default) */}
          {actionLayout === 'horizontal' && !groupActions && (
            <HStack spacing={2} justifyContent="center" flexWrap="wrap" mt={1}>
              {visibleActions.map(action => 
                renderActionButton(action, compact || appearance.iconOnly ? 'icon' : 'full')
              )}
              
              {/* More menu for additional actions */}
              {moreActions.length > 0 && (
                <Menu closeOnSelect={false}>
                  <Tooltip label="More actions">
                    <MenuButton
                      as={IconButton}
                      aria-label="More actions"
                      icon={<FiMoreVertical />}
                      size={appearance.buttonSize || 'sm'}
                      variant="outline"
                    />
                  </Tooltip>
                  <Portal>
                    <MenuList zIndex={10}>
                      {moreActions.map(action => renderActionButton(action, 'menu'))}
                    </MenuList>
                  </Portal>
                </Menu>
              )}
            </HStack>
          )}
          
          {/* Vertical layout */}
          {actionLayout === 'vertical' && !groupActions && (
            <VStack spacing={2} align="stretch" mt={1}>
              {visibleActions.map(action => (
                <Button
                  key={action.action}
                  leftIcon={<action.icon />}
                  size={appearance.buttonSize || 'sm'}
                  justifyContent="flex-start"
                  colorScheme={action.destructive ? "red" : undefined}
                  variant={action.destructive ? "outline" : "ghost"}
                  onClick={() => handleAction(action)}
                  isDisabled={action.isDisabled}
                >
                  {action.label}
                  {action.badge && (
                    <Badge ml={2} colorScheme={action.badgeColor || 'blue'}>
                      {action.badge}
                    </Badge>
                  )}
                </Button>
              ))}
              
              {/* More actions disclosure */}
              {moreActions.length > 0 && (
                <Box>
                  <Button
                    size="sm"
                    variant="link"
                    rightIcon={<FiChevronDown />}
                    onClick={() => {/* Toggle more actions */}}
                  >
                    {moreActions.length} more actions
                  </Button>
                </Box>
              )}
            </VStack>
          )}
          
          {/* Grid layout */}
          {actionLayout === 'grid' && !groupActions && (
            <VStack spacing={2} align="stretch" mt={1}>
              {actionRows.map((row, idx) => (
                <HStack key={idx} spacing={2} justify="center">
                  {row.map(action => renderActionButton(action, 'icon'))}
                </HStack>
              ))}
            </VStack>
          )}
          
          {/* Grouped actions */}
          {groupActions && (
            <VStack spacing={4} align="stretch" mt={2}>
              {Object.entries(groupedActions).map(([group, actions]) => (
                <Box key={group}>
                  <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={2}>
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </Text>
                  
                  {/* Grid layout for grouped actions */}
                  <SimpleGrid columns={compact ? 4 : 2} spacing={2}>
                    {actions.map(action => 
                      renderActionButton(action, compact ? 'icon' : 'full')
                    )}
                  </SimpleGrid>
                </Box>
              ))}
            </VStack>
          )}
        </>
      )}
      
      {/* Action Modal for forms */}
      <Modal 
        isOpen={isActionModalOpen} 
        onClose={onActionModalClose} 
        size={selectedAction?.formSize || 'md'}
        initialFocusRef={initialFocusRef}
        scrollBehavior="inside"
      >
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent>
          <ModalHeader>
            {selectedAction && (
              <HStack>
                <selectedAction.icon />
                <Text>{selectedAction.label}</Text>
                {selectedAction.beta && (
                  <Badge colorScheme="orange" fontSize="0.7em" ml={1}>BETA</Badge>
                )}
              </HStack>
            )}
            {selectedAction?.description && (
              <Text fontSize="sm" fontWeight="normal" color="gray.500" mt={1}>
                {selectedAction.description}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <form ref={formRef} onSubmit={handleFormSubmit}>
            <ModalBody pb={6}>
              {renderActionForm()}
            </ModalBody>

            <ModalFooter>
              <Button 
                colorScheme={selectedAction?.destructive ? "red" : "blue"} 
                mr={3} 
                type="submit"
                isLoading={isSubmitting || isProcessing}
                loadingText="Processing..."
                leftIcon={selectedAction?.destructive ? <FiTrash2 /> : <FiCheck />}
              >
                {selectedAction?.destructive ? 'Confirm' : 'Submit'}
              </Button>
              <Button variant="ghost" onClick={onActionModalClose} isDisabled={isSubmitting || isProcessing}>
                Cancel
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
      
      {/* Drawer for larger forms */}
      <Drawer
        isOpen={isActionDrawerOpen}
        placement="right"
        onClose={onActionDrawerClose}
        size={selectedAction?.formSize === 'full' ? 'full' : 'lg'}
        initialFocusRef={initialFocusRef}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            {selectedAction && (
              <HStack>
                <selectedAction.icon />
                <Text>{selectedAction.label}</Text>
                {selectedAction.beta && (
                  <Badge colorScheme="orange" fontSize="0.7em" ml={1}>BETA</Badge>
                )}
              </HStack>
            )}
            {selectedAction?.description && (
              <Text fontSize="sm" fontWeight="normal" color="gray.500" mt={1}>
                {selectedAction.description}
              </Text>
            )}
          </DrawerHeader>
          
          <DrawerBody>
            <form id="drawer-form" onSubmit={handleFormSubmit}>
              {renderActionForm()}
            </form>
          </DrawerBody>
          
          <DrawerFooter borderTopWidth="1px">
            <Button 
              variant="outline" 
              mr={3} 
              onClick={onActionDrawerClose}
              isDisabled={isSubmitting || isProcessing}
            >
              Cancel
            </Button>
            <Button 
              colorScheme={selectedAction?.destructive ? "red" : "blue"} 
              type="submit"
              form="drawer-form"
              leftIcon={selectedAction?.destructive ? <FiTrash2 /> : <FiCheck />}
              isLoading={isSubmitting || isProcessing}
              loadingText="Processing..."
            >
              {selectedAction?.destructive ? 'Confirm' : 'Submit'}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      
      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={isConfirmDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onConfirmDialogClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {selectedAction?.destructive ? 'Destructive Action' : 'Confirm Action'}
            </AlertDialogHeader>

            <AlertDialogBody>
              {selectedAction?.confirmationMessage || `Are you sure you want to ${selectedAction?.label.toLowerCase()}?`}
              
              {selectedAction?.destructive && (
                <Box mt={4} p={2} bg="red.50" borderRadius="md" borderLeftWidth="3px" borderLeftColor="red.500">
                  <Text fontSize="sm" color="red.600">
                    <Icon as={FiAlertTriangle} mr={1} />
                    This action may have irreversible consequences.
                  </Text>
                </Box>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onConfirmDialogClose}>
                Cancel
              </Button>
              <Button 
                colorScheme={selectedAction?.destructive ? "red" : "blue"}
                onClick={handleConfirmAction} 
                ml={3}
                isLoading={isProcessing}
                loadingText="Processing..."
              >
                {selectedAction?.destructive ? 'Yes, I\'m sure' : 'Confirm'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      {/* Help Drawer */}
      <Drawer
        isOpen={isHelpDrawerOpen}
        placement="right"
        onClose={onHelpDrawerClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <HStack>
              <Icon as={FiHelpCircle} />
              <Text>Available Actions Help</Text>
            </HStack>
          </DrawerHeader>
          
          <DrawerBody>
            <VStack align="stretch" spacing={6}>
              <Box>
                <Text fontSize="sm">
                  These actions are available for this {entityType}. Some actions may require specific permissions.
                </Text>
              </Box>
              
              {Object.entries(groupActions ? groupedActions : { 'All Actions': allActions }).map(([group, actions]) => (
                <Box key={group}>
                  <Heading size="sm" mb={3}>
                    {group === 'ungrouped' ? 'Available Actions' : group.charAt(0).toUpperCase() + group.slice(1)}
                  </Heading>
                  
                  <VStack align="stretch" spacing={3}>
                    {actions.map(action => (
                      <Box key={action.action} p={3} borderWidth="1px" borderRadius="md" position="relative">
                        {(action.isNew || action.beta) && (
                          <HStack position="absolute" top={1} right={2}>
                            {action.isNew && <Badge colorScheme="purple">New</Badge>}
                            {action.beta && <Badge colorScheme="orange">Beta</Badge>}
                          </HStack>
                        )}
                        
                        <HStack mb={2}>
                          <Box 
                            p={2} 
                            borderRadius="full" 
                            bg={action.destructive ? "red.50" : "blue.50"} 
                            color={action.destructive ? "red.500" : "blue.500"}
                          >
                            <action.icon />
                          </Box>
                          <Text fontWeight="bold">{action.label}</Text>
                        </HStack>
                        
                        <Text fontSize="sm" color="gray.600">
                          {action.description || `${action.label} for this ${entityType}`}
                        </Text>
                        
                        {/* Show shortcut key if available */}
                        {action.shortcutKey && (
                          <HStack mt={2}>
                            <Text fontSize="xs" color="gray.500">Shortcut:</Text>
                            <Kbd size="xs">{action.shortcutKey}</Kbd>
                          </HStack>
                        )}
                        
                        {/* Show permission requirement if any */}
                        {action.requiredPermission && (
                          <Tag size="sm" mt={2} colorScheme="purple" variant="subtle">
                            Requires {action.requiredPermission} permission
                          </Tag>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </Box>
              ))}
            </VStack>
          </DrawerBody>
          
          <DrawerFooter borderTopWidth="1px">
            <Button colorScheme="blue" onClick={onHelpDrawerClose}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default ActionButtons;