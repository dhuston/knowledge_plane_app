/**
 * useLayoutWorker.ts
 * Custom hook for graph layout computation in a web worker
 */
import { useState, useEffect, useCallback } from 'react';
import Graph from 'graphology';
// The functions for serialization are built into graphology since v0.23+
import type { SerializedGraph } from 'graphology/dist/types';

// Import the worker
// @ts-ignore: Vite handles this with its worker plugin
import LayoutWorker from '../workers/layout-worker?worker';

interface LayoutOptions {
  iterations?: number;
  settings?: {
    slowDown?: number;
    gravity?: number;
    barnesHutOptimize?: boolean;
    linLogMode?: boolean;
    outboundAttractionDistribution?: boolean;
    adjustSizes?: boolean;
    [key: string]: any;
  };
}

interface UseLayoutWorkerReturn {
  computeLayout: (graph: Graph, options?: LayoutOptions) => Promise<Graph>;
  isComputing: boolean;
  error: Error | null;
}

/**
 * Hook to offload graph layout calculations to a web worker
 */
export const useLayoutWorker = (): UseLayoutWorkerReturn => {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize worker with error handling
  useEffect(() => {
    try {
      // Create worker instance
      const layoutWorker = new LayoutWorker();
      setWorker(layoutWorker);

      // Clean up function
      return () => {
        layoutWorker.terminate();
      };
    } catch (err) {
      console.error("Failed to initialize layout worker:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      // Leave worker as null, computeLayout will use fallback
    }
  }, []);

  // Function to compute layout in the worker
  const computeLayout = useCallback(
    (graph: Graph, options?: LayoutOptions): Promise<Graph> => {
      return new Promise((resolve, reject) => {
        if (!worker) {
          reject(new Error('Worker not initialized'));
          return;
        }

        setIsComputing(true);
        setError(null);

        // Check graph size to decide whether to use worker
        const nodeCount = graph.order;
        
        // For small graphs (< 100 nodes), compute directly instead of using worker
        if (nodeCount < 100) {
          try {
            const forceAtlas2 = require('graphology-layout-forceatlas2').default;
            
            forceAtlas2.assign(graph, {
              iterations: options?.iterations || 150,
              settings: options?.settings || {
                slowDown: 5,
                gravity: 1.5,
                barnesHutOptimize: true,
                linLogMode: true,
                outboundAttractionDistribution: true,
                adjustSizes: true,
              }
            });
            
            setIsComputing(false);
            resolve(graph);
            return;
          } catch (err) {
            setIsComputing(false);
            setError(err instanceof Error ? err : new Error(String(err)));
            reject(err);
            return;
          }
        }

        // Set up message handler for worker response
        const handleMessage = (event: MessageEvent) => {
          const { type, result, error } = event.data;

          if (type === 'SUCCESS') {
            // Update graph with positioned nodes
            const newGraph = Graph.from(result); // Using native graphology import
            
            // Copy positions back to original graph
            newGraph.forEachNode((node: string, attributes: any) => {
              if (graph.hasNode(node)) {
                graph.setNodeAttribute(node, 'x', attributes.x);
                graph.setNodeAttribute(node, 'y', attributes.y);
              }
            });

            setIsComputing(false);
            worker.removeEventListener('message', handleMessage);
            resolve(graph);
          } else if (type === 'ERROR') {
            setIsComputing(false);
            const err = new Error(error);
            setError(err);
            worker.removeEventListener('message', handleMessage);
            reject(err);
          }
        };

        worker.addEventListener('message', handleMessage);

        // Send graph to worker
        try {
          const serializedGraph = graph.export(); // Using native graphology serialization
          worker.postMessage({ graphData: serializedGraph, options });
        } catch (err) {
          setIsComputing(false);
          setError(err instanceof Error ? err : new Error(String(err)));
          worker.removeEventListener('message', handleMessage);
          reject(err);
        }
      });
    },
    [worker]
  );

  return { computeLayout, isComputing, error };
};

export default useLayoutWorker;