/**
 * Test Data Generator for WebGL Map Benchmarking
 * 
 * This utility generates synthetic graph datasets of various sizes
 * for testing WebGL renderer performance.
 */

// Configuration
const NODE_TYPES = [
  { type: 'USER', weight: 5 },
  { type: 'TEAM', weight: 1 },
  { type: 'PROJECT', weight: 2 },
  { type: 'GOAL', weight: 1 },
  { type: 'TEAM_CLUSTER', weight: 0.5 },
];

const EDGE_TYPES = [
  { type: 'REPORTS_TO', weight: 2 },
  { type: 'MEMBER_OF', weight: 4 },
  { type: 'PARTICIPANT', weight: 3 },
  { type: 'ALIGNED_TO', weight: 1 },
  { type: 'PARENT_OF', weight: 1 },
];

// Weighted random selection function
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.type;
    }
  }
  return items[0].type; // Fallback
}

/**
 * Generate a random graph dataset with specified properties
 * @param {Number} nodeCount - Number of nodes to generate
 * @param {Number} edgeFactor - Multiplier for edge count (edges = nodes * edgeFactor)
 * @param {Boolean} enforceConnected - Ensure the graph is connected
 * @returns {Object} The generated graph data
 */
function generateGraphData(nodeCount = 1000, edgeFactor = 2, enforceConnected = true) {
  console.log(`Generating graph with ${nodeCount} nodes and ~${nodeCount * edgeFactor} edges...`);
  
  // Generate nodes
  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    const type = weightedRandom(NODE_TYPES);
    const label = `${type}-${i.toString().padStart(5, '0')}`;
    
    const node = {
      id: `node-${i}`,
      type,
      label,
      data: {
        status: Math.random() > 0.7 ? 'active' : Math.random() > 0.5 ? 'pending' : 'completed',
        hasOverlaps: Math.random() > 0.8,
        dueDate: Math.random() > 0.7 ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
      }
    };
    
    nodes.push(node);
  }
  
  // Generate edges
  const edges = [];
  const edgeCount = Math.floor(nodeCount * edgeFactor);
  
  // If enforceConnected, first create a spanning tree
  if (enforceConnected) {
    // Start with node 0 as "visited"
    const visited = new Set([0]);
    const unvisited = new Set(Array.from({ length: nodeCount - 1 }, (_, i) => i + 1));
    
    // Connect each unvisited node to a visited one
    while (unvisited.size > 0) {
      const to = Array.from(unvisited)[Math.floor(Math.random() * unvisited.size)];
      const from = Array.from(visited)[Math.floor(Math.random() * visited.size)];
      
      const edgeType = weightedRandom(EDGE_TYPES);
      edges.push({
        id: `edge-${edges.length}`,
        source: `node-${from}`,
        target: `node-${to}`,
        type: edgeType,
        label: edgeType.replace(/_/g, ' '),
      });
      
      visited.add(to);
      unvisited.delete(to);
    }
  }
  
  // Add remaining random edges
  const remainingEdges = enforceConnected ? edgeCount - (nodeCount - 1) : edgeCount;
  for (let i = 0; i < remainingEdges; i++) {
    let source, target;
    do {
      source = Math.floor(Math.random() * nodeCount);
      target = Math.floor(Math.random() * nodeCount);
    } while (source === target); // Avoid self-loops
    
    const edgeType = weightedRandom(EDGE_TYPES);
    edges.push({
      id: `edge-${edges.length}`,
      source: `node-${source}`,
      target: `node-${target}`,
      type: edgeType,
      label: edgeType.replace(/_/g, ' '),
    });
  }
  
  return { nodes, edges };
}

/**
 * Save the generated data to a JSON file
 */
function saveToFile(data, filename) {
  const fs = require('fs');
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`Saved to ${filename}`);
}

// Generate datasets of different sizes
function generateAllDatasets() {
  const sizes = [
    { name: 'small', nodes: 1000, edgeFactor: 2 },
    { name: 'medium', nodes: 5000, edgeFactor: 2 },
    { name: 'large', nodes: 10000, edgeFactor: 1.5 },
    { name: 'extreme', nodes: 20000, edgeFactor: 1 }
  ];
  
  for (const size of sizes) {
    const data = generateGraphData(size.nodes, size.edgeFactor);
    saveToFile(data, `graph_data_${size.name}.json`);
  }
}

// If running directly
if (require.main === module) {
  generateAllDatasets();
}

module.exports = {
  generateGraphData,
  saveToFile,
  generateAllDatasets
}; 