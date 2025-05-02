import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { exportToCSV, exportToPDF } from './export';
import { GraphMetrics } from '../components/analytics/AnalyticsEngine';

// Mock dependencies
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockClickLink = vi.fn();

// Mock data
const mockGraphMetrics: GraphMetrics = {
  density: 0.45,
  modularity: 0.67,
  connectedness: 0.89,
  nodes: {
    'node1': {
      degreeCentrality: 0.75,
      betweennessCentrality: 0.55,
      closenessCentrality: 0.66,
      clusteringCoefficient: 0.42,
      eigenvectorCentrality: 0.81
    },
    'node2': {
      degreeCentrality: 0.45,
      betweennessCentrality: 0.35,
      closenessCentrality: 0.56,
      clusteringCoefficient: 0.22,
      eigenvectorCentrality: 0.61
    }
  },
  mostCentralNodes: ['node1', 'node2']
};

describe('export utilities', () => {
  beforeAll(() => {
    // Mock URL.createObjectURL
    URL.createObjectURL = mockCreateObjectURL;
    URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock document elements and methods
    document.createElement = vi.fn().mockImplementation((tag) => {
      if (tag === 'a') {
        return {
          setAttribute: vi.fn(),
          style: {},
          click: mockClickLink
        };
      }
      return {};
    });

    document.body.appendChild = mockAppendChild;
    document.body.removeChild = mockRemoveChild;

    // Spy on console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('mock-url');
    window.alert = vi.fn();
  });

  describe('exportToCSV', () => {
    it('should export data to CSV', () => {
      exportToCSV('test-export', mockGraphMetrics);

      // Check if Blob was created with correct content
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blobCall = mockCreateObjectURL.mock.calls[0][0];
      expect(blobCall instanceof Blob).toBeTruthy();
      
      // Check if link was created and clicked
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockClickLink).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      
      // Verify console logs
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('CSV export completed'));
    });

    it('should handle empty data gracefully', () => {
      exportToCSV('test-export', null);
      
      // Should log error and not proceed with export
      expect(console.error).toHaveBeenCalledWith('No data to export');
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockClickLink).not.toHaveBeenCalled();
    });

    it('should handle empty nodes object gracefully', () => {
      const emptyNodesData = { ...mockGraphMetrics, nodes: {} };
      exportToCSV('test-export', emptyNodesData);
      
      // Should log error about no metrics
      expect(console.error).toHaveBeenCalledWith('No node metrics to export');
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });
  });

  describe('exportToPDF', () => {
    it('should export data to JSON when PDF export is unavailable', async () => {
      await exportToPDF('insights-panel', mockGraphMetrics);

      // Check if Blob was created with JSON content
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const blobCall = mockCreateObjectURL.mock.calls[0][0];
      expect(blobCall instanceof Blob).toBeTruthy();
      
      // Verify the MIME type
      expect(blobCall.type).toBe('application/json');
      
      // Check if link was created and clicked
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockClickLink).toHaveBeenCalled();
      
      // Verify alert was shown
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('PDF export is currently unavailable'));
      
      // Verify console logs
      expect(console.log).toHaveBeenCalledWith('JSON export completed');
    });

    it('should handle empty data gracefully', async () => {
      await exportToPDF('insights-panel', null);
      
      // Should log error and not proceed with export
      expect(console.error).toHaveBeenCalledWith('No data to export');
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
      expect(mockClickLink).not.toHaveBeenCalled();
    });
  });
});