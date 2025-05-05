/**
 * layout-worker.ts
 * Web Worker for performing graph layout calculations
 * This isolates CPU-intensive graph layout from the main UI thread
 */

// Import force-directed layout algorithm
import forceAtlas2 from 'graphology-layout-forceatlas2';
// Import Graph for serialization functionality
import Graph from 'graphology';

// Listen for messages from the main thread
self.onmessage = (event: MessageEvent) => {
  const { graphData, options } = event.data;
  
  try {
    // Deserialize graph data
    const graph = Graph.from(graphData);
    
    // Set default options with improved spacing parameters
    const layoutOptions = {
      iterations: options?.iterations || 200,
      settings: options?.settings || {
        slowDown: 8,  // Increased to slow down node movements
        gravity: 0.8, // Reduced gravity to prevent excessive clustering
        strongGravityMode: false, // Disable strong gravity which can cause clumping
        barnesHutOptimize: true,
        linLogMode: false, // Disabled for more uniform spacing
        outboundAttractionDistribution: true,
        adjustSizes: true,
        scalingRatio: 3.0, // Increased to create more space between nodes
        edgeWeightInfluence: 1.0, // Consider edge weights for better structure
        preventOverlap: true, // Prevent nodes from overlapping
      }
    };
    
    // Execute layout algorithm
    console.time('Worker: ForceAtlas2 Layout');
    forceAtlas2.assign(graph, layoutOptions);
    console.timeEnd('Worker: ForceAtlas2 Layout');
    
    // Serialize the positioned graph and return to main thread
    const serializedResult = graph.export();
    self.postMessage({
      type: 'SUCCESS',
      result: serializedResult
    });
  } catch (error) {
    // Report errors back to main thread
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Let TypeScript know this is a worker file
export default {} as typeof Worker & { new(): Worker };