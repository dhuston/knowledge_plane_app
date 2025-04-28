import React from 'react';
import {
    Box,
    Heading,
    Text,
    Spinner,
    Alert,
    AlertIcon,
    CloseButton,
    HStack,
    // Add Drawer or Modal components if needed for display
} from '@chakra-ui/react';

import { useApiClient } from '../../hooks/useApiClient';

// Define interface for the briefing response
interface BriefingResponse {
    summary: string;
}

interface DailyBriefingPanelProps {
    isOpen: boolean; // To control visibility (if using Drawer/Modal)
    onClose: () => void; // To close the panel
}

const DailyBriefingPanel: React.FC<DailyBriefingPanelProps> = ({ isOpen, onClose }) => {
    // State to hold the briefing summary string
    const [briefingSummary, setBriefingSummary] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    
    // API client for authenticated calls
    const apiClient = useApiClient();

    React.useEffect(() => {
        if (!isOpen) {
             // Optionally clear state when closed
            // setBriefingSummary(null);
            // setError(null);
            return; 
        }

        const fetchBriefing = async () => {
            setIsLoading(true);
            setError(null);
            setBriefingSummary(null);
            try {
                // Fetch from the new briefing endpoint
                const response = await apiClient.get<BriefingResponse>('/briefings/daily');
                setBriefingSummary(response.data.summary || "No briefing summary available.");
            } catch (err) {
                console.error("Error fetching daily briefing:", err);
                setError("Failed to load briefing data.");
                setBriefingSummary(null); // Clear summary on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchBriefing();

    }, [isOpen, apiClient]); // Re-fetch when isOpen changes or apiClient changes

    // Basic rendering logic
    const renderContent = () => {
        if (isLoading) {
            return <Spinner />;
        }
        if (error) {
            return <Alert status="error"><AlertIcon />{error}</Alert>;
        }
        if (!briefingSummary) {
            return <Text>No briefing available.</Text>;
        }
        return (
            // Display the summary text, potentially using Markdown or similar rendering later
            // For now, just display the raw string, respecting whitespace
            <Text whiteSpace="pre-wrap"> 
                {briefingSummary}
            </Text>
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