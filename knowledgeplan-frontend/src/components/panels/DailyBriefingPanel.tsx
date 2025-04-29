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
    VStack,
    Icon,
    Flex,
    Badge,
    Divider,
    Link,
    useColorModeValue,
} from '@chakra-ui/react';
import { MdOutlineInsights } from 'react-icons/md';
import { FiClock, FiCalendar, FiAlertCircle, FiCheckCircle, FiFileText, FiUsers } from 'react-icons/fi';

import { useApiClient } from '../../hooks/useApiClient';

// Define interfaces for the briefing response
interface Experiment {
    id: string;
    name: string;
    status: string;
    dueTime?: string;
    dueMinutes?: number;
}

interface ScheduleItem {
    id: string;
    title: string;
    time: string;
    type: 'meeting' | 'deadline' | 'reminder';
}

interface Update {
    id: string;
    title: string;
    type: string;
    time?: string;
}

interface Action {
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
}

interface BriefingResponse {
    summary: string;
    greeting?: string;
    name?: string;
    experiments?: Experiment[];
    schedule?: ScheduleItem[];
    updates?: Update[];
    actions?: Action[];
}

interface DailyBriefingPanelProps {
    isOpen: boolean; // To control visibility (if using Drawer/Modal)
    onClose: () => void; // To close the panel
}

const DailyBriefingPanel: React.FC<DailyBriefingPanelProps> = ({ isOpen, onClose }) => {
    // State to hold the briefing data
    const [briefingData, setBriefingData] = React.useState<BriefingResponse | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // API client for authenticated calls
    const apiClient = useApiClient();

    // Colors for styling
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.700');
    const highlightBg = useColorModeValue('primary.50', 'primary.900');
    const secondaryText = useColorModeValue('gray.600', 'gray.400');
    const accentColor = useColorModeValue('primary.500', 'primary.300');
    const subtleBg = useColorModeValue('gray.50', 'gray.800');

    React.useEffect(() => {
        if (!isOpen) {
            return;
        }

        const fetchBriefing = async () => {
            setIsLoading(true);
            setError(null);
            setBriefingData(null);
            try {
                // Fetch from the briefing endpoint
                const response = await apiClient.get<BriefingResponse>('/briefings/daily');

                // Just use the data from the API response
                setBriefingData({
                    summary: response.data.summary || "No summary available for today.",
                    // We'll use the current time of day for the greeting
                    greeting: `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}`,
                    // Use the user's name if available from the response
                    name: response.data.name
                });
            } catch (err) {
                console.error("Error fetching daily briefing:", err);
                setError("Failed to load briefing data.");
                setBriefingData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBriefing();

    }, [isOpen, apiClient]); // Re-fetch when isOpen changes or apiClient changes

    // We'll use a single function to render the AI-generated summary
    const renderSummary = () => {
        if (!briefingData?.summary) {
            return null;
        }

        return (
            <Box>
                <Text whiteSpace="pre-wrap" fontSize="md" lineHeight="tall">
                    {briefingData.summary}
                </Text>
            </Box>
        );
    };

    // Basic rendering logic
    const renderContent = () => {
        if (isLoading) {
            return (
                <Center py={8}>
                    <Spinner color="primary.500" size="lg" />
                </Center>
            );
        }

        if (error) {
            return <Alert status="error" variant="left-accent"><AlertIcon />{error}</Alert>;
        }

        if (!briefingData) {
            return (
                <Box textAlign="center" py={8}>
                    <Icon as={MdOutlineInsights} boxSize={12} color="gray.400" mb={4} />
                    <Text fontSize="lg" fontWeight="medium" mb={2}>No briefing available</Text>
                    <Text color="gray.500">Check back later for your daily research insights</Text>
                </Box>
            );
        }

        return (
            <VStack spacing={4} align="stretch">
                {/* Greeting */}
                <Heading size="md">
                    {briefingData.greeting || 'Good afternoon'}, {briefingData.name || 'there'}
                </Heading>

                {/* Main content - AI-generated summary */}
                <Box mt={2}>
                    {renderSummary()}
                </Box>
            </VStack>
        );
    };

    return (
        <Box
            p={5}
            bg={cardBg}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="md"
            maxW="800px"
            mx="auto"
            my={4}
        >
            <HStack justifyContent="space-between" mb={4}>
                <HStack spacing={2}>
                    <Icon as={MdOutlineInsights} color={accentColor} boxSize={5} />
                    <Heading size="md">Daily Briefing</Heading>
                </HStack>
                <CloseButton onClick={onClose} />
            </HStack>
            <Divider mb={4} />
            {renderContent()}
        </Box>
    );
};

export default DailyBriefingPanel;