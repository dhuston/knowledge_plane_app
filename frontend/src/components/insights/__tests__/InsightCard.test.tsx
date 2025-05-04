import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InsightCard from '../InsightCard';
import { InsightCategory, InsightSourceType } from '../../../types/insight';

// Mock the context functions
const mockDismissInsight = jest.fn();
const mockSaveInsight = jest.fn();
const mockProvideFeedback = jest.fn();

jest.mock('../../../context/InsightsContext', () => ({
  useInsights: () => ({
    dismissInsight: mockDismissInsight,
    saveInsight: mockSaveInsight,
    provideFeedback: mockProvideFeedback
  })
}));

// Create a sample insight for testing
const mockInsight = {
  id: '1',
  title: 'Test Insight',
  description: 'This is a test insight description',
  category: InsightCategory.COLLABORATION,
  createdAt: new Date().toISOString(),
  relevanceScore: 0.85,
  source: {
    type: InsightSourceType.ACTIVITY,
    id: '123'
  }
};

describe('InsightCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders insight details correctly', () => {
    render(<InsightCard insight={mockInsight} />);
    
    expect(screen.getByText(mockInsight.title)).toBeInTheDocument();
    expect(screen.getByText(mockInsight.description)).toBeInTheDocument();
    expect(screen.getByText('Collaboration')).toBeInTheDocument();
    expect(screen.getByText('85% relevant')).toBeInTheDocument();
  });
  
  it('calls dismissInsight when dismiss button is clicked', () => {
    render(<InsightCard insight={mockInsight} />);
    
    const dismissButton = screen.getByLabelText('Dismiss insight');
    fireEvent.click(dismissButton);
    
    expect(mockDismissInsight).toHaveBeenCalledWith(mockInsight.id);
  });
  
  it('calls saveInsight when save button is clicked', () => {
    render(<InsightCard insight={mockInsight} />);
    
    const saveButton = screen.getByLabelText('Save insight');
    fireEvent.click(saveButton);
    
    expect(mockSaveInsight).toHaveBeenCalledWith(mockInsight.id);
  });
  
  it('calls provideFeedback with true when thumbs up is clicked', () => {
    render(<InsightCard insight={mockInsight} />);
    
    const thumbsUpButton = screen.getByLabelText('Mark as relevant');
    fireEvent.click(thumbsUpButton);
    
    expect(mockProvideFeedback).toHaveBeenCalledWith(mockInsight.id, true);
  });
  
  it('calls provideFeedback with false when thumbs down is clicked', () => {
    render(<InsightCard insight={mockInsight} />);
    
    const thumbsDownButton = screen.getByLabelText('Mark as not relevant');
    fireEvent.click(thumbsDownButton);
    
    expect(mockProvideFeedback).toHaveBeenCalledWith(mockInsight.id, false);
  });
  
  it('shows view details button', () => {
    render(<InsightCard insight={mockInsight} />);
    
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });
  
  it('displays feedback status when provided', () => {
    const insightWithFeedback = {
      ...mockInsight,
      feedback: { isRelevant: true }
    };
    
    render(<InsightCard insight={insightWithFeedback} />);
    
    expect(screen.getByText('Marked Relevant')).toBeInTheDocument();
  });
});