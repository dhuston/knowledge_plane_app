/**
 * Unit tests for EntitySuggestionsContainer component
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EntitySuggestionsContainer from '../EntitySuggestionsContainer';
import { ChakraProvider } from '@chakra-ui/react';
import * as useEntitySuggestionsModule from '../../../../hooks/useEntitySuggestions';
import { MapNodeTypeEnum } from '../../../../types/map';

// Mock the custom hook
jest.mock('../../../../hooks/useEntitySuggestions', () => {
  const actual = jest.requireActual('../../../../hooks/useEntitySuggestions');
  return {
    __esModule: true,
    ...actual,
    useEntitySuggestions: jest.fn(),
  };
});

// Mock data for testing
const mockSuggestions = [
  {
    id: 'user1',
    type: MapNodeTypeEnum.USER,
    label: 'John Smith',
    reason: '2 mutual connections',
    confidence: 0.8,
    priority: 'high',
    tags: ['engineering', 'frontend']
  },
  {
    id: 'team1',
    type: MapNodeTypeEnum.TEAM,
    label: 'Frontend Team',
    reason: 'Same department',
    confidence: 0.6,
    priority: 'medium',
    tags: ['react', 'typescript']
  },
  {
    id: 'project1',
    type: MapNodeTypeEnum.PROJECT,
    label: 'Website Redesign',
    reason: 'Shared interests',
    confidence: 0.4,
    priority: 'low',
    tags: ['design', 'ux']
  }
];

describe('EntitySuggestionsContainer', () => {
  const mockSubmitFeedback = jest.fn().mockResolvedValue(undefined);
  const mockRefresh = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    (useEntitySuggestionsModule.useEntitySuggestions as jest.Mock).mockReturnValue({
      suggestions: mockSuggestions,
      isLoading: false,
      error: null,
      refresh: mockRefresh,
      submitFeedback: mockSubmitFeedback,
      clearSuggestions: jest.fn(),
    });
  });

  it('should render suggestions when data is available', () => {
    render(
      <ChakraProvider>
        <EntitySuggestionsContainer entityId="entity123" />
      </ChakraProvider>
    );

    // Title should be visible
    expect(screen.getByText('Suggested Connections')).toBeInTheDocument();
    
    // Suggestions should be visible
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Frontend Team')).toBeInTheDocument();
    expect(screen.getByText('Website Redesign')).toBeInTheDocument();
  });

  it('should show loading state when loading', () => {
    (useEntitySuggestionsModule.useEntitySuggestions as jest.Mock).mockReturnValue({
      suggestions: [],
      isLoading: true,
      error: null,
      refresh: mockRefresh,
      submitFeedback: mockSubmitFeedback,
      clearSuggestions: jest.fn(),
    });

    render(
      <ChakraProvider>
        <EntitySuggestionsContainer entityId="entity123" />
      </ChakraProvider>
    );

    expect(screen.getByText('Loading suggestions...')).toBeInTheDocument();
  });

  it('should show error state when error occurs', () => {
    (useEntitySuggestionsModule.useEntitySuggestions as jest.Mock).mockReturnValue({
      suggestions: [],
      isLoading: false,
      error: new Error('Test error'),
      refresh: mockRefresh,
      submitFeedback: mockSubmitFeedback,
      clearSuggestions: jest.fn(),
    });

    render(
      <ChakraProvider>
        <EntitySuggestionsContainer entityId="entity123" />
      </ChakraProvider>
    );

    expect(screen.getByText('Unable to load suggestions')).toBeInTheDocument();
  });

  it('should not render anything when entityId is null', () => {
    const { container } = render(
      <ChakraProvider>
        <EntitySuggestionsContainer entityId={null} />
      </ChakraProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it('should call onSuggestionClick when a suggestion is clicked', () => {
    const mockOnSuggestionClick = jest.fn();
    
    render(
      <ChakraProvider>
        <EntitySuggestionsContainer 
          entityId="entity123" 
          onSuggestionClick={mockOnSuggestionClick} 
          viewMode="list" 
        />
      </ChakraProvider>
    );

    // Find and click the first suggestion
    fireEvent.click(screen.getByText('John Smith'));
    expect(mockOnSuggestionClick).toHaveBeenCalledWith('user1', 'John Smith');
  });
  
  it('should submit feedback when feedback buttons are clicked', async () => {
    render(
      <ChakraProvider>
        <EntitySuggestionsContainer 
          entityId="entity123" 
          viewMode="cards" 
        />
      </ChakraProvider>
    );

    // Find and click the thumbs up button (using aria-label)
    fireEvent.click(screen.getAllByLabelText('This suggestion is helpful')[0]);
    
    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith('user1', true);
    });
    
    // Find and click the thumbs down button
    fireEvent.click(screen.getAllByLabelText('This suggestion is not helpful')[0]);
    
    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith('user1', false);
    });
  });

  it('should respect custom title and view mode props', () => {
    render(
      <ChakraProvider>
        <EntitySuggestionsContainer 
          entityId="entity123" 
          title="Custom Title" 
          viewMode="compact" 
        />
      </ChakraProvider>
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });
});