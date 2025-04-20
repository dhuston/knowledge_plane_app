import React, { useEffect, useState, useMemo } from 'react';
import {
    Box, Text, Spinner, Heading, VStack, CloseButton, Divider, Tag, Code,
    List, ListItem, ListIcon, Textarea, Button, Avatar, HStack, Input, IconButton, useToast
} from '@chakra-ui/react';
import { MdCalendarToday, MdNote, MdPersonAdd } from "react-icons/md";
import { MapNode } from '../../types/map'; // Import the correct MapNode type
// import { AxiosResponse } from 'axios'; // REMOVED - Workaround for import issue

import { apiClient } from '../../api/client'; // Correct path and named import
import { useAuth } from '../../context/AuthContext'; // Correct path and named import

// Import specific entity types - FILES NOW EXIST
import { User } from '../../types/user'; 
import { Team } from '../../types/team'; 
import { Project } from '../../types/project'; 
import { Goal } from '../../types/goal'; 
import { NoteCreate, Note } from '../../types/knowledge_asset'; // Use specific NoteCreate and Note
import { MapNodeTypeEnum } from '../../types/map'; // Import MapNodeTypeEnum

// Define a type for Google Calendar events (adjust based on actual API response)
interface CalendarEvent {
    id: string;
    summary: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    htmlLink?: string;
}

interface BriefingPanelProps {
    nodeData: MapNode | null; // Use the API MapNode type from parent
    isOpen: boolean; // Add isOpen prop to control visibility from parent
    onClose: () => void;
}

