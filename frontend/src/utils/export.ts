/**
 * export.ts
 * Utilities for exporting analytics data to various formats
 */
import { GraphMetrics } from '../components/analytics/AnalyticsEngine';
import { MapNode } from '../types/map';

/**
 * Export graph metrics to CSV
 * @param filename Base filename for the CSV
 * @param data Graph metrics data to export
 */
export const exportToCSV = (filename: string, data: GraphMetrics | null): void => {
  if (!data || !data.nodes) {
    console.error("No data to export");
    return;
  }
  
  try {
    // Convert node metrics to CSV
    const nodeMetrics = data.nodes;
    const nodeIds = Object.keys(nodeMetrics);
    
    if (nodeIds.length === 0) {
      console.error("No node metrics to export");
      return;
    }
    
    // Create CSV headers
    const headers = ['Node ID', 'Degree Centrality', 'Betweenness Centrality', 'Closeness Centrality', 'Clustering Coefficient', 'Eigenvector Centrality'];
    
    // Create CSV rows
    const csvRows = [
      headers.join(','),
      ...nodeIds.map(id => {
        const metrics = nodeMetrics[id];
        return [
          id,
          (metrics?.degreeCentrality || 0).toFixed(4),
          (metrics?.betweennessCentrality || 0).toFixed(4),
          (metrics?.closenessCentrality || 0).toFixed(4),
          (metrics?.clusteringCoefficient || 0).toFixed(4),
          (metrics?.eigenvectorCentrality || 0).toFixed(4)
        ].join(',');
      })
    ];
    
    // Convert to CSV content
    const csvContent = csvRows.join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`CSV export completed: ${filename}`);
  } catch (error) {
    console.error("Error exporting to CSV:", error);
  }
};

/**
 * Export graph metrics to PDF
 * @param filename Base filename for the PDF
 * @param data Graph metrics data to export
 */
export const exportToPDF = async (
  elementId: string = 'insights-panel', 
  data: GraphMetrics | null
): Promise<void> => {
  if (!data) {
    console.error("No data to export");
    return;
  }
  
  // Temporary solution - export as JSON instead
  try {
    console.log("PDF export not available - exporting as JSON instead");
    
    // Create a formatted JSON string
    const metricsJson = JSON.stringify(data, null, 2);
    
    // Create a blob with the JSON data
    const blob = new Blob([metricsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `map-analytics-${Date.now()}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("JSON export completed");
    
    alert("PDF export is currently unavailable. Your data has been exported as JSON instead. To enable PDF export, please install the jspdf and html2canvas packages.");
    
    /* ORIGINAL PDF EXPORT CODE - COMMENTED OUT UNTIL DEPENDENCIES ARE INSTALLED
    try {
      console.log("Attempting to import PDF libraries");
      
      // Try to handle case where libraries might not be installed yet
      let jsPDF;
      let html2canvas;
      
      try {
        const jspdfModule = await import('jspdf');
        jsPDF = jspdfModule.jsPDF;
        html2canvas = await import('html2canvas');
      } catch (importError) {
        console.error("Failed to import PDF generation libraries:", importError);
        alert("PDF export functionality requires additional libraries. Please add jspdf and html2canvas to package.json and run npm install.");
        return;
      }
      
      // Get the element to capture
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Element with ID '${elementId}' not found`);
        return;
      }
      
      console.log("Generating PDF from element:", elementId);
      
      // Convert the element to canvas
      const canvas = await html2canvas.default(element);
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title
      pdf.setFontSize(20);
      pdf.text('Map Analytics Report', 20, 20);
      
      // Add timestamp
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
      
      // Add graph image
      const imgProps = pdf.getImageProperties(imgData);
      const width = pdf.internal.pageSize.getWidth() - 40;
      const height = (imgProps.height * width) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 20, 40, width, Math.min(height, 150));
      
      // Add metrics data
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Network Metrics Summary', 20, 20);
      
      // Add key metrics
      pdf.setFontSize(12);
      pdf.text(`Network Density: ${(data.density * 100).toFixed(2)}%`, 20, 40);
      pdf.text(`Network Modularity: ${(data.modularity * 100).toFixed(2)}%`, 20, 50);
      pdf.text(`Network Connectedness: ${(data.connectedness * 100).toFixed(2)}%`, 20, 60);
      
      // Add top nodes table
      pdf.setFontSize(14);
      pdf.text('Top Central Nodes', 20, 80);
      
      // Extract top node information if available
      if (data.mostCentralNodes && data.mostCentralNodes.length > 0) {
        pdf.setFontSize(10);
        data.mostCentralNodes.forEach((nodeId, index) => {
          const metrics = data.nodes[nodeId];
          if (metrics) {
            pdf.text(`${index + 1}. ${nodeId} - Betweenness: ${(metrics.betweennessCentrality * 100).toFixed(2)}%`, 25, 95 + (index * 8));
          }
        });
      }
      
      // Save the PDF
      pdf.save(`map-analytics-${Date.now()}.pdf`);
      console.log("PDF export completed");
    */
  } catch (error) {
    console.error("Error exporting data:", error);
  }
};