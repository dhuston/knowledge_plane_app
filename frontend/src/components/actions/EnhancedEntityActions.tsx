import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  ButtonGroup,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuGroup,
  useColorModeValue,
  useToast,
  Tooltip,
  Badge,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Select,
  Textarea,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Flex,
  Spinner,
  Portal
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
import { useApiClient } from '../../hooks/useApiClient';
import { useFeatureFlags } from '../../utils/featureFlags';

// Define action interfaces
interface Action {
  id: string;
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick: () => void;
  primary?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  requiredPermission?: 'edit' | 'delete' | 'share' | 'admin' | 'owner';
  category: 'main' | 'collaboration' | 'edit' | 'view' | 'advanced' | 'danger';
  showInCompactMode?: boolean;
  showConfirmation?: boolean;
  confirmationMessage?: string;
  requiresForm?: boolean;
  formComponent?: React.ReactNode;
  badge?: {
    text: string;
    colorScheme?: string;
    variant?: string;
  };
  tooltip?: string;
  isNew?: boolean;
  isBeta?: boolean;
}

interface ActionsProps {
  entityType: MapNodeTypeEnum;
  entityId: string;
  entityName?: string;
  compact?: boolean;
  maxVisibleActions?: number;
  groupByCategory?: boolean;
  onActionComplete?: (action: string, result: any) => void;
  permissions?: {
    canEdit?: boolean;
    canDelete?: boolean;
    canShare?: boolean;
    isAdmin?: boolean;
    isOwner?: boolean;
  };
}

