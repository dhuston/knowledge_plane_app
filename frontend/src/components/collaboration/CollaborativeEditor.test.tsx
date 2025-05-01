import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CollaborativeEditor from './CollaborativeEditor';
import { PresenceUser } from '../../models/collaboration/PresenceUser';

// Mock the useCollaborationService hook
jest.mock('../../hooks/useCollaborationService', () => ({
  useCollaborationService: () => ({
    subscribeToDocumentChanges: jest.fn(),
    sendContentChange: jest.fn(),
    sendCursorPosition: jest.fn()
  })
}));

describe('CollaborativeEditor', () => {
  const mockParticipants: PresenceUser[] = [
    {
      id: 'user1',
      name: 'John Doe',
      status: 'online',
      lastActive: new Date()
    },
    {
      id: 'user2',
      name: 'Jane Smith',
      status: 'away',
      lastActive: new Date(Date.now() - 300000) // 5 minutes ago
    }
  ];
  
  const mockProps = {
    documentId: 'doc-123',
    initialContent: 'Initial document content',
    participants: mockParticipants
  };
  
  it('renders without crashing', () => {
    render(<CollaborativeEditor {...mockProps} />);
    expect(screen.getByText(/Initial document content/)).toBeInTheDocument();
  });
  
  it('displays the correct number of participants', () => {
    render(<CollaborativeEditor {...mockProps} />);
    expect(screen.getByText('J')).toBeInTheDocument(); // First letter of John
  });
  
  it('shows save button when not in read-only mode', () => {
    render(<CollaborativeEditor {...mockProps} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });
  
  it('hides save button when in read-only mode', () => {
    render(<CollaborativeEditor {...mockProps} readOnly={true} />);
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.getByText('Read-only mode')).toBeInTheDocument();
  });
  
  it('updates content when typing', () => {
    render(<CollaborativeEditor {...mockProps} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New content' } });
    
    expect(textarea).toHaveValue('New content');
  });
  
  it('calls onSave when save button is clicked', async () => {
    const mockSave = jest.fn();
    render(<CollaborativeEditor {...mockProps} onSave={mockSave} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New content to save' } });
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith('New content to save');
    });
  });
  
  it('shows correct loading state when saving', async () => {
    const slowMockSave = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    render(<CollaborativeEditor {...mockProps} onSave={slowMockSave} />);
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument();
    });
  });
  
  it('shows document ID in the footer', () => {
    render(<CollaborativeEditor {...mockProps} />);
    expect(screen.getByText(/Document ID: doc-123/)).toBeInTheDocument();
  });
});