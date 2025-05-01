import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NaturalLanguageInterface } from './NaturalLanguageInterface';
import { ChakraProvider } from '@chakra-ui/react';

// Mock the query processing service
vi.mock('../../../services/nlqService', () => ({
  processQuery: vi.fn((query) => {
    if (query.includes('team') && query.includes('members')) {
      return Promise.resolve({
        type: 'team',
        data: {
          teamName: 'Research Team',
          members: [
            { id: '1', name: 'John Smith', role: 'Research Lead' },
            { id: '2', name: 'Jane Doe', role: 'Senior Researcher' },
            { id: '3', name: 'Bob Johnson', role: 'Data Scientist' }
          ]
        },
        message: 'Here are the members of the Research Team:'
      });
    } else if (query.includes('project') && query.includes('status')) {
      return Promise.resolve({
        type: 'project',
        data: {
          projectName: 'Knowledge Graph Enhancement',
          status: 'In Progress',
          progress: 65,
          dueDate: '2025-06-15'
        },
        message: 'Current status of Knowledge Graph Enhancement project:'
      });
    } else {
      return Promise.resolve({
        type: 'text',
        data: null,
        message: "I'm sorry, I couldn't understand that query. Try asking about team members or project status."
      });
    }
  })
}));

describe('NaturalLanguageInterface', () => {
  it('renders the input field', () => {
    render(
      <ChakraProvider>
        <NaturalLanguageInterface />
      </ChakraProvider>
    );
    
    expect(screen.getByPlaceholderText(/ask anything/i)).toBeInTheDocument();
  });
  
  it('submits a query and displays the response', async () => {
    render(
      <ChakraProvider>
        <NaturalLanguageInterface />
      </ChakraProvider>
    );
    
    const input = screen.getByPlaceholderText(/ask anything/i);
    fireEvent.change(input, { target: { value: 'Show me research team members' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('Here are the members of the Research Team:')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Research Lead')).toBeInTheDocument();
    });
  });
  
  it('handles project status queries', async () => {
    render(
      <ChakraProvider>
        <NaturalLanguageInterface />
      </ChakraProvider>
    );
    
    const input = screen.getByPlaceholderText(/ask anything/i);
    fireEvent.change(input, { target: { value: 'What is the status of the Knowledge Graph project?' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('Current status of Knowledge Graph Enhancement project:')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
    });
  });
  
  it('displays error for unrecognized queries', async () => {
    render(
      <ChakraProvider>
        <NaturalLanguageInterface />
      </ChakraProvider>
    );
    
    const input = screen.getByPlaceholderText(/ask anything/i);
    fireEvent.change(input, { target: { value: 'What is the meaning of life?' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText(/I'm sorry, I couldn't understand that query/i)).toBeInTheDocument();
    });
  });
  
  it('shows loading state during query processing', async () => {
    render(
      <ChakraProvider>
        <NaturalLanguageInterface />
      </ChakraProvider>
    );
    
    const input = screen.getByPlaceholderText(/ask anything/i);
    fireEvent.change(input, { target: { value: 'Show me research team members' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(screen.getByTestId('query-loading')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByTestId('query-loading')).not.toBeInTheDocument();
    });
  });
});