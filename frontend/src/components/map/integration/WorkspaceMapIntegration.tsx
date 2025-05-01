import React, { FC, useEffect, useState, useMemo, useCallback } from 'react';
import { Workspace } from '../../../models/workspace/Workspace';
import { WorkspaceType } from '../../../models/workspace/Workspace';
import { workspaceService } from '../../../services/WorkspaceService';
import ErrorBoundary from '../../workspaces/ErrorBoundary';

interface NodeData {
  id: string;
  type: 'user' | 'team' | 'project' | 'goal';
  name: string;
  description?: string;
}

interface WorkspaceMapIntegrationProps {
  selectedNodeData?: NodeData;
  workspaceId?: string;
  onSelectWorkspace?: (workspaceId: string) => void;
  onCreateWorkspace?: (nodeData: NodeData, workspaceType: WorkspaceType) => void;
  userId: string;
}

/**
 * Component that integrates workspaces with the map visualization
 * Enables bidirectional navigation between map nodes and workspaces
 */
const WorkspaceMapIntegration: FC<WorkspaceMapIntegrationProps> = ({
  selectedNodeData,
  workspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  userId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [associatedWorkspaces, setAssociatedWorkspaces] = useState<Workspace[]>([]);
  
  // Determine appropriate workspace types for the selected node
  const availableWorkspaceTypes = useMemo(() => {
    if (!selectedNodeData) return [];
    
    switch (selectedNodeData.type) {
      case 'user':
        return [
          { type: WorkspaceType.PERSONAL, label: 'Personal Workspace' }
        ];
      case 'team':
        return [
          { type: WorkspaceType.TEAM, label: 'Team Workspace' },
          { type: WorkspaceType.DOCUMENT, label: 'Document Collaboration' },
          { type: WorkspaceType.MEETING, label: 'Meeting Space' }
        ];
      case 'project':
        return [
          { type: WorkspaceType.PROJECT, label: 'Project Workspace' },
          { type: WorkspaceType.RESEARCH, label: 'Research Workspace' },
          { type: WorkspaceType.DOCUMENT, label: 'Document Collaboration' }
        ];
      case 'goal':
        return [
          { type: WorkspaceType.DOCUMENT, label: 'Document Collaboration' },
          { type: WorkspaceType.MEETING, label: 'Planning Meeting' }
        ];
      default:
        return [];
    }
  }, [selectedNodeData]);
  
  // Load workspaces associated with the selected node
  useEffect(() => {
    if (!selectedNodeData) {
      setAssociatedWorkspaces([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const fetchWorkspaces = async () => {
      try {
        const workspaces = await workspaceService.getWorkspacesByMapEntity(
          selectedNodeData.type,
          selectedNodeData.id
        );
        
        setAssociatedWorkspaces(workspaces);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching associated workspaces:', err);
        setError(err instanceof Error ? err : new Error('Unknown error loading workspaces'));
        setIsLoading(false);
      }
    };
    
    fetchWorkspaces();
  }, [selectedNodeData]);
  
  // Handle workspace selection
  const handleSelectWorkspace = useCallback((workspace: Workspace) => {
    if (onSelectWorkspace) {
      onSelectWorkspace(workspace.id);
    }
  }, [onSelectWorkspace]);
  
  // Handle creation of a new workspace
  const handleCreateWorkspace = useCallback((workspaceType: WorkspaceType) => {
    if (!selectedNodeData || !onCreateWorkspace) return;
    
    onCreateWorkspace(selectedNodeData, workspaceType);
  }, [selectedNodeData, onCreateWorkspace]);
  
  // When a workspace is directly selected, find related map node
  useEffect(() => {
    if (!workspaceId) return;
    
    const highlightRelatedMapNode = async () => {
      try {
        const workspace = await workspaceService.getWorkspace(workspaceId);
        if (!workspace) return;
        
        // This would trigger map highlighting in a real implementation
        console.log(`Highlighting map node for workspace: ${workspace.id}`);
        
        // Determine the node type based on workspace type and ownerId
        // In a real implementation, this would query the map service
      } catch (error) {
        console.error('Error fetching workspace details:', error);
      }
    };
    
    highlightRelatedMapNode();
  }, [workspaceId]);
  
  // Handle errors that may occur
  const handleRetry = useCallback(() => {
    if (selectedNodeData) {
      setError(null);
      setIsLoading(true);
      
      workspaceService.getWorkspacesByMapEntity(selectedNodeData.type, selectedNodeData.id)
        .then(workspaces => {
          setAssociatedWorkspaces(workspaces);
          setIsLoading(false);
        })
        .catch(err => {
          setError(err instanceof Error ? err : new Error('Unknown error loading workspaces'));
          setIsLoading(false);
        });
    }
  }, [selectedNodeData]);
  
  return (
    <ErrorBoundary>
      <div 
        className="workspace-map-integration"
        aria-busy={isLoading}
      >
        {selectedNodeData && (
          <div className="map-node-workspaces">
            <h3 className="integration-title">
              Workspaces for {selectedNodeData.name}
            </h3>
            
            {isLoading ? (
              <div className="loading-indicator" role="status">
                Loading workspaces...
              </div>
            ) : error ? (
              <div className="error-state" role="alert">
                <p>Error loading workspaces</p>
                <button 
                  className="retry-button"
                  onClick={handleRetry}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                {associatedWorkspaces.length > 0 ? (
                  <ul className="workspace-list" role="list">
                    {associatedWorkspaces.map(workspace => (
                      <li 
                        key={workspace.id} 
                        className="workspace-item"
                      >
                        <button
                          className="workspace-button"
                          onClick={() => handleSelectWorkspace(workspace)}
                          data-workspace-id={workspace.id}
                          data-workspace-type={workspace.type}
                        >
                          <span className="workspace-name">{workspace.name}</span>
                          <span className="workspace-type">{workspace.type}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="no-workspaces">
                    <p>No workspaces associated with this {selectedNodeData.type}.</p>
                  </div>
                )}
                
                {availableWorkspaceTypes.length > 0 && (
                  <div className="create-workspace-section">
                    <h4>Create New Workspace</h4>
                    <div className="workspace-type-options">
                      {availableWorkspaceTypes.map(workspaceType => (
                        <button
                          key={workspaceType.type}
                          className="create-workspace-button"
                          onClick={() => handleCreateWorkspace(workspaceType.type)}
                        >
                          {workspaceType.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {workspaceId && !selectedNodeData && (
          <div className="workspace-map-hint">
            <p>
              Select an item on the map to see its relationship with this workspace.
            </p>
          </div>
        )}
        
        {!workspaceId && !selectedNodeData && (
          <div className="integration-empty-state">
            <p>
              Select a node on the map to see associated workspaces,
              or select a workspace to highlight related items on the map.
            </p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default React.memo(WorkspaceMapIntegration);