export const EnhancedEntityActions: React.FC<ActionsProps> = ({
  entityType,
  entityId,
  entityName = '',
  compact = false,
  maxVisibleActions = 3,
  groupByCategory = true,
  onActionComplete,
  permissions = {
    canEdit: true,
    canDelete: true,
    canShare: true,
    isAdmin: false,
    isOwner: false
  }
}) => {
  // Hooks for UI state
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const apiClient = useApiClient();
  const { flags } = useFeatureFlags();

  // UI disclosure hooks
  const { isOpen: isFormOpen, onOpen: openForm, onClose: closeForm } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: openConfirm, onClose: closeConfirm } = useDisclosure();
  const { isOpen: isHelpOpen, onOpen: openHelp, onClose: closeHelp } = useDisclosure();
  
  // Refs
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  
  // Theme colors
  const primaryColor = useColorModeValue('blue.500', 'blue.300');
  const dangerColor = useColorModeValue('red.500', 'red.300');
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const newBadgeBg = useColorModeValue('purple.100', 'purple.700');
  const newTextColor = useColorModeValue('purple.700', 'purple.200');
  const betaBadgeBg = useColorModeValue('orange.100', 'orange.700');
  const betaTextColor = useColorModeValue('orange.700', 'orange.200');

  // Handle form field changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle radio changes
  const handleRadioChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form data
  const resetForm = () => {
    setFormData({});
    setFormErrors({});
  };

  // Process action click
  const handleActionClick = (action: Action) => {
    setSelectedAction(action);
    
    // Check if action is disabled
    if (action.disabled) {
      toast({
        title: 'Action unavailable',
        description: action.disabledReason || 'This action is currently unavailable',
        status: 'info',
        duration: 3000,
        isClosable: true
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
          isClosable: true
        });
        return;
      }
    }
    
    // Set initial form data based on action
    const initialData = getInitialFormData(action);
    setFormData(initialData);
    
    // Show confirmation dialog if required
    if (action.showConfirmation) {
      openConfirm();
      return;
    }
    
    // Show form if required
    if (action.requiresForm) {
      openForm();
      return;
    }
    
    // Execute action immediately if no confirmation or form is needed
    executeAction(action);
  };

  // Get initial form data based on action
  const getInitialFormData = (action: Action): Record<string, any> => {
    const data: Record<string, any> = {
      entityId,
      entityType: entityType.toString(),
      entityName
    };
    
    switch (action.id) {
      case 'message':
        return { 
          ...data, 
          subject: '', 
          message: '' 
        };
      case 'schedule':
        return { 
          ...data, 
          title: `Meeting with ${entityName}`, 
          date: new Date().toISOString().split('T')[0], 
          time: '09:00', 
          duration: 30, 
          description: '' 
        };
      case 'share':
        return {
          ...data,
          shareWith: '',
          permission: 'view',
          note: ''
        };
      case 'edit':
        return {
          ...data,
          name: entityName,
          description: '',
          status: 'active'
        };
      case 'add-task':
        return {
          ...data,
          title: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          assignee: ''
        };
      default:
        return data;
    }
  };

  // Execute the selected action
  const executeAction = async (action: Action, formValues = formData) => {
    setIsProcessing(true);
    
    try {
      let result;
      
      // Call API based on action ID
      switch (action.id) {
        case 'message':
          result = await apiClient.post(`/messages`, formValues);
          break;
        case 'schedule':
          result = await apiClient.post(`/calendar/meetings`, formValues);
          break;
        case 'share':
          result = await apiClient.post(`/share/${entityType}/${entityId}`, formValues);
          break;
        case 'edit':
          result = await apiClient.put(`/${entityType}s/${entityId}`, formValues);
          break;
        case 'add-task':
          result = await apiClient.post(`/tasks`, formValues);
          break;
        case 'archive':
          result = await apiClient.post(`/${entityType}s/${entityId}/archive`);
          break;
        default:
          // Dispatch a custom event for other components to react to
          const actionEvent = new CustomEvent('entity-action', {
            detail: {
              action: action.id,
              entityType,
              entityId,
              formValues,
              timestamp: Date.now()
            },
            bubbles: true
          });
          document.dispatchEvent(actionEvent);
          result = { success: true, message: `${action.label} completed` };
      }
      
      // Show success message
      toast({
        title: `${action.label} successful`,
        description: `The action was completed successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
      
      // Call the onActionComplete callback if provided
      if (onActionComplete) {
        onActionComplete(action.id, { success: true, data: result });
      }
      
      // Close any open dialogs
      closeForm();
      closeConfirm();
      
      // Reset form data
      resetForm();
    } catch (error) {
      console.error('Error executing action:', error);
      
      // Show error message
      toast({
        title: 'Action failed',
        description: 'There was a problem completing the action. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
      
      // Call the onActionComplete callback if provided
      if (onActionComplete) {
        onActionComplete(action.id, { success: false, error });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Validate form before submission
  const validateForm = (action: Action): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    switch (action.id) {
      case 'message':
        if (!formData.subject || formData.subject.trim() === '') {
          errors.subject = 'Subject is required';
        }
        if (!formData.message || formData.message.trim() === '') {
          errors.message = 'Message is required';
        }
        break;
      case 'schedule':
        if (!formData.title || formData.title.trim() === '') {
          errors.title = 'Title is required';
        }
        if (!formData.date) {
          errors.date = 'Date is required';
        }
        if (!formData.time) {
          errors.time = 'Time is required';
        }
        break;
      case 'add-task':
        if (!formData.title || formData.title.trim() === '') {
          errors.title = 'Title is required';
        }
        break;
      case 'edit':
        if (!formData.name || formData.name.trim() === '') {
          errors.name = 'Name is required';
        }
        break;
    }
    
    return errors;
  };

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAction) return;
    
    // Validate form
    const errors = validateForm(selectedAction);
    setFormErrors(errors);
    
    // If there are errors, don't submit
    if (Object.keys(errors).length > 0) {
      return;
    }
    
    // Execute the action with form data
    executeAction(selectedAction);
  };

  // Handle confirmation dialog submission
  const handleConfirmAction = () => {
    if (selectedAction) {
      executeAction(selectedAction);
    }
  };

  // Get entity-specific actions
  const getActions = (): Action[] => {
    switch (entityType) {
      case MapNodeTypeEnum.USER:
        return [
          {
            id: 'message',
            icon: FiMail,
            label: 'Send Message',
            description: 'Send a direct message to this user',
            onClick: () => {},
            primary: true,
            category: 'collaboration',
            showInCompactMode: true,
            requiresForm: true,
            tooltip: 'Send a message to this user'
          },
          {
            id: 'schedule',
            icon: FiCalendar,
            label: 'Schedule Meeting',
            description: 'Schedule a meeting with this user',
            onClick: () => {},
            category: 'collaboration',
            showInCompactMode: true,
            requiresForm: true,
            tooltip: 'Schedule a meeting with this user'
          },
          {
            id: 'favorite',
            icon: FiStar,
            label: 'Add to Favorites',
            description: 'Add this user to your favorites',
            onClick: () => {},
            category: 'main',
            showInCompactMode: false,
            tooltip: 'Add this user to your favorites'
          },
          {
            id: 'share',
            icon: FiShare2,
            label: 'Share Profile',
            description: 'Share this user profile with others',
            onClick: () => {},
            category: 'collaboration',
            showInCompactMode: false,
            requiresForm: true,
            tooltip: 'Share this user profile'
          },
          {
            id: 'view-activity',
            icon: FiActivity,
            label: 'View Activity',
            description: 'View recent activity history',
            onClick: () => {},
            category: 'view',
            showInCompactMode: false,
            tooltip: 'View recent activity'
          },
          {
            id: 'view-performance',
            icon: FiBarChart2,
            label: 'Performance',
            description: 'View performance metrics',
            onClick: () => {},
            category: 'view',
            isNew: true,
            showInCompactMode: false,
            tooltip: 'View performance metrics',
            badge: {
              text: 'New',
              colorScheme: 'purple'
            }
          },
          {
            id: 'assign-team',
            icon: FiUserPlus,
            label: 'Assign to Team',
            description: 'Assign this user to a team',
            onClick: () => {},
            requiredPermission: 'admin',
            category: 'advanced',
            showInCompactMode: false,
            requiresForm: true,
            tooltip: 'Assign user to a team'
          }
        ];
      
      case MapNodeTypeEnum.TEAM:
        return [
          {
            id: 'view-members',
            icon: FiUsers,
            label: 'View Members',
            description: 'View all members of this team',
            onClick: () => {},
            primary: true,
            category: 'view',
            showInCompactMode: true,
            tooltip: 'View team members'
          },
          {
            id: 'join-team',
            icon: FiPlus,
            label: 'Join Team',
            description: 'Request to join this team',
            onClick: () => {},
            category: 'main',
            showInCompactMode: true,
            showConfirmation: true,
            confirmationMessage: 'Are you sure you want to join this team?',
            tooltip: 'Request to join this team'
          },
          {
            id: 'team-chat',
            icon: FiMessageSquare,
            label: 'Team Chat',
            description: 'Open the team chat channel',
            onClick: () => {},
            category: 'collaboration',
            showInCompactMode: true,
            tooltip: 'Open team chat'
          },
          {
            id: 'edit-team',
            icon: FiEdit,
            label: 'Edit Team',
            description: 'Edit team details and configuration',
            onClick: () => {},
            requiredPermission: 'edit',
            category: 'edit',
            showInCompactMode: false,
            requiresForm: true,
            tooltip: 'Edit team details'
          },
          {
            id: 'share',
            icon: FiShare2,
            label: 'Share Team',
            description: 'Share this team with others',
            onClick: () => {},
            category: 'collaboration',
            showInCompactMode: false,
            requiresForm: true,
            tooltip: 'Share this team'
          },
          {
            id: 'team-analytics',
            icon: FiBarChart2,
            label: 'Team Analytics',
            description: 'View team performance analytics',
            onClick: () => {},
            category: 'view',
            showInCompactMode: false,
            tooltip: 'View team analytics'
          },
          {
            id: 'manage-settings',
            icon: FiSettings,
            label: 'Manage Settings',
            description: 'Manage team settings and permissions',
            onClick: () => {},
            requiredPermission: 'admin',
            category: 'advanced',
            showInCompactMode: false,
            requiresForm: true,
            tooltip: 'Manage team settings'
          },
          {
            id: 'archive-team',
            icon: FiArchive,
            label: 'Archive Team',
            description: 'Archive this team',
            onClick: () => {},
            destructive: true,
            requiredPermission: 'admin',
            category: 'danger',
            showInCompactMode: false,
            showConfirmation: true,
            confirmationMessage: 'Are you sure you want to archive this team? This action cannot be undone.',
            tooltip: 'Archive this team'
          }
        ];
        
      case MapNodeTypeEnum.PROJECT:
        return [
          {
            id: 'edit',
            icon: FiEdit,
            label: 'Edit Project',
            description: 'Edit project details',
            onClick: () => {},
            primary: true,
            requiredPermission: 'edit',
            category: 'edit',
            showInCompactMode: true,
            requiresForm: true,
            tooltip: 'Edit project details'
          },
          {
            id: 'add-task',
            icon: FiPlus,
            label: 'Add Task',
            description: 'Add a new task to this project',
            onClick: () => {},
            category: 'main',
            showInCompactMode: true,
            requiresForm: true,
            tooltip: 'Add a new task'
          },
          {
            id: 'set-goal',
            icon: FiFlag,
            label: 'Set Goal',
            description: 'Set or modify project goals',
            onClick: () => {},
            category: 'edit',
            showInCompactMode: true,
            requiresForm: true,
            tooltip: 'Set or modify goals'
          },
          {
            id: 'view-members',
            icon: FiUsers,
            label: 'Team Members',
            description: 'View and manage project team members',
            onClick: () => {},
            category: 'view',
            showInCompactMode: false,
            tooltip: 'View team members'
          },
          {
            id: 'share',
            icon: FiShare2,
            label: 'Share Project',
            description: 'Share this project with others',
            onClick: () => {},
            category: 'collaboration',
            showInCompactMode: false,
            requiresForm: true,
            tooltip: 'Share this project'
          },
          {
            id: 'view-timeline',
            icon: FiClock,
            label: 'View Timeline',
            description: 'View project timeline and milestones',
            onClick: () => {},
            category: 'view',
            showInCompactMode: false,
            tooltip: 'View project timeline'
          },
          {
            id: 'project-health',
            icon: FiActivity,
            label: 'Project Health',
            description: 'View project health metrics',
            onClick: () => {},
            category: 'view',
            showInCompactMode: false,
            badge: {
              text: 'Critical',
              colorScheme: 'red'
            },
            tooltip: 'View project health'
          },
          {
            id: 'analytics-dashboard',
            icon: FiBarChart2,
            label: 'Analytics Dashboard',
            description: 'View project analytics',
            onClick: () => {},
            category: 'view',
            isNew: true,
            showInCompactMode: false,
            badge: {
              text: 'New',
              colorScheme: 'purple'
            },
            tooltip: 'View analytics dashboard'
          },
          {
            id: 'archive-project',
            icon: FiArchive,
            label: 'Archive Project',
            description: 'Archive this project',
            onClick: () => {},
            destructive: true,
            requiredPermission: 'admin',
            category: 'danger',
            showInCompactMode: false,
            showConfirmation: true,
            confirmationMessage: 'Are you sure you want to archive this project? This action cannot be undone.',
            tooltip: 'Archive this project'
          }
        ];
        
      case MapNodeTypeEnum.GOAL:
        return [
          {
            id: 'edit',
            icon: FiEdit,
            label: 'Edit Goal',
            description: 'Edit goal details',
            onClick: () => {},
            primary: true,
            requiredPermission: 'edit',
            category: 'edit',
            showInCompactMode: true,
            requiresForm: true,
            tooltip: 'Edit goal details'
          },
          {
            id: 'add-project',
            icon: FiPlus,
            label: 'Add Project',
            description: 'Add a new project linked to this goal',
            onClick: () => {},
            category: 'main',
            showInCompactMode: true,
            requiresForm: true,
            tooltip: 'Add a new project'
          },
          {
            id: 'mark-priority',
            icon: FiStar,
            label: 'Mark as Priority',
            description: 'Flag this goal as high priority',
            onClick: () => {},
            category: 'main',
            showInCompactMode: true,
            showConfirmation: true,
            confirmationMessage: 'Mark this goal as high priority?',
            tooltip: 'Mark as high priority'
          },
          {
            id: 'share',
            icon: FiShare2,
            label: 'Share Goal',
            description: 'Share this goal with others',
            onClick: () => {},
            category: 'collaboration',
            showInCompactMode: false,
            requiresForm: true,
            tooltip: 'Share this goal'
          },
          {
            id: 'update-status',
            icon: FiCheck,
            label: 'Update Status',
            description: 'Update the goal status',
            onClick: () => {},
            category: 'main',
            showInCompactMode: false,
            requiresForm: true,
            tooltip: 'Update goal status'
          },
          {
            id: 'view-progress',
            icon: FiActivity,
            label: 'View Progress',
            description: 'View detailed progress metrics',
            onClick: () => {},
            category: 'view',
            showInCompactMode: false,
            tooltip: 'View progress metrics'
          },
          {
            id: 'set-milestones',
            icon: FiTrendingUp,
            label: 'Set Milestones',
            description: 'Create milestone tracking',
            onClick: () => {},
            category: 'edit',
            isNew: true,
            showInCompactMode: false,
            requiresForm: true,
            badge: {
              text: 'New',
              colorScheme: 'purple'
            },
            tooltip: 'Set milestones'
          },
          {
            id: 'delete-goal',
            icon: FiTrash2,
            label: 'Delete Goal',
            description: 'Permanently delete this goal',
            onClick: () => {},
            destructive: true,
            requiredPermission: 'admin',
            category: 'danger',
            showInCompactMode: false,
            showConfirmation: true,
            confirmationMessage: 'Are you sure you want to delete this goal? This action cannot be undone.',
            tooltip: 'Delete this goal'
          }
        ];
        
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return [
          {
            id: 'edit',
            icon: FiEdit,
            label: 'Edit Asset',
            description: 'Edit asset details',
            onClick: () => {},
            primary: true,
            requiredPermission: 'edit',
            category: 'edit',
            showInCompactMode: true,
            requiresForm: true,
            tooltip: 'Edit asset details'
          },
          {
            id: 'view',
            icon: FiBook,
            label: 'View Document',
            description: 'Open and view this asset',
            onClick: () => {},
            category: 'view',
            showInCompactMode: true,
            tooltip: 'View document'
          },
          {
            id: 'share',
            icon: FiShare2,
            label: 'Share Asset',
            description: 'Share this asset with others',
            onClick: () => {},
            category: 'collaboration',
            showInCompactMode: true,
            requiresForm: true,
            tooltip: 'Share this asset'
          },
          {
            id: 'download',
            icon: FiDownload,
            label: 'Download',
            description: 'Download this asset',
            onClick: () => {},
            category: 'main',
            showInCompactMode: false,
            tooltip: 'Download this asset'
          },
          {
            id: 'manage-tags',
            icon: FiTag,
            label: 'Manage Tags',
            description: 'Add or edit tags',
            onClick: () => {},
            category: 'edit',
            showInCompactMode: false,
            requiresForm: true,
            tooltip: 'Manage asset tags'
          },
          {
            id: 'manage-permissions',
            icon: FiShield,
            label: 'Manage Permissions',
            description: 'Configure access permissions',
            onClick: () => {},
            requiredPermission: 'admin',
            category: 'advanced',
            isNew: true,
            showInCompactMode: false,
            requiresForm: true,
            badge: {
              text: 'New',
              colorScheme: 'purple'
            },
            tooltip: 'Manage permissions'
          },
          {
            id: 'archive',
            icon: FiArchive,
            label: 'Archive Asset',
            description: 'Archive this asset',
            onClick: () => {},
            destructive: true,
            category: 'danger',
            showInCompactMode: false,
            showConfirmation: true,
            confirmationMessage: 'Are you sure you want to archive this knowledge asset?',
            tooltip: 'Archive this asset'
          }
        ];
      
      case MapNodeTypeEnum.DEPARTMENT:
        return [
          {
            id: 'view-teams',
            icon: FiUsers,
            label: 'View Teams',
            description: 'View all teams in this department',
            onClick: () => {},
            primary: true,
            category: 'view',
            showInCompactMode: true,
            tooltip: 'View department teams'
          },
          {
            id: 'edit',
            icon: FiEdit,
            label: 'Edit Department',
            description: 'Edit department details',
            onClick: () => {},
            requiredPermission: 'admin',
            category: 'edit',
            showInCompactMode: true,
            requiresForm: true,
            tooltip: 'Edit department details'
          },
          {
            id: 'analytics',
            icon: FiBarChart2,
            label: 'Department Analytics',
            description: 'View department analytics',
            onClick: () => {},
            category: 'view',
            showInCompactMode: true,
            tooltip: 'View analytics'
          },
          {
            id: 'add-team',
            icon: FiUserPlus,
            label: 'Add Team',
            description: 'Create a new team in this department',
            onClick: () => {},
            requiredPermission: 'admin',
            category: 'edit',
            showInCompactMode: false,
            requiresForm: true,
            tooltip: 'Add new team'
          },
          {
            id: 'resource-planning',
            icon: FiGrid,
            label: 'Resource Planning',
            description: 'Resource planning tools',
            onClick: () => {},
            requiredPermission: 'admin',
            category: 'advanced',
            isNew: true,
            showInCompactMode: false,
            requiresForm: true,
            badge: {
              text: 'New',
              colorScheme: 'purple'
            },
            tooltip: 'Resource planning tools'
          },
          {
            id: 'archive',
            icon: FiArchive,
            label: 'Archive Department',
            description: 'Archive this department',
            onClick: () => {},
            destructive: true,
            requiredPermission: 'admin',
            category: 'danger',
            showInCompactMode: false,
            showConfirmation: true,
            confirmationMessage: 'Are you sure you want to archive this department? This action will affect all teams within it.',
            tooltip: 'Archive this department'
          }
        ];
      
      default:
        return [];
    }
  };

  // Get all actions and filter based on permissions
  const allActions = getActions().map(action => ({
    ...action,
    onClick: () => handleActionClick(action),
    disabled: action.requiredPermission ? 
      (action.requiredPermission === 'edit' && !permissions.canEdit) ||
      (action.requiredPermission === 'delete' && !permissions.canDelete) ||
      (action.requiredPermission === 'share' && !permissions.canShare) ||
      (action.requiredPermission === 'admin' && !permissions.isAdmin) ||
      (action.requiredPermission === 'owner' && !permissions.isOwner) : 
      false
  }));

  // Get the primary actions (for main display)
  const primaryAction = allActions.find(action => action.primary);
  
  // Get visible actions based on compact mode and max limit
  const visibleActions = compact ? 
    allActions.filter(action => action.showInCompactMode).slice(0, maxVisibleActions) :
    allActions.slice(0, maxVisibleActions);
  
  // Get overflow actions that will be shown in a dropdown
  const overflowActions = allActions.slice(maxVisibleActions);
  
  // Group actions by category if requested
  const groupedActions = React.useMemo(() => {
    if (!groupByCategory) return { ungrouped: allActions };
    
    return allActions.reduce((groups: Record<string, Action[]>, action) => {
      const category = action.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(action);
      return groups;
    }, {});
  }, [allActions, groupByCategory]);

  // Display function for a single action button
  const renderActionButton = (action: Action, buttonVariant: 'icon' | 'full' = 'full') => {
    // Define button props based on action type
    const buttonProps = {
      leftIcon: buttonVariant === 'full' ? <action.icon /> : undefined,
      icon: buttonVariant === 'icon' ? <action.icon /> : undefined,
      colorScheme: action.destructive ? 'red' : 'blue',
      variant: action.primary ? 'solid' : action.destructive ? 'outline' : 'ghost',
      size: compact ? 'sm' : 'md',
      isDisabled: action.disabled,
      onClick: action.onClick,
      'aria-label': action.label,
    };
    
    // Wrapper component with tooltip and badge
    const ActionWrapper = ({ children }: { children: React.ReactNode }) => (
      <Box position="relative">
        {/* New badge */}
        {action.isNew && (
          <Badge 
            position="absolute" 
            top={-1} 
            right={-1} 
            zIndex={1}
            fontSize="xs"
            bg={newBadgeBg}
            color={newTextColor}
            borderRadius="full"
            transform="scale(0.8)"
          >
            NEW
          </Badge>
        )}
        
        {/* Beta badge */}
        {action.isBeta && (
          <Badge 
            position="absolute" 
            top={-1} 
            right={-1} 
            zIndex={1}
            fontSize="xs"
            bg={betaBadgeBg}
            color={betaTextColor}
            borderRadius="full"
            transform="scale(0.8)"
          >
            BETA
          </Badge>
        )}
        
        {/* Custom badge */}
        {action.badge && (
          <Badge 
            position="absolute" 
            top={-1} 
            right={-1} 
            zIndex={1}
            fontSize="xs"
            colorScheme={action.badge.colorScheme}
            variant={action.badge.variant}
            borderRadius="full"
            transform="scale(0.8)"
          >
            {action.badge.text}
          </Badge>
        )}
        
        {/* Tooltip */}
        <Tooltip 
          label={action.tooltip || action.description || action.label} 
          hasArrow 
          placement="top"
        >
          {children}
        </Tooltip>
      </Box>
    );
    
    // Render button based on variant
    if (buttonVariant === 'icon') {
      return (
        <ActionWrapper key={action.id}>
          <IconButton {...buttonProps} />
        </ActionWrapper>
      );
    }
    
    return (
      <ActionWrapper key={action.id}>
        <Button {...buttonProps}>
          {action.label}
        </Button>
      </ActionWrapper>
    );
  };

  // Render the menu item for the dropdown
  const renderMenuItem = (action: Action) => {
    return (
      <MenuItem
        key={action.id}
        icon={<action.icon />}
        onClick={action.onClick}
        isDisabled={action.disabled}
        position="relative"
      >
        <HStack justify="space-between" width="full">
          <Text>{action.label}</Text>
          
          {action.isNew && (
            <Badge colorScheme="purple" fontSize="xs">NEW</Badge>
          )}
          
          {action.isBeta && (
            <Badge colorScheme="orange" fontSize="xs">BETA</Badge>
          )}
          
          {action.badge && (
            <Badge 
              colorScheme={action.badge.colorScheme}
              variant={action.badge.variant}
              fontSize="xs"
            >
              {action.badge.text}
            </Badge>
          )}
        </HStack>
      </MenuItem>
    );
  };

  // Render form fields based on the selected action
  const renderFormFields = () => {
    if (!selectedAction) return null;
    
    switch (selectedAction.id) {
      case 'message':
        return (
          <>
            <FormControl isRequired isInvalid={!!formErrors.subject} mb={4}>
              <FormLabel>Subject</FormLabel>
              <Input 
                name="subject" 
                value={formData.subject || ''} 
                onChange={handleFormChange} 
                placeholder="Message subject"
              />
              {formErrors.subject && (
                <FormErrorMessage>{formErrors.subject}</FormErrorMessage>
              )}
            </FormControl>
            
            <FormControl isRequired isInvalid={!!formErrors.message} mb={4}>
              <FormLabel>Message</FormLabel>
              <Textarea 
                name="message" 
                value={formData.message || ''} 
                onChange={handleFormChange} 
                placeholder="Type your message here..."
                rows={5}
              />
              {formErrors.message && (
                <FormErrorMessage>{formErrors.message}</FormErrorMessage>
              )}
            </FormControl>
          </>
        );
      
      case 'schedule':
        return (
          <>
            <FormControl isRequired isInvalid={!!formErrors.title} mb={4}>
              <FormLabel>Meeting Title</FormLabel>
              <Input 
                name="title" 
                value={formData.title || ''} 
                onChange={handleFormChange} 
                placeholder="Enter meeting title"
              />
              {formErrors.title && (
                <FormErrorMessage>{formErrors.title}</FormErrorMessage>
              )}
            </FormControl>
            
            <HStack spacing={4} mb={4}>
              <FormControl isRequired isInvalid={!!formErrors.date} flex="1">
                <FormLabel>Date</FormLabel>
                <Input 
                  type="date" 
                  name="date" 
                  value={formData.date || ''} 
                  onChange={handleFormChange}
                />
                {formErrors.date && (
                  <FormErrorMessage>{formErrors.date}</FormErrorMessage>
                )}
              </FormControl>
              
              <FormControl isRequired isInvalid={!!formErrors.time} flex="1">
                <FormLabel>Time</FormLabel>
                <Input 
                  type="time" 
                  name="time" 
                  value={formData.time || ''} 
                  onChange={handleFormChange}
                />
                {formErrors.time && (
                  <FormErrorMessage>{formErrors.time}</FormErrorMessage>
                )}
              </FormControl>
            </HStack>
            
            <FormControl mb={4}>
              <FormLabel>Duration (minutes)</FormLabel>
              <Select 
                name="duration" 
                value={formData.duration || 30} 
                onChange={handleFormChange}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </Select>
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea 
                name="description" 
                value={formData.description || ''} 
                onChange={handleFormChange} 
                placeholder="Meeting details..."
                rows={3}
              />
            </FormControl>
          </>
        );
      
      case 'share':
        return (
          <>
            <FormControl mb={4}>
              <FormLabel>Share with</FormLabel>
              <Select 
                name="shareWith" 
                value={formData.shareWith || ''} 
                onChange={handleFormChange}
                placeholder="Select option"
              >
                <option value="user">Specific User</option>
                <option value="team">Team</option>
                <option value="department">Department</option>
              </Select>
            </FormControl>
            
            {formData.shareWith === 'user' && (
              <FormControl mb={4} isRequired isInvalid={!!formErrors.recipient}>
                <FormLabel>Recipient</FormLabel>
                <Input 
                  name="recipient" 
                  value={formData.recipient || ''} 
                  onChange={handleFormChange} 
                  placeholder="Enter name or email"
                />
                {formErrors.recipient && (
                  <FormErrorMessage>{formErrors.recipient}</FormErrorMessage>
                )}
              </FormControl>
            )}
            
            <FormControl mb={4}>
              <FormLabel>Permission Level</FormLabel>
              <Select 
                name="permission" 
                value={formData.permission || 'view'} 
                onChange={handleFormChange}
              >
                <option value="view">View only</option>
                <option value="comment">Comment</option>
                <option value="edit">Edit</option>
              </Select>
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Note (optional)</FormLabel>
              <Textarea 
                name="note" 
                value={formData.note || ''} 
                onChange={handleFormChange} 
                placeholder="Add a note..."
                rows={3}
              />
            </FormControl>
          </>
        );
      
      case 'edit':
        return (
          <>
            <FormControl isRequired isInvalid={!!formErrors.name} mb={4}>
              <FormLabel>Name</FormLabel>
              <Input 
                name="name" 
                value={formData.name || ''} 
                onChange={handleFormChange}
              />
              {formErrors.name && (
                <FormErrorMessage>{formErrors.name}</FormErrorMessage>
              )}
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea 
                name="description" 
                value={formData.description || ''} 
                onChange={handleFormChange} 
                placeholder="Enter description..."
                rows={4}
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Status</FormLabel>
              <Select 
                name="status" 
                value={formData.status || 'active'} 
                onChange={handleFormChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </Select>
            </FormControl>
          </>
        );
      
      case 'add-task':
        return (
          <>
            <FormControl isRequired isInvalid={!!formErrors.title} mb={4}>
              <FormLabel>Task Title</FormLabel>
              <Input 
                name="title" 
                value={formData.title || ''} 
                onChange={handleFormChange} 
                placeholder="Enter task title"
              />
              {formErrors.title && (
                <FormErrorMessage>{formErrors.title}</FormErrorMessage>
              )}
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Description</FormLabel>
              <Textarea 
                name="description" 
                value={formData.description || ''} 
                onChange={handleFormChange} 
                placeholder="Describe the task..."
                rows={4}
              />
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Priority</FormLabel>
              <Select 
                name="priority" 
                value={formData.priority || 'medium'} 
                onChange={handleFormChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </FormControl>
            
            <FormControl mb={4}>
              <FormLabel>Due Date</FormLabel>
              <Input 
                type="date" 
                name="dueDate" 
                value={formData.dueDate || ''} 
                onChange={handleFormChange}
              />
            </FormControl>
          </>
        );
      
      // Add more form types as needed
      
      default:
        return (
          <Text>No form configuration available for this action.</Text>
        );
    }
  };
  
  // Return empty box if no actions are available
  if (allActions.length === 0) {
    return null;
  }

  return (
    <Box>
      <Divider my={4} />
      
      {/* Section header with help button */}
      <HStack justify="space-between" mb={3}>
        <Heading size="xs" color="gray.500">Quick Actions</Heading>
        <Tooltip label="Learn about available actions">
          <IconButton
            icon={<FiHelpCircle />}
            aria-label="Help for actions"
            size="xs"
            variant="ghost"
            onClick={openHelp}
          />
        </Tooltip>
      </HStack>
      
      {/* Action buttons */}
      <Box mb={4}>
        {compact ? (
          // Compact mode with icon buttons
          <HStack spacing={2}>
            {visibleActions.map(action => renderActionButton(action, 'icon'))}
            
            {/* Overflow menu */}
            {overflowActions.length > 0 && (
              <Menu placement="bottom-end">
                <MenuButton
                  as={IconButton}
                  icon={<FiMoreVertical />}
                  variant="ghost"
                  size="sm"
                  aria-label="More actions"
                />
                <Portal>
                  <MenuList zIndex={1000}>
                    {groupByCategory ? 
                      // Group actions by category
                      Object.entries(groupedActions).map(([category, actions]) => (
                        <React.Fragment key={category}>
                          <MenuGroup title={category.charAt(0).toUpperCase() + category.slice(1)}>
                            {actions.map(action => renderMenuItem(action))}
                          </MenuGroup>
                          <MenuDivider />
                        </React.Fragment>
                      ))
                      :
                      // Flat list of actions
                      overflowActions.map(action => renderMenuItem(action))
                    }
                  </MenuList>
                </Portal>
              </Menu>
            )}
          </HStack>
        ) : (
          // Full mode with buttons and labels
          <VStack spacing={3} align="stretch">
            {/* Primary action */}
            {primaryAction && (
              <Box mb={1}>
                <Button
                  leftIcon={<primaryAction.icon />}
                  colorScheme="blue"
                  size="md"
                  width="100%"
                  onClick={primaryAction.onClick}
                  isDisabled={primaryAction.disabled}
                >
                  {primaryAction.label}
                </Button>
              </Box>
            )}
            
            {/* Secondary actions */}
            <HStack spacing={2} flexWrap="wrap">
              {visibleActions
                .filter(action => !action.primary)
                .map(action => renderActionButton(action, 'full'))}
              
              {/* Overflow menu */}
              {overflowActions.length > 0 && (
                <Menu placement="bottom-end">
                  <MenuButton
                    as={Button}
                    rightIcon={<FiChevronDown />}
                    variant="outline"
                    size="md"
                  >
                    More
                  </MenuButton>
                  <Portal>
                    <MenuList zIndex={1000}>
                      {groupByCategory ? 
                        // Group actions by category
                        Object.entries(groupedActions)
                          .filter(([category]) => 
                            // Only show categories that have actions in the overflow
                            overflowActions.some(a => a.category === category)
                          )
                          .map(([category, actions]) => (
                            <React.Fragment key={category}>
                              <MenuGroup title={category.charAt(0).toUpperCase() + category.slice(1)}>
                                {actions
                                  .filter(action => !visibleActions.includes(action))
                                  .map(action => renderMenuItem(action))
                                }
                              </MenuGroup>
                              <MenuDivider />
                            </React.Fragment>
                          ))
                        :
                        // Flat list of actions
                        overflowActions.map(action => renderMenuItem(action))
                      }
                    </MenuList>
                  </Portal>
                </Menu>
              )}
            </HStack>
          </VStack>
        )}
      </Box>
      
      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        size="md"
        isCentered
      >
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent>
          {selectedAction && (
            <React.Fragment>
              <ModalHeader>
                <HStack>
                  <Box color={selectedAction.destructive ? dangerColor : primaryColor}>
                    <selectedAction.icon />
                  </Box>
                  <Text>{selectedAction.label}</Text>
                </HStack>
                {selectedAction.description && (
                  <Text fontSize="sm" fontWeight="normal" mt={1} color="gray.500">
                    {selectedAction.description}
                  </Text>
                )}
              </ModalHeader>
              <ModalCloseButton />
              <form onSubmit={handleFormSubmit}>
                <ModalBody pb={6}>
                  {renderFormFields()}
                </ModalBody>
                <ModalFooter>
                  <Button 
                    colorScheme={selectedAction.destructive ? "red" : "blue"} 
                    mr={3} 
                    type="submit"
                    isLoading={isProcessing}
                  >
                    {selectedAction.destructive ? "Delete" : "Submit"}
                  </Button>
                  <Button variant="ghost" onClick={closeForm}>
                    Cancel
                  </Button>
                </ModalFooter>
              </form>
            </React.Fragment>
          )}
        </ModalContent>
      </Modal>
      
      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={closeConfirm}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              {selectedAction?.destructive ? "Destructive Action" : "Confirm Action"}
            </AlertDialogHeader>

            <AlertDialogBody>
              {selectedAction?.confirmationMessage || "Are you sure you want to proceed with this action?"}
              
              {selectedAction?.destructive && (
                <Box mt={4} p={3} bg="red.50" borderRadius="md" color="red.600">
                  <HStack>
                    <FiAlertTriangle />
                    <Text>This action may have irreversible consequences.</Text>
                  </HStack>
                </Box>
              )}
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeConfirm}>
                Cancel
              </Button>
              <Button 
                colorScheme={selectedAction?.destructive ? "red" : "blue"} 
                onClick={handleConfirmAction} 
                ml={3}
                isLoading={isProcessing}
              >
                Confirm
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      {/* Help Dialog */}
      <Modal
        isOpen={isHelpOpen}
        onClose={closeHelp}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FiHelpCircle />
              <Text>Available Actions</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              These are the available actions for this {entityType}. Some actions may require specific permissions.
            </Text>
            
            <Divider mb={4} />
            
            {groupByCategory ? (
              // Grouped by category
              Object.entries(groupedActions).map(([category, actions]) => (
                <Box key={category} mb={6}>
                  <Heading size="sm" mb={3}>
                    {category.charAt(0).toUpperCase() + category.slice(1)} Actions
                  </Heading>
                  
                  <VStack spacing={4} align="stretch">
                    {actions.map(action => (
                      <Box 
                        key={action.id} 
                        p={3} 
                        borderWidth="1px" 
                        borderRadius="md" 
                        borderColor={borderColor}
                        position="relative"
                      >
                        {/* Badges */}
                        {(action.isNew || action.isBeta || action.badge) && (
                          <HStack position="absolute" top={2} right={2} spacing={2}>
                            {action.isNew && (
                              <Badge colorScheme="purple">NEW</Badge>
                            )}
                            {action.isBeta && (
                              <Badge colorScheme="orange">BETA</Badge>
                            )}
                            {action.badge && (
                              <Badge colorScheme={action.badge.colorScheme}>
                                {action.badge.text}
                              </Badge>
                            )}
                          </HStack>
                        )}
                        
                        <HStack mb={2}>
                          <Box 
                            p={2} 
                            borderRadius="md" 
                            bg={action.destructive ? "red.50" : "blue.50"}
                            color={action.destructive ? "red.500" : "blue.500"}
                          >
                            <action.icon />
                          </Box>
                          <Text fontWeight="bold">{action.label}</Text>
                        </HStack>
                        
                        <Text fontSize="sm" color="gray.600">
                          {action.description || `No description available`}
                        </Text>
                        
                        {action.requiredPermission && (
                          <Badge mt={2} colorScheme="purple" variant="subtle">
                            Requires {action.requiredPermission} permission
                          </Badge>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </Box>
              ))
            ) : (
              // Flat list
              <VStack spacing={4} align="stretch">
                {allActions.map(action => (
                  <Box 
                    key={action.id} 
                    p={3} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    borderColor={borderColor}
                  >
                    <HStack justify="space-between">
                      <HStack>
                        <Box 
                          p={2} 
                          borderRadius="md" 
                          bg={action.destructive ? "red.50" : "blue.50"}
                          color={action.destructive ? "red.500" : "blue.500"}
                        >
                          <action.icon />
                        </Box>
                        <Text fontWeight="bold">{action.label}</Text>
                      </HStack>
                      
                      <HStack>
                        {action.isNew && (
                          <Badge colorScheme="purple">NEW</Badge>
                        )}
                        {action.isBeta && (
                          <Badge colorScheme="orange">BETA</Badge>
                        )}
                        {action.badge && (
                          <Badge colorScheme={action.badge.colorScheme}>
                            {action.badge.text}
                          </Badge>
                        )}
                      </HStack>
                    </HStack>
                    
                    <Text fontSize="sm" color="gray.600" mt={2}>
                      {action.description || `No description available`}
                    </Text>
                    
                    {action.requiredPermission && (
                      <Badge mt={2} colorScheme="purple" variant="subtle">
                        Requires {action.requiredPermission} permission
                      </Badge>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={closeHelp}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default EnhancedEntityActions;