import React from 'react';
import { render, screen } from '@testing-library/react';
import NodeWithNotifications from '../notifications/NodeWithNotifications';
import { Notification } from '../../../hooks/useNotifications';

jest.mock('../../../hooks/useNotifications', () => ({
  __esModule: true,
  default: () => ({
    notifications: mockNotifications,
    unreadCount: 2
  })
}));

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'activity',
    severity: 'warning',
    title: 'Project Update',
    message: 'Project X has been updated',
    created_at: new Date().toISOString(),
    read_at: null,
    dismissed_at: null,
    entity_type: 'project',
    entity_id: 'project-1',
  },
  {
    id: '2',
    type: 'mention',
    severity: 'info',
    title: 'You were mentioned',
    message: 'You were mentioned in a note',
    created_at: new Date().toISOString(),
    read_at: null,
    dismissed_at: null,
    entity_type: 'user',
    entity_id: 'user-1',
  },
  {
    id: '3',
    type: 'system',
    severity: 'critical',
    title: 'System Update',
    message: 'System will be down for maintenance',
    created_at: new Date().toISOString(),
    read_at: new Date().toISOString(), // Already read
    dismissed_at: null,
    entity_type: 'system',
    entity_id: null,
  }
];

describe('NodeWithNotifications', () => {
  const mockNode = {
    id: 'project-1',
    type: 'project',
  };
  
  const MockChildComponent: React.FC = () => <div data-testid="mock-child">Mock Node</div>;
  
  test('should render the child component', () => {
    render(
      <NodeWithNotifications node={mockNode} animate={true}>
        <MockChildComponent />
      </NodeWithNotifications>
    );
    
    expect(screen.getByTestId('mock-child')).toBeInTheDocument();
  });
  
  test('should render notification indicators for relevant notifications', () => {
    render(
      <NodeWithNotifications node={mockNode} animate={true}>
        <MockChildComponent />
      </NodeWithNotifications>
    );
    
    // Should find 1 notification indicator (for project-1)
    const indicators = screen.getAllByTestId('notification-indicator');
    expect(indicators.length).toBe(1);
  });
  
  test('should not render indicators for unrelated entities', () => {
    const unrelatedNode = {
      id: 'team-1',
      type: 'team',
    };
    
    render(
      <NodeWithNotifications node={unrelatedNode} animate={true}>
        <MockChildComponent />
      </NodeWithNotifications>
    );
    
    // Should not find any notification indicators
    expect(screen.queryByTestId('notification-indicator')).not.toBeInTheDocument();
  });
  
  test('should prioritize notifications by severity', () => {
    // Add a critical notification for the same project
    const criticalNotifications = [
      ...mockNotifications,
      {
        id: '4',
        type: 'insight',
        severity: 'critical',
        title: 'Critical Issue',
        message: 'Project has critical issues',
        created_at: new Date().toISOString(),
        read_at: null,
        dismissed_at: null,
        entity_type: 'project',
        entity_id: 'project-1',
      }
    ];
    
    jest.spyOn(require('../../../hooks/useNotifications'), 'default').mockImplementation(() => ({
      notifications: criticalNotifications,
      unreadCount: 3
    }));
    
    render(
      <NodeWithNotifications node={mockNode} animate={true}>
        <MockChildComponent />
      </NodeWithNotifications>
    );
    
    // Should find indicators with critical class (highest severity)
    const indicators = screen.getAllByTestId('notification-indicator');
    expect(indicators[0]).toHaveClass('notification-indicator-critical');
  });
});