import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MapDataProvider } from '../providers/MapDataProvider';
import { MapViewportProvider } from '../providers/MapViewport';
import SigmaGraph from '../graph/EnhancedSigmaGraph';
import { MapNodeTypeEnum } from '../../../types/map';
import NodeWithNotifications from '../notifications/NodeWithNotifications';
import NotificationMapFilter from '../notifications/NotificationMapFilter';
import NotificationMapIndicator from '../notifications/NotificationMapIndicator';

// Mock Sigma modules
jest.mock('@react-sigma/core', () => ({
  SigmaContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sigma-container">{children}</div>
  ),
  useLoadGraph: () => jest.fn(),
  useSigma: () => ({
    getGraph: () => ({
      nodes: () => ['node1', 'node2'],
      edges: () => ['edge1', 'edge2'],
      getNodeAttribute: () => ({}),
      extremities: () => ['node1', 'node2'],
    }),
    getCamera: () => ({
      getState: () => ({ x: 0, y: 0, ratio: 1 }),
      setState: jest.fn(),
    }),
    graphToViewport: () => ({ x: 100, y: 100 }),
    setSetting: jest.fn(),
  }),
  useRegisterEvents: () => jest.fn(() => jest.fn()),
}));

// Mock API client
jest.mock('../../../hooks/useApiClient', () => ({
  useApiClient: () => ({
    get: jest.fn().mockResolvedValue({
      data: {
        nodes: [
          {
            id: 'node1',
            label: 'User 1',
            type: 'user',
            position: { x: 100, y: 100 },
          },
          {
            id: 'node2',
            label: 'Team 1',
            type: 'team',
            position: { x: 200, y: 200 },
          },
        ],
        edges: [
          {
            source: 'node1',
            target: 'node2',
            type: 'MEMBER_OF',
          },
        ],
      },
    }),
  }),
}));

// Mock layout worker
jest.mock('../../../hooks/useLayoutWorker', () => ({
  useLayoutWorker: () => ({
    processMapData: jest.fn((data) => Promise.resolve(data)),
  }),
}));

// Mock performance utils
jest.mock('../../../utils/performance', () => ({
  perfume: {
    start: jest.fn(),
    end: jest.fn(),
  },
  measureAsync: jest.fn((label, fn) => fn()),
  useComponentPerformance: () => ({
    start: jest.fn(),
    end: jest.fn(),
  }),
}));

// Mock useNotificationFilter hook
jest.mock('../../../hooks/useNotificationFilter', () => ({
  useNotificationFilter: () => ({
    visibleEntities: new Set(['node1']),
    toggleEntityVisibility: jest.fn(),
    isFilterActive: true,
    setFilterActive: jest.fn(),
    resetFilter: jest.fn(),
  }),
}));

// Mock useNotifications hook
jest.mock('../../../hooks/useNotifications', () => ({
  __esModule: true,
  default: () => ({
    notifications: [
      { id: 'notif1', entity_id: 'node1', entity_type: 'user', read_at: null },
      { id: 'notif2', entity_id: 'node2', entity_type: 'team', read_at: null },
    ],
    unreadCount: 2,
  }),
}));

describe('Map Components Tests', () => {
  // Set up common mocks
  const mockNodeClick = jest.fn();
  const mockNodeHover = jest.fn();
  const mockStageClick = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SigmaGraph', () => {
    test('renders within context providers', () => {
      render(
        <MapDataProvider>
          <MapViewportProvider>
            <SigmaGraph
              onNodeClick={mockNodeClick}
              onNodeHover={mockNodeHover}
              onStageClick={mockStageClick}
            />
          </MapViewportProvider>
        </MapDataProvider>
      );
      
      expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
    });
    
    test('renders with analytics enabled', () => {
      render(
        <MapDataProvider>
          <MapViewportProvider>
            <SigmaGraph
              onNodeClick={mockNodeClick}
              onNodeHover={mockNodeHover}
              onStageClick={mockStageClick}
              analyticsEnabled={true}
            />
          </MapViewportProvider>
        </MapDataProvider>
      );
      
      expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
    });
    
    test('renders with custom renderers', () => {
      const customNodeRenderer = () => true;
      const customEdgeRenderer = () => true;
      
      render(
        <MapDataProvider>
          <MapViewportProvider>
            <SigmaGraph
              onNodeClick={mockNodeClick}
              onNodeHover={mockNodeHover}
              onStageClick={mockStageClick}
              customNodeRenderer={customNodeRenderer}
              customEdgeRenderer={customEdgeRenderer}
            />
          </MapViewportProvider>
        </MapDataProvider>
      );
      
      expect(screen.getByTestId('sigma-container')).toBeInTheDocument();
    });
  });

  describe('NotificationMapFilter', () => {
    test('renders filter toggle button', () => {
      render(<NotificationMapFilter />);
      expect(screen.getByText(/Filter by/i)).toBeInTheDocument();
    });

    test('shows notification counts', () => {
      render(<NotificationMapFilter />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('NotificationMapIndicator', () => {
    test('renders the notification indicator', () => {
      render(<NotificationMapIndicator count={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    test('applies active style when isActive is true', () => {
      render(<NotificationMapIndicator count={5} isActive={true} />);
      const indicator = screen.getByText('5').parentElement;
      expect(indicator).toHaveStyle('background-color: var(--chakra-colors-blue-500)');
    });
  });

  describe('NodeWithNotifications', () => {
    const mockNode = {
      id: 'node1',
      label: 'Test Node',
      type: MapNodeTypeEnum.USER,
    };

    test('renders node with notification badge', () => {
      render(
        <svg>
          <NodeWithNotifications
            node={mockNode}
            x={100}
            y={100}
            size={20}
            color="#000"
          />
        </svg>
      );
      
      // Check that node and badge are rendered
      expect(document.querySelector('circle')).toBeInTheDocument();
    });
  });
});