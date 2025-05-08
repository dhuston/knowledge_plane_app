import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

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
      // Check if the calendar endpoint is available
      const endpointAvailable = await apiClient.isEndpointAvailable('/api/v1/calendar/events/today');
      
      if (!endpointAvailable) {
        console.warn("Calendar API endpoint is not available");
        setEvents([]);
        setError("Calendar service not available");
        setIsLoading(false);
        return;
      }

      // Fetch calendar events from the API
      const response = await apiClient.get<{ data: CalendarEvent[] }>('/calendar/events/today');
      
      // Process response with defensive checks
      if (response && response.data && Array.isArray(response.data)) {
        setEvents(response.data);
      } else {
        // Set empty array if data is not in expected format
        setEvents([]);
      }
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError('Failed to fetch calendar events');
      setEvents([]);
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