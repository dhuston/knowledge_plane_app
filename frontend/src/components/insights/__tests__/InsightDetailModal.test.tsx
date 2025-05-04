import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InsightDetailModal from '../InsightDetailModal';
import { InsightCategory, InsightSourceType } from '../../../types/insight';

// Mock context functions
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

// Test data
const mockInsight = {
  id: 'test-insight-1',
  title: 'Test Insight Title',
  description: 'This is a test insight description that provides details about the insight.',
  category: InsightCategory.COLLABORATION,
  createdAt: new Date().toISOString(),
  relevanceScore: 0.85,
  source: {
    type: InsightSourceType.ACTIVITY,
    id: 'source-123'
  },
  relatedEntities: [
    {
      id: 'user-1',
      type: 'user',
      name: 'Test User',
      connection: 'frequent collaborator'
    }
  ],
  suggestedActions: [
    {
      label: 'Test Action',
      type: 'task'
    }
  ]
};

describe('InsightDetailModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders insight details correctly', () => {
    render(
      <InsightDetailModal 
        insight={mockInsight} 
        isOpen={true} 
        onClose={() => {}}
      />
    );
    
    // Header information
    expect(screen.getByText(mockInsight.title)).toBeInTheDocument();
    expect(screen.getByText(mockInsight.description)).toBeInTheDocument();
    expect(screen.getByText('Collaboration')).toBeInTheDocument();
    
    // Relevance badge
    expect(screen.getByText('85% relevant')).toBeInTheDocument();
    
    // Source information should be displayed
    expect(screen.getByText('Source Type')).toBeInTheDocument();
    expect(screen.getByText('activity')).toBeInTheDocument();
    
    // Related entities
    expect(screen.getByText('Related Entities')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('(frequent collaborator)')).toBeInTheDocument();
    
    // Suggested actions
    expect(screen.getByText('Suggested Actions')).toBeInTheDocument();
    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });
  
  it('calls provideFeedback when feedback button is clicked', async () => {
    render(
      <InsightDetailModal 
        insight={mockInsight} 
        isOpen={true} 
        onClose={() => {}}
      />
    );
    
    // Click the "Mark as relevant" button
    const relevantButton = screen.getByLabelText('Mark as relevant');
    fireEvent.click(relevantButton);
    
    expect(mockProvideFeedback).toHaveBeenCalledWith(mockInsight.id, true);
  });
  
  it('calls saveInsight when save button is clicked', () => {
    render(
      <InsightDetailModal 
        insight={mockInsight} 
        isOpen={true} 
        onClose={() => {}}
      />
    );
    
    // Find the Save button and click it
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    expect(mockSaveInsight).toHaveBeenCalledWith(mockInsight.id);
  });
  
  it('calls dismissInsight and onClose when dismiss button is clicked', () => {
    const mockOnClose = jest.fn();
    
    render(
      <InsightDetailModal 
        insight={mockInsight} 
        isOpen={true} 
        onClose={mockOnClose}
      />
    );
    
    // Find the Dismiss button and click it
    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);
    
    expect(mockDismissInsight).toHaveBeenCalledWith(mockInsight.id);
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  it('shows feedback form when Add feedback button is clicked', async () => {
    render(
      <InsightDetailModal 
        insight={mockInsight} 
        isOpen={true} 
        onClose={() => {}}
      />
    );
    
    // Find the Add feedback button (using the icon)
    const feedbackButton = screen.getByLabelText('Add feedback');
    fireEvent.click(feedbackButton);
    
    // Feedback form should appear
    await waitFor(() => {
      expect(screen.getByText('Add Feedback')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
  
  it('displays existing feedback if available', () => {
    const insightWithFeedback = {
      ...mockInsight,
      feedback: {
        isRelevant: true,
        comment: 'This insight was very helpful',
        timestamp: new Date().toISOString()
      }
    };
    
    render(
      <InsightDetailModal 
        insight={insightWithFeedback} 
        isOpen={true} 
        onClose={() => {}}
      />
    );
    
    expect(screen.getByText('Your Feedback')).toBeInTheDocument();
    expect(screen.getByText('"This insight was very helpful"')).toBeInTheDocument();
  });
});