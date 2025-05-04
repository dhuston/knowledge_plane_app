import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import InsightsDashboard from '../InsightsDashboard';
import { InsightsProvider } from '../../../context/InsightsContext';

// Mock the API service
jest.mock('../../../services/InsightService', () => ({
  fetchInsights: jest.fn(() => Promise.resolve([
    {
      id: '1',
      title: 'Test Insight',
      description: 'This is a test insight',
      category: 'collaboration',
      createdAt: new Date().toISOString(),
      relevanceScore: 0.85,
      source: {
        type: 'activity',
        id: '123'
      }
    }
  ]))
}));

describe('InsightsDashboard', () => {
  it('renders the dashboard header', () => {
    render(
      <InsightsProvider>
        <InsightsDashboard />
      </InsightsProvider>
    );
    
    expect(screen.getByText(/insights dashboard/i)).toBeInTheDocument();
  });
  
  it('shows loading state initially', () => {
    render(
      <InsightsProvider>
        <InsightsDashboard />
      </InsightsProvider>
    );
    
    expect(screen.getByTestId('insights-loading')).toBeInTheDocument();
  });
  
  it('displays insights when loaded', async () => {
    render(
      <InsightsProvider>
        <InsightsDashboard />
      </InsightsProvider>
    );
    
    // Wait for insights to load
    await waitFor(() => {
      expect(screen.getByText('Test Insight')).toBeInTheDocument();
    });
  });
  
  it('allows filtering by time period', () => {
    render(
      <InsightsProvider>
        <InsightsDashboard />
      </InsightsProvider>
    );
    
    expect(screen.getByLabelText(/select time period/i)).toBeInTheDocument();
  });
});