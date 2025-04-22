import React from 'react';
import {
    Box, Heading, Text, VStack, Spinner, Alert, AlertIcon, CloseButton, HStack 
    // Add Drawer or Modal components if needed for display
} from '@chakra-ui/react';

// TODO: Define interface for Calendar Event data
interface CalendarEvent {
    id: string;
    summary: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    // Add other relevant fields like description, attendees, etc.
}

interface DailyBriefingPanelProps {
    isOpen: boolean; // To control visibility (if using Drawer/Modal)
    onClose: () => void; // To close the panel
}

const DailyBriefingPanel: React.FC<DailyBriefingPanelProps> = ({ isOpen, onClose }) => {
    const [events, setEvents] = React.useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    
    // TODO: Add useEffect hook to fetch data from '/integrations/google/calendar/events'
    // Need to handle authentication (useApiClient) and potential errors

    React.useEffect(() => {
        if (!isOpen) {
             // Optionally clear state when closed
            // setEvents([]);
            // setError(null);
            return; 
        }

        const fetchBriefing = async () => {
            setIsLoading(true);
            setError(null);
            // TODO: Implement API call using useApiClient
            try {
                // const apiClient = useApiClient(); // Get client instance
                // const response = await apiClient.get('/integrations/google/calendar/events');
                // setEvents(response.data || []);
                console.warn("Calendar fetching not implemented yet.");
                setEvents([]); // Placeholder
            } catch (err) {
                console.error("Error fetching daily briefing:", err);
                setError("Failed to load briefing data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchBriefing();

    }, [isOpen]); // Re-fetch when isOpen changes to true

    // Basic rendering logic
    const renderContent = () => {
        if (isLoading) {
            return <Spinner />;
        }
        if (error) {
            return <Alert status="error"><AlertIcon />{error}</Alert>;
        }
        if (events.length === 0) {
            return <Text>No upcoming events found for today.</Text>;
        }
        return (
            <VStack align="stretch" spacing={3}>
                {events.map(event => (
                    <Box key={event.id} p={2} borderWidth="1px" borderRadius="md">
                        <Heading size="xs">{event.summary}</Heading>
                        {/* TODO: Format start/end times nicely */}
                        <Text fontSize="sm">{event.start?.dateTime || event.start?.date}</Text>
                    </Box>
                ))}
            </VStack>
        );
    };

    // TODO: Wrap with Drawer or Modal component if needed
    // Example using a simple Box for now if rendered directly in layout
    return (
        <Box p={4}>
            <HStack justifyContent="space-between" mb={4}>
                 <Heading size="md">Daily Briefing</Heading>
                 <CloseButton onClick={onClose} />
             </HStack>
            {renderContent()}
        </Box>
    );
};

export default DailyBriefingPanel; 