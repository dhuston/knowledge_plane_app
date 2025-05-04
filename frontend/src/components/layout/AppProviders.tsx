/**
 * AppProviders.tsx
 * Wraps the application with all required context providers
 */
import React, { ReactNode } from 'react';
import { NodeSelectionProvider } from '../../context/NodeSelectionContext';
import InsightsProvider from '../../context/InsightsContext';
import ErrorBoundary from '../error/ErrorBoundary';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * AppProviders - Wraps the application with all required context providers
 * This component is designed to be used at the root of the application
 * to provide shared state and functionality.
 */
const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <NodeSelectionProvider>
      <ErrorBoundary>
        <InsightsProvider>
          {children}
        </InsightsProvider>
      </ErrorBoundary>
    </NodeSelectionProvider>
  );
};

export default AppProviders;