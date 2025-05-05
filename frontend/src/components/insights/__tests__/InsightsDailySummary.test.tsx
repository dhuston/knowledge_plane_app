import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import InsightsDailySummary from '../InsightsDailySummary';
import { useInsights } from '../../../context/InsightsContext';
import OpenAIService from '../../../services/OpenAIService';

// Mock dependencies
vi.mock('../../../context/InsightsContext');
vi.mock('../../../services/OpenAIService');

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
    },
    {
      id: 'insight-2',
      title: 'Productivity Improvement',
      description: 'Your productivity has increased by 15% this week',
      category: 'productivity',
      createdAt: '2023-05-02T14:00:00Z',
      relevanceScore: 0.92,
      source: { type: 'activity', id: 'source-2' }
    },
    {
      id: 'insight-3',
      title: 'Knowledge Sharing Opportunity',
      description: 'Consider sharing your recent findings with the research team',
      category: 'knowledge',
      createdAt: '2023-05-03T09:30:00Z',
      relevanceScore: 0.78,
      source: { type: 'recommendation', id: 'source-3' }
    }
  ];
  
  const mockLastUpdated = new Date('2023-05-01T14:00:00Z');
  
  // Create mock implementations that we can modify for individual tests
  const mockInsightsHook = {
    insights: mockInsights,
    loading: false,
    error: null,
    fetchInsights: vi.fn(),
    lastUpdated: mockLastUpdated
  };
  
  // Set up mocks
  beforeEach(() => {
    // Mock useInsights hook
    vi.mocked(useInsights).mockReturnValue(mockInsightsHook);
    
    // Mock OpenAI service
    vi.mocked(OpenAIService.isAvailable).mockReturnValue(true);
    vi.mocked(OpenAIService.generateInsightSummary).mockResolvedValue(
      "Here's what's happening in your research today\n\nYou have been collaborating well with Team Alpha. Consider scheduling regular check-ins."
    );
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  test('renders loading state', () => {
    mockInsightsHook.insights = [];
    mockInsightsHook.loading = true;
    mockInsightsHook.lastUpdated = null;
    
    render(
      <ChakraProvider>
        <InsightsDailySummary />
      </ChakraProvider>
    );
    
    expect(screen.getByText(/generating your summary/i)).toBeInTheDocument();
  });
  
  test('renders error state', () => {
    mockInsightsHook.insights = [];
    mockInsightsHook.loading = false;
    mockInsightsHook.error = 'Failed to load insights';
    mockInsightsHook.lastUpdated = null;
    
    render(
      <ChakraProvider>
        <InsightsDailySummary />
      </ChakraProvider>
    );
    
    expect(screen.getByText(/try again/i)).toBeInTheDocument();
  });
  
  test('renders empty state when no insights available', () => {
    mockInsightsHook.insights = [];
    mockInsightsHook.loading = false;
    mockInsightsHook.error = null;
    mockInsightsHook.lastUpdated = null;
    
    render(
      <ChakraProvider>
        <InsightsDailySummary />
      </ChakraProvider>
    );
    
    expect(screen.getByText(/no insights available/i)).toBeInTheDocument();
  });
  
  test('renders OpenAI unavailable message when API key is not configured', async () => {
    vi.mocked(OpenAIService.isAvailable).mockReturnValue(false);
    mockInsightsHook.insights = [];
    mockInsightsHook.loading = false;
    mockInsightsHook.error = null;
    mockInsightsHook.lastUpdated = null;
    
    render(
      <ChakraProvider>
        <InsightsDailySummary />
      </ChakraProvider>
    );
    
    // Wait for the effect to run
    await waitFor(() => {
      expect(screen.getByText(/OpenAI API key not configured/i)).toBeInTheDocument();
    });
  });
  
  test('renders generated summary in the summary tab', async () => {
    render(
      <ChakraProvider>
        <InsightsDailySummary />
      </ChakraProvider>
    );
    
    // Wait for the summary to be generated
    await waitFor(() => {
      expect(OpenAIService.generateInsightSummary).toHaveBeenCalledWith(mockInsights, undefined);
    });
    
    // Check for summary content
    expect(screen.getByText(/what's happening in your research today/i)).toBeInTheDocument();
  });
  
  test('shows category tabs for different insight types', async () => {
    render(
      <ChakraProvider>
        <InsightsDailySummary />
      </ChakraProvider>
    );
    
    // Wait for summary to be generated
    await waitFor(() => {
      expect(OpenAIService.generateInsightSummary).toHaveBeenCalled();
    });
    
    // Check for category tabs
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Collaboration')).toBeInTheDocument();
    expect(screen.getByText('Productivity')).toBeInTheDocument();
    expect(screen.getByText('Knowledge')).toBeInTheDocument();
  });
  
  test('allows switching between tabs', async () => {
    render(
      <ChakraProvider>
        <InsightsDailySummary />
      </ChakraProvider>
    );
    
    // Wait for initial render
    await waitFor(() => {
      expect(OpenAIService.generateInsightSummary).toHaveBeenCalled();
    });
    
    // Default should be summary tab
    expect(screen.getByText(/what's happening in your research today/i)).toBeInTheDocument();
    
    // Click on the Collaboration tab
    fireEvent.click(screen.getByText('Collaboration'));
    
    // Now we should see collaboration insights
    expect(screen.getByText('Collaboration Pattern')).toBeInTheDocument();
    
    // Click on the Productivity tab
    fireEvent.click(screen.getByText('Productivity'));
    
    // Now we should see productivity insights
    expect(screen.getByText('Productivity Improvement')).toBeInTheDocument();
  });
  
  test('refreshes summary when refresh button is clicked', async () => {
    const mockFetchInsights = vi.fn().mockResolvedValue(undefined);
    mockInsightsHook.fetchInsights = mockFetchInsights;
    
    render(
      <ChakraProvider>
        <InsightsDailySummary />
      </ChakraProvider>
    );
    
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
  });
  
  test('shows date badge on insights', async () => {
    render(
      <ChakraProvider>
        <InsightsDailySummary />
      </ChakraProvider>
    );
    
    // Wait for initial render
    await waitFor(() => {
      expect(OpenAIService.generateInsightSummary).toHaveBeenCalled();
    });
    
    // Click on the Collaboration tab
    fireEvent.click(screen.getByText('Collaboration'));
    
    // Check if date badge is rendered
    const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date('2023-05-01'));
    expect(screen.getByText(dateFormat)).toBeInTheDocument();
  });
  
  test('expands insight description when More button is clicked', async () => {
    render(
      <ChakraProvider>
        <InsightsDailySummary />
      </ChakraProvider>
    );
    
    // Wait for initial render
    await waitFor(() => {
      expect(OpenAIService.generateInsightSummary).toHaveBeenCalled();
    });
    
    // Click on the Collaboration tab
    fireEvent.click(screen.getByText('Collaboration'));
    
    // Find and click the More button
    const moreButton = screen.getByRole('button', { name: /more/i });
    fireEvent.click(moreButton);
    
    // Now the Less button should be visible
    expect(screen.getByRole('button', { name: /less/i })).toBeInTheDocument();
  });
  
  test('passes personalization context to OpenAI service', async () => {
    const personalizationContext = { userId: 'user-1', teamId: 'team-1' };
    
    render(
      <ChakraProvider>
        <InsightsDailySummary personalizationContext={personalizationContext} />
      </ChakraProvider>
    );
    
    // Wait for the summary to be generated
    await waitFor(() => {
      expect(OpenAIService.generateInsightSummary).toHaveBeenCalledWith(
        mockInsights,
        personalizationContext
      );
    });
  });
  
  test('displays header with last updated time', async () => {
    render(
      <ChakraProvider>
        <InsightsDailySummary />
      </ChakraProvider>
    );
    
    // Wait for initial render
    await waitFor(() => {
      expect(OpenAIService.generateInsightSummary).toHaveBeenCalled();
    });
    
    // Check for header elements
    expect(screen.getByText('Daily Insights')).toBeInTheDocument();
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });
});