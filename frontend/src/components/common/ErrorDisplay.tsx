/**
 * ErrorDisplay component
 * A standardized error display component for consistent error handling across the application
 */

import React from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Button,
  VStack,
  Text,
  useColorModeValue,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ErrorCategory, AppError, isErrorWithMessage } from '../../utils/errorHandling';

// Maps error categories to Chakra UI alert status
const categoryToAlertStatus = {
  [ErrorCategory.NETWORK]: 'warning',
  [ErrorCategory.AUTHENTICATION]: 'error',
  [ErrorCategory.AUTHORIZATION]: 'error',
  [ErrorCategory.VALIDATION]: 'warning',
  [ErrorCategory.NOT_FOUND]: 'info',
  [ErrorCategory.SERVER]: 'error',
  [ErrorCategory.UNKNOWN]: 'error',
} as const;

// Maps error categories to descriptive titles
const categoryToTitle = {
  [ErrorCategory.NETWORK]: 'Connection Issue',
  [ErrorCategory.AUTHENTICATION]: 'Authentication Required',
  [ErrorCategory.AUTHORIZATION]: 'Access Denied',
  [ErrorCategory.VALIDATION]: 'Invalid Data',
  [ErrorCategory.NOT_FOUND]: 'Not Found',
  [ErrorCategory.SERVER]: 'Server Error',
  [ErrorCategory.UNKNOWN]: 'Error',
} as const;

// Maps error categories to icons
const categoryToIcon = {
  [ErrorCategory.NETWORK]: 'warning',
  [ErrorCategory.AUTHENTICATION]: 'warning', 
  [ErrorCategory.AUTHORIZATION]: 'warning',
  [ErrorCategory.VALIDATION]: 'warning',
  [ErrorCategory.NOT_FOUND]: 'info',
  [ErrorCategory.SERVER]: 'error',
  [ErrorCategory.UNKNOWN]: 'error',
} as const;

interface ErrorDisplayProps {
  /** The error to display */
  error: unknown;
  
  /** Function to retry the failed operation */
  onRetry?: () => void;
  
  /** Additional action for some error types (e.g., "Login" for auth errors) */
  additionalAction?: {
    label: string;
    onClick: () => void;
  };
  
  /** Whether to show technical details (for developers, admins, etc.) */
  showDetails?: boolean;
  
  /** Optional CSS variant [subtle, solid, left-accent, top-accent] */
  variant?: 'subtle' | 'solid' | 'left-accent' | 'top-accent';
  
  /** Optional custom title to override the category-based title */
  title?: string;
  
  /** Optional custom message to override the extracted error message */
  message?: string;
  
  /** Whether to use a compact layout */
  compact?: boolean;

  /** CSS class name */
  className?: string;
}

/**
 * A standardized error display component
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  additionalAction,
  showDetails = false,
  variant = 'left-accent',
  title,
  message,
  compact = false,
  className,
}) => {
  // Convert the error to an AppError if it's not already one
  const appError = error instanceof AppError 
    ? error 
    : AppError.fromError(error);
  
  const { isOpen, onToggle } = useDisclosure();
  
  // Get alert properties based on error category
  const status = categoryToAlertStatus[appError.category];
  const defaultTitle = categoryToTitle[appError.category];
  const iconType = categoryToIcon[appError.category];
  
  // Use provided message or get from error
  const errorMessage = message || appError.message;
  
  // Get technical details if available
  const originalError = appError.originalError;
  
  // Stack trace if available (use any browser-specific APIs)
  const stack = 
    (originalError instanceof Error && originalError.stack) || 
    (appError.stack) || 
    'Stack trace not available';
  
  // Animation properties
  const animationVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={compact ? {} : animationVariants}
      className={className}
    >
      <Alert 
        status={status} 
        variant={variant} 
        borderRadius="md"
        flexDirection={compact ? 'row' : 'column'} 
        alignItems={compact ? 'center' : 'flex-start'}
        textAlign={compact ? 'left' : 'center'}
        padding={compact ? 3 : 4}
        width="100%"
      >
        <AlertIcon boxSize={compact ? '20px' : '24px'} />
        
        {compact ? (
          // Compact layout
          <Box flex="1">
            <Text fontWeight="medium">{errorMessage}</Text>
          </Box>
        ) : (
          // Regular layout
          <VStack spacing={3} align="center" width="100%">
            <AlertTitle fontWeight="bold" fontSize="lg">
              {title || defaultTitle}
            </AlertTitle>
            
            <AlertDescription maxWidth="lg">
              {errorMessage}
            </AlertDescription>
            
            {/* Actions */}
            {(onRetry || additionalAction) && (
              <Box d="flex" flexDirection="row" justifyContent="center" mt={2} gap={3}>
                {onRetry && (
                  <Button 
                    size="sm" 
                    colorScheme={status} 
                    onClick={onRetry}
                    variant="outline"
                  >
                    Try Again
                  </Button>
                )}
                
                {additionalAction && (
                  <Button 
                    size="sm" 
                    colorScheme={status === 'error' ? 'blue' : status} 
                    onClick={additionalAction.onClick}
                  >
                    {additionalAction.label}
                  </Button>
                )}
              </Box>
            )}
            
            {/* Technical details for developers */}
            {showDetails && (
              <Box width="100%" mt={2}>
                <Button 
                  size="xs" 
                  variant="link" 
                  onClick={onToggle} 
                  colorScheme="gray"
                >
                  {isOpen ? 'Hide Technical Details' : 'Show Technical Details'}
                </Button>
                
                <Collapse in={isOpen} animateOpacity>
                  <Box 
                    mt={2} 
                    p={3} 
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    borderRadius="md"
                    fontSize="xs"
                    fontFamily="monospace"
                    whiteSpace="pre-wrap"
                    overflowX="auto"
                    textAlign="left"
                  >
                    <Text fontWeight="bold">Error Category: {appError.category}</Text>
                    <Text mt={1}>Original error: {JSON.stringify(originalError, null, 2)}</Text>
                    <Text mt={2}>Stack trace:</Text>
                    <Text mt={1}>{stack}</Text>
                  </Box>
                </Collapse>
              </Box>
            )}
          </VStack>
        )}
        
        {/* Retry button for compact layout */}
        {compact && onRetry && (
          <Button 
            size="sm" 
            colorScheme={status} 
            onClick={onRetry}
            variant="ghost"
            ml={2}
          >
            Retry
          </Button>
        )}
      </Alert>
    </motion.div>
  );
};

export default ErrorDisplay;