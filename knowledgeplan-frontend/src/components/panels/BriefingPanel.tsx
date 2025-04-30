import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Text, Spinner, Heading, VStack, Button, Avatar, HStack,
    useToast, Card, CardHeader, CardBody, Center, Icon,
    UnorderedList, ListItem, Alert, AlertIcon, CloseButton,
    useDisclosure,
    Badge,
    Input,
    InputGroup,
    InputRightElement,
    IconButton
} from '@chakra-ui/react';
import {
    MdNote,
    MdOutlinePerson,
    MdOutlineGroup,
    MdOutlineFolder,
    MdOutlineFlag
} from "react-icons/md"; // Icons for types
import { FaExclamationTriangle } from 'react-icons/fa'; // Icon for overlap

// Core Types
import { MapNode, MapNodeTypeEnum } from '../../types/map';
import type { ProjectRead } from '../../types/project';
import type { TeamRead } from '../../types/team';
import type { User as UserReadSchema } from '../../types/user';
import { NoteCreate } from '../../types/knowledge_asset';
import { GoalRead } from '../../types/goal'; // For full goal info
import { NoteRead, NoteReadRecent } from '../../types/knowledge_asset'; // Use correct path

// Hooks & Components
import { useApiClient } from '../../hooks/useApiClient';
import { NoteInput } from '../notes/NoteInput'; // Assuming path is correct
import GoalSelectorModal from '../modals/GoalSelectorModal'; // Correct default import


interface BriefingPanelProps {
    selectedNode: MapNode | null;
    onClose: () => void;
    projectOverlaps: Record<string, string[]>; // Overlap data passed down
    // Callback to get project name from already fetched map data if possible
    getProjectNameById: (id: string) => string | undefined;
}

// Type guard for entity data
function isProjectRead(data: unknown): data is ProjectRead {
    return typeof data === 'object' && data !== null && 'owning_team_id' in data;
}

function isTeamRead(data: unknown): data is TeamRead {
    return typeof data === 'object' && data !== null && 'lead_id' in data;
}

function isUserRead(data: unknown): data is UserReadSchema {
    return typeof data === 'object' && data !== null && 'email' in data;
}


