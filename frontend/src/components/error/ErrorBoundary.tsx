import React from 'react';
import { Box, Heading, Text, Button, VStack, Code } from '@chakra-ui/react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log the error to console
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }
  
  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box p={6} borderRadius="md" bg="gray.50" color="gray.800" maxW="800px" mx="auto" my={4} _dark={{ bg: "gray.700", color: "gray.100" }}>
          <VStack spacing={4} align="flex-start">
            <Heading size="lg" color="red.500">Something went wrong</Heading>
            <Text>We encountered an error while rendering this component. Please try again or contact support if the issue persists.</Text>
            
            {this.state.error && (
              <Box p={3} bg="gray.100" w="100%" borderRadius="md" _dark={{ bg: "gray.800" }}>
                <Text fontWeight="bold">Error:</Text>
                <Code colorScheme="red" display="block" whiteSpace="pre-wrap" p={2} borderRadius="md">
                  {this.state.error.toString()}
                </Code>
              </Box>
            )}
            
            <Button colorScheme="blue" onClick={this.handleRetry}>
              Try Again
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;