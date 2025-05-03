/**
 * Unit tests for ContextPanel component
 */
import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContextPanel from '../ContextPanel';
import { ChakraProvider } from '@chakra-ui/react';
import { MapNodeTypeEnum } from '../../../types/map';
import * as useAPIClientModule from '../../../hooks/useApiClient';
import * as featureFlagsModule from '../../../utils/featureFlags';
import * as performanceUtils from '../../../utils/performance';

// Mock the API client hook
jest.mock('../../../hooks/useApiClient', () => ({
  __esModule: true,
  useApiClient: jest.fn()
}));

// Mock the feature flags hook
jest.mock('../../../utils/featureFlags', () => ({
  useFeatureFlags: jest.fn()
}));

// Mock performance utils
jest.mock('../../../utils/performance', () => {
  const actual = jest.requireActual('../../../utils/performance');
  return {
    ...actual,
    cacheEntity: jest.fn(),
    getCachedEntity: jest.fn(),
    useIsMounted: jest.fn().mockReturnValue(() => true),
    useDelayedExecution: jest.fn().mockReturnValue(true),
    useLazyLoad: jest.fn().mockReturnValue(true),
    areEqual: jest.fn()
  };
});

// Mock error handling utils
jest.mock('../../../utils/errorHandling', () => ({
  extractErrorMessage: jest.fn((err) => err.message || 'Unknown error'),
  logError: jest.fn(),
  createApiError: jest.fn()
}));

// Mock framer-motion to prevent console warnings in tests
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => (
        <div {...props} data-testid="motion-div">{children}</div>
      )
    },
    AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>
  };
});

// Mock child components
jest.mock('../entity-panels/UserPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="user-panel">User Panel</div>
}));

jest.mock('../entity-panels/TeamPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="team-panel">Team Panel</div>
}));

jest.mock('../entity-panels/ProjectPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="project-panel">Project Panel</div>
}));

jest.mock('../entity-panels/GoalPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="goal-panel">Goal Panel</div>
}));

jest.mock('../EntityDetails', () => ({
  __esModule: true,
  default: ({ data }: any) => (
    <div data-testid="entity-details">
      Entity Details: {data?.name || 'Unknown'}
    </div>
  )
}));

jest.mock('../RelationshipList', () => ({
  __esModule: true,
  default: ({ relationships, isLoading, entityType }: any) => (
    <div data-testid="relationship-list" data-entity-type={entityType}>
      {isLoading ? 'Loading relationships...' : `Relationships: ${relationships.length}`}
    </div>
  )
}));

jest.mock('../ActivityTimeline', () => ({
  __esModule: true,
  default: ({ activities, isLoading }: any) => (
    <div data-testid="activity-timeline">
      {isLoading ? 'Loading activities...' : `Activities: ${activities.length}`}
    </div>
  )
}));

jest.mock('../ActionButtons', () => ({
  __esModule: true,
  default: ({ entityType, entityId }: any) => (
    <div data-testid="action-buttons" data-entity-type={entityType} data-entity-id={entityId}>
      Action Buttons
    </div>
  )
}));

jest.mock('../header/PanelHeader', () => ({
  __esModule: true,
  default: ({ label, type, onClose }: any) => (
    <header data-testid="panel-header" data-node-type={type}>
      <h2>{label}</h2>
      <button onClick={onClose} aria-label="close">Close</button>
    </header>
  )
}));

jest.mock('../header/BreadcrumbNav', () => ({
  __esModule: true,
  default: ({ history, onNavigate }: any) => (
    <nav data-testid="breadcrumb-nav" data-history-length={history.length}>
      {history.map((item: any, index: number) => (
        <button key={index} onClick={() => onNavigate(item)} data-node-id={item.nodeId}>
          {item.label}
        </button>
      ))}
    </nav>
  )
}));

jest.mock('../tabs/PanelTabs', () => ({
  __esModule: true,
  default: ({ activeTab, onTabChange }: any) => (
    <div data-testid="panel-tabs" data-active-tab={activeTab}>
      <button 
        role="tab" 
        aria-selected={activeTab === 'details'} 
        onClick={() => onTabChange('details')}
      >
        Details
      </button>
      <button 
        role="tab" 
        aria-selected={activeTab === 'related'} 
        onClick={() => onTabChange('related')}
      >
        Relationships
      </button>
      <button 
        role="tab" 
        aria-selected={activeTab === 'activity'} 
        onClick={() => onTabChange('activity')}
      >
        Activity
      </button>
    </div>
  )
}));

