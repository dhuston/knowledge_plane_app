import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Here you could send the error to your error reporting service
    // e.g., Sentry, LogRocket, etc.
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  public render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      p={8}
      bg={bgColor}
      borderRadius="lg"
      border="1px solid"
      borderColor={borderColor}
      boxShadow="lg"
      maxW="600px"
      mx="auto"
      my={8}
    >
      <VStack spacing={6} align="stretch">
        <VStack spacing={2} align="center">
          <Icon as={FiAlertTriangle} boxSize={10} color="error.500" />
          <Heading size="lg" textAlign="center">
            Something went wrong
          </Heading>
        </VStack>

        <VStack spacing={4} align="stretch">
          <Text color="gray.600" _dark={{ color: 'gray.300' }}>
            We apologize for the inconvenience. An unexpected error has occurred.
          </Text>

          {error && (
            <Box
              p={4}
              bg="gray.50"
              _dark={{ bg: 'gray.900' }}
              borderRadius="md"
              fontSize="sm"
              fontFamily="mono"
            >
              <Text color="error.500">{error.message}</Text>
            </Box>
          )}

          <Button
            colorScheme="primary"
            onClick={onReset}
            size="lg"
            width="full"
          >
            Try Again
          </Button>

          <Text fontSize="sm" color="gray.500" textAlign="center">
            If the problem persists, please contact support.
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
} 