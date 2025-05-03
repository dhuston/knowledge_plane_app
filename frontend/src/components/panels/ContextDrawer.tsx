/**
 * ContextDrawer.tsx
 * A drawer-based implementation of the context panel that slides out from the right
 * Uses NodeSelectionContext for consistent node selection behavior
 */
import React from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  useColorModeValue
} from '@chakra-ui/react';
import ContextPanel from './ContextPanel';
import { useNodeSelection } from '../../context/NodeSelectionContext';
import { MapNodeTypeEnum } from '../../types/map';

// Only accept additional props, core functionality comes from context
interface ContextDrawerProps {
  projectOverlaps?: Record<string, string[]>;
  getProjectNameById?: (id: string) => string | undefined;
}

const ContextDrawer: React.FC<ContextDrawerProps> = ({
  projectOverlaps = {},
  getProjectNameById
}) => {
  const { 
  selectedNode, 
  isDrawerOpen, 
  closeDrawer, 
  selectNode, 
  getRelatedNode,
  storeRelatedNode
} = useNodeSelection();
  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <Drawer
      isOpen={isDrawerOpen}
      placement="right"
      onClose={closeDrawer}
      size="md"
      blockScrollOnMount={false}
    >
      <DrawerOverlay />
      <DrawerContent 
        marginTop="64px" // Adjust this value based on your header height
        height="calc(100vh - 64px)" // Adjust based on header height
        backgroundColor={bgColor}
        boxShadow="lg"
        borderTopLeftRadius="md"
      >
        <DrawerCloseButton position="absolute" top="12px" right="12px" zIndex={10} />
        <DrawerBody padding={0}>  
          {selectedNode && (
            <ContextPanel 
              selectedNode={selectedNode}
              onClose={closeDrawer}
              projectOverlaps={projectOverlaps}
              getProjectNameById={getProjectNameById}
              // Pass the selectNode function from context
              // This ensures consistent behavior across the app
              onNodeClick={(nodeId) => {
                if (!nodeId) {
                  // Handle null case (deselection)
                  selectNode(null);
                  return;
                }
                
                // Use the improved node selection system
                // First check if it's already in our cache
                const cachedNode = getRelatedNode(nodeId);
                
                if (cachedNode) {
                  // We found it in the cache, use it directly
                  selectNode(cachedNode);
                } else if (selectedNode?.data?.relationships) {
                  // Try to find in relationships
                  const relatedNodes = selectedNode.data.relationships
                    .filter(rel => rel.targetId === nodeId || rel.sourceId === nodeId)
                    .map(rel => rel.targetId === nodeId ? rel.target : rel.source)
                    .filter(Boolean);
                    
                  if (relatedNodes.length > 0) {
                    const relatedNode = relatedNodes[0];
                    // Cache it for future use
                    storeRelatedNode(relatedNode);
                    // Select it
                    selectNode(relatedNode);
                  } else {
                    // Create a minimal placeholder
                    const placeholderNode = {
                      id: nodeId,
                      label: `Node ${nodeId}`,
                      type: selectedNode.type,
                      data: {}
                    };
                    selectNode(placeholderNode);
                  }
                } else {
                  // No relationship data available, create a placeholder
                  // Use the selected node's type if available, otherwise use a safe default
                  // This prevents security issues with defaulting to 'user' type without validation
                  const nodeType = selectedNode?.type || MapNodeTypeEnum.UNKNOWN;
                  const placeholderNode = {
                    id: nodeId,
                    label: `Node ${nodeId}`,
                    type: nodeType,
                    data: {
                      isPlaceholder: true // Flag to indicate this is a placeholder with limited permissions
                    }
                  };
                  selectNode(placeholderNode);
                }
              }}
            />
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default ContextDrawer;