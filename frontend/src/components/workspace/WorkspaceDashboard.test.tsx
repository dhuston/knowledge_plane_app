import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WorkspaceDashboard } from './WorkspaceDashboard';
import { ChakraProvider } from '@chakra-ui/react';

// Mock components
vi.mock('./welcome/WelcomePanel', () => ({
  WelcomePanel: () => <div data-testid="welcome-panel">Welcome Panel</div>
}));

vi.mock('./briefing/DailyBriefing', () => ({
  DailyBriefing: () => <div data-testid="daily-briefing">Daily Briefing</div>
}));

vi.mock('./activity/TeamActivity', () => ({
  TeamActivity: () => <div data-testid="team-activity">Team Activity</div>
}));

vi.mock('./tasks/TaskManagement', () => ({
  TaskManagement: () => <div data-testid="task-management">Task Management</div>
}));

vi.mock('./actions/QuickActions', () => ({
  QuickActions: () => <div data-testid="quick-actions">Quick Actions</div>
}));

vi.mock('../map/LivingMap', () => ({
  LivingMap: () => <div data-testid="living-map">Living Map</div>
}));

describe('WorkspaceDashboard', () => {
  it('renders all dashboard components', () => {
    render(
      <ChakraProvider>
        <WorkspaceDashboard />
      </ChakraProvider>
    );
    
    expect(screen.getByTestId('workspace-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('welcome-panel')).toBeInTheDocument();
    expect(screen.getByTestId('daily-briefing')).toBeInTheDocument();
    expect(screen.getByTestId('team-activity')).toBeInTheDocument();
    expect(screen.getByTestId('task-management')).toBeInTheDocument();
    expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
  });

  it('renders in default layout mode', () => {
    render(
      <ChakraProvider>
        <WorkspaceDashboard />
      </ChakraProvider>
    );
    
    expect(screen.getByTestId('workspace-dashboard')).toHaveClass('dashboard-layout');
  });
  
  it('toggles between dashboard and map views', () => {
    render(
      <ChakraProvider>
        <WorkspaceDashboard />
      </ChakraProvider>
    );
    
    // Dashboard view should be active by default
    expect(screen.getByTestId('workspace-layout-toggle')).toHaveTextContent('View Map');
    
    // Click toggle button
    screen.getByTestId('workspace-layout-toggle').click();
    
    // Should switch to map view
    expect(screen.getByTestId('workspace-layout-toggle')).toHaveTextContent('View Dashboard');
    expect(screen.getByTestId('living-map')).toBeInTheDocument();
  });

  it('renders with customizable layout', () => {
    render(
      <ChakraProvider>
        <WorkspaceDashboard initialLayout="compact" />
      </ChakraProvider>
    );
    
    expect(screen.getByTestId('workspace-dashboard')).toHaveClass('compact-layout');
  });
});