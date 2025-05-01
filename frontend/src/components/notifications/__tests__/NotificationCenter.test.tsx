import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotificationCenter from '../NotificationCenter';
import * as notificationHooks from '../../../hooks/useNotifications';

// Mock the notification hooks
jest.mock('../../../hooks/useNotifications');
const mockUseNotifications = notificationHooks.default as jest.Mock;

// Mock notification data
const mockNotifications = [
  {
    id: '1',
    type: 'activity',
    severity: 'info',
    title: 'Test Notification 1',
    message: 'This is a test notification',
    created_at: new Date().toISOString(),
    read_at: null,
    dismissed_at: null,
    entity_type: 'project',
    entity_id: '123',
    action_url: '/projects/123'
  },
  {
    id: '2',
    type: 'insight',
    severity: 'warning',
    title: 'Test Notification 2',
    message: 'This is another test notification',
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    read_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
    dismissed_at: null,
    entity_type: null,
    entity_id: null,
    action_url: null
  }
];

// Mock hook implementation
const mockMarkAsRead = jest.fn();
const mockDismiss = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockDismissAll = jest.fn();

describe('NotificationCenter', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementation
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      unreadCount: 1, // First notification is unread
      preferences: [],
      isLoading: false,
      error: null,
      fetchNotifications: jest.fn(),
      markAsRead: mockMarkAsRead,
      dismiss: mockDismiss,
      markAllAsRead: mockMarkAllAsRead,
      dismissAll: mockDismissAll,
      fetchPreferences: jest.fn(),
      updatePreference: jest.fn()
    });
  });
  
  test('should render notification bell with badge showing correct count', () => {
    render(
      <BrowserRouter>
        <NotificationCenter />
      </BrowserRouter>
    );
    
    // Check if bell icon is rendered
    const bellButton = screen.getByLabelText('Notifications');
    expect(bellButton).toBeInTheDocument();
    
    // Check if badge is rendered with correct count
    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
  });
  
  test('should open notification drawer when bell is clicked', async () => {
    render(
      <BrowserRouter>
        <NotificationCenter />
      </BrowserRouter>
    );
    
    // Click the bell icon
    fireEvent.click(screen.getByLabelText('Notifications'));
    
    // Check if drawer is opened with correct title
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
    
    // Check if notifications are rendered
    expect(screen.getByText('Test Notification 1')).toBeInTheDocument();
    expect(screen.getByText('Test Notification 2')).toBeInTheDocument();
  });
  
  test('should mark a notification as read when clicked', async () => {
    render(
      <BrowserRouter>
        <NotificationCenter />
      </BrowserRouter>
    );
    
    // Open the drawer
    fireEvent.click(screen.getByLabelText('Notifications'));
    
    // Find the notification and click it
    await waitFor(() => {
      fireEvent.click(screen.getByText('This is a test notification'));
    });
    
    // Check if markAsRead was called with correct ID
    expect(mockMarkAsRead).toHaveBeenCalledWith('1');
  });
});