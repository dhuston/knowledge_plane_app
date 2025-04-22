import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Box, Text, Spinner, Heading, VStack, /* CloseButton, */ /*Divider,*/ Tag, Code,
    Textarea, Button, Avatar, HStack, /* Input, */ useToast, Card, CardHeader, CardBody, SimpleGrid, Center, Flex
} from '@chakra-ui/react';
import { MdNote /* MdPersonAdd */ } from "react-icons/md"; // Cleaned up imports
import { MapNode, MapNodeTypeEnum } from '../../types/map';

// import { apiClient } from '../../api/client'; // Removed unused
// import { useAuth } from '../../context/AuthContext'; // REMOVED unused import

// Import specific entity types
import { User, UserReadBasic } from '../../types/user'; // Use User and UserReadBasic
import { TeamRead } from '../../types/team'; // Use TeamRead
import { ProjectRead } from '../../types/project'; // Use ProjectRead
import { GoalRead, GoalReadMinimal } from '../../types/goal'; // Use GoalRead and GoalReadMinimal
import { NoteCreate, Note } from '../../types/knowledge_asset';
import { useApiClient } from '../../hooks/useApiClient'; // Corrected path relative to src/components/panels
// import { Link as RouterLink } from 'react-router-dom'; // Removed unused

// Define a type for Google Calendar events (Removed - not used here)
// interface CalendarEvent { ... }

interface BriefingPanelProps {
    node: MapNode | null; // The selected node data from the map
    onSelectNode: (nodeId: string, nodeType: MapNodeTypeEnum) => void; // Add callback prop
}

// Helper component for Label-Value pairs
const DetailItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <Box>
        <Text fontSize="sm" fontWeight="medium" color="gray.600">{label}</Text>
        <Text fontSize="sm" mt={1}>{children}</Text>
    </Box>
);

// Helper component for Clickable Links
const EntityLink: React.FC<{ label: string; onClick: () => void; children: React.ReactNode }> = ({ label, onClick, children }) => (
     <DetailItem label={label}>
         <Button variant="link" size="sm" colorScheme="blue" onClick={onClick} fontWeight="normal">
            {children}
         </Button>
     </DetailItem>
);

