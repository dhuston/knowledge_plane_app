import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import NotificationMapFilter from '../NotificationMapFilter';
import useNotifications from '../../../../hooks/useNotifications';

// Mock useNotifications
jest.mock('../../../../hooks/useNotifications', () => ({
  __esModule: true,
  default: jest.fn()
}));
const mockUseNotifications = useNotifications as jest.Mock;

describe('NotificationMapFilter', () => {
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotifications.mockImplementation(() => ({
      unreadCount: 5,
      notifications: []
    }));
  });

  test('should render filter button', () => {
    render(<NotificationMapFilter onFilterChange={mockOnFilterChange} />);
    
    // Check button is rendered
    const filterButton = screen.getByRole('button');
    expect(filterButton).toBeInTheDocument();
  });

  test('should show badge when filter is enabled', async () => {
    render(<NotificationMapFilter onFilterChange={mockOnFilterChange} />);
    
    // Initially the badge shouldn't be visible
    expect(screen.queryByText('5')).not.toBeInTheDocument();
    
    // Click to open menu
    fireEvent.click(screen.getByRole('button'));
    
    // Click to enable filter
    fireEvent.click(screen.getByText('Enable Filter'));
    
    // Now badge should be visible with unread count
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('should call onFilterChange when filter is toggled', () => {
    render(<NotificationMapFilter onFilterChange={mockOnFilterChange} />);
    
    // Click to open menu
    fireEvent.click(screen.getByRole('button'));
    
    // Click to enable filter
    fireEvent.click(screen.getByText('Enable Filter'));
    
    // Check onFilterChange was called with correct params
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      enabled: true,
      type: undefined,
      severity: undefined,
      includeRead: false
    });
    
    // Click to disable filter
    fireEvent.click(screen.getByText('Disable Filter'));
    
    // Check onFilterChange was called again with correct params
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      enabled: false,
      type: undefined,
      severity: undefined,
      includeRead: false
    });
  });

  test('should update notification type filter', () => {
    render(<NotificationMapFilter onFilterChange={mockOnFilterChange} />);
    
    // Click to open menu
    fireEvent.click(screen.getByRole('button'));
    
    // Click on a notification type
    fireEvent.click(screen.getByText('Insights'));
    
    // Check onFilterChange was called with correct type
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'insight'
      })
    );
  });

  test('should update severity filter', () => {
    render(<NotificationMapFilter onFilterChange={mockOnFilterChange} />);
    
    // Click to open menu
    fireEvent.click(screen.getByRole('button'));
    
    // Click on a severity level
    fireEvent.click(screen.getByText('Warning'));
    
    // Check onFilterChange was called with correct severity
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'warning'
      })
    );
  });

  test('should toggle include read option', () => {
    render(<NotificationMapFilter onFilterChange={mockOnFilterChange} />);
    
    // Click to open menu
    fireEvent.click(screen.getByRole('button'));
    
    // Click to include read notifications
    fireEvent.click(screen.getByText('Include Read Notifications'));
    
    // Check onFilterChange was called with includeRead: true
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        includeRead: true
      })
    );
  });

  test('should reset filters', () => {
    render(<NotificationMapFilter onFilterChange={mockOnFilterChange} />);
    
    // Click to open menu
    fireEvent.click(screen.getByRole('button'));
    
    // Set some filters first
    fireEvent.click(screen.getByText('Insights'));
    fireEvent.click(screen.getByText('Warning'));
    fireEvent.click(screen.getByText('Include Read Notifications'));
    
    // Clear mock to only check reset
    mockOnFilterChange.mockClear();
    
    // Click reset
    fireEvent.click(screen.getByText('Reset Filters'));
    
    // Check onFilterChange was called with reset values
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      enabled: expect.any(Boolean), // This depends on current state
      type: undefined,
      severity: undefined,
      includeRead: false
    });
  });
});