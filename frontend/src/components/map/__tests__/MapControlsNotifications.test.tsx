import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MapControls from '../MapControls';
import useNotifications from '../../../hooks/useNotifications';

// Mock useNotifications
jest.mock('../../../hooks/useNotifications', () => ({
  __esModule: true,
  default: jest.fn()
}));
const mockUseNotifications = useNotifications as jest.Mock;

describe('MapControls with Notification Filter', () => {
  const mockOnNotificationFilterChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotifications.mockImplementation(() => ({
      unreadCount: 3,
      notifications: []
    }));
  });
  
  test('should render NotificationMapFilter when onNotificationFilterChange is provided', () => {
    render(
      <MapControls 
        onZoomIn={jest.fn()}
        onZoomOut={jest.fn()}
        onReset={jest.fn()}
        onCenter={jest.fn()}
        onFullScreen={jest.fn()}
        zoomLevel={1}
        onZoomChange={jest.fn()}
        onNotificationFilterChange={mockOnNotificationFilterChange}
      />
    );
    
    // Since we can't directly test for the component, we test for its button
    const filterButton = screen.getByRole('button', { name: /notifications/i });
    expect(filterButton).toBeInTheDocument();
  });
  
  test('should not render NotificationMapFilter when onNotificationFilterChange is not provided', () => {
    render(
      <MapControls 
        onZoomIn={jest.fn()}
        onZoomOut={jest.fn()}
        onReset={jest.fn()}
        onCenter={jest.fn()}
        onFullScreen={jest.fn()}
        zoomLevel={1}
        onZoomChange={jest.fn()}
      />
    );
    
    const filterButton = screen.queryByRole('button', { name: /notifications/i });
    expect(filterButton).not.toBeInTheDocument();
  });
  
  test('should trigger filter change when notification filter is used', () => {
    render(
      <MapControls 
        onZoomIn={jest.fn()}
        onZoomOut={jest.fn()}
        onReset={jest.fn()}
        onCenter={jest.fn()}
        onFullScreen={jest.fn()}
        zoomLevel={1}
        onZoomChange={jest.fn()}
        onNotificationFilterChange={mockOnNotificationFilterChange}
      />
    );
    
    // Click to open menu
    const filterButton = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(filterButton);
    
    // Enable filter (this should call onNotificationFilterChange)
    const enableButton = screen.getByText('Enable Filter');
    fireEvent.click(enableButton);
    
    expect(mockOnNotificationFilterChange).toHaveBeenCalled();
    expect(mockOnNotificationFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true
      })
    );
  });
});