jest.mock('../suggestions/EntitySuggestionsContainer', () => ({
  __esModule: true,
  default: ({ entityId, onSuggestionClick }: any) => (
    <div data-testid="entity-suggestions" data-entity-id={entityId}>
      <button onClick={() => onSuggestionClick('suggestion1', 'Suggestion 1')}>
        Suggestion 1
      </button>
    </div>
  )
}));

jest.mock('../common/LazyPanel', () => ({
  __esModule: true,
  default: ({ active, tabId, children, 'data-testid': testId }: any) => (
    <div data-testid={testId || `lazy-panel-${tabId}`} data-active={active}>
      {children}
    </div>
  )
}));

jest.mock('../common/AnimatedTransition', () => ({
  __esModule: true,
  default: ({ in: isIn, variant, children, transitionKey }: any) => (
    <div data-testid="animated-transition" data-in={isIn} data-variant={variant} data-key={transitionKey}>
      {children}
    </div>
  )
}));

// Mock data for testing
const mockUserNode = {
  id: 'user1',
  type: MapNodeTypeEnum.USER,
  label: 'John Smith',
  data: {
    name: 'John Smith',
    title: 'Software Engineer',
    avatar_url: 'https://example.com/avatar.jpg'
  }
};

const mockTeamNode = {
  id: 'team1',
  type: MapNodeTypeEnum.TEAM,
  label: 'Engineering Team',
  data: {
    name: 'Engineering Team'
  }
};

const mockProjectNode = {
  id: 'project1',
  type: MapNodeTypeEnum.PROJECT,
  label: 'Website Redesign',
  data: {
    name: 'Website Redesign',
    status: 'active'
  }
};

const mockGoalNode = {
  id: 'goal1',
  type: MapNodeTypeEnum.GOAL,
  label: 'Improve UX',
  data: {
    name: 'Improve UX',
    status: 'in_progress'
  }
};

const mockDepartmentNode = {
  id: 'dept1',
  type: MapNodeTypeEnum.DEPARTMENT,
  label: 'Engineering Department',
  data: {
    name: 'Engineering Department'
  }
};

const mockKnowledgeAssetNode = {
  id: 'ka1',
  type: MapNodeTypeEnum.KNOWLEDGE_ASSET,
  label: 'Technical Documentation',
  data: {
    name: 'Technical Documentation',
    type: 'document'
  }
};

// Mock API responses
const mockUserData = {
  id: 'user1',
  type: 'user',
  name: 'John Smith',
  title: 'Software Engineer',
  team_id: 'team1',
  skills: ['JavaScript', 'React'],
  email: 'john@example.com',
};

const mockTeamData = {
  id: 'team1',
  type: 'team',
  name: 'Engineering Team',
  department_id: 'dept1',
  members: ['user1', 'user2']
};

const mockProjectData = {
  id: 'project1',
  type: 'project',
  name: 'Website Redesign',
  status: 'active',
  team_id: 'team1',
  goals: ['goal1']
};

const mockGoalData = {
  id: 'goal1',
  type: 'goal',
  name: 'Improve UX',
  status: 'in_progress',
  projects: ['project1']
};

const mockDepartmentData = {
  id: 'dept1',
  type: 'department',
  name: 'Engineering Department',
  teams: ['team1']
};

const mockKnowledgeAssetData = {
  id: 'ka1',
  type: 'knowledge_asset',
  name: 'Technical Documentation',
  asset_type: 'document',
  author_id: 'user1'
};

const mockRelationships = [
  { id: 'rel1', type: 'MEMBER_OF', sourceId: 'user1', targetId: 'team1', source: mockUserNode, target: mockTeamNode },
  { id: 'rel2', type: 'PARTICIPATES_IN', sourceId: 'user1', targetId: 'project1', source: mockUserNode, target: mockProjectNode }
];

const mockActivities = [
  { id: '1', type: 'update', message: 'Updated status', timestamp: '2023-01-01T12:00:00Z', user: 'John Smith' },
  { id: '2', type: 'comment', message: 'Added comment', timestamp: '2023-01-02T12:00:00Z', user: 'Jane Doe' }
];