const BriefingPanel: React.FC<BriefingPanelProps> = ({ nodeData, isOpen, onClose }) => {
    // Use actual imported types
    const [entityData, setEntityData] = useState<User | Team | Project | Goal | null>(null); 
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]); 
    const [notes, setNotes] = useState<Note[]>([]); // Use Note[] type
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isBriefingLoading, setIsBriefingLoading] = useState<boolean>(false); // Separate loading state
    const [error, setError] = useState<string | null>(null);
    const [isNotesLoading, setIsNotesLoading] = useState<boolean>(false); // Loading state for notes
    const [newNoteContent, setNewNoteContent] = useState<string>(''); // State for new note input
    const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false); // Loading state for note submission
    const { token, user: currentUser } = useAuth();
    const toast = useToast(); // Initialize toast here
    const [inviteSearch, setInviteSearch] = useState(''); // Mock search state

    const nodeType = useMemo(() => nodeData?.type, [nodeData]);
    const nodeId = useMemo(() => nodeData?.id, [nodeData]);

    const isCurrentUserSelected = useMemo(() => {
        return nodeType === MapNodeTypeEnum.USER && nodeId === currentUser?.id;
    }, [nodeType, nodeId, currentUser]);

    // Determine API endpoint based on node type stored during transformation
    const apiEndpoint = useMemo(() => {
        if (!nodeId || !nodeType) return null;
        // Use the nodeType directly from the MapNode prop
        switch (nodeType) {
            case MapNodeTypeEnum.USER: return `/users/${nodeId}`;
            case MapNodeTypeEnum.TEAM: return `/teams/${nodeId}`;
            case MapNodeTypeEnum.PROJECT: return `/projects/${nodeId}`;
            case MapNodeTypeEnum.GOAL: return `/goals/${nodeId}`; 
            // Add other types if needed (DEPARTMENT, KNOWLEDGE_ASSET)
            default: return null;
        }
    }, [nodeId, nodeType]);

    useEffect(() => {
        const fetchNodeDetails = async () => {
            if (!apiEndpoint || !token || !nodeId || !nodeType) { // Check nodeType too
                setEntityData(null);
                setError(null);
                setCalendarEvents([]);
                setNotes([]); // Clear notes
                return;
            }

            setIsLoading(true);
            setError(null);
            setCalendarEvents([]);
            setNotes([]); // Clear notes

            let entityType: 'user' | 'team' | 'project' | 'goal' | null = null; // Track entity type, add goal

            try {
                // Rely on type inference for response
                const response = await apiClient.get(apiEndpoint);
                // Use specific assertion workaround
                setEntityData((response as { data: User | Team | Project | Goal | null }).data); 
                
                // Determine entity type AFTER successful fetch
                if (nodeType === MapNodeTypeEnum.USER) entityType = 'user';
                else if (nodeType === MapNodeTypeEnum.TEAM) entityType = 'team';
                else if (nodeType === MapNodeTypeEnum.PROJECT) entityType = 'project';
                else if (nodeType === MapNodeTypeEnum.GOAL) entityType = 'goal';

                // Fetch related data based on type
                if (entityType === 'user' && isCurrentUserSelected) {
                   // Fetch calendar events
                   setIsBriefingLoading(true);
                   try {
                        // Rely on type inference for eventsResponse
                        const eventsResponse = await apiClient.get('/integrations/google/calendar/events');
                        // Use specific assertion workaround
                        setCalendarEvents((eventsResponse as { data: CalendarEvent[] | null }).data || []);
                    } catch (briefingErr) {
                        console.error("Error fetching calendar events:", briefingErr);
                        toast({ title: "Could not load briefing events", status: "warning", duration: 3000 });
                    } finally {
                        setIsBriefingLoading(false);
                    }
                } else if (entityType === 'project') {
                    // Fetch notes for the project
                    setIsNotesLoading(true);
                    try {
                         // Rely on type inference for notesResponse
                        const notesResponse = await apiClient.get(`/projects/${nodeId}/notes`);
                        // Use specific assertion workaround
                        setNotes((notesResponse as { data: Note[] | null }).data || []);
                    } catch (notesErr) {
                        console.error("Error fetching notes:", notesErr);
                        toast({ title: "Could not load notes", status: "warning", duration: 3000 });
                    } finally {
                         setIsNotesLoading(false);
                    }
                }

            } catch (err: unknown) {
                console.error(`Error fetching details from ${apiEndpoint}:`, err);
                setError("Failed to load details.");
                setEntityData(null); // Clear data on error
            } finally {
                setIsLoading(false);
            }
        };

        fetchNodeDetails();
    }, [apiEndpoint, token, nodeId, nodeType, isCurrentUserSelected, toast]); // Update dependencies

    // --- Note Submission Handler ---
    const handleNoteSubmit = async () => {
        if (!newNoteContent.trim() || !nodeId || nodeType !== MapNodeTypeEnum.PROJECT) { // Check nodeType
            return;
        }
        setIsSubmittingNote(true);
        // Use actual imported NoteCreate type
        const noteData: NoteCreate = {
            content: newNoteContent.trim(),
            project_id: nodeId, // Use nodeId
            type: 'note', // Explicitly set type
            // title is optional for notes
        };

        try {
            // Rely on type inference for response
            const response = await apiClient.post(`/projects/${nodeId}/notes`, noteData);
            // Use specific assertion workaround
            setNotes(prevNotes => [(response as { data: Note }).data, ...prevNotes]); // Add new note to the top
            setNewNoteContent(''); // Clear input
            toast({ title: "Note added", status: "success", duration: 2000 });
        } catch (error: unknown) {
            console.error("Failed to add note:", error);
            let errorMessage = "Could not add note.";
             if (typeof error === 'object' && error !== null && 'response' in error) {
                 const responseError = error as { response?: { data?: { detail?: string } } };
                 errorMessage = responseError.response?.data?.detail || errorMessage;
             } else if (error instanceof Error) { errorMessage = error.message; }
             toast({ title: "Error adding note", description: errorMessage, status: "error", duration: 5000 });
        } finally {
            setIsSubmittingNote(false);
        }
    };

    // Render functions for different entity types
    const renderUserContent = (data: User) => (
        <VStack align="stretch" spacing={3}>
            <Heading size="sm">{data.name ?? 'User Details'}</Heading>
            <Divider />
            <Text fontSize="sm">**ID:** <Code fontSize="xs">{data.id ?? 'N/A'}</Code></Text>
            <Text fontSize="sm">**Email:** {data.email ?? 'N/A'}</Text>
            <Text fontSize="sm">**Title:** {data.title ?? 'N/A'}</Text>
            {/* <Text fontSize="sm">**Team ID:** {data.team_id || 'N/A'}</Text> */} 
            {/* <Text fontSize="sm">**Manager ID:** {data.manager_id || 'N/A'}</Text> */} 
            
            {/* Show Briefing if it's the current user */} 
            {isCurrentUserSelected && (
                <Box pt={4}>
                    <Heading size="xs" mb={2}>Daily Briefing</Heading>
                    <Divider mb={2}/>
                    {isBriefingLoading ? (
                        <Spinner size="sm" />
                    ) : calendarEvents.length > 0 ? (
                        <List spacing={2}>
                            {calendarEvents.map(event => (
                                <ListItem key={event.id} fontSize="sm">
                                    <ListIcon as={MdCalendarToday} color="green.500" />
                                    {event.summary}
                                    {/* Optionally format start/end times */}
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Text fontSize="sm" color="gray.500">No upcoming events found.</Text>
                    )}
                </Box>
            )}
        </VStack>
    );

    const renderTeamContent = (data: Team) => (
        <VStack align="stretch" spacing={3}>
            <Heading size="sm">{data.name ?? 'Team Details'}</Heading>
             <Divider />
             <Text fontSize="sm">**ID:** <Code fontSize="xs">{data.id ?? 'N/A'}</Code></Text>
             <Text fontSize="sm">**Description:** {data.description ?? 'N/A'}</Text>
             {/* TODO: Fetch and display members? */} 
             {/* <Text fontSize="sm">**Lead ID:** {data.lead_id || 'N/A'}</Text> */} 
        </VStack>
    );

    const renderProjectContent = (data: Project) => {
        // Mock participants for visual demo
        const mockParticipants = [
            { id: 'user-1', name: 'Alice Manager' },
            { id: 'user-2', name: 'Bob Report' },
            { id: 'current-user', name: currentUser?.name || 'You' } // Include current user maybe
        ];

        return (
            <VStack align="stretch" spacing={3}>
                <Heading size="sm">{data.name ?? 'Project Details'}</Heading>
                <Divider />
                <Text fontSize="sm">**ID:** <Code fontSize="xs">{data.id ?? 'N/A'}</Code></Text>
                <Text fontSize="sm">**Status:** <Tag size="sm">{data.status ?? 'N/A'}</Tag></Text>
                <Text fontSize="sm">**Description:** {data.description ?? 'N/A'}</Text>

                {/* Participants Section (Visual Mock) */}
                <Box pt={4}>
                    <Heading size="xs" mb={2}>Members</Heading>
                    <Divider mb={3}/>
                    <HStack mb={3}>
                        <Input 
                            placeholder="Invite user by name..." 
                            size="sm"
                            value={inviteSearch}
                            onChange={(e) => setInviteSearch(e.target.value)}
                            isDisabled // Disable for mock
                        />
                        <IconButton 
                            aria-label="Add member" 
                            icon={<MdPersonAdd />} 
                            size="sm" 
                            colorScheme="brand" 
                            variant="outline"
                            isDisabled // Disable for mock
                        />
                    </HStack>
                    <VStack align="stretch" spacing={2} pl={2} maxH="150px" overflowY="auto">
                        {mockParticipants.map(p => (
                            <HStack key={p.id} spacing={2}>
                                <Avatar size="xs" name={p.name} />
                                <Text fontSize="sm">{p.name}</Text>
                            </HStack>
                        ))}
                    </VStack>
                </Box>

                {/* Notes Section */}
                <Box pt={4}>
                    <Heading size="xs" mb={2}>Notes</Heading>
                    <Divider mb={3}/>
                    {/* Add Note Form */}
                    <VStack align="stretch" mb={4} spacing={2}>
                         <Textarea 
                             placeholder="Add a new note..."
                             value={newNoteContent}
                             onChange={(e) => setNewNoteContent(e.target.value)}
                             size="sm"
                             isDisabled={isSubmittingNote}
                         />
                         <Button 
                             size="sm" 
                             colorScheme="brand" 
                             onClick={handleNoteSubmit}
                             isLoading={isSubmittingNote}
                             isDisabled={!newNoteContent.trim()}
                             alignSelf="flex-end"
                         >
                             Add Note
                         </Button>
                    </VStack>

                    {/* Display Notes */}
                    {isNotesLoading ? (
                        <Spinner size="sm" />
                    ) : notes.length > 0 ? (
                        <List spacing={3}>
                            {notes.map(note => (
                                <ListItem key={note.id} fontSize="sm" bg="gray.50" p={2} borderRadius="md">
                                    <ListIcon as={MdNote} color="gray.500" />
                                    {note.content} 
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Text fontSize="sm" color="gray.500">No notes added yet.</Text>
                    )}
                </Box>
            </VStack>
        );
    };

    const renderContent = () => {
        if (!nodeData) return null; // Should not happen if panel is open, but safeguard
        if (isLoading) return <Spinner />;
        if (error) return <Text color="red.500">{error}</Text>;
        if (!entityData) return <Text>No details found for {nodeId}.</Text>; // Use nodeId

        // Remove type casting if possible, rely on TS knowing the type now
        switch (nodeType) { 
            case MapNodeTypeEnum.USER: return renderUserContent(entityData as User); // Keep cast for union type resolution
            case MapNodeTypeEnum.TEAM: return renderTeamContent(entityData as Team);
            case MapNodeTypeEnum.PROJECT: return renderProjectContent(entityData as Project);
            // case MapNodeTypeEnum.GOAL: return renderGoalContent(entityData as Goal); // Add later
            default:
                return <Text>Details view not implemented for type: {nodeType}</Text>;
        }
    };

    if (!isOpen) return null; // Don't render if not open

    return (
        <Box
            position="absolute"
            right={0}
            top={0}
            bottom={0}
            width={{ base: '100%', md: '350px' }}
            bg="white"
            p={4}
            boxShadow="lg"
            zIndex={10}
            overflowY="auto"
            borderLeft="1px solid"
            borderColor="gray.200"
        >
            <CloseButton position="absolute" top="8px" right="8px" onClick={onClose} />
            {renderContent()}
        </Box>
    );
};

export default BriefingPanel; 