const BriefingPanel: React.FC<BriefingPanelProps> = ({ node, onSelectNode }) => {
    // Use specific Read types matching API responses
    const [entityData, setEntityData] = useState<User | TeamRead | ProjectRead | GoalRead | null>(null);
    const [notes, setNotes] = useState<Note[]>([]); 
    const [userProjects, setUserProjects] = useState<ProjectRead[]>([]);
    const [userGoals, setUserGoals] = useState<GoalRead[]>([]);
    // Add state for team's related items
    const [teamProjects, setTeamProjects] = useState<ProjectRead[]>([]);
    const [teamGoals, setTeamGoals] = useState<GoalReadMinimal[]>([]); // State uses GoalReadMinimal
    // Loading states
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isNotesLoading, setIsNotesLoading] = useState<boolean>(false);
    const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
    const [isFetchingRelated, setIsFetchingRelated] = useState<boolean>(false); 
    // New note state
    const [newNoteContent, setNewNoteContent] = useState<string>(''); 
    // const { user: currentUser } = useAuth(); // Removed as unused 
    const toast = useToast();

    // Add state for project participants
    const [projectParticipants, setProjectParticipants] = useState<UserReadBasic[]>([]);

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

    // Fetch main entity details and related data
    useEffect(() => {
        setEntityData(null); 
        setError(null);
        setNotes([]);
        setUserProjects([]); 
        setUserGoals([]);
        setTeamProjects([]); // Reset team projects
        setTeamGoals([]); // Reset team goals
        setProjectParticipants([]); // Reset participants

        if (!nodeId || !nodeType) {
            setIsLoading(false);
            return;
        }

        let apiEndpoint = '';
        let fetchSuccess = true;

        // Determine main endpoint
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
            setIsFetchingRelated(false); // Reset related fetching state
            let fetchedEntityData: User | TeamRead | ProjectRead | GoalRead | null = null;

            try {
                // Fetch main entity details
                if (nodeType === MapNodeTypeEnum.USER) {
                     const response = await apiClient.get<User>(apiEndpoint);
                     fetchedEntityData = response.data; // Access .data
                } else { 
                     const response = await apiClient.get<TeamRead | ProjectRead | GoalRead>(apiEndpoint);
                     fetchedEntityData = response.data; // Access .data
                }
               
                setEntityData(fetchedEntityData);
                console.log("Fetched entity data:", fetchedEntityData);

                // ---- Fetch Related Data ----
                if (fetchedEntityData) { // Only fetch related if main fetch succeeded
                    setIsFetchingRelated(true);
                    try {
                        if (nodeType === MapNodeTypeEnum.PROJECT && nodeId) {
                            await fetchProjectNotes(nodeId);
                            // Fetch project participants
                            const participantsResponse = await apiClient.get<UserReadBasic[]>(`/projects/${nodeId}/participants`);
                            setProjectParticipants(participantsResponse.data || []);
                        }
                        if (nodeType === MapNodeTypeEnum.USER && nodeId) {
                            const projectsResponse = await apiClient.get<ProjectRead[]>(`/users/${nodeId}/projects`);
                            setUserProjects(projectsResponse.data || []);
                            const goalsResponse = await apiClient.get<GoalRead[]>(`/users/${nodeId}/goals`);
                            setUserGoals(goalsResponse.data || []);
                        }
                        // --- Add fetch for TEAM --- 
                        if (nodeType === MapNodeTypeEnum.TEAM && nodeId) {
                            // Fetch team's projects
                            const teamProjectsResponse = await apiClient.get<ProjectRead[]>(`/teams/${nodeId}/projects`);
                            setTeamProjects(teamProjectsResponse.data || []);
                            // Fetch team's goals
                            const teamGoalsResponse = await apiClient.get<GoalReadMinimal[]>(`/teams/${nodeId}/goals`);
                            setTeamGoals(teamGoalsResponse.data || []);
                        }
                    } catch (relatedErr) {
                        console.error("Error fetching related data:", relatedErr);
                        toast({ title: "Error Loading Related Items", status: "warning", duration: 3000 });
                        // Don't fail the whole panel, just show missing related data
                    } finally {
                        setIsFetchingRelated(false);
                    }
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
       
    }, [nodeId, nodeType, apiClient, toast, fetchProjectNotes]); // Dependencies

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
            <VStack align="stretch" spacing={4} w="full">
                <Card variant="outline" size="sm">
                    <CardHeader pb={2}>
                        <HStack spacing={3}>
                            <Avatar size="md" name={data.name || data.email} src={data.avatar_url ? data.avatar_url : undefined} />
                            <VStack align="start" spacing={0}>
                                <Heading size="sm">{data.name || node?.label || 'User Details'}</Heading>
                                {data.title && <Text fontSize="sm" color="gray.500">{data.title}</Text>}
                            </VStack>
                        </HStack>
                    </CardHeader>
                    <CardBody pt={2}>
                        <VStack align="start" spacing={3} w="full">
                            <DetailItem label="Email">{data.email || 'N/A'}</DetailItem>
                            {data.team_id && (
                                <EntityLink label="Team" onClick={() => onSelectNode(data.team_id!, MapNodeTypeEnum.TEAM)}>
                                <Code fontSize="xs" px={1}>{data.team_id}</Code>
                                </EntityLink>
                            )}
                            {data.manager_id && (
                                <EntityLink label="Manager" onClick={() => onSelectNode(data.manager_id!, MapNodeTypeEnum.USER)}>
                                <Code fontSize="xs" px={1}>{data.manager_id}</Code>
                                </EntityLink>
                            )}
                            <Tag size="sm" variant="subtle" mt={2}>ID: {data.id}</Tag>
                        </VStack>
                    </CardBody>
                </Card>

                 {/* Associated Projects Card */}
                <Card variant="outline" size="sm">
                    <CardHeader pb={1}><Heading size="xs">Associated Projects</Heading></CardHeader>
                    <CardBody pt={1}>
                        {isFetchingRelated ? <Spinner size="xs" /> : 
                         userProjects.length > 0 ? (
                            <VStack align="start" spacing={1}>
                                {userProjects.map(proj => (
                                    <EntityLink key={proj.id} label="" onClick={() => onSelectNode(proj.id, MapNodeTypeEnum.PROJECT)}>
                                        {proj.name}
                                    </EntityLink>
                                ))}
                             </VStack>
                        ) : (
                            <Text fontSize="sm" color="gray.500">No associated projects found.</Text>
                        )}
                    </CardBody>
                </Card>

                 {/* Associated Goals Card */}
                 <Card variant="outline" size="sm">
                    <CardHeader pb={1}><Heading size="xs">Associated Goals</Heading></CardHeader>
                    <CardBody pt={1}>
                        {isFetchingRelated ? <Spinner size="xs" /> : 
                         userGoals.length > 0 ? (
                            <VStack align="start" spacing={1}>
                                {userGoals.map(goal => (
                                     <EntityLink key={goal.id} label="" onClick={() => onSelectNode(goal.id, MapNodeTypeEnum.GOAL)}>
                                        {goal.title} 
                                     </EntityLink>
                                ))}
                             </VStack>
                        ) : (
                            <Text fontSize="sm" color="gray.500">No associated goals found.</Text>
                        )}
                     </CardBody>
                 </Card>
             </VStack>
        );
    }

    const renderTeamContent = (data: TeamRead) => (
        <VStack align="stretch" spacing={4} w="full">
             <Card variant="outline" size="sm">
                <CardHeader pb={2}>
                    <Heading size="sm">{data.name ?? 'Team Details'}</Heading>
                </CardHeader>
                <CardBody pt={2}>
                    <VStack align="start" spacing={3} w="full">
                        <DetailItem label="Description">{data.description || <Text as="i" color="gray.400">No description</Text>}</DetailItem>
                        {data.lead_id && (
                            <EntityLink label="Lead" onClick={() => onSelectNode(data.lead_id!, MapNodeTypeEnum.USER)}>
                            <Code fontSize="xs" px={1}>{data.lead_id}</Code>
                            </EntityLink>
                        )}
                        {data.dept_id && (
                            <EntityLink label="Department" onClick={() => onSelectNode(data.dept_id!, MapNodeTypeEnum.DEPARTMENT)}>
                            <Code fontSize="xs" px={1}>{data.dept_id}</Code>
                            </EntityLink>
                        )}
                        <Tag size="sm" variant="subtle" mt={2}>ID: {data.id}</Tag>
                    </VStack>
                </CardBody>
            </Card>

            {/* Associated Projects Card */}
            <Card variant="outline" size="sm">
                <CardHeader pb={1}><Heading size="xs">Owned Projects</Heading></CardHeader>
                <CardBody pt={1}>
                    {isFetchingRelated ? <Spinner size="xs" /> : 
                        teamProjects.length > 0 ? (
                        <VStack align="start" spacing={1}>
                            {teamProjects.map(proj => (
                                <EntityLink key={proj.id} label="" onClick={() => onSelectNode(proj.id, MapNodeTypeEnum.PROJECT)}>
                                    {proj.name}
                                </EntityLink>
                            ))}
                            </VStack>
                    ) : (
                        <Text fontSize="sm" color="gray.500">No associated projects found.</Text>
                    )}
                </CardBody>
            </Card>

            {/* Associated Goals Card */}
            <Card variant="outline" size="sm">
                <CardHeader pb={1}><Heading size="xs">Associated Goals (via Projects)</Heading></CardHeader>
                <CardBody pt={1}>
                    {isFetchingRelated ? <Spinner size="xs" /> : 
                        teamGoals.length > 0 ? (
                        <VStack align="start" spacing={1}>
                            {teamGoals.map(goal => (
                                <EntityLink key={goal.id} label="" onClick={() => onSelectNode(goal.id, MapNodeTypeEnum.GOAL)}>
                                    {goal.title} 
                                </EntityLink>
                            ))}
                            </VStack>
                    ) : (
                        <Text fontSize="sm" color="gray.500">No associated goals found.</Text>
                    )}
                    </CardBody>
            </Card>
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
             <VStack align="stretch" spacing={4} w="full">
                 <Card variant="outline" size="sm">
                    <CardHeader pb={2}>
                        <HStack justifyContent="space-between">
                            <Heading size="sm">{data.name ?? 'Project Details'}</Heading>
                            {data.status && <Tag size="sm" colorScheme={statusColorScheme} variant="subtle">{data.status}</Tag>} 
                        </HStack>
                    </CardHeader>
                    <CardBody pt={2}>
                         <VStack align="start" spacing={3} w="full">
                            <DetailItem label="Description">{data.description || <Text as="i" color="gray.400">No description</Text>}</DetailItem>
                            <SimpleGrid columns={2} spacing={3} w="full">
                                {data.owning_team_id && (
                                    <EntityLink label="Owning Team" onClick={() => onSelectNode(data.owning_team_id!, MapNodeTypeEnum.TEAM)}>
                                        <Code fontSize="xs" px={1}>{data.owning_team_id}</Code>
                                    </EntityLink>
                                )}
                                {data.goal_id && (
                                    <EntityLink label="Aligned Goal" onClick={() => onSelectNode(data.goal_id!, MapNodeTypeEnum.GOAL)}>
                                        <Code fontSize="xs" px={1}>{data.goal_id}</Code>
                                    </EntityLink>
                                )}
                            </SimpleGrid>
                            <Tag size="sm" variant="subtle" mt={2}>ID: {data.id}</Tag>
                         </VStack>
                     </CardBody>
                 </Card>
                
                 {/* Participants Card */}
                 <Card variant="outline" size="sm">
                     <CardHeader pb={1}>
                         <Flex justify="space-between" align="center">
                             <Heading size="xs">Participants</Heading>
                             <Button 
                                size="xs" 
                                variant="outline" 
                                colorScheme="gray"
                                onClick={() => console.log("TODO: Implement Add Participant UI/logic")}
                             >
                                 Add
                             </Button>
                         </Flex>
                     </CardHeader>
                     <CardBody pt={1}>
                        {isFetchingRelated ? <Spinner size="xs" /> : 
                         projectParticipants.length > 0 ? (
                            <VStack align="start" spacing={1}>
                                {projectParticipants.map(user => (
                                    <EntityLink key={user.id} label="" onClick={() => onSelectNode(user.id, MapNodeTypeEnum.USER)}>
                                        {user.name || user.id} {/* Display name if available, else ID */}
                                    </EntityLink>
                                ))}
                             </VStack>
                        ) : (
                            <Text fontSize="sm" color="gray.500">No participants listed.</Text>
                        )}
                     </CardBody>
                 </Card>

                 {/* Notes Section - Improved Layout */}
                <Card variant="outline" size="sm">
                    <CardHeader pb={1}>
                         <Heading size="xs">Notes</Heading>
                    </CardHeader>
                    <CardBody pt={1}>
                        <VStack align="stretch" spacing={2} mb={3} maxH="250px" overflowY="auto" pr={2}>
                            {isNotesLoading ? <Center><Spinner size="sm"/></Center> : 
                             notes.length > 0 ? notes.map(note => (
                                 <Box key={note.id} p={2} bg="blackAlpha.50" borderRadius="sm">
                                    <Text fontSize="sm" whiteSpace="pre-wrap">{note.content}</Text>
                                    {/* TODO: Add note metadata (author, timestamp) */}
                                 </Box>
                            )) : <Text fontSize="sm" color="gray.500" fontStyle="italic">No notes yet.</Text>}
                         </VStack>
                         <VStack align="stretch" spacing={2} mt={3}>
                             <Textarea 
                                placeholder="Add a new note..." 
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                                size="sm"
                             />
                             <Button 
                                size="sm" 
                                colorScheme="blue"
                                onClick={handleNoteSubmit}
                                isLoading={isSubmittingNote}
                                isDisabled={!newNoteContent.trim()}
                                leftIcon={<MdNote />}
                                alignSelf="flex-end"
                            >
                                Add Note
                            </Button>
                        </VStack>
                    </CardBody>
                 </Card>
             </VStack>
        );
    };

     const renderGoalContent = (data: GoalRead) => (
         <Card variant="outline" size="sm">
            <CardHeader pb={2}>
                 <HStack justifyContent="space-between">
                    <Heading size="sm">{data.title ?? 'Goal Details'}</Heading>
                    {data.status && <Tag size="sm" colorScheme="green" variant="subtle">{data.status}</Tag>} 
                 </HStack>
            </CardHeader>
            <CardBody pt={2}>
                 <VStack align="start" spacing={3} w="full">
                     <SimpleGrid columns={2} spacing={3} w="full">
                        <DetailItem label="Type">{data.type ?? 'N/A'}</DetailItem>
                        <DetailItem label="Progress">{data.progress ?? 0}%</DetailItem>
                        <DetailItem label="Due">{data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'N/A'}</DetailItem>
                    </SimpleGrid>
                     {data.parent_id && (
                        <EntityLink label="Parent Goal" onClick={() => onSelectNode(data.parent_id!, MapNodeTypeEnum.GOAL)}>
                           <Code fontSize="xs" px={1}>{data.parent_id}</Code>
                        </EntityLink>
                     )}
                     <Tag size="sm" variant="subtle" mt={2}>ID: {data.id}</Tag>
                 </VStack>
             </CardBody>
         </Card>
     );

    // Main render logic decides which content function to call
    const renderContent = () => {
        if (isLoading) return <Center><Spinner /></Center>; // Center spinner
        if (error) return <Text color="red.500" p={4}>{error}</Text>; 
        if (!entityData) { 
            // Show spinner if loading, otherwise prompt to select
            return isLoading ? <Center><Spinner /></Center> : <Center h="100%"><Text color="gray.500">Select a node to see details.</Text></Center>;
        }

        // Use type guards for safer rendering
        switch (nodeType) { 
            case MapNodeTypeEnum.USER: 
                 // Assuming the API call for USER returns User
                 if ('email' in entityData) { // Check for a required User field
                     return renderUserContent(entityData as User);
                 }
                 break; 
            case MapNodeTypeEnum.TEAM: 
                 // Check for a required Team field like 'name' instead of optional relationships
                 if ('name' in entityData && typeof entityData.name === 'string') { 
                    return renderTeamContent(entityData as TeamRead);
                 }
                 break; 
            case MapNodeTypeEnum.PROJECT: 
                 // Check for a required Project field like 'name'
                 if ('name' in entityData && typeof entityData.name === 'string') { 
                    return renderProjectContent(entityData as ProjectRead);
                 }
                 break;
            case MapNodeTypeEnum.GOAL: 
                 // Check for a required Goal field like 'title'
                 // Use GoalRead here as the main entity fetch gets the full GoalRead
                 if ('title' in entityData && typeof entityData.title === 'string') { 
                     return renderGoalContent(entityData as GoalRead);
                 }
                 break;
            // case MapNodeTypeEnum.DEPARTMENT: ... 
            default:
                console.warn("Unhandled node type or type mismatch in renderContent:", nodeType, entityData);
                return <Text>Details for type {node?.type} not implemented or data mismatch.</Text>;
        }
        // Fallback if type guard fails (should ideally not happen)
        return <Text color="orange.500" p={4}>Data structure mismatch for type {nodeType}.</Text>;
    };

    if (!node && !isLoading) { // Don't render anything if no node selected and not loading initial node
        return null; 
    }

    return (
        // Add padding to the main panel container
        <Box width="100%" height="100%" p={4}> 
            {renderContent()}
        </Box>
    );
};

export default BriefingPanel; 