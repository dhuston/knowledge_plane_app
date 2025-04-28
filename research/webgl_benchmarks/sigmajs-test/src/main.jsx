import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { SigmaContainer, ControlsContainer, ZoomControl, FullScreenControl, useSigma } from "@react-sigma/core";
import { useLayoutForceAtlas2 } from "@react-sigma/layout-forceatlas2";
import Graph from 'graphology';

import "@react-sigma/core/lib/react-sigma.min.css";

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
  // Sigma.js uses its own animation loop, so we hook into requestAnimationFrame separately
  requestAnimationFrame(updateFPS);
}

// Start FPS counter
updateFPS();

// Separate component to manage graph instance and layout
const GraphController = ({ graphInstance }) => {
  const sigma = useSigma();
  // The hook itself manages starting/stopping based on component lifecycle/graph changes
  useLayoutForceAtlas2({ settings: { slowDown: 10 } });

  useEffect(() => {
    if (graphInstance && sigma) {
      console.log("Loading graph into Sigma instance");
      // Simply load the graph; the layout hook will apply automatically
      sigma.setGraph(graphInstance); 
      // No need to manually call start() or stop() here
    } 
    // Dependencies only include graphInstance and sigma
  }, [graphInstance, sigma]); 

  return null;
};

function SigmaBenchmark() {
  const [datasetName, setDatasetName] = useState('small');
  const [isLoading, setIsLoading] = useState(false);
  const [graphInstance, setGraphInstance] = useState(null); // Store graphology instance
  const [stats, setStats] = useState({ nodes: 0, edges: 0, loadTime: 0 });

  const datasetFiles = {
    small: '/graph_data_small.json',
    medium: '/graph_data_medium.json',
    large: '/graph_data_large.json',
    extreme: '/graph_data_extreme.json',
  };

  // Function to load and process data
  const handleLoadClick = useCallback(async () => {
    const datasetFile = datasetFiles[datasetName];
    if (!datasetFile || isLoading) return;

    console.log(`Load triggered for: ${datasetFile}`);
    setIsLoading(true);
    setGraphInstance(null); // Clear previous graph
    document.getElementById('nodeCount').textContent = '...';
    document.getElementById('edgeCount').textContent = '...';
    document.getElementById('renderTime').textContent = '...';
    
    const startTime = performance.now();

    try {
      console.log(`Fetching: ${datasetFile}`);
      const response = await fetch(datasetFile);
      console.log(`Fetch response status for ${datasetFile}: ${response.status}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
      }
      const data = await response.json();

      console.log(`Data loaded for ${datasetFile}, creating graph...`);
      const graph = new Graph({ multi: true, type: 'directed' }); 
      
      data.nodes.forEach(node => {
        graph.addNode(node.id, { 
          label: node.label, 
          size: 10, 
          color: typeColors[node.type] || '#999',
          x: Math.random() * 1000, 
          y: Math.random() * 1000, 
          originalData: node 
        });
      });
      
      let edgeCount = 0;
      data.edges.forEach(edge => {
        if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
            graph.addEdgeWithKey(edge.id, edge.source, edge.target, { 
              type: 'arrow',
              size: 1,
              color: '#ccc'
            });
            edgeCount++;
        } else {
          console.warn(`Skipping edge ${edge.id} (${edge.source} -> ${edge.target}): node(s) not found.`);
        }
      });

      console.log(`Graph created for ${datasetFile}`);
      const endTime = performance.now();
      const newLoadTime = Math.round(endTime - startTime);
      
      // Update stats display immediately
      document.getElementById('nodeCount').textContent = graph.order;
      document.getElementById('edgeCount').textContent = edgeCount;
      document.getElementById('renderTime').textContent = newLoadTime;
      
      // Set the new graph instance for the controller
      setGraphInstance(graph);
      setStats({ nodes: graph.order, edges: edgeCount, loadTime: newLoadTime });
      console.log(`Finished processing ${datasetFile}`);

    } catch (error) {
      console.error(`Error processing dataset ${datasetFile}:`, error);
      alert(`Error loading dataset: ${error.message}`);
      setStats({ nodes: 0, edges: 0, loadTime: 0 });
      document.getElementById('nodeCount').textContent = 0;
      document.getElementById('edgeCount').textContent = 0;
      document.getElementById('renderTime').textContent = 0;
    } finally {
      setIsLoading(false); 
    }
  }, [datasetName, isLoading]); // Dependency array

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div id="controls">
        <div>
          <label htmlFor="dataset">Dataset:</label>
          <select id="dataset" value={datasetName} onChange={e => setDatasetName(e.target.value)} disabled={isLoading}>
            <option value="small">Small (1K nodes)</option>
            <option value="medium">Medium (5K nodes)</option>
            <option value="large">Large (10K nodes)</option>
            <option value="extreme">Extreme (20K nodes)</option>
          </select>
        </div>
        <div>
          <button id="load" onClick={handleLoadClick} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load Dataset'}
          </button>
        </div>
      </div>
      <div id="stats">
        <div>FPS: <span id="fps">0</span></div>
        <div>Nodes: <span id="nodeCount">{stats.nodes}</span></div>
        <div>Edges: <span id="edgeCount">{stats.edges}</span></div>
        <div>Load Time: <span id="renderTime">{stats.loadTime}</span> ms</div>
        <div>Memory: <span id="memory">0</span> MB</div>
      </div>

      <SigmaContainer style={{ width: "100%", height: "100%" }} settings={{ allowInvalidContainer: true, defaultNodeColor: "#999" }}>
        {/* Pass the graph instance to the controller */} 
        <GraphController graphInstance={graphInstance} /> 

        {isLoading && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10 }}>
                Loading graph data...
            </div>
        )}
        <ControlsContainer position={"bottom-right"}>
            <ZoomControl />
            <FullScreenControl />
        </ControlsContainer>
      </SigmaContainer>
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<SigmaBenchmark />); 