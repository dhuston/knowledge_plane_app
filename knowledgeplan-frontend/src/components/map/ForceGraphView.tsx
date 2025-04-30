/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useRef, useEffect, memo } from 'react';
// @ts-expect-error missing types for react-force-graph
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph';
import { MapData, MapNode } from '../../types/map';

interface ForceGraphViewProps {
  mapData: MapData;
  onNodeClick: (node: MapNode | null) => void;
}

const ForceGraphView: React.FC<ForceGraphViewProps> = ({ mapData, onNodeClick }) => {
  const fgRef = useRef<ForceGraphMethods>();

  // Convert MapData to force-graph format
  const graph = React.useMemo(() => {
    return {
      nodes: mapData.nodes.map((n) => ({ ...n })),
      links: mapData.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.type })),
    } as const;
  }, [mapData]);

  useEffect(() => {
    // Center / zoom to fit on load
    if (fgRef.current) {
      fgRef.current.zoomToFit(400);
    }
  }, [graph]);

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graph as any}
      nodeRelSize={6}
      onNodeClick={(node: any) => {
        onNodeClick(node as MapNode);
      }}
      nodeCanvasObject={(node: any, ctx, globalScale) => {
        const label = node.label || node.id;
        const fontSize = 12 / (globalScale * 0.8);
        ctx.font = `${fontSize}px Sans-Serif`;
        const bgSize = fontSize * 1.2; // background circle size

        // Draw node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, bgSize / 2, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#3182bd';
        ctx.fill();

        // Only draw label if zoomed in enough
        if (globalScale > 1.5) {
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, node.x, node.y);
        }
      }}
      linkDirectionalArrowLength={3}
      linkDirectionalArrowRelPos={1}
      linkCurvature={0.25}
      enableNodeDrag={false}
    />
  );
};

export default memo(ForceGraphView); 