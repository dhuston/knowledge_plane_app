import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Box, Text, Spinner, Heading, VStack, /* CloseButton, */ Divider, Tag, Code,
    /* List, ListItem, */ Textarea, Button, Avatar, HStack, /* Input, */ useToast // Cleaned up imports
} from '@chakra-ui/react';
import { MdNote /* MdPersonAdd */ } from "react-icons/md"; // Cleaned up imports
import { MapNode, MapNodeTypeEnum } from '../../types/map';

// import { apiClient } from '../../api/client'; // Removed unused
// import { useAuth } from '../../context/AuthContext'; // REMOVED unused import

// Import specific entity types
import { User } from '../../types/user'; // Use User
import { TeamRead } from '../../types/team'; // Use TeamRead
import { ProjectRead } from '../../types/project'; // Use ProjectRead
import { GoalRead } from '../../types/goal'; // Use GoalRead
import { NoteCreate, Note } from '../../types/knowledge_asset';
import { useApiClient } from '../../hooks/useApiClient'; // Corrected path relative to src/components/panels
// import { Link as RouterLink } from 'react-router-dom'; // Removed unused

// Define a type for Google Calendar events (Removed - not used here)
// interface CalendarEvent { ... }

interface BriefingPanelProps {
    node: MapNode | null; // The selected node data from the map
    onSelectNode: (nodeId: string, nodeType: MapNodeTypeEnum) => void; // Add callback prop
}

