import { useState, useEffect } from 'react';
import axios from 'axios';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  attendees: string[];
  summary: string;
}

interface CalendarHookResult {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook for fetching calendar events from the API
 * @returns Calendar events, loading state, error state, and refresh function
 */
export function useCalendarEvents(): CalendarHookResult {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would make an API call
      // For now, we'll return mock data after a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock calendar events
      const mockEvents: CalendarEvent[] = [
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
        {
          id: '3',
          title: 'Lunch with Jane',
          startTime: '12:30',
          endTime: '13:30',
          location: 'Cafeteria',
          attendees: ['Jane Smith'],
          summary: 'Informal lunch meeting to discuss collaboration opportunities.',
        },
        {
          id: '4',
          title: 'AI Knowledge Base Planning',
          startTime: '14:00',
          endTime: '15:30',
          location: 'Virtual - Teams',
          attendees: ['John Doe', 'Sarah Green', 'Thomas Lee', 'Aisha Khan'],
          summary: 'Planning session for the AI Knowledge Base project. Focus on architecture and data models.',
        },
      ];
      
      setEvents(mockEvents);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError('Failed to fetch calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    isLoading,
    error,
    refresh: fetchEvents,
  };
}