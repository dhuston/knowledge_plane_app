import React, { createContext, useState, useContext, useCallback, ReactNode, useRef } from 'react';
import { MapNode, MapNodeTypeEnum } from '../types/map';

interface NodeSelectionContextType {
  selectedNode: MapNode | null;
  isDrawerOpen: boolean;
  selectNode: (node: MapNode | null) => void;
  closeDrawer: () => void;
  openDrawer: () => void;
  // New APIs for robust node tracking
  getRelatedNode: (nodeId: string) => MapNode | null;
  storeRelatedNode: (node: MapNode) => void;
}

const NodeSelectionContext = createContext<NodeSelectionContextType | null>(null);

export const NodeSelectionProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // Main selection state
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  
  // Cache of nodes we've seen or related nodes
  const nodeCache = useRef<Map<string, MapNode>>(new Map());
  
  // Centralized node selection function with caching
  const selectNode = useCallback((node: MapNode | null) => {
    // Store node in cache if it exists
    if (node) {
      nodeCache.current.set(node.id, node);
      
      // Store related nodes too if they exist
      if (node.data && node.data.relationships) {
        for (const rel of node.data.relationships) {
          if (rel.source && rel.source.id) {
            nodeCache.current.set(rel.source.id, rel.source);
          }
          if (rel.target && rel.target.id) {
            nodeCache.current.set(rel.target.id, rel.target);
          }
        }
      }
    }
    
    setSelectedNode(node);
    if (node) {
      setIsDrawerOpen(true);
    }
  }, []);
  
  // Get a related node from cache if available
  const getRelatedNode = useCallback((nodeId: string): MapNode | null => {
    if (nodeCache.current.has(nodeId)) {
      return nodeCache.current.get(nodeId) || null;
    }
    
    // If not in cache, look through relationships of selected node
    if (selectedNode && selectedNode.data && selectedNode.data.relationships) {
      for (const rel of selectedNode.data.relationships) {
        if ((rel.source && rel.source.id === nodeId) || (rel.target && rel.target.id === nodeId)) {
          const relatedNode = rel.source.id === nodeId ? rel.source : rel.target;
          if (relatedNode) {
            // Cache it for future use
            nodeCache.current.set(nodeId, relatedNode);
            return relatedNode;
          }
        }
      }
    }
    
    return null;
  }, [selectedNode]);
  
  // Store a related node in cache
  const storeRelatedNode = useCallback((node: MapNode) => {
    if (node && node.id) {
      nodeCache.current.set(node.id, node);
    }
  }, []);

  // Standard drawer controls
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const openDrawer = useCallback(() => {
    if (selectedNode) {
      setIsDrawerOpen(true);
    }
  }, [selectedNode]);

  return (
    <NodeSelectionContext.Provider 
      value={{
        selectedNode,
        isDrawerOpen,
        selectNode,
        closeDrawer,
        openDrawer,
        getRelatedNode,
        storeRelatedNode
      }}
    >
      {children}
    </NodeSelectionContext.Provider>
  );
};

// Custom hook for consuming the context
export const useNodeSelection = (): NodeSelectionContextType => {
  const context = useContext(NodeSelectionContext);
  if (!context) {
    // Provide a fallback context instead of throwing an error
    // This is defensive programming to prevent crashes
    console.warn('useNodeSelection used outside NodeSelectionProvider - using fallback');
    
    // In-memory node cache for the fallback implementation
    const memoryCache = new Map<string, MapNode>();
    
    // Return a fallback implementation that does nothing but at least won't crash
    return {
      selectedNode: null,
      isDrawerOpen: false,
      selectNode: (node) => {
        console.warn('selectNode called outside provider');
        // Still cache nodes even in fallback mode
        if (node) memoryCache.set(node.id, node);
      },
      closeDrawer: () => console.warn('closeDrawer called outside provider'),
      openDrawer: () => console.warn('openDrawer called outside provider'),
      getRelatedNode: (nodeId) => {
        console.warn('getRelatedNode called outside provider');
        return memoryCache.get(nodeId) || null;
      },
      storeRelatedNode: (node) => {
        console.warn('storeRelatedNode called outside provider');
        if (node) memoryCache.set(node.id, node);
      }
    };
  }
  return context;
};