/**
 * HeatmapView.tsx
 * Visualizes heatmap data using D3
 */
import React, { useEffect, useRef } from 'react';
import { Box, Spinner } from '@chakra-ui/react';
import * as d3 from 'd3';

export interface HeatmapData {
  x: string;
  y: string;
  value: number;
}

interface HeatmapViewProps {
  data: HeatmapData[];
  width?: number;
  height?: number;
  colorRange?: [string, string];
  title?: string;
  isLoading?: boolean;
  margin?: { top: number; right: number; bottom: number; left: number };
}

/**
 * HeatmapView component that visualizes relationships between entities
 */
const HeatmapView: React.FC<HeatmapViewProps> = ({
  data,
  width = 600,
  height = 400,
  colorRange = ['#f7fbff', '#08306b'],
  title = 'Relationship Heatmap',
  isLoading = false,
  margin = { top: 40, right: 50, bottom: 100, left: 100 }
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0 || isLoading) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render
    
    try {
      // Extract unique x and y values
      const xValues = Array.from(new Set(data.map(d => d.x)));
      const yValues = Array.from(new Set(data.map(d => d.y)));
      
      // Set up scales
      const xScale = d3.scaleBand()
        .domain(xValues)
        .range([margin.left, width - margin.right])
        .padding(0.05);
        
      const yScale = d3.scaleBand()
        .domain(yValues)
        .range([margin.top, height - margin.bottom])
        .padding(0.05);
        
      // Color scale
      const colorScale = d3.scaleSequential()
        .interpolator(d3.interpolate(colorRange[0], colorRange[1]))
        .domain([0, d3.max(data, d => d.value) || 1]);
        
      // Create heatmap cells
      svg.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', d => xScale(d.x) as number)
        .attr('y', d => yScale(d.y) as number)
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', d => colorScale(d.value))
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .on('mouseover', function(event, d) {
          // Highlight the cell on hover
          d3.select(this)
            .attr('stroke', '#000')
            .attr('stroke-width', 2);
            
          // Add tooltip
          const tooltip = svg.append('g')
            .attr('class', 'tooltip')
            .attr('transform', `translate(${xScale(d.x)! + xScale.bandwidth() / 2}, ${yScale(d.y)! + yScale.bandwidth() / 2})`);
          
          tooltip.append('rect')
            .attr('width', 70)
            .attr('height', 30)
            .attr('x', -35)
            .attr('y', -15)
            .attr('fill', 'black')
            .attr('opacity', 0.8)
            .attr('rx', 5);
          
          tooltip.append('text')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'middle')
            .text(`${(d.value * 100).toFixed(0)}%`)
            .style('font-weight', 'bold')
            .style('font-size', '12px')
            .style('fill', 'white');
        })
        .on('mouseout', function() {
          d3.select(this)
            .attr('stroke', '#fff')
            .attr('stroke-width', 0.5);
          svg.selectAll('.tooltip').remove();
        });
        
      // Add x-axis
      svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom + 5})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('transform', 'translate(-10,0)rotate(-45)')
        .style('text-anchor', 'end')
        .style('font-size', '12px');
        
      // Add y-axis
      svg.append('g')
        .attr('transform', `translate(${margin.left - 5},0)`)
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .style('font-size', '12px');
        
      // Add title
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .text(title);
        
      // Add legend
      const legendWidth = 20;
      const legendHeight = 150;
      const legend = svg.append('g')
        .attr('transform', `translate(${width - margin.right + 30}, ${height / 2 - legendHeight / 2})`);
        
      // Gradient for legend
      const defs = svg.append('defs');
      const gradient = defs.append('linearGradient')
        .attr('id', 'heatmap-gradient')
        .attr('x1', '0%')
        .attr('y1', '100%')
        .attr('x2', '0%')
        .attr('y2', '0%');
        
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorRange[0]);
        
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorRange[1]);
        
      // Draw legend rectangle
      legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#heatmap-gradient)');
        
      // Legend labels
      const legendScale = d3.scaleLinear()
        .domain([0, 1])
        .range([legendHeight, 0]);
        
      const legendAxis = d3.axisRight(legendScale)
        .tickFormat(d => `${(d as number * 100).toFixed(0)}%`)
        .ticks(5);
        
      legend.append('g')
        .attr('transform', `translate(${legendWidth},0)`)
        .call(legendAxis)
        .selectAll('text')
        .style('font-size', '10px');
        
      // Legend title
      legend.append('text')
        .attr('x', legendWidth / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Strength');
      
    } catch (error) {
      console.error('Error rendering heatmap:', error);
      
      // Display error message
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .style('fill', 'red')
        .text('Error rendering heatmap');
    }
  }, [data, width, height, colorRange, title, margin, isLoading]);
  
  return (
    <Box width="100%" height="100%" position="relative">
      {isLoading && (
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="rgba(255, 255, 255, 0.7)"
          zIndex={1}
        >
          <Spinner size="xl" color="blue.500" />
        </Box>
      )}
      <svg ref={svgRef} width={width} height={height} />
    </Box>
  );
};

export default HeatmapView;