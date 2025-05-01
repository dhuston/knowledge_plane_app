import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Spinner,
    Alert,
    AlertIcon,
    Center,
    VStack,
    RadioGroup,
    Radio,
    HStack,
    Text,
    IconButton,
    useDisclosure
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import { useApiClient } from '../../hooks/useApiClient';
import { GoalRead } from '../../types/goal'; // Assuming GoalRead exists
import { GoalFormModal } from './GoalFormModal'; // Import the new form modal

interface GoalSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string; // ID of the project we're linking for
    currentGoalId?: string | null; // Currently linked goal ID
    onGoalSelect: (projectId: string, goalId: string | null) => Promise<void>; // Async callback
}

const GoalSelectorModal: React.FC<GoalSelectorModalProps> = ({ 
    isOpen, 
    onClose, 
    projectId, 
    currentGoalId, 
    onGoalSelect 
}) => {
    const apiClient = useApiClient();
    const [goals, setGoals] = useState<GoalRead[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(currentGoalId || null);
    const [isSaving, setIsSaving] = useState(false);

    // State for managing the GoalFormModal
    const { 
        isOpen: isEditModalOpen, 
        onOpen: onEditModalOpen, 
        onClose: onEditModalClose 
    } = useDisclosure();
    const [editingGoal, setEditingGoal] = useState<GoalRead | undefined>(undefined);

    // Fetch goals when modal opens
    useEffect(() => {
        if (isOpen) {
            const fetchGoals = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await apiClient.get<GoalRead[]>('/goals');
                    setGoals(response.data || []);
                    // Reset selection to current goal when reopening
                    setSelectedGoalId(currentGoalId || null);
                } catch (err) {
                    console.error("Error fetching goals:", err);
                    setError("Failed to load available goals.");
                    setGoals([]);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchGoals();
        }
    }, [isOpen, apiClient, currentGoalId]); // Re-fetch if modal reopens

    const handleEditClick = (goal: GoalRead) => {
        setEditingGoal(goal);
        onEditModalOpen();
    };

    // Callback for when GoalFormModal succeeds
    const handleEditSuccess = (updatedGoal: GoalRead) => {
        // Refresh the list of goals to show the update
        setGoals(prevGoals => 
            prevGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
        );
        // If the currently selected goal was edited, keep it selected
        // If a new goal was potentially created (though not triggered from here), 
        // it won't be selected automatically.
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onGoalSelect(projectId, selectedGoalId);
            onClose(); // Close modal on successful save
        } catch (saveError) {
            console.error("Error saving linked goal:", saveError);
            // Error handling (e.g., toast) might be better in the parent component
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Link Goal to Project</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    {isLoading ? (
                        <Center><Spinner /></Center>
                    ) : error ? (
                        <Alert status="error"><AlertIcon />{error}</Alert>
                    ) : (
                        <VStack align="stretch">
                            {/* Use RadioGroup for selection */}
                            <RadioGroup onChange={setSelectedGoalId} value={selectedGoalId || ''}>
                                <VStack align="stretch" spacing={2} maxHeight="300px" overflowY="auto" pr={2}>
                                    {/* Option to unlink */} 
                                    <Radio value=''>
                                        <Text fontStyle="italic">-- Unlink Goal --</Text>
                                    </Radio>
                                    {/* Goal list with Edit buttons */} 
                                    {goals.map((goal) => (
                                        <HStack key={goal.id} justifyContent="space-between" w="100%">
                                            <Radio value={goal.id}>
                                                {goal.title} <Text as="span" fontSize="xs" color="gray.500">({goal.type})</Text>
                                            </Radio>
                                            <IconButton 
                                                aria-label={`Edit goal ${goal.title}`}
                                                icon={<EditIcon />}
                                                size="xs"
                                                variant="ghost"
                                                onClick={() => handleEditClick(goal)}
                                            />
                                        </HStack>
                                    ))}
                                </VStack>
                            </RadioGroup>
                            {/* Optionally show details of selected goal? */} 
                        </VStack>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button 
                        colorScheme='blue' 
                        mr={3} 
                        onClick={handleSave}
                        isLoading={isSaving}
                        isDisabled={isLoading || !!error}
                    >
                        Save
                    </Button>
                    <Button variant='ghost' onClick={onClose}>Cancel</Button>
                </ModalFooter>
            </ModalContent>

            {/* Render the GoalFormModal when editing */}
            {isEditModalOpen && (
                <GoalFormModal 
                    isOpen={isEditModalOpen}
                    onClose={onEditModalClose}
                    onSuccess={handleEditSuccess} 
                    initialData={editingGoal}
                />
            )}
        </Modal>
    );
};

export default GoalSelectorModal; 