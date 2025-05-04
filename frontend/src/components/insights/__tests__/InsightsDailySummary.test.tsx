import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import InsightsDailySummary from '../InsightsDailySummary';
import { useInsights } from '../../../context/InsightsContext';
import OpenAIService from '../../../services/OpenAIService';

// Mock dependencies
jest.mock('../../../context/InsightsContext');
jest.mock('../../../services/OpenAIService');

describe('InsightsDailySummary', () => {
  // Mock response data
  const mockInsights = [
    {
      id: 'insight-1',
      title: 'Collaboration Pattern',
      description: 'You have collaborated frequently with Team Alpha',
      category: 'collaboration',
      createdAt: '2023-05-01T12:00:00Z',
      relevanceScore: 0.85,
      source: { type: 'activity', id: 'source-1' }
    }
  ];
  
  const mockLastUpdated = new Date('2023-05-01T14:00:00Z');
  
  // Default mock setup
  beforeEach(() => {
    // Mock useInsights hook
    (useInsights as jest.Mock).mockReturnValue({
      insights: mockInsights,
      loading: false,
      error: null,
      fetchInsights: jest.fn(),
      lastUpdated: mockLastUpdated
    });
    
    // Mock OpenAI service
    (OpenAIService.isAvailable as jest.Mock).mockReturnValue(true);
    (OpenAIService.generateInsightSummary as jest.Mock).mockResolvedValue(
      '## Daily Summary\n\nYou have been collaborating well with Team Alpha. Consider scheduling regular check-ins.'
    );
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders loading state', () => {
    (useInsights as jest.Mock).mockReturnValue({
      insights: [],
      loading: true,
      error: null,
      fetchInsights: jest.fn(),
      lastUpdated: null
    });
    
    render(<InsightsDailySummary />);
    
    expect(screen.getByText(/generating your personalized summary|loading insights/i)).toBeInTheDocument();
  });
  
  test('renders error state', () => {
    (useInsights as jest.Mock).mockReturnValue({
      insights: [],
      loading: false,
      error: 'Failed to load insights',
      fetchInsights: jest.fn(),
      lastUpdated: null
    });
    
    render(<InsightsDailySummary />);
    
    expect(screen.getByText(/failed to load insights/i)).toBeInTheDocument();
  });
  
  test('renders empty state when no insights available', () => {
    (useInsights as jest.Mock).mockReturnValue({
      insights: [],
      loading: false,
      error: null,
      fetchInsights: jest.fn(),
      lastUpdated: null
    });
    
    render(<InsightsDailySummary />);
    
    expect(screen.getByText(/no insights available/i)).toBeInTheDocument();
  });
  
  test('renders OpenAI unavailable message when API key is not configured', async () => {
    (OpenAIService.isAvailable as jest.Mock).mockReturnValue(false);
    
    render(<InsightsDailySummary />);
    
    // Wait for the effect to run
    await waitFor(() => {
      expect(screen.getByText(/AI-powered summaries unavailable/i)).toBeInTheDocument();
    });
  });
  
  test('renders generated summary', async () => {
    render(<InsightsDailySummary />);
    
    // Wait for the summary to be generated
    await waitFor(() => {
      expect(OpenAIService.generateInsightSummary).toHaveBeenCalledWith(mockInsights, undefined);
    });
    
    // Check for summary content
    expect(screen.getByText(/Your Personalized Daily Summary/i)).toBeInTheDocument();
  });
  
  test('refreshes summary when refresh button is clicked', async () => {
    const mockFetchInsights = jest.fn().mockResolvedValue(undefined);
    
    (useInsights as jest.Mock).mockReturnValue({
      insights: mockInsights,
      loading: false,
      error: null,
      fetchInsights: mockFetchInsights,
      lastUpdated: mockLastUpdated
    });
    
    render(<InsightsDailySummary />);
    
    // Wait for initial render
    await waitFor(() => {
      expect(OpenAIService.generateInsightSummary).toHaveBeenCalledTimes(1);
    });
    
    // Get and click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    // Check if fetchInsights was called
    await waitFor(() => {
      expect(mockFetchInsights).toHaveBeenCalledTimes(1);
      expect(mockFetchInsights).toHaveBeenCalledWith('daily');
    });
    
    // Check if summary was regenerated
    await waitFor(() => {
      expect(OpenAIService.generateInsightSummary).toHaveBeenCalledTimes(2);
    });
  });
  
  test('passes personalization context to OpenAI service', async () => {
    const personalizationContext = { userId: 'user-1', teamId: 'team-1' };
    
    render(<InsightsDailySummary personalizationContext={personalizationContext} />);
    
    // Wait for the summary to be generated
    await waitFor(() => {
      expect(OpenAIService.generateInsightSummary).toHaveBeenCalledWith(
        mockInsights,
        personalizationContext
      );
    });
  });
});