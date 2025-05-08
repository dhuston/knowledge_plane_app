/**
 * Hook to provide a mock layout worker for map operations
 */

import { useCallback } from 'react';

export type LayoutWorkerProps = {
  nodes: any[];
  edges: any[];
  options?: {
    algorithm: string;
    iterations?: number;
    gravity?: number;
    repulsion?: number;
    attraction?: number;
    center?: string;
  };
};

export function useLayoutWorker() {
  // Create a mock layout worker that doesn't do any actual computation
  // Just passes back the same nodes with default positions if none exist
  const calculateLayout = useCallback((props: LayoutWorkerProps) => {
    const { nodes, edges, options } = props;
    
    return new Promise<any[]>((resolve) => {
      // Add mock positions for nodes that don't have positions
      const processedNodes = nodes.map(node => {
        if (node.x === undefined || node.y === undefined) {
          // Generate a random position in a grid-like layout
          return {
            ...node,
            x: Math.random() * 10,
            y: Math.random() * 10
          };
        }
        return node;
      });
      
      // Return processed nodes
      setTimeout(() => {
        resolve(processedNodes);
      }, 10);
    });
  }, []);
  
  return { calculateLayout };
}