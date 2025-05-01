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
    
    // Set default options
    const layoutOptions = {
      iterations: options?.iterations || 150,
      settings: options?.settings || {
        slowDown: 5,
        gravity: 1.5,
        barnesHutOptimize: true,
        linLogMode: true,
        outboundAttractionDistribution: true,
        adjustSizes: true,
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