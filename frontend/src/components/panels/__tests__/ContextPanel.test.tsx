/**
 * Unit tests for ContextPanel component
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContextPanel from '../ContextPanel';
import { ChakraProvider } from '@chakra-ui/react';
import { MapNodeTypeEnum } from '../../../types/map';
import * as useAPIClientModule from '../../../hooks/useApiClient';
import * as featureFlagsModule from '../../../utils/featureFlags';

// Mock the API client hook
jest.mock('../../../hooks/useApiClient', () => ({
  __esModule: true,
  useApiClient: jest.fn()
}));

// Mock the feature flags hook
jest.mock('../../../utils/featureFlags', () => ({
  useFeatureFlags: jest.fn()
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

jest.mock('../RelationshipList', () => ({
  __esModule: true,
  default: ({ relationships, isLoading }: any) => (
    <div data-testid="relationship-list">
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
  
  beforeEach(() => {
    jest.clearAllMocks();
    
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
    const mockTeamData = {
      id: 'team1',
      type: 'team',
      name: 'Engineering Team'
    };
    
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
    const mockProjectData = {
      id: 'project1',
      type: 'project',
      name: 'Website Redesign',
      status: 'active'
    };
    
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
    const mockGoalData = {
      id: 'goal1',
      type: 'goal',
      name: 'Improve UX',
      status: 'in_progress'
    };
    
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
    const mockTeamData = {
      id: 'team1',
      type: 'team',
      name: 'Engineering Team'
    };
    
    mockApiGet.mockResolvedValueOnce({ data: mockTeamData });

    // Rerender with team node
    rerender(
      <ChakraProvider>
        <ContextPanel selectedNode={mockTeamNode} onClose={mockOnClose} />
      </ChakraProvider>
    );

    await waitFor(() => expect(screen.getByTestId('team-panel')).toBeInTheDocument());
  });
});