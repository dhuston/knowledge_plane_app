import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKey?: number; // When this changes, the error boundary resets
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component for workspace components
 * Catches JavaScript errors in child component tree and displays fallback UI
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }
  
  static defaultProps = {
    fallback: <div className="error-boundary">Something went wrong. Please try again.</div>
  };
  
  /**
   * Update state when an error occurs
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  /**
   * Reset error state if the resetKey changes
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }
  
  /**
   * Log error information
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Workspace error caught by boundary:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  /**
   * Reset the error state
   */
  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  }
  
  render() {
    if (this.state.hasError) {
      // Render fallback UI if there's an error
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback({ 
          error: this.state.error,
          resetErrorBoundary: this.resetErrorBoundary
        });
      }
      
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h3>Something went wrong</h3>
            <p className="error-message">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button 
              className="error-retry" 
              onClick={this.resetErrorBoundary}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    
    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;