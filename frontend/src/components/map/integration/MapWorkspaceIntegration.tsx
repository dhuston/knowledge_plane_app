import React, { FC, useEffect, useState } from 'react';
import { Workspace } from '../../../models/workspace/Workspace';

interface MapWorkspaceIntegrationProps {
  mapNodeId?: string;
  nodeType?: 'user' | 'team' | 'project' | 'goal';
  workspaceId?: string;
  onWorkspaceSelect?: (workspaceId: string) => void;
}

/**
 * Component that integrates workspaces with the Living Map visualization
 * It manages the bidirectional connection between map nodes and workspaces
 */
const MapWorkspaceIntegration: FC<MapWorkspaceIntegrationProps> = ({
  mapNodeId,
  nodeType,
  workspaceId,
  onWorkspaceSelect
}) => {
  const [associatedWorkspaces, setAssociatedWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // When a map node is selected, fetch its associated workspaces
  useEffect(() => {
    if (!mapNodeId) return;
    
    setIsLoading(true);
    
    // Simulate API call to fetch workspaces associated with this map node
    setTimeout(() => {
      // This would be real data from an API in production
      const mockWorkspaces: Workspace[] = [
        {
          id: `ws-${nodeType}-1`,
          name: `${nodeType?.charAt(0).toUpperCase()}${nodeType?.slice(1)} Workspace`,
          description: `A workspace for ${nodeType} ${mapNodeId}`,
          type: nodeType === 'team' ? 'team' : nodeType === 'project' ? 'project' : 'personal',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'current-user',
          ownerId: mapNodeId || '',
          members: [],
          settings: {
            isPublic: true,
            allowGuests: false,
            notificationsEnabled: true
          },
          customization: {
            theme: 'light',
            layout: 'default',
            widgets: []
          },
          isArchived: false
        }
      ];
      
      setAssociatedWorkspaces(mockWorkspaces);
      setIsLoading(false);
    }, 500);
  }, [mapNodeId, nodeType]);
  
  // When a workspace is directly selected, highlight its corresponding map node
  useEffect(() => {
    if (!workspaceId) return;
    
    // This would trigger an event or state change to highlight the corresponding
    // node on the map in a real implementation
    console.log(`Highlighting map node associated with workspace ${workspaceId}`);
    
    // For demonstration purposes - determine the node type and ID from the workspace
    const nodeTypeFromWorkspace = workspaceId.includes('team') 
      ? 'team' 
      : workspaceId.includes('project')
        ? 'project'
        : workspaceId.includes('user')
          ? 'user'
          : 'unknown';
          
    console.log(`Node type: ${nodeTypeFromWorkspace}`);
  }, [workspaceId]);
  
  // Handle workspace selection
  const handleSelectWorkspace = (workspace: Workspace) => {
    if (onWorkspaceSelect) {
      onWorkspaceSelect(workspace.id);
    }
  };
  
  // Handle creating a new workspace for the selected map node
  const handleCreateWorkspace = () => {
    // This would show a modal or navigate to a workspace creation form
    // with the map node pre-selected in a real implementation
    console.log(`Creating new workspace for ${nodeType} ${mapNodeId}`);
  };
  
  return (
    <div className="map-workspace-integration">
      {mapNodeId && (
        <div className="map-node-workspaces">
          <h3>Workspaces for {nodeType} {mapNodeId}</h3>
          
          {isLoading ? (
            <div className="loading-indicator">Loading workspaces...</div>
          ) : (
            <>
              {associatedWorkspaces.length > 0 ? (
                <ul className="workspace-list">
                  {associatedWorkspaces.map(workspace => (
                    <li 
                      key={workspace.id} 
                      className="workspace-item"
                      onClick={() => handleSelectWorkspace(workspace)}
                    >
                      <span className="workspace-name">{workspace.name}</span>
                      <span className="workspace-type">{workspace.type}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-workspaces">
                  No workspaces associated with this {nodeType}.
                </p>
              )}
              
              <button 
                className="create-workspace-button"
                onClick={handleCreateWorkspace}
              >
                Create New Workspace
              </button>
            </>
          )}
        </div>
      )}
      
      {workspaceId && !mapNodeId && (
        <div className="workspace-map-hint">
          <p>
            Select an item on the map to see its relationship with this workspace.
          </p>
        </div>
      )}
    </div>
  );
};

export default MapWorkspaceIntegration;