const BriefingPanel: React.FC<BriefingPanelProps> = ({ node, onSelectNode }) => {
    // Use specific Read types matching API responses
    const [entityData, setEntityData] = useState<User | TeamRead | ProjectRead | GoalRead | null>(null);
    const [notes, setNotes] = useState<Note[]>([]); 
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isNotesLoading, setIsNotesLoading] = useState<boolean>(false);
    const [newNoteContent, setNewNoteContent] = useState<string>(''); 
    const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
    // const { user: currentUser } = useAuth(); // Removed as unused 
    const toast = useToast();

    const nodeType = useMemo(() => node?.type, [node]);
    const nodeId = useMemo(() => node?.id, [node]);

    const apiClient = useApiClient();

    // --- Callback Definitions --- 
    // Wrap fetchProjectNotes in useCallback
    const fetchProjectNotes = useCallback(async (projectId: string) => {
        console.log(`Fetching notes for project ${projectId}...`);
        setIsNotesLoading(true);
        try {
            const response = await apiClient.get<Note[]>(`/projects/${projectId}/notes`);
            setNotes(response.data || []); 
        } catch (err) {
            console.error("Error fetching notes:", err);
            toast({ title: "Error Loading Notes", status: "error", duration: 3000 });
            setNotes([]); 
        } finally {
            setIsNotesLoading(false);
        }
    }, [apiClient, toast]); // Dependencies of the callback

    // Fetch main entity details and related data (notes)
    useEffect(() => {
        setEntityData(null); 
        setError(null);
        setNotes([]);
        if (!nodeId || !nodeType) {
            setIsLoading(false);
            return;
        }

        let apiEndpoint = '';
        let fetchSuccess = true;

        switch (nodeType) {
            case MapNodeTypeEnum.USER: apiEndpoint = `/users/${nodeId}`; break;
            case MapNodeTypeEnum.TEAM: apiEndpoint = `/teams/${nodeId}`; break;
            case MapNodeTypeEnum.PROJECT: apiEndpoint = `/projects/${nodeId}`; break;
            case MapNodeTypeEnum.GOAL: apiEndpoint = `/goals/${nodeId}`; break; 
            case MapNodeTypeEnum.DEPARTMENT: apiEndpoint = `/departments/${nodeId}`; break;
            default: 
                setError(`Unsupported node type for detail fetching: ${nodeType}`);
                setIsLoading(false);
                fetchSuccess = false;
                return;
        }

        const fetchNodeDetails = async () => {
            console.log(`Fetching details for ${nodeType} ${nodeId} from ${apiEndpoint}`);
            setIsLoading(true);
            let fetchedEntityData: User | TeamRead | ProjectRead | GoalRead | null = null;

            try {
                // Fetch full response
                if (nodeType === MapNodeTypeEnum.USER) {
                     const response = await apiClient.get<User>(apiEndpoint);
                     fetchedEntityData = response.data; // Access .data
                } else { 
                     const response = await apiClient.get<TeamRead | ProjectRead | GoalRead>(apiEndpoint);
                     fetchedEntityData = response.data; // Access .data
                }
               
                setEntityData(fetchedEntityData);
                console.log("Fetched entity data:", fetchedEntityData);

                // Fetch related data ONLY if main fetch succeeded
                 if (nodeType === MapNodeTypeEnum.PROJECT && nodeId) {
                    // Call the memoized fetchProjectNotes
                    await fetchProjectNotes(nodeId);
                 }
                 // Removed calendar fetch logic

            } catch (err: unknown) { 
                console.error("Error fetching node details:", err);
                 let detail = "Unknown error";
                 // Safer error handling: Check instanceof Error first
                 if (err instanceof Error) { 
                     detail = err.message;
                     // Check if it might be an axios-like error object
                     if ('response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response) {
                         const responseError = err.response as { data?: { detail?: string } };
                         detail = responseError.data?.detail || detail;
                     }
                 } else if (typeof err === 'object' && err !== null) {
                     // Handle potential non-Error objects with response structure
                      if ('response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response) {
                         const responseError = err.response as { data?: { detail?: string } };
                         detail = responseError.data?.detail || detail;
                      } else {
                         detail = String(err); // Fallback to string conversion
                      }
                 }
                 setError(`Failed to load details: ${detail}`);
                 toast({ title: "Error Loading Details", description: detail, status: "error", duration: 5000, isClosable: true });
                 fetchSuccess = false;
            } finally {
                 setIsLoading(false);
            }
        };
        
        if(fetchSuccess) {
             fetchNodeDetails();
        }
       
    }, [nodeId, nodeType, apiClient, toast, fetchProjectNotes]); // Removed currentUser dependency

    // Wrap handleNoteSubmit in useCallback
    const handleNoteSubmit = useCallback(async () => {
        if (!newNoteContent.trim() || !nodeId || nodeType !== MapNodeTypeEnum.PROJECT) return;
        setIsSubmittingNote(true);
        const noteData: NoteCreate = { 
            content: newNoteContent.trim(),
        };
        try {
            const response = await apiClient.post<Note>(`/projects/${nodeId}/notes`, noteData);
            setNotes(prevNotes => [response.data, ...prevNotes]);
            setNewNoteContent('');
            toast({ title: "Note Added", status: "success", duration: 2000 });
        } catch (err: unknown) {
            console.error("Error submitting note:", err);
            let detail = "Could not add note.";
             if (err instanceof Error) { 
                 detail = err.message;
                 if ('response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response) {
                     const responseError = err.response as { data?: { detail?: string } };
                     detail = responseError.data?.detail || detail;
                 }
             } else if (typeof err === 'object' && err !== null) {
                  if ('response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response) {
                     const responseError = err.response as { data?: { detail?: string } };
                     detail = responseError.data?.detail || detail;
                  } else {
                     detail = String(err);
                  }
             }
            toast({ title: "Error Adding Note", description: detail, status: "error", duration: 3000 });
        } finally {
            setIsSubmittingNote(false);
        }
    }, [newNoteContent, nodeId, nodeType, apiClient, toast, setNotes]); 

    // Render functions for different entity types
    const renderUserContent = (data: User) => { 
        return (
            <VStack align="start" spacing={3} w="full">
                <HStack spacing={4}>
                    <Avatar size="md" name={data.name || data.email} src={data.avatar_url || undefined} />
                    <VStack align="start" spacing={0}>
                        <Heading size="md">{data.name || node?.label || 'User Details'}</Heading>
                        {data.title && <Text fontSize="md" color="gray.500">{data.title}</Text>}
                    </VStack>
                </HStack>
                <Divider />
                <Text fontSize="sm"><b>Email:</b> {data.email || 'N/A'}</Text>
                {data.team_id && (
                    <Text fontSize="sm"><b>Team:</b> 
                        <Button variant="link" size="sm" colorScheme="blue" ml={1}
                            onClick={() => onSelectNode(data.team_id!, MapNodeTypeEnum.TEAM)}>
                           <Code fontSize="xs">{data.team_id}</Code>
                        </Button>
                    </Text>
                )}
                {data.manager_id && (
                     <Text fontSize="sm"><b>Manager:</b> 
                        <Button variant="link" size="sm" colorScheme="blue" ml={1}
                            onClick={() => onSelectNode(data.manager_id!, MapNodeTypeEnum.USER)}>
                           <Code fontSize="xs">{data.manager_id}</Code>
                        </Button>
                    </Text>
                )}
                <Tag size="sm" variant="outline">ID: {data.id}</Tag>
            </VStack>
        );
    }

    const renderTeamContent = (data: TeamRead) => (
        <VStack align="start" spacing={3} w="full">
            <Heading size="md">{data.name ?? 'Team Details'}</Heading>
            <Divider />
            <Text fontSize="sm"><b>Description:</b> {data.description || <Text as="i" color="gray.500">No description</Text>}</Text>
            {data.lead_id && (
                 <Text fontSize="sm"><b>Lead:</b> 
                    <Button variant="link" size="sm" colorScheme="blue" ml={1}
                        onClick={() => onSelectNode(data.lead_id!, MapNodeTypeEnum.USER)}>
                       <Code fontSize="xs">{data.lead_id}</Code>
                    </Button>
                 </Text>
            )}
            {data.dept_id && (
                <Text fontSize="sm"><b>Department:</b> 
                    <Button variant="link" size="sm" colorScheme="blue" ml={1}
                        onClick={() => onSelectNode(data.dept_id!, MapNodeTypeEnum.DEPARTMENT)}>
                       <Code fontSize="xs">{data.dept_id}</Code>
                    </Button>
                </Text>
            )}
            <Tag size="sm" variant="outline">ID: {data.id}</Tag>
        </VStack>
    );

    const renderProjectContent = (data: ProjectRead) => {
         // Define badge color based on status (example)
        let statusColorScheme = 'gray';
        const lowerCaseStatus = data.status?.toLowerCase();
        if (lowerCaseStatus?.includes('active') || lowerCaseStatus?.includes('on track')) statusColorScheme = 'green';
        if (lowerCaseStatus?.includes('planning') || lowerCaseStatus?.includes('pending')) statusColorScheme = 'blue';
        if (lowerCaseStatus?.includes('paused') || lowerCaseStatus?.includes('blocked') || lowerCaseStatus?.includes('at risk')) statusColorScheme = 'orange';
        if (lowerCaseStatus?.includes('completed') || lowerCaseStatus?.includes('done')) statusColorScheme = 'purple';

         return (
             <VStack align="start" spacing={3} w="full">
                <Heading size="md">{data.name ?? 'Project Details'}</Heading>
                {data.status && <Tag size="sm" colorScheme={statusColorScheme} variant="subtle">{data.status}</Tag>} 
                <Divider />
                <Text fontSize="sm">
                    <b>Description:</b> {data.description || <Text as="i" color="gray.500">No description</Text>}
                </Text>
                {data.owner_id && (
                     <Text fontSize="sm"><b>Owner:</b> 
                        <Button variant="link" size="sm" colorScheme="blue" ml={1}
                             onClick={() => onSelectNode(data.owner_id!, MapNodeTypeEnum.USER)}>
                            <Code fontSize="xs">{data.owner_id}</Code>
                        </Button>
                     </Text>
                )}
                {data.owning_team_id && (
                     <Text fontSize="sm"><b>Owning Team:</b> 
                         <Button variant="link" size="sm" colorScheme="blue" ml={1}
                            onClick={() => onSelectNode(data.owning_team_id!, MapNodeTypeEnum.TEAM)}>
                            <Code fontSize="xs">{data.owning_team_id}</Code>
                         </Button>
                     </Text>
                )}
                {data.goal_id && (
                     <Text fontSize="sm"><b>Aligned Goal:</b> 
                         <Button variant="link" size="sm" colorScheme="blue" ml={1}
                            onClick={() => onSelectNode(data.goal_id!, MapNodeTypeEnum.GOAL)}>
                            <Code fontSize="xs">{data.goal_id}</Code>
                         </Button>
                     </Text>
                )}
                 <Tag size="sm" variant="outline">ID: {data.id}</Tag>
                
                {/* Notes Section */}
                <Box pt={4} w="full">
                     <Heading size="xs" mb={2}>Notes</Heading>
                    <Divider mb={2}/>
                    <VStack align="stretch" spacing={2} mb={3} maxH="200px" overflowY="auto">
                        {/* TODO: Add error display for notes fetching */}
                        {isNotesLoading ? <Spinner size="sm"/> : 
                         notes.length > 0 ? notes.map(note => (
                             <Box key={note.id} p={2} bg="gray.50" borderRadius="md">
                                <Text fontSize="sm">{note.content}</Text>
                                {/* Optionally display note.created_at or owner later */}
                             </Box>
                        )) : <Text fontSize="sm" color="gray.500">No notes yet.</Text>}
                     </VStack>
                     <Textarea 
                        placeholder="Add a new note..."
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        size="sm"
                        mb={2}
                     />
                     <Button 
                        size="sm" 
                        colorScheme="blue"
                        onClick={handleNoteSubmit}
                        isLoading={isSubmittingNote}
                        isDisabled={!newNoteContent.trim()}
                        leftIcon={<MdNote />}
                    >
                        Add Note
                    </Button>
                </Box>
             </VStack>
        );
    };

     const renderGoalContent = (data: GoalRead) => (
        <VStack align="start" spacing={3} w="full">
            {/* Assume Goal type in types/goal.ts has these fields */}
            <Heading size="md">{data.title ?? 'Goal Details'}</Heading>
            {data.status && <Tag size="sm" colorScheme="green">{data.status}</Tag>} 
            <Divider />
             <Text fontSize="sm"><b>Type:</b> {data.type ?? 'N/A'}</Text>
             <Text fontSize="sm"><b>Progress:</b> {data.progress ?? 0}%</Text>
             <Text fontSize="sm"><b>Due:</b> {data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'N/A'}</Text>
             {data.parent_id && (
                <Text fontSize="sm"><b>Parent Goal:</b> 
                    <Button variant="link" size="sm" colorScheme="blue" ml={1}
                         onClick={() => onSelectNode(data.parent_id!, MapNodeTypeEnum.GOAL)}>
                       <Code fontSize="xs">{data.parent_id}</Code>
                    </Button>
                </Text>
             )}
             <Tag size="sm" variant="outline">ID: {data.id}</Tag>
        </VStack>
     );

    // Main render logic decides which content function to call
    const renderContent = () => {
        if (isLoading) return <Spinner />;
        if (error) return <Text color="red.500">{error}</Text>; 
        if (!entityData) { 
            if (node && !isLoading) return <Text color="gray.500">Loading details...</Text>; 
             return <Text color="gray.500">Select a node to see details.</Text>;
        }

        // Use type guards for safer rendering
        switch (nodeType) { 
            case MapNodeTypeEnum.USER: 
                // User type should match API response, assuming it's User for now
                return renderUserContent(entityData as User);
            case MapNodeTypeEnum.TEAM: 
                // Assuming the API call for TEAM returns TeamRead
                 if ('dept_id' in entityData || 'lead_id' in entityData) { // Check properties specific to TeamRead
                    return renderTeamContent(entityData as TeamRead);
                 }
                 break; 
            case MapNodeTypeEnum.PROJECT: 
                 // Assuming the API call for PROJECT returns ProjectRead
                 if ('owner_id' in entityData || 'owning_team_id' in entityData) { 
                    return renderProjectContent(entityData as ProjectRead);
                 }
                 break;
            case MapNodeTypeEnum.GOAL: 
                 // Assuming the API call for GOAL returns GoalRead
                 if ('title' in entityData || 'progress' in entityData) { 
                     return renderGoalContent(entityData as GoalRead);
                 }
                 break;
            // case MapNodeTypeEnum.DEPARTMENT: ... 
            default:
                console.warn("Unhandled node type or type mismatch in renderContent:", nodeType, entityData);
                return <Text>Details for type {node?.type} not implemented or data mismatch.</Text>;
        }
        // Fallback if type guard fails (should ideally not happen)
        return <Text color="orange.500">Data structure mismatch for type {nodeType}.</Text>;
    };

    if (!node) {
        return null; 
    }

    return (
        <Box width="100%" height="100%" p={1}> 
            {renderContent()}
        </Box>
    );
};

export default BriefingPanel; 