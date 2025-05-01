import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Workspace, WorkspaceType } from '../../models/workspace/Workspace';
import { workspaceService } from '../../services/WorkspaceService';
import { WorkspaceError, WorkspaceErrorType } from '../../models/workspace/types';

// Define the context state interface
interface WorkspaceContextState {
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: WorkspaceError | null;
  activeSection: string | null;
  workspaceOperationInProgress: boolean;
}

// Define the context methods
interface WorkspaceContextMethods {
  loadWorkspace: (id: string) => Promise<void>;
  updateWorkspace: (workspace: Workspace) => Promise<void>;
  setActiveSection: (section: string) => void;
  clearError: () => void;
  archiveWorkspace: (id: string) => Promise<void>;
  createWorkspace: (
    name: string,
    description: string,
    type: WorkspaceType,
    ownerId: string,
    additionalParams?: Record<string, any>
  ) => Promise<Workspace | null>;
}

// Create the combined context type
type WorkspaceContextType = WorkspaceContextState & WorkspaceContextMethods;

// Create the context with a default value
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// Provider props interface
interface WorkspaceProviderProps {
  children: ReactNode;
}

/**
 * Workspace context provider that manages workspace state and operations
 */
export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  // Initialize state
  const [state, setState] = useState<WorkspaceContextState>({
    currentWorkspace: null,
    isLoading: false,
    error: null,
    activeSection: 'overview', // Default section
    workspaceOperationInProgress: false
  });

  /**
   * Loads a workspace by ID
   */
  const loadWorkspace = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const workspace = await workspaceService.getWorkspace(id);
      
      if (workspace) {
        setState(prev => ({ 
          ...prev, 
          currentWorkspace: workspace, 
          isLoading: false 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: {
            type: WorkspaceErrorType.NOT_FOUND,
            message: `Workspace with ID ${id} not found`
          } 
        }));
      }
    } catch (err) {
      console.error('Error loading workspace:', err);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: {
          type: WorkspaceErrorType.SERVER_ERROR,
          message: err instanceof Error ? err.message : 'Failed to load workspace'
        } 
      }));
    }
  }, []);

  /**
   * Updates a workspace
   */
  const updateWorkspace = useCallback(async (workspace: Workspace) => {
    setState(prev => ({ ...prev, workspaceOperationInProgress: true, error: null }));

    try {
      const updatedWorkspace = await workspaceService.updateWorkspace(workspace);
      
      setState(prev => ({ 
        ...prev, 
        currentWorkspace: updatedWorkspace, 
        workspaceOperationInProgress: false 
      }));
    } catch (err) {
      console.error('Error updating workspace:', err);
      setState(prev => ({ 
        ...prev, 
        workspaceOperationInProgress: false, 
        error: {
          type: WorkspaceErrorType.SERVER_ERROR,
          message: err instanceof Error ? err.message : 'Failed to update workspace'
        } 
      }));
    }
  }, []);

  /**
   * Sets the active section
   */
  const setActiveSection = useCallback((section: string) => {
    setState(prev => ({ ...prev, activeSection: section }));
  }, []);

  /**
   * Clears the error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Archives a workspace
   */
  const archiveWorkspace = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, workspaceOperationInProgress: true, error: null }));

    try {
      const archivedWorkspace = await workspaceService.archiveWorkspace(id);
      
      setState(prev => ({ 
        ...prev, 
        currentWorkspace: archivedWorkspace, 
        workspaceOperationInProgress: false 
      }));
    } catch (err) {
      console.error('Error archiving workspace:', err);
      setState(prev => ({ 
        ...prev, 
        workspaceOperationInProgress: false, 
        error: {
          type: WorkspaceErrorType.SERVER_ERROR,
          message: err instanceof Error ? err.message : 'Failed to archive workspace'
        } 
      }));
    }
  }, []);

  /**
   * Creates a new workspace
   */
  const createWorkspace = useCallback(async (
    name: string,
    description: string,
    type: WorkspaceType,
    ownerId: string,
    additionalParams?: Record<string, any>
  ): Promise<Workspace | null> => {
    setState(prev => ({ ...prev, workspaceOperationInProgress: true, error: null }));

    try {
      // Use service to create the workspace
      const workspace = await workspaceService.createWorkspace(
        name,
        description,
        type,
        ownerId, // Treated as createdBy
        ownerId,
        additionalParams
      );
      
      setState(prev => ({ 
        ...prev, 
        workspaceOperationInProgress: false 
      }));
      
      return workspace;
    } catch (err) {
      console.error('Error creating workspace:', err);
      setState(prev => ({ 
        ...prev, 
        workspaceOperationInProgress: false, 
        error: {
          type: WorkspaceErrorType.SERVER_ERROR,
          message: err instanceof Error ? err.message : 'Failed to create workspace'
        } 
      }));
      
      return null;
    }
  }, []);

  // Combine state and methods for the context value
  const contextValue: WorkspaceContextType = {
    ...state,
    loadWorkspace,
    updateWorkspace,
    setActiveSection,
    clearError,
    archiveWorkspace,
    createWorkspace
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
};

/**
 * Hook to use the workspace context
 * @returns Workspace context value
 * @throws Error if used outside of a WorkspaceProvider
 */
export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  
  return context;
}