import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkspaceContainer from '../../frontend/src/components/workspaces/WorkspaceContainer';
import { Workspace, WorkspaceType } from '../../frontend/src/models/workspace/Workspace';

// Mock the child components
vi.mock('../../frontend/src/components/workspaces/WorkspaceHeader', () => ({
  default: ({ title, description, workspaceType }: { title: string, description: string, workspaceType: WorkspaceType }) => (
    <div data-testid="workspace-header">
      <h1>{title}</h1>
      <p>{description}</p>
      <span>Type: {workspaceType}</span>
    </div>
  )
}));

vi.mock('../../frontend/src/components/workspaces/WorkspaceNavigation', () => ({
  default: ({ 
    workspaceType, 
    activeSection, 
    onSectionChange 
  }: { 
    workspaceType: WorkspaceType, 
    activeSection: string, 
    onSectionChange: (section: string) => void 
  }) => (
    <nav data-testid="workspace-navigation">
      <ul>
        <li>
          <button 
            data-active={activeSection === 'overview'} 
            onClick={() => onSectionChange('overview')}
          >
            Overview
          </button>
        </li>
        <li>
          <button 
            data-active={activeSection === 'activity'} 
            onClick={() => onSectionChange('activity')}
          >
            Activity
          </button>
        </li>
      </ul>
    </nav>
  )
}));

vi.mock('../../frontend/src/components/workspaces/WorkspaceContent', () => ({
  default: ({ 
    workspaceId, 
    workspaceType, 
    activeSection, 
    children 
  }: { 
    workspaceId: string, 
    workspaceType: WorkspaceType, 
    activeSection: string, 
    children?: React.ReactNode 
  }) => (
    <div data-testid="workspace-content">
      <h2>Section: {activeSection}</h2>
      <p>Workspace ID: {workspaceId}</p>
      <p>Type: {workspaceType}</p>
      {children}
    </div>
  )
}));

describe('WorkspaceContainer Component', () => {
  const mockWorkspace: Workspace = {
    id: 'ws-123',
    name: 'Test Workspace',
    description: 'Test workspace description',
    type: WorkspaceType.TEAM,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'user-123',
    ownerId: 'team-123',
    members: [],
    settings: {
      isPublic: false,
      allowGuests: false,
      notificationsEnabled: true
    },
    customization: {
      theme: 'light',
      layout: 'default',
      widgets: []
    },
    isArchived: false
  };

  it('should render the workspace container with all components', () => {
    render(<WorkspaceContainer workspace={mockWorkspace} />);
    
    expect(screen.getByTestId('workspace-header')).toBeDefined();
    expect(screen.getByTestId('workspace-navigation')).toBeDefined();
    expect(screen.getByTestId('workspace-content')).toBeDefined();
  });
  
  it('should pass correct props to the header component', () => {
    render(<WorkspaceContainer workspace={mockWorkspace} />);
    
    const header = screen.getByTestId('workspace-header');
    expect(header.querySelector('h1')?.textContent).toBe('Test Workspace');
    expect(header.querySelector('p')?.textContent).toBe('Test workspace description');
    expect(header.querySelector('span')?.textContent).toBe('Type: team');
  });
  
  it('should start with overview as the active section', () => {
    render(<WorkspaceContainer workspace={mockWorkspace} />);
    
    const content = screen.getByTestId('workspace-content');
    expect(content.querySelector('h2')?.textContent).toBe('Section: overview');
  });
  
  it('should change the active section when navigation is clicked', () => {
    render(<WorkspaceContainer workspace={mockWorkspace} />);
    
    const navigationButtons = screen.getByTestId('workspace-navigation').querySelectorAll('button');
    fireEvent.click(navigationButtons[1]); // Click on "Activity"
    
    const content = screen.getByTestId('workspace-content');
    expect(content.querySelector('h2')?.textContent).toBe('Section: activity');
  });
  
  it('should render children inside the content component', () => {
    render(
      <WorkspaceContainer workspace={mockWorkspace}>
        <div data-testid="child-content">Child Content</div>
      </WorkspaceContainer>
    );
    
    expect(screen.getByTestId('child-content')).toBeDefined();
    expect(screen.getByTestId('child-content').textContent).toBe('Child Content');
  });
});