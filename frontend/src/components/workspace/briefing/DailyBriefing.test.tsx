import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { DailyBriefing } from './DailyBriefing';
import { ChakraProvider } from '@chakra-ui/react';

// Mock matchMedia for tests
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

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

// Create a mock implementation that we can modify in individual tests
const mockImplementation = {
  events: mockCalendarEvents,
  isLoading: false,
  error: null,
};

// Mock the API hook
vi.mock('../../../hooks/useCalendarEvents', () => ({
  useCalendarEvents: () => mockImplementation
}));

describe('DailyBriefing', () => {
  // Reset the mock implementation before each test
  beforeEach(() => {
    mockImplementation.events = mockCalendarEvents;
    mockImplementation.isLoading = false;
    mockImplementation.error = null;
  });
  it('renders calendar events in the schedule tab', () => {
    render(
      <ChakraProvider>
        <DailyBriefing />
      </ChakraProvider>
    );
    
    // The component should default to the first tab (Schedule)
    expect(screen.getByText('Team Standup')).toBeInTheDocument();
    expect(screen.getByText('Project Review')).toBeInTheDocument();
  });

  it('displays event times in compact view', () => {
    render(
      <ChakraProvider>
        <DailyBriefing />
      </ChakraProvider>
    );
    
    // In compact view, only start time is displayed separately
    expect(screen.getByText('09:30')).toBeInTheDocument();
    expect(screen.getByText('11:00')).toBeInTheDocument();
  });
  
  it('toggles between compact and expanded views', () => {
    render(
      <ChakraProvider>
        <DailyBriefing />
      </ChakraProvider>
    );
    
    // Default is compact view - we can check for attendees tags, but need to use getAllByText
    // because there might be multiple elements with the same text
    const attendeesTags = screen.getAllByText('3 attendees');
    expect(attendeesTags.length).toBeGreaterThan(0);
    
    // Click expand button
    const expandButton = screen.getByText('Expand');
    fireEvent.click(expandButton);
    
    // Now we should see the expanded view with full time range
    expect(screen.getByText('09:30 - 10:00')).toBeInTheDocument();
    expect(screen.getByText('11:00 - 12:00')).toBeInTheDocument();
    
    // And the button text should change
    expect(screen.getByText('Compact')).toBeInTheDocument();
  });

  it('shows loading state when events are loading', () => {
    // Override mock for this test
    mockImplementation.events = [];
    mockImplementation.isLoading = true;
    
    render(
      <ChakraProvider>
        <DailyBriefing />
      </ChakraProvider>
    );
    
    expect(screen.getByTestId('briefing-skeleton')).toBeInTheDocument();
  });

  it('shows error state when API fails', () => {
    // Override mock for this test
    mockImplementation.events = [];
    mockImplementation.isLoading = false;
    mockImplementation.error = 'Failed to fetch calendar events';
    
    render(
      <ChakraProvider>
        <DailyBriefing />
      </ChakraProvider>
    );
    
    expect(screen.getByText(/unable to load calendar events/i)).toBeInTheDocument();
  });

  it('shows AI-generated meeting preparation tab', () => {
    render(
      <ChakraProvider>
        <DailyBriefing />
      </ChakraProvider>
    );
    
    // Click on the Meeting Prep tab
    const meetingPrepTab = screen.getByText('Meeting Prep');
    fireEvent.click(meetingPrepTab);
    
    // Now the meeting preparation section should be visible
    expect(screen.getByTestId('meeting-preparation')).toBeInTheDocument();
    
    // Get all instances of text since these appear multiple times in the accordion items
    expect(screen.getAllByText('Key Participants:').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Suggested Talking Points:').length).toBeGreaterThan(0);
  });
  
  it('shows tab navigation with correct counts', () => {
    render(
      <ChakraProvider>
        <DailyBriefing />
      </ChakraProvider>
    );
    
    expect(screen.getByText(`Schedule (${mockCalendarEvents.length})`)).toBeInTheDocument();
    expect(screen.getByText('Meeting Prep')).toBeInTheDocument();
  });
});