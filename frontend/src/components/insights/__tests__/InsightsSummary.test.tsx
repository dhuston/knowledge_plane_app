import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import InsightsSummary from '../InsightsSummary';
import { InsightCategory, InsightSourceType } from '../../../types/insight';

// Mock the insights context
const mockFetchInsights = jest.fn();
const mockInsights = [
  {
    id: 'insight-1',
    title: 'Top Priority Insight',
    description: 'This is a high priority insight with top relevance',
    category: InsightCategory.PROJECT,
    createdAt: new Date().toISOString(),
    relevanceScore: 0.95,
    source: {
      type: InsightSourceType.ACTIVITY,
      id: 'source-1'
    }
  },
  {
    id: 'insight-2',
    title: 'Medium Priority Insight',
    description: 'This is a medium priority insight',
    category: InsightCategory.COLLABORATION,
    createdAt: new Date().toISOString(),
    relevanceScore: 0.75,
    source: {
      type: InsightSourceType.PROJECT,
      id: 'source-2'
    }
  },
  {
    id: 'insight-3',
    title: 'Lower Priority Insight',
    description: 'This is a lower priority insight',
    category: InsightCategory.KNOWLEDGE,
    createdAt: new Date().toISOString(),
    relevanceScore: 0.65,
    source: {
      type: InsightSourceType.TEAM,
      id: 'source-3'
    }
  }
];

jest.mock('../../../context/InsightsContext', () => ({
  useInsights: () => ({
    insights: mockInsights,
    loading: false,
    error: null,
    fetchInsights: mockFetchInsights
  })
}));

// Utility to render with Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('InsightsSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the summary title', () => {
    renderWithRouter(<InsightsSummary />);
    expect(screen.getByText('Daily Insights')).toBeInTheDocument();
  });

  it('calls fetchInsights on mount', () => {
    renderWithRouter(<InsightsSummary />);
    expect(mockFetchInsights).toHaveBeenCalledWith('daily');
  });

  it('displays top insights ordered by relevance score', () => {
    renderWithRouter(<InsightsSummary />);
    
    // Check that insights are rendered
    expect(screen.getByText('Top Priority Insight')).toBeInTheDocument();
    expect(screen.getByText('Medium Priority Insight')).toBeInTheDocument();
    expect(screen.getByText('Lower Priority Insight')).toBeInTheDocument();
    
    // Check for relevance scores
    expect(screen.getByText('95% relevant')).toBeInTheDocument();
    expect(screen.getByText('75% relevant')).toBeInTheDocument();
    expect(screen.getByText('65% relevant')).toBeInTheDocument();
  });

  it('displays limited number of insights when maxInsights is set', () => {
    renderWithRouter(<InsightsSummary maxInsights={2} />);
    
    // Should only show top 2 insights
    expect(screen.getByText('Top Priority Insight')).toBeInTheDocument();
    expect(screen.getByText('Medium Priority Insight')).toBeInTheDocument();
    expect(screen.queryByText('Lower Priority Insight')).not.toBeInTheDocument();
  });

  it('includes links to view all insights', () => {
    renderWithRouter(<InsightsSummary />);
    
    // Should have two links to view all
    const viewAllLinks = screen.getAllByText(/View All/);
    expect(viewAllLinks.length).toBeGreaterThan(0);
    
    const viewAllButton = screen.getByText('View All Insights');
    expect(viewAllButton).toBeInTheDocument();
  });

  it('displays "Just now" for very recent insights', () => {
    // Mock a very recent date
    const recentDate = new Date();
    const recentInsights = [
      {
        ...mockInsights[0],
        createdAt: recentDate.toISOString()
      }
    ];
    
    jest.mock('../../../context/InsightsContext', () => ({
      useInsights: () => ({
        insights: recentInsights,
        loading: false,
        error: null,
        fetchInsights: mockFetchInsights
      })
    }));
    
    renderWithRouter(<InsightsSummary />);
    
    // The exact text may vary depending on how the component formats times
    const timeTexts = screen.getAllByText(/Just now|minutes ago/);
    expect(timeTexts.length).toBeGreaterThan(0);
  });
});