describe('ContextPanel', () => {
  const mockOnClose = jest.fn();
  const mockApiGet = jest.fn();
  const mockOnNodeClick = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    (performanceUtils.getCachedEntity as jest.Mock).mockReturnValue(null);
    
    // Mock API client
    (useAPIClientModule.useApiClient as jest.Mock).mockReturnValue({
      get: mockApiGet
    });
    
    // Mock feature flags
    (featureFlagsModule.useFeatureFlags as jest.Mock).mockReturnValue({
      flags: {
        enableActivityTimeline: true,
        enableSuggestions: true
      }
    });
  });

  it('should render loading state while fetching entity data', () => {
    // Mock API response to delay
    mockApiGet.mockReturnValue(new Promise(resolve => setTimeout(() => resolve({ data: mockUserData }), 100)));

    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockUserNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    expect(screen.getByText('Loading details...')).toBeInTheDocument();
  });

  it('should render user panel when user node is selected', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === `/users/${mockUserNode.id}`) {
        return Promise.resolve({ data: mockUserData });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockUserNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-panel')).toBeInTheDocument();
    });
  });

  it('should render team panel when team node is selected', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === `/teams/${mockTeamNode.id}`) {
        return Promise.resolve({ data: mockTeamData });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockTeamNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('team-panel')).toBeInTheDocument();
    });
  });

  it('should render project panel when project node is selected', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === `/projects/${mockProjectNode.id}`) {
        return Promise.resolve({ data: mockProjectData });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockProjectNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('project-panel')).toBeInTheDocument();
    });
  });

  it('should render goal panel when goal node is selected', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === `/goals/${mockGoalNode.id}`) {
        return Promise.resolve({ data: mockGoalData });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockGoalNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('goal-panel')).toBeInTheDocument();
    });
  });

  it('should render department details when department node is selected', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === `/departments/${mockDepartmentNode.id}`) {
        return Promise.resolve({ data: mockDepartmentData });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockDepartmentNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('entity-details')).toBeInTheDocument();
      expect(screen.getByText(/Engineering Department/)).toBeInTheDocument();
    });
  });

  it('should render knowledge asset details when knowledge asset node is selected', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === `/knowledge-assets/${mockKnowledgeAssetNode.id}`) {
        return Promise.resolve({ data: mockKnowledgeAssetData });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockKnowledgeAssetNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('entity-details')).toBeInTheDocument();
      expect(screen.getByText(/Technical Documentation/)).toBeInTheDocument();
    });
  });

  it('should render error message when API call fails', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('Failed to load data'));

    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockUserNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
  });

  it('should render tabs with correct initial state', async () => {
    mockApiGet.mockResolvedValueOnce({ data: mockUserData });

    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockUserNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => {
      // The header should have the node label
      expect(screen.getByText(mockUserNode.label)).toBeInTheDocument();
      
      // Tabs should be present
      expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: 'Relationships' })).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'false');
    });
  });

  it('should switch tabs when clicked', async () => {
    // Mock API responses for all data needed when switching tabs
    mockApiGet.mockImplementation((url) => {
      if (url === `/users/${mockUserNode.id}`) {
        return Promise.resolve({ data: mockUserData });
      } else if (url.includes('/relationships')) {
        return Promise.resolve({ data: mockRelationships });
      } else if (url.includes('/activities')) {
        return Promise.resolve({ data: mockActivities });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockUserNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByText(mockUserNode.label)).toBeInTheDocument());

    // Click relationships tab
    fireEvent.click(screen.getByRole('tab', { name: 'Relationships' }));
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Relationships' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('relationship-list')).toBeInTheDocument();
    });

    // Click activity tab
    fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
    });
  });

  it('should hide activity tab when feature flag is disabled', async () => {
    // Disable activity timeline feature flag
    (featureFlagsModule.useFeatureFlags as jest.Mock).mockReturnValue({
      flags: {
        enableActivityTimeline: false,
        enableSuggestions: true
      }
    });

    mockApiGet.mockResolvedValueOnce({ data: mockUserData });

    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockUserNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByText(mockUserNode.label)).toBeInTheDocument());

    // Activity tab should not be present
    expect(screen.queryByRole('tab', { name: 'Activity' })).not.toBeInTheDocument();
  });

  it('should close panel when close button is clicked', async () => {
    mockApiGet.mockResolvedValueOnce({ data: mockUserData });

    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockUserNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByText(mockUserNode.label)).toBeInTheDocument());

    // Find and click the close button
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should update when selected node changes', async () => {
    // First render with user node
    mockApiGet.mockResolvedValueOnce({ data: mockUserData });

    const { rerender } = render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockUserNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user-panel')).toBeInTheDocument());

    // Mock team data for second render
    mockApiGet.mockResolvedValueOnce({ data: mockTeamData });

    // Rerender with team node
    rerender(
      <ChakraProvider>
        <ContextPanel selectedNode={mockTeamNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByTestId('team-panel')).toBeInTheDocument());
  });

  it('should use cached entity data if available', async () => {
    // Mock cached data
    (performanceUtils.getCachedEntity as jest.Mock).mockReturnValueOnce(mockUserData);
    
    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockUserNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user-panel')).toBeInTheDocument());
    
    // API get should not be called when cache is used
    expect(mockApiGet).not.toHaveBeenCalled();
  });

  it('should handle cached relationships data', async () => {
    mockApiGet.mockResolvedValueOnce({ data: mockUserData });
    
    // Mock cached relationships
    (performanceUtils.getCachedEntity as jest.Mock).mockImplementation((key) => {
      if (key === `relationships:${mockUserNode.type}:${mockUserNode.id}`) {
        return mockRelationships;
      }
      return null;
    });

    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockUserNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user-panel')).toBeInTheDocument());
    
    // Click relationships tab
    fireEvent.click(screen.getByRole('tab', { name: 'Relationships' }));
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Relationships' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('relationship-list')).toBeInTheDocument();
      expect(screen.getByText(`Relationships: ${mockRelationships.length}`)).toBeInTheDocument();
    });
    
    // API get should not be called for relationships when cache is used
    expect(mockApiGet).not.toHaveBeenCalledWith(`/${mockUserNode.type.toLowerCase()}s/${mockUserNode.id}/relationships`);
  });

  it('should handle navigation through breadcrumb nav', async () => {
    // Setup mock API responses
    mockApiGet.mockImplementation((url) => {
      if (url === `/users/${mockUserNode.id}`) {
        return Promise.resolve({ data: mockUserData });
      } else if (url === `/teams/${mockTeamNode.id}`) {
        return Promise.resolve({ data: mockTeamData });
      } else if (url.includes('/relationships')) {
        return Promise.resolve({ data: mockRelationships });
      } else if (url.includes('/activities')) {
        return Promise.resolve({ data: mockActivities });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ChakraProvider>
        <ContextPanel 
          selectedNode={mockUserNode} 
          onClose={mockOnClose} 
          onNodeClick={mockOnNodeClick}
        />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByText(mockUserNode.label)).toBeInTheDocument());

    // First we need to navigate to another node to build history
    const { rerender } = render(
      <ChakraProvider>
        <ContextPanel 
          selectedNode={mockTeamNode} 
          onClose={mockOnClose} 
          onNodeClick={mockOnNodeClick}
        />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByText(mockTeamNode.label)).toBeInTheDocument());

    // Now we should have a breadcrumb navigation
    const breadcrumbNav = screen.getByTestId('breadcrumb-nav');
    expect(breadcrumbNav).toBeInTheDocument();
    expect(breadcrumbNav).toHaveAttribute('data-history-length', '2');

    // Click on the first history item (user node)
    const userBreadcrumb = screen.getByText(mockUserNode.label);
    fireEvent.click(userBreadcrumb);

    // The onNodeClick callback should be called with the correct node ID
    expect(mockOnNodeClick).toHaveBeenCalledWith(mockUserNode.id);
  });

  it('should handle node navigation via custom event', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === `/users/${mockUserNode.id}`) {
        return Promise.resolve({ data: mockUserData });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ChakraProvider>
        <ContextPanel 
          selectedNode={mockUserNode} 
          onClose={mockOnClose} 
          onNodeClick={mockOnNodeClick}
        />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByText(mockUserNode.label)).toBeInTheDocument());

    // Dispatch a custom navigation event
    const navigateEvent = new CustomEvent('navigate-to-node', {
      detail: { nodeId: 'team1' }
    });
    
    act(() => {
      document.dispatchEvent(navigateEvent);
    });
    
    // The onNodeClick callback should be called with the correct node ID
    expect(mockOnNodeClick).toHaveBeenCalledWith('team1');
  });

  it('should handle suggestion clicks', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === `/users/${mockUserNode.id}`) {
        return Promise.resolve({ data: mockUserData });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ChakraProvider>
        <ContextPanel 
          selectedNode={mockUserNode} 
          onClose={mockOnClose} 
          onNodeClick={mockOnNodeClick}
        />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByText(mockUserNode.label)).toBeInTheDocument());

    // Find and click the suggestion
    const suggestion = screen.getByText('Suggestion 1');
    fireEvent.click(suggestion);
    
    // The onNodeClick callback should be called with the correct node ID
    expect(mockOnNodeClick).toHaveBeenCalledWith('suggestion1');
  });

  it('should handle entity actions via custom event', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === `/users/${mockUserNode.id}`) {
        return Promise.resolve({ data: mockUserData });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ChakraProvider>
        <ContextPanel 
          selectedNode={mockUserNode} 
          onClose={mockOnClose} 
          onNodeClick={mockOnNodeClick}
        />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByText(mockUserNode.label)).toBeInTheDocument());

    // Dispatch a custom entity action event
    const actionEvent = new CustomEvent('entity-action', {
      detail: { action: 'edit', entityId: mockUserNode.id }
    });
    
    act(() => {
      document.dispatchEvent(actionEvent);
    });
    
    // The event is handled but doesn't trigger any specific callback in our mocked setup
    // This test just ensures the event listener doesn't throw errors
  });

  it('should handle keyboard navigation (Escape key)', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === `/users/${mockUserNode.id}`) {
        return Promise.resolve({ data: mockUserData });
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ChakraProvider>
        <ContextPanel 
          selectedNode={mockUserNode} 
          onClose={mockOnClose} 
          onNodeClick={mockOnNodeClick}
        />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByText(mockUserNode.label)).toBeInTheDocument());

    // Simulate Escape key press
    act(() => {
      const escapeKeyEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });
      document.dispatchEvent(escapeKeyEvent);
    });
    
    // The onClose callback should be called
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle API error when fetching relationships', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === `/users/${mockUserNode.id}`) {
        return Promise.resolve({ data: mockUserData });
      } else if (url.includes('/relationships')) {
        return Promise.reject(new Error('Failed to fetch relationships'));
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ChakraProvider>
        <ContextPanel 
          selectedNode={mockUserNode} 
          onClose={mockOnClose} 
        />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByText(mockUserNode.label)).toBeInTheDocument());

    // Click relationships tab
    fireEvent.click(screen.getByRole('tab', { name: 'Relationships' }));
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Relationships' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Relationships: 0')).toBeInTheDocument();
    });
  });

  it('should handle API error when fetching activities', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === `/users/${mockUserNode.id}`) {
        return Promise.resolve({ data: mockUserData });
      } else if (url.includes('/activities')) {
        return Promise.reject(new Error('Failed to fetch activities'));
      }
      return Promise.resolve({ data: [] });
    });

    render(
      <ChakraProvider>
        <ContextPanel 
          selectedNode={mockUserNode} 
          onClose={mockOnClose} 
        />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByText(mockUserNode.label)).toBeInTheDocument());

    // Click activity tab
    fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Activities: 0')).toBeInTheDocument();
    });
  });

  it('should render null when no node is selected', () => {
    render(
      <ChakraProvider>
        <ContextPanel 
          selectedNode={null} 
          onClose={mockOnClose} 
        />
      </ChakraProvider>
    );

    // The panel should not render anything
    expect(screen.queryByTestId('panel-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('panel-tabs')).not.toBeInTheDocument();
  });

  it('should handle project overviews and custom project name getter', async () => {
    mockApiGet.mockImplementation((url) => {
      if (url === `/projects/${mockProjectNode.id}`) {
        return Promise.resolve({ data: mockProjectData });
      }
      return Promise.resolve({ data: [] });
    });

    const mockProjectOverlaps = {
      'project1': ['project2', 'project3']
    };

    const mockGetProjectName = jest.fn().mockImplementation((id) => {
      const names = {
        'project1': 'Website Redesign',
        'project2': 'API Development',
        'project3': 'Mobile App'
      };
      return names[id as keyof typeof names];
    });

    render(
      <ChakraProvider>
        <ContextPanel 
          selectedNode={mockProjectNode} 
          onClose={mockOnClose} 
          projectOverlaps={mockProjectOverlaps}
          getProjectNameById={mockGetProjectName}
        />
      </ChakraProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('project-panel')).toBeInTheDocument();
      // The project panel receives these props but our mock doesn't use them for verification
      // This test mainly ensures the component renders correctly with these props
    });
  });

  it('should hide suggestions when feature flag is disabled', async () => {
    // Disable suggestions feature flag
    (featureFlagsModule.useFeatureFlags as jest.Mock).mockReturnValue({
      flags: {
        enableActivityTimeline: true,
        enableSuggestions: false
      }
    });

    mockApiGet.mockResolvedValueOnce({ data: mockUserData });

    render(
      <ChakraProvider>
        <ContextPanel selectedNode={mockUserNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByText(mockUserNode.label)).toBeInTheDocument());

    // Entity suggestions should not be present
    expect(screen.queryByTestId('entity-suggestions')).not.toBeInTheDocument();
  });
});