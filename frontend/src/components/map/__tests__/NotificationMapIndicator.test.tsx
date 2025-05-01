import React from 'react';
import { render, screen } from '@testing-library/react';
import NotificationMapIndicator from '../notifications/NotificationMapIndicator';
import { Notification } from '../../../hooks/useNotifications';

describe('NotificationMapIndicator', () => {
  const mockNotification: Notification = {
    id: '1',
    type: 'activity',
    severity: 'info',
    title: 'Test Notification',
    message: 'This is a test notification',
    created_at: new Date().toISOString(),
    read_at: null,
    dismissed_at: null,
    entity_type: 'project',
    entity_id: 'test-project-id',
  };
  
  test('should render with info severity styling', () => {
    render(<NotificationMapIndicator notification={mockNotification} size="sm" />);
    const indicator = screen.getByTestId('notification-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('notification-indicator-info');
  });
  
  test('should render with warning severity styling', () => {
    const warningNotification = { ...mockNotification, severity: 'warning' as const };
    render(<NotificationMapIndicator notification={warningNotification} size="sm" />);
    const indicator = screen.getByTestId('notification-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('notification-indicator-warning');
  });
  
  test('should render with critical severity styling', () => {
    const criticalNotification = { ...mockNotification, severity: 'critical' as const };
    render(<NotificationMapIndicator notification={criticalNotification} size="sm" />);
    const indicator = screen.getByTestId('notification-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('notification-indicator-critical');
  });
  
  test('should render with different sizes', () => {
    render(<NotificationMapIndicator notification={mockNotification} size="lg" />);
    const indicator = screen.getByTestId('notification-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('notification-indicator-lg');
  });
  
  test('should apply pulse animation for unread notifications', () => {
    render(<NotificationMapIndicator notification={mockNotification} size="sm" animate={true} />);
    const indicator = screen.getByTestId('notification-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass('notification-indicator-pulse');
  });
  
  test('should not animate for read notifications', () => {
    const readNotification = { 
      ...mockNotification, 
      read_at: new Date().toISOString() 
    };
    render(<NotificationMapIndicator notification={readNotification} size="sm" animate={true} />);
    const indicator = screen.getByTestId('notification-indicator');
    expect(indicator).toBeInTheDocument();
    expect(indicator).not.toHaveClass('notification-indicator-pulse');
  });
});