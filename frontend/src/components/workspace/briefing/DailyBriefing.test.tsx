import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DailyBriefing } from './DailyBriefing';
import { ChakraProvider } from '@chakra-ui/react';

// Mock calendar events data
const mockCalendarEvents = [
  {
    id: '1',
    title: 'Team Standup',
    startTime: '09:30',
    endTime: '10:00',
    location: 'Virtual - Zoom',
    attendees: ['John Doe', 'Jane Smith', 'Bob Johnson'],
    summary: 'Daily standup meeting to discuss project progress and blockers.',
  },
  {
    id: '2',
    title: 'Project Review',
    startTime: '11:00',
    endTime: '12:00',
    location: 'Conference Room A',
    attendees: ['Jane Smith', 'Alice Brown', 'Charlie Wilson'],
    summary: 'Quarterly review of research project progress and milestones.',
  },
];

// Mock the API hook
vi.mock('../../../hooks/useCalendarEvents', () => ({
  useCalendarEvents: () => ({
    events: mockCalendarEvents,
    isLoading: false,
    error: null,
  }),
}));

describe('DailyBriefing', () => {
  it('renders calendar events', () => {
    render(
      <ChakraProvider>
        <DailyBriefing />
      </ChakraProvider>
    );
    
    expect(screen.getByText('Team Standup')).toBeInTheDocument();
    expect(screen.getByText('Project Review')).toBeInTheDocument();
  });

  it('displays event times', () => {
    render(
      <ChakraProvider>
        <DailyBriefing />
      </ChakraProvider>
    );
    
    expect(screen.getByText('09:30 - 10:00')).toBeInTheDocument();
    expect(screen.getByText('11:00 - 12:00')).toBeInTheDocument();
  });

  it('shows loading state when events are loading', () => {
    // Override mock for this test
    vi.mock('../../../hooks/useCalendarEvents', () => ({
      useCalendarEvents: () => ({
        events: [],
        isLoading: true,
        error: null,
      }),
    }), { virtual: true });
    
    render(
      <ChakraProvider>
        <DailyBriefing />
      </ChakraProvider>
    );
    
    expect(screen.getByTestId('briefing-skeleton')).toBeInTheDocument();
  });

  it('shows error state when API fails', () => {
    // Override mock for this test
    vi.mock('../../../hooks/useCalendarEvents', () => ({
      useCalendarEvents: () => ({
        events: [],
        isLoading: false,
        error: 'Failed to fetch calendar events',
      }),
    }), { virtual: true });
    
    render(
      <ChakraProvider>
        <DailyBriefing />
      </ChakraProvider>
    );
    
    expect(screen.getByText(/unable to load calendar events/i)).toBeInTheDocument();
  });

  it('shows AI-generated meeting preparation', () => {
    render(
      <ChakraProvider>
        <DailyBriefing />
      </ChakraProvider>
    );
    
    expect(screen.getByTestId('meeting-preparation')).toBeInTheDocument();
  });
});