const BriefingPanel: React.FC<BriefingPanelProps> = ({ 
    selectedNode,
    onClose,
    projectOverlaps,
    getProjectNameById
}) => {
    // State for fetched data
    const [entityData, setEntityData] = useState<UserReadSchema | TeamRead | ProjectRead | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [recentNotes, setRecentNotes] = useState<NoteReadRecent[]>([]);
    const [isNotesLoading, setIsNotesLoading] = useState<boolean>(false);
    const [notesError, setNotesError] = useState<string | null>(null);
    const [linkedGoal, setLinkedGoal] = useState<GoalRead | null>(null);
    const [isGoalLoading, setIsGoalLoading] = useState<boolean>(false);
    
    // State for asset linking placeholder
    const [assetLinkUrl, setAssetLinkUrl] = useState<string>('');
    const [isLinkingAsset, setIsLinkingAsset] = useState<boolean>(false);

    const { 
        isOpen: isGoalModalOpen, 
        onOpen: onGoalModalOpen, 
        onClose: onGoalModalClose 
    } = useDisclosure();

    const nodeType = useMemo(() => selectedNode?.type, [selectedNode]);
    const nodeId = useMemo(() => selectedNode?.id, [selectedNode]);

    const apiClient = useApiClient();
    const toast = useToast();

    // --- Data Fetching Effect ---
    useEffect(() => {
        if (!nodeId || !nodeType) {
            setEntityData(null);
            setError(null);
            setRecentNotes([]);
            setLinkedGoal(null);
            return;
        }

        const fetchDetails = async () => {
            setIsLoading(true);
            setError(null);
            setEntityData(null); 
            setRecentNotes([]);
            setLinkedGoal(null);
            setNotesError(null);

            let apiUrl = '';

            try {
                switch (nodeType) {
                    case MapNodeTypeEnum.USER:
                        apiUrl = `/users/${nodeId}`;
                        {
                            const response = await apiClient.get<UserReadSchema>(apiUrl);
                            setEntityData(response.data);
                        }
                        break;
                    case MapNodeTypeEnum.TEAM:
                        apiUrl = `/teams/${nodeId}`;
                        {
                            const response = await apiClient.get<TeamRead>(apiUrl);
                            setEntityData(response.data);
                        }
                        break;
                    case MapNodeTypeEnum.PROJECT:
                        apiUrl = `/projects/${nodeId}`;
                        {
                            const response = await apiClient.get<ProjectRead>(apiUrl);
                            setEntityData(response.data);

                            // Fetch related notes & goal info
                            if (response.data) {
                                fetchRecentNotes(nodeId);
                                if (response.data.goal_id) {
                                    fetchLinkedGoal(response.data.goal_id);
                                }
                            }
                        }
                        break;
                    default:
                        console.warn('No API endpoint for type:', nodeType);
                        setError(`Details view not implemented for type: ${nodeType}`);
                        return;
                }
            } catch (err) {
                console.error(`Error fetching details for ${nodeType} ${nodeId}:`, err);
                setError(`Failed to load details for ${selectedNode?.label || nodeId}.`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();

    }, [nodeId, nodeType, apiClient]); // Re-fetch when node changes

    // --- Fetch Recent Notes --- 
    const fetchRecentNotes = async (projectId: string) => {
        setIsNotesLoading(true);
        setNotesError(null);
        try {
            const response = await apiClient.get<NoteReadRecent[]>(`/notes/project/${projectId}/recent?limit=5`);
            setRecentNotes(response.data || []);
        } catch (err) {
            console.error(`Error fetching notes for project ${projectId}:`, err);
            setNotesError("Failed to load recent notes.");
        } finally {
            setIsNotesLoading(false);
        }
    };

    // --- Fetch Linked Goal --- 
    const fetchLinkedGoal = async (goalId: string | null) => {
        if (!goalId) {
            setLinkedGoal(null);
            return;
        }
        setIsGoalLoading(true);
        try {
            const response = await apiClient.get<GoalRead>(`/goals/${goalId}`);
            setLinkedGoal(response.data);
        } catch (err) {
            console.error(`Error fetching title for goal ${goalId}:`, err);
            setLinkedGoal(null);
            toast({ title: "Error fetching linked goal details", status: "error", duration: 4000 });
        } finally {
            setIsGoalLoading(false);
        }
    };

    // --- Handlers --- 
    const handleAddNote = async (content: string) => {
        if (!nodeId || nodeType !== MapNodeTypeEnum.PROJECT) return;
        const payload: NoteCreate = { content };
        try {
            const response = await apiClient.post<NoteRead>(`/notes`, payload); 
            const newRecentNote: NoteReadRecent = {
                id: response.data.id,
                title: response.data.title,
                created_at: response.data.created_at
            };
            setRecentNotes(prev => [newRecentNote, ...prev].slice(0, 5));
            toast({ title: "Note added", status: "success", duration: 3000, isClosable: true });
        } catch (err) {
            console.error("Error adding note:", err);
            toast({ title: "Error adding note", status: "error", duration: 5000, isClosable: true });
        }
    };
    
    const handleGoalSelect = async (projectId: string, goalId: string | null) => {
        if (!entityData || !isProjectRead(entityData)) return;

        const originalGoalId = entityData.goal_id;
        const originalLinkedGoal = linkedGoal;

        // Optimistic update
        setLinkedGoal(null);
        setEntityData(prev => ({ ...(prev as ProjectRead), goal_id: goalId }));

        try {
            await apiClient.put(`/projects/${projectId}`, { goal_id: goalId });

            if (goalId) {
                fetchLinkedGoal(goalId);
            } else {
                setLinkedGoal(null);
            }

            toast({ title: 'Goal link updated', status: 'success', duration: 3000, isClosable: true });
        } catch (err) {
            console.error('Error updating project goal link:', err);
            toast({ title: 'Error updating goal link', status: 'error', duration: 5000, isClosable: true });

            // Revert
            setLinkedGoal(originalLinkedGoal);
            setEntityData(prev => ({ ...(prev as ProjectRead), goal_id: originalGoalId }));
        }
    };

    // --- Asset Linking Placeholder Handler ---
    const handleLinkAsset = async () => {
        if (!assetLinkUrl || !entityData || !isProjectRead(entityData)) return;

        const currentLinks = (entityData.properties?.linkedAssets as string[] || []);
        if (currentLinks.includes(assetLinkUrl)) {
            toast({ title: "Link already exists", status: "info", duration: 3000 });
            return;
        }

        const updatedLinks = [...currentLinks, assetLinkUrl];
        const updatedProperties = { ...(entityData.properties || {}), linkedAssets: updatedLinks };

        // Optimistic update
        const originalProperties = entityData.properties;
        setEntityData(prev => ({ ...(prev as ProjectRead), properties: updatedProperties }));
        setAssetLinkUrl(''); // Clear input
        setIsLinkingAsset(true);

        try {
            await apiClient.put(`/projects/${entityData.id}`, { properties: updatedProperties });
            toast({ title: "Asset linked (placeholder)", status: "success", duration: 3000 });
        } catch (err) {
            console.error("Error linking asset:", err);
            toast({ title: "Error linking asset", status: "error" });
            // Revert optimistic update
            setEntityData(prev => ({ ...(prev as ProjectRead), properties: originalProperties }));
        } finally {
            setIsLinkingAsset(false);
        }
    };

    const handleRemoveAssetLink = async (linkToRemove: string) => {
        if (!entityData || !isProjectRead(entityData)) return;

        const currentLinks = (entityData.properties?.linkedAssets as string[] || []);
        const updatedLinks = currentLinks.filter(link => link !== linkToRemove);
        const updatedProperties = { ...(entityData.properties || {}), linkedAssets: updatedLinks };

        // Optimistic update
        const originalProperties = entityData.properties;
        setEntityData(prev => ({ ...(prev as ProjectRead), properties: updatedProperties }));
        setIsLinkingAsset(true); // Reuse loading state maybe?

        try {
            await apiClient.put(`/projects/${entityData.id}`, { properties: updatedProperties });
            toast({ title: "Asset link removed", status: "success", duration: 3000 });
        } catch (err) {
            console.error("Error removing asset link:", err);
            toast({ title: "Error removing link", status: "error" });
            // Revert optimistic update
            setEntityData(prev => ({ ...(prev as ProjectRead), properties: originalProperties }));
        } finally {
            setIsLinkingAsset(false);
        }
    };

    // --- Render Functions --- 

    const renderUserDetails = (data: UserReadSchema) => (
        <VStack align="stretch" spacing={1}>
            <HStack spacing={3} mb={2}>
                <Avatar size="md" name={data.name || data.email || 'U'} src={data.avatar_url || undefined} />
                <VStack align="start" spacing={0}>
                    <Heading size="sm">{data.name || selectedNode?.label || 'User'}</Heading>
                    {data.title && <Text fontSize="sm" color="gray.500">{data.title}</Text>}
                </VStack>
            </HStack>
            <Text fontSize="sm">Email: {data.email}</Text>
            {/* TODO: Display Team/Manager Links */} 
        </VStack>
    );

    const renderTeamDetails = (data: TeamRead) => (
        <VStack align="stretch" spacing={1}>
            <Heading size="sm">{data.name || selectedNode?.label || 'Team'}</Heading>
            {/* TODO: Display Lead, Members, Projects */} 
        </VStack>
    );

    const renderProjectDetails = (data: ProjectRead) => {
        const overlaps = projectOverlaps[data.id] || [];
        let statusColorScheme = 'gray';
        const statusLower = data.status?.toLowerCase() || '';
        if (statusLower.includes('active') || statusLower.includes('track')) statusColorScheme = 'green';
        else if (statusLower.includes('planning')) statusColorScheme = 'blue';
        else if (statusLower.includes('paused') || statusLower.includes('blocked')) statusColorScheme = 'orange';
        else if (statusLower.includes('completed')) statusColorScheme = 'purple';

        return (
            <VStack align="stretch" spacing={4}>
                <Heading size="sm">{data.name || selectedNode?.label || 'Project'}</Heading>
                <HStack spacing={2} alignItems="center">
                    <Badge colorScheme={statusColorScheme} size="sm" variant="subtle">{data.status || 'N/A'}</Badge>
                    <HStack flex={1} minWidth={0} alignItems="center">
                        <Text fontSize="xs" fontWeight="medium" whiteSpace="nowrap">Aligns To:</Text>
                        {isGoalLoading && <Spinner size="xs" ml={1} />}
                        {!isGoalLoading && linkedGoal && (
                            <HStack>
                                <Badge 
                                    variant="outline" 
                                    colorScheme={linkedGoal.status?.toLowerCase().includes('risk') ? 'red' : 'green'}
                                    fontSize="xs"
                                    mr={1}
                                    noOfLines={1}
                                    maxWidth="150px"
                                    title={`${linkedGoal.title} (${linkedGoal.status || 'N/A'})`}
                                >
                                    {linkedGoal.title || 'Untitled Goal'}
                                </Badge>
                                <Button size="xs" variant="ghost" colorScheme="blue" onClick={onGoalModalOpen} aria-label="Change Goal">Change</Button>
                            </HStack>
                        )}
                        {!isGoalLoading && !linkedGoal && data.goal_id && (
                            <HStack>
                                <Text fontSize="xs" color="red.500">Error loading goal.</Text>
                                <Button size="xs" variant="ghost" colorScheme="blue" onClick={onGoalModalOpen} aria-label="Retry/Change Goal">Retry</Button>
                            </HStack>
                        )}
                    </HStack>
                </HStack>
                {data.description && <Text fontSize="sm" whiteSpace="pre-wrap">{data.description}</Text>}
                
                {/* Overlaps Section */} 
                {overlaps.length > 0 && (
                    <Box mt={1} p={3} borderWidth="1px" borderRadius="md" borderColor="orange.200" bg="orange.50">
                        <HStack mb={1} spacing={2}>
                            <Icon as={FaExclamationTriangle} color="orange.400" />
                            <Heading size="xs" color="orange.800">Potential Overlaps Found</Heading>
                        </HStack>
                        <UnorderedList spacing={1} pl={5} >
                            {overlaps.map(overlapId => (
                                <ListItem key={overlapId} fontSize="sm">
                                    {getProjectNameById(overlapId) ?? `Project: ${overlapId.substring(0, 8)}...`}
                                    {/* TODO: Link to focus map on overlapId */} 
                                </ListItem>
                            ))}
                        </UnorderedList>
                    </Box>
                )}

                {/* Notes Section */} 
                <Card variant="outline" size="sm">
                    <CardHeader pb={1}><Heading size="xs">Recent Activity / Notes</Heading></CardHeader>
                    <CardBody pt={1}>
                        <NoteInput onSubmit={handleAddNote} />
                        {isNotesLoading && <Center><Spinner size="sm" /></Center>}
                        {notesError && <Text color="red.500" fontSize="sm">{notesError}</Text>}
                        {!isNotesLoading && !notesError && recentNotes.length === 0 && (
                            <Text color="gray.500" fontSize="sm">No recent notes.</Text>
                        )}
                        {!isNotesLoading && !notesError && recentNotes.length > 0 && (
                            <UnorderedList spacing={1} styleType="none" ml={0}>
                                {recentNotes.map(note => (
                                    <ListItem key={note.id} fontSize="sm">
                                        <HStack justifyContent="space-between">
                                            <Text noOfLines={1} title={note.title || 'Note'}>{note.title || 'Untitled Note'}</Text>
                                            <Text fontSize="xs" color="gray.400">{new Date(note.created_at).toLocaleDateString()}</Text>
                                        </HStack>
                                        {/* TODO: Maybe make these clickable to view full note? */}
                                    </ListItem>
                                ))}
                            </UnorderedList>
                        )}
                    </CardBody>
                </Card>

                {/* Asset Linking Placeholder Section */}
                <Card variant="outline" size="sm">
                    <CardHeader pb={1}><Heading size="xs">Linked Assets (Placeholder)</Heading></CardHeader>
                    <CardBody pt={1}>
                        <InputGroup size="sm" mb={2}>
                            <Input 
                                placeholder="Paste document URL (e.g., GDrive, SharePoint)"
                                value={assetLinkUrl}
                                onChange={(e) => setAssetLinkUrl(e.target.value)}
                                isDisabled={isLinkingAsset}
                            />
                            <InputRightElement width="4.5rem">
                                <Button 
                                    h="1.75rem" 
                                    size="sm" 
                                    onClick={handleLinkAsset}
                                    isLoading={isLinkingAsset}
                                    isDisabled={!assetLinkUrl}
                                > Link </Button>
                            </InputRightElement>
                        </InputGroup>
                        
                        {(entityData.properties?.linkedAssets as string[] || []).length === 0 && (
                             <Text fontSize="sm" color="gray.500">No assets linked yet.</Text>
                        )}
                        {(entityData.properties?.linkedAssets as string[] || []).length > 0 && (
                            <UnorderedList spacing={1} styleType="none" ml={0}>
                                {(entityData.properties?.linkedAssets as string[]).map((link, index) => (
                                    <ListItem key={index} fontSize="sm">
                                        <HStack justifyContent="space-between">
                                            <Text as="a" href={link} isExternal noOfLines={1} color="blue.600" title={link}>{link}</Text>
                                            <IconButton 
                                                 aria-label="Remove link"
                                                 icon={<CloseButton size="sm" />} 
                                                 size="xs"
                                                 variant="ghost"
                                                 onClick={() => handleRemoveAssetLink(link)}
                                                 isDisabled={isLinkingAsset}
                                            />
                                        </HStack>
                                    </ListItem>
                                ))}
                            </UnorderedList>
                        )}
                    </CardBody>
                </Card>
            </VStack>
        );
    };

    const renderMainContent = () => {
        if (isLoading) return <Center h="100%"><Spinner /></Center>;
        if (error) return <Alert status="error" variant="subtle"><AlertIcon />{error}</Alert>;
        if (!entityData) return <Center h="100%"><Text color="gray.500">Select a node.</Text></Center>;

        if (isUserRead(entityData)) return renderUserDetails(entityData);
        if (isTeamRead(entityData)) return renderTeamDetails(entityData);
        if (isProjectRead(entityData)) return renderProjectDetails(entityData);
        // Add Goal or other types here
        
        return <Alert status="warning" variant="subtle"><AlertIcon />Cannot render details for this entity type.</Alert>;
    };

    // --- Panel Header Logic --- 
    const getNodeIcon = (type: MapNodeTypeEnum | undefined) => {
        switch (type) {
            case MapNodeTypeEnum.USER: return MdOutlinePerson;
            case MapNodeTypeEnum.TEAM: return MdOutlineGroup;
            case MapNodeTypeEnum.PROJECT: return MdOutlineFolder;
            case MapNodeTypeEnum.GOAL: return MdOutlineFlag;
            default: return MdNote;
        }
    };
    const panelTitle: string = selectedNode?.label ?? selectedNode?.type ?? 'Details';
    const panelSubTitle: string = nodeType ? nodeType.charAt(0).toUpperCase() + nodeType.slice(1) : '';

    // --- Final Render --- 
    
    // Return null if nothing is selected (avoids rendering empty panel initially)
    if (!selectedNode && !isLoading) return null; 

    return (
        <> 
            <Box width="100%" height="100%" p={4} overflowY="auto" display="flex" flexDirection="column">
                {/* Header */} 
                <HStack justifyContent="space-between" mb={4} alignItems="center" flexShrink={0}>
                    <HStack spacing={2} minWidth={0}>
                        <Icon as={getNodeIcon(nodeType)} boxSize={5} color="gray.500" />
                        <VStack align="start" spacing={0} flex={1} minWidth={0}>
                            <Heading size="sm" noOfLines={1} title={panelTitle}>{panelTitle}</Heading>
                            {panelSubTitle && <Text fontSize="xs" color="gray.500">{panelSubTitle}</Text>}
                        </VStack>
                    </HStack>
                    <CloseButton size="sm" onClick={onClose} />
                </HStack>
                
                {/* Body */} 
                <Box flex={1} overflowY="auto" pl={1} pr={1}> {/* Add slight padding for scrollbar */} 
                    {renderMainContent()}
                </Box>
            </Box>

            {/* Goal Modal (Rendered outside main flow) */}
            {nodeType === MapNodeTypeEnum.PROJECT && entityData && isProjectRead(entityData) && (
                <GoalSelectorModal
                    isOpen={isGoalModalOpen}
                    onClose={onGoalModalClose}
                    projectId={entityData.id}
                    onGoalSelect={handleGoalSelect}
                    currentGoalId={entityData.goal_id || undefined}
                />
            )}
        </>
    );
};

export default BriefingPanel; 