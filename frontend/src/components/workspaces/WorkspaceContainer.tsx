import React, { FC, ReactNode, useState, useCallback, memo } from 'react';
import WorkspaceHeader from './WorkspaceHeader';
import WorkspaceNavigation from './WorkspaceNavigation';
import WorkspaceContent from './WorkspaceContent';
import ErrorBoundary from './ErrorBoundary';
import { Workspace } from '../../models/workspace/Workspace';
import { useWorkspace } from './WorkspaceContext';

interface WorkspaceContainerProps {
  workspace: Workspace;
  children?: ReactNode;
  onError?: (error: Error) => void;
}

// Memoized Header component to prevent unnecessary re-renders
const MemoizedHeader = memo(WorkspaceHeader);

// Memoized Navigation component to prevent unnecessary re-renders
const MemoizedNavigation = memo(WorkspaceNavigation);

/**
 * Container component for workspaces that provides the layout structure
 * and common functionality for all workspace types
 */
const WorkspaceContainer: FC<WorkspaceContainerProps> = ({ 
  workspace, 
  children,
  onError 
}) => {
  // Use the context if available, otherwise use local state
  const workspaceContext = useWorkspace();
  
  // If we have a context with the same workspace, use its active section
  const contextHasSameWorkspace = 
    workspaceContext?.currentWorkspace?.id === workspace.id;
  
  const activeSection = contextHasSameWorkspace && workspaceContext.activeSection
    ? workspaceContext.activeSection
    : 'overview';
  
  // Handle section changes
  const handleSectionChange = useCallback((section: string) => {
    if (contextHasSameWorkspace && workspaceContext.setActiveSection) {
      workspaceContext.setActiveSection(section);
    }
  }, [contextHasSameWorkspace, workspaceContext]);
  
  // Handle errors from child components
  const handleError = useCallback((error: Error) => {
    console.error('Workspace component error:', error);
    if (onError) {
      onError(error);
    }
  }, [onError]);
  
  return (
    <div 
      className="workspace-container"
      data-workspace-id={workspace.id}
      data-workspace-type={workspace.type}
    >
      <ErrorBoundary onError={handleError}>
        <MemoizedHeader 
          title={workspace.name} 
          description={workspace.description} 
          workspaceType={workspace.type} 
        />
        
        <div className="workspace-layout">
          <MemoizedNavigation 
            workspaceType={workspace.type}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
          
          <ErrorBoundary 
            onError={handleError}
            key={`${workspace.id}-${activeSection}`} // Reset error state when section changes
            fallback={
              <div className="workspace-error">
                <h3>Error loading workspace section</h3>
                <p>The requested section could not be loaded. Please try again or select a different section.</p>
              </div>
            }
          >
            <WorkspaceContent 
              workspaceId={workspace.id}
              workspaceType={workspace.type}
              activeSection={activeSection}
            >
              {children}
            </WorkspaceContent>
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default memo(WorkspaceContainer);