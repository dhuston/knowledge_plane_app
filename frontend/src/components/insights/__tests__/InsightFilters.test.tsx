import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import InsightFilters from '../InsightFilters';
import { InsightCategory } from '../../../types/insight';

describe('InsightFilters', () => {
  const mockOnCategoryChange = jest.fn();
  const mockOnSortChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders all category buttons', () => {
    render(
      <InsightFilters 
        selectedCategory="all" 
        onCategoryChange={mockOnCategoryChange}
        sortBy="relevance"
        onSortChange={mockOnSortChange}
        insightCount={10}
      />
    );
    
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('Collaboration')).toBeInTheDocument();
    expect(screen.getByText('Productivity')).toBeInTheDocument();
    expect(screen.getByText('Knowledge')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();
  });
  
  it('calls onCategoryChange when a category button is clicked', () => {
    render(
      <InsightFilters 
        selectedCategory="all" 
        onCategoryChange={mockOnCategoryChange}
        sortBy="relevance"
        onSortChange={mockOnSortChange}
        insightCount={10}
      />
    );
    
    fireEvent.click(screen.getByText('Collaboration'));
    expect(mockOnCategoryChange).toHaveBeenCalledWith(InsightCategory.COLLABORATION);
  });
  
  it('renders sort options', () => {
    render(
      <InsightFilters 
        selectedCategory="all" 
        onCategoryChange={mockOnCategoryChange}
        sortBy="relevance"
        onSortChange={mockOnSortChange}
        insightCount={10}
      />
    );
    
    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    
    const sortSelect = screen.getByRole('combobox');
    expect(sortSelect).toBeInTheDocument();
  });
  
  it('calls onSortChange when sort option is changed', () => {
    render(
      <InsightFilters 
        selectedCategory="all" 
        onCategoryChange={mockOnCategoryChange}
        sortBy="relevance"
        onSortChange={mockOnSortChange}
        insightCount={10}
      />
    );
    
    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'newest' } });
    
    expect(mockOnSortChange).toHaveBeenCalledWith('newest');
  });
  
  it('displays the correct insight count', () => {
    render(
      <InsightFilters 
        selectedCategory="all" 
        onCategoryChange={mockOnCategoryChange}
        sortBy="relevance"
        onSortChange={mockOnSortChange}
        insightCount={10}
      />
    );
    
    expect(screen.getByText('10 insights')).toBeInTheDocument();
  });
  
  it('displays singular insight text when count is 1', () => {
    render(
      <InsightFilters 
        selectedCategory="all" 
        onCategoryChange={mockOnCategoryChange}
        sortBy="relevance"
        onSortChange={mockOnSortChange}
        insightCount={1}
      />
    );
    
    expect(screen.getByText('1 insight')).toBeInTheDocument();
  });
});