import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { 
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
    Button, FormControl, FormLabel, FormErrorMessage, Input, Textarea, Select,
    NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
    VStack, useToast 
} from '@chakra-ui/react';
import { GoalRead, GoalCreate, GoalUpdate, GoalTypeEnum } from '../../types/goal'; 
import { useApiClient } from '../../hooks/useApiClient';

interface GoalFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (goal: GoalRead) => void; // Callback with the created/updated goal
    initialData?: GoalRead; // Pass existing goal data for editing
}

// Combine Create and Update for form data shape
type GoalFormData = Omit<GoalCreate & GoalUpdate, 'dueDate' | 'parent_id'> & {
    dueDate?: string; // Use string for date input
    parent_id?: string | null; // Use string for select input
};

export const GoalFormModal: React.FC<GoalFormModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
    const { handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<GoalFormData>();
    const toast = useToast();
    const apiClient = useApiClient();
    const [availableGoals, setAvailableGoals] = useState<GoalRead[]>([]); // For parent selection

    // Fetch available goals for parent selection
    useEffect(() => {
        if (isOpen) {
            const fetchGoals = async () => {
                try {
                    const response = await apiClient.get<GoalRead[]>('/goals'); // Fetch all tenant goals
                    // Filter out the goal being edited itself from the parent options
                    setAvailableGoals(response.data.filter(g => g.id !== initialData?.id) || []);
                } catch (error) {
                    console.error("Error fetching goals for parent selection:", error);
                    setAvailableGoals([]);
                    toast({ title: "Error fetching goals", status: "error" });
                }
            };
            fetchGoals();
        }
    }, [isOpen, apiClient, initialData?.id, toast]);

    // Reset form when initialData changes or modal opens/closes
    useEffect(() => {
        if (isOpen) {
            reset({
                title: initialData?.title || '',
                description: initialData?.description || '',
                type: initialData?.type || GoalTypeEnum.TEAM, // Default to TEAM
                status: initialData?.status || 'on_track', // Default status
                progress: initialData?.progress ?? 0,
                dueDate: initialData?.dueDate ? initialData.dueDate.split('T')[0] : '', // Format date for input
                parent_id: initialData?.parent_id || null, // Default to null if no parent
            });
        } else {
            reset(); // Clear form on close
        }
    }, [initialData, isOpen, reset]);

    const onSubmit = async (data: GoalFormData) => {
        const payload: GoalCreate | GoalUpdate = {
            ...data,
            parent_id: data.parent_id === '' || data.parent_id === null ? null : data.parent_id, // Handle empty string from select
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : null, // Ensure only date part
            progress: data.progress ? Number(data.progress) : 0,
        };

        try {
            let response;
            if (initialData?.id) {
                // Update existing goal
                response = await apiClient.put<GoalRead>(`/goals/${initialData.id}`, payload);
            } else {
                // Create new goal
                response = await apiClient.post<GoalRead>('/goals/', payload);
            }
            toast({ title: `Goal ${initialData ? 'updated' : 'created'}`, status: 'success' });
            onSuccess(response.data); // Pass the result back
            onClose();
        } catch (err) {
            console.error("Error saving goal:", err);
            toast({ title: `Error saving goal`, description: (err as Error).message, status: 'error' });
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
                <ModalHeader>{initialData ? 'Edit Goal' : 'Create New Goal'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl isInvalid={!!errors.title} isRequired>
                            <FormLabel>Title</FormLabel>
                            <Controller
                                name="title"
                                control={control}
                                rules={{ required: 'Title is required' }}
                                render={({ field }) => <Input {...field} />}
                            />
                            <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
                        </FormControl>

                        <FormControl isInvalid={!!errors.description}>
                            <FormLabel>Description</FormLabel>
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => <Textarea {...field} />}
                            />
                        </FormControl>

                        <FormControl isInvalid={!!errors.type} isRequired>
                            <FormLabel>Type</FormLabel>
                            <Controller
                                name="type"
                                control={control}
                                rules={{ required: 'Type is required' }}
                                render={({ field }) => (
                                    <Select {...field}>
                                        {Object.values(GoalTypeEnum).map(type => (
                                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                        ))}
                                    </Select>
                                )}
                            />
                        </FormControl>

                         <FormControl isInvalid={!!errors.parent_id}>
                            <FormLabel>Parent Goal (Optional)</FormLabel>
                            <Controller
                                name="parent_id"
                                control={control}
                                render={({ field }) => (
                                    <Select {...field} placeholder="Select parent goal...">
                                        {/* Add empty option for unlinking */} 
                                         <option value="">-- No Parent --</option> 
                                        {availableGoals.map(goal => (
                                            <option key={goal.id} value={goal.id}>{goal.title}</option>
                                        ))}
                                    </Select>
                                )}
                            />
                        </FormControl>

                        <FormControl isInvalid={!!errors.status}>
                            <FormLabel>Status</FormLabel>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => <Input {...field} placeholder="e.g., On Track, At Risk"/>}
                            />
                        </FormControl>

                        <FormControl isInvalid={!!errors.progress}>
                            <FormLabel>Progress (%)</FormLabel>
                            <Controller
                                name="progress"
                                control={control}
                                render={({ field: { onChange, value, ...restField } }) => (
                                    <NumberInput 
                                        {...restField} 
                                        value={value ?? 0} 
                                        onChange={(valueString) => onChange(parseInt(valueString) || 0)} 
                                        min={0} 
                                        max={100}
                                    >
                                        <NumberInputField />
                                        <NumberInputStepper>
                                            <NumberIncrementStepper />
                                            <NumberDecrementStepper />
                                        </NumberInputStepper>
                                    </NumberInput>
                                )}
                            />
                        </FormControl>

                        <FormControl isInvalid={!!errors.dueDate}>
                            <FormLabel>Due Date</FormLabel>
                            <Controller
                                name="dueDate"
                                control={control}
                                render={({ field }) => <Input type="date" {...field} />}
                            />
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button variant='ghost' mr={3} onClick={onClose} isDisabled={isSubmitting}>Cancel</Button>
                    <Button colorScheme='blue' type="submit" isLoading={isSubmitting}>
                        {initialData ? 'Save Changes' : 'Create Goal'}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}; 