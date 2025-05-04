import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import ContextPanel from '../ContextPanel';
import ActivityTimeline from '../ActivityTimeline';
import PanelTabs from '../tabs/PanelTabs';
import RelationshipList from '../RelationshipList';
import EntitySuggestionsContainer from '../suggestions/EntitySuggestionsContainer';

// Mock data and modules
jest.mock('../../../hooks/useApiClient', () => ({
  useApiClient: () => ({
    get: jest.fn().mockResolvedValue({ data: [] }),
  }),
}));

jest.mock('../../../hooks/useEntitySuggestions', () => ({
  useEntitySuggestions: () => ({
    suggestions: [
      { id: 'sugg1', title: 'Suggestion 1', type: 'user', relevance: 'high' },
      { id: 'sugg2', title: 'Suggestion 2', type: 'team', relevance: 'medium' }
    ],
    isLoading: false,
    error: null,
  }),
}));

describe('Panel Components Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ContextPanel', () => {
    test('renders closed by default', () => {
      render(
        <ChakraProvider>
          <ContextPanel isOpen={false} onClose={() => {}} entity={null} />
        </ChakraProvider>
      );
      
      expect(screen.queryByText(/Details/i)).not.toBeInTheDocument();
    });

    test('renders panel with user entity', () => {
      const userEntity = {
        id: 'user1',
        type: 'user',
        title: 'John Doe',
        subtitle: 'Software Engineer',
        properties: { team: 'Engineering' },
      };

      render(
        <ChakraProvider>
          <ContextPanel isOpen={true} onClose={() => {}} entity={userEntity} />
        </ChakraProvider>
      );
      
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
  });

  describe('ActivityTimeline', () => {
    const mockActivities = [
      {
        id: 'act1',
        title: 'Created project',
        timestamp: '2023-05-01T10:30:00Z',
        type: 'create',
        user: { name: 'John Doe', id: 'user1' },
      },
      {
        id: 'act2',
        title: 'Updated document',
        timestamp: '2023-05-01T11:45:00Z',
        type: 'update',
        user: { name: 'Jane Smith', id: 'user2' },
      },
    ];

    test('renders activity items', () => {
      render(
        <ChakraProvider>
          <ActivityTimeline activities={mockActivities} />
        </ChakraProvider>
      );
      
      expect(screen.getByText(/Created project/i)).toBeInTheDocument();
      expect(screen.getByText(/Updated document/i)).toBeInTheDocument();
    });

    test('shows empty state when no activities', () => {
      render(
        <ChakraProvider>
          <ActivityTimeline activities={[]} />
        </ChakraProvider>
      );
      
      expect(screen.getByText(/No recent activity/i)).toBeInTheDocument();
    });
  });

  describe('PanelTabs', () => {
    test('renders tabs and handles tab change', () => {
      const handleTabChange = jest.fn();
      
      const tabs = [
        { label: 'Details', content: <div>Details Content</div> },
        { label: 'Activity', content: <div>Activity Content</div> },
      ];

      render(
        <ChakraProvider>
          <PanelTabs tabs={tabs} activeTab={0} onChange={handleTabChange} />
        </ChakraProvider>
      );
      
      expect(screen.getByText(/Details Content/i)).toBeInTheDocument();
      expect(screen.queryByText(/Activity Content/i)).not.toBeInTheDocument();
      
      // Click on second tab
      fireEvent.click(screen.getByText(/Activity/i));
      expect(handleTabChange).toHaveBeenCalledWith(1);
    });
  });

  describe('RelationshipList', () => {
    const mockRelationships = [
      { id: 'rel1', title: 'Engineering Team', type: 'team', relationshipType: 'MEMBER_OF' },
      { id: 'rel2', title: 'Project Alpha', type: 'project', relationshipType: 'CONTRIBUTES_TO' },
    ];

    test('renders relationships', () => {
      render(
        <ChakraProvider>
          <RelationshipList relationships={mockRelationships} onItemClick={() => {}} />
        </ChakraProvider>
      );
      
      expect(screen.getByText(/Engineering Team/i)).toBeInTheDocument();
      expect(screen.getByText(/Project Alpha/i)).toBeInTheDocument();
    });

    test('shows empty state when no relationships', () => {
      render(
        <ChakraProvider>
          <RelationshipList relationships={[]} onItemClick={() => {}} />
        </ChakraProvider>
      );
      
      expect(screen.getByText(/No relationships found/i)).toBeInTheDocument();
    });
  });

  describe('EntitySuggestionsContainer', () => {
    test('renders entity suggestions', () => {
      render(
        <ChakraProvider>
          <EntitySuggestionsContainer entityId="user1" entityType="user" />
        </ChakraProvider>
      );
      
      expect(screen.getByText(/Suggestion 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Suggestion 2/i)).toBeInTheDocument();
    });
  });
});