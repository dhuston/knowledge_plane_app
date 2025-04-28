import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ForceGraph2D } from 'react-force-graph'; 

// Type colors (same as before)
const typeColors = {
  USER: '#3182bd',
  TEAM: '#6baed6',
  PROJECT: '#fd8d3c',
  GOAL: '#74c476',
  TEAM_CLUSTER: '#9e9ac8'
};

// FPS counter (same as before)
let frameCount = 0;
let lastTime = performance.now();
let fps = 0;

function updateFPS() {
  const now = performance.now();
  const delta = now - lastTime;
  
  if (delta > 1000) {
    fps = Math.round((frameCount * 1000) / delta);
    frameCount = 0;
    lastTime = now;
    
    const fpsEl = document.getElementById('fps');
    if (fpsEl) fpsEl.textContent = fps;
    
    // Update memory usage if available
    if (window.performance && window.performance.memory) {
      const memory = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024));
      const memoryEl = document.getElementById('memory');
      if (memoryEl) memoryEl.textContent = memory;
    }
  }
  
  frameCount++;
  requestAnimationFrame(updateFPS);
}

// Start FPS counter
updateFPS();

// React component
function ForceGraphBenchmark() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [datasetName, setDatasetName] = useState('small'); 
  const fgRef = useRef();

  const datasetFiles = {
    small: '../graph_data_small.json',
    medium: '../graph_data_medium.json',
    large: '../graph_data_large.json',
    extreme: '../graph_data_extreme.json',
  };

  async function loadDataset() {
    if (!datasetFiles[datasetName]) return;

    setIsLoading(true);
    const nodeCountEl = document.getElementById('nodeCount');
    const edgeCountEl = document.getElementById('edgeCount');
    const renderTimeEl = document.getElementById('renderTime');
    if (nodeCountEl) nodeCountEl.textContent = '...';
    if (edgeCountEl) edgeCountEl.textContent = '...';
    
    const startTime = performance.now();
    
    try {
      const response = await fetch(datasetFiles[datasetName]);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Convert to force-graph format
      const loadedGraphData = {
        nodes: data.nodes.map(node => ({
          id: node.id,
          label: node.label,
          type: node.type,
          color: typeColors[node.type] || '#999',
          data: node.data
        })),
        links: data.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type
        }))
      };
      
      const endTime = performance.now();
      if (renderTimeEl) renderTimeEl.textContent = Math.round(endTime - startTime);
      if (nodeCountEl) nodeCountEl.textContent = loadedGraphData.nodes.length;
      if (edgeCountEl) edgeCountEl.textContent = loadedGraphData.links.length;
      
      setGraphData(loadedGraphData);
      
      // Center the graph after data is loaded
      setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400); // Adjust duration as needed
        }
      }, 100); // Short delay to allow initial render
    } catch (error) {
      console.error('Error loading dataset:', error);
      alert(`Error loading dataset: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }
  
  // Effect to load data when datasetName changes
  useEffect(() => {
      // Optionally load the initial dataset on mount
      // loadDataset(); 
  }, []); // Load only on mount, or add datasetName dependency to reload on change


  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div id="controls">
        <div>
          <label htmlFor="dataset">Dataset:</label>
          <select id="dataset" value={datasetName} onChange={e => setDatasetName(e.target.value)}>
            <option value="small">Small (1K nodes)</option>
            <option value="medium">Medium (5K nodes)</option>
            <option value="large">Large (10K nodes)</option>
            <option value="extreme">Extreme (20K nodes)</option>
          </select>
        </div>
        <div>
          <button id="load" onClick={loadDataset} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load Dataset'}
          </button>
        </div>
      </div>
      <div id="stats">
        <div>FPS: <span id="fps">0</span></div>
        <div>Nodes: <span id="nodeCount">0</span></div>
        <div>Edges: <span id="edgeCount">0</span></div>
        <div>Load Time: <span id="renderTime">0</span> ms</div> 
        <div>Memory: <span id="memory">0</span> MB</div>
      </div>

      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeId="id"
        nodeLabel="label"
        nodeColor={node => node.color}
        nodeRelSize={6}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.label;
          const fontSize = 12 / globalScale;
          ctx.fillStyle = node.color || '#999'; // Add default color
          ctx.beginPath();
          // Ensure node.x and node.y are defined before drawing
          if (typeof node.x === 'number' && typeof node.y === 'number') {
              ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
              ctx.fill();
          }
          
          // Only draw label if we're zoomed in enough
          if (globalScale > 1.5 && label && typeof node.x === 'number' && typeof node.y === 'number') {
            ctx.font = `${fontSize}px Sans-Serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff'; // Consider contrast
            ctx.fillText(label, node.x, node.y);
          }
        }}
        // Let ForceGraph handle width/height based on container
      />
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container); 
root.render(<ForceGraphBenchmark />); 