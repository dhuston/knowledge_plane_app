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
    FormControl,
    FormLabel,
    Select,
    VStack,
    useToast,
    FormErrorMessage,
    Text,
    Box,
    Divider,
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { useApiClient } from '../../hooks/useApiClient';
import { MapNodeTypeEnum, MapEdgeTypeEnum } from '../../types/map';

interface EntityLinkingModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceNodeId?: string;
    sourceNodeType?: MapNodeTypeEnum;
    targetNodeId?: string;
    targetNodeType?: MapNodeTypeEnum;
    onLinkCreated?: () => void;
}

interface FormData {
    sourceType: MapNodeTypeEnum;
    sourceId: string;
    relationshipType: MapEdgeTypeEnum;
    targetType: MapNodeTypeEnum;
    targetId: string;
}

interface EntityOption {
    id: string;
    name: string;
}

const EntityLinkingModal: React.FC<EntityLinkingModalProps> = ({
    isOpen,
    onClose,
    sourceNodeId,
    sourceNodeType,
    targetNodeId,
    targetNodeType,
    onLinkCreated
}) => {
    const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            sourceType: sourceNodeType || MapNodeTypeEnum.PROJECT,
            sourceId: sourceNodeId || '',
            relationshipType: MapEdgeTypeEnum.ALIGNED_TO,
            targetType: targetNodeType || MapNodeTypeEnum.GOAL,
            targetId: targetNodeId || '',
        }
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sourceOptions, setSourceOptions] = useState<EntityOption[]>([]);
    const [targetOptions, setTargetOptions] = useState<EntityOption[]>([]);
    const [isLoadingSourceOptions, setIsLoadingSourceOptions] = useState(false);
    const [isLoadingTargetOptions, setIsLoadingTargetOptions] = useState(false);

    const apiClient = useApiClient();
    const toast = useToast();

    const watchSourceType = watch('sourceType');
    const watchTargetType = watch('targetType');
    const watchRelationshipType = watch('relationshipType');

    // Load source entity options when source type changes
    useEffect(() => {
        const fetchSourceOptions = async () => {
            if (!watchSourceType) return;

            setIsLoadingSourceOptions(true);
            try {
                // For demo purposes, we'll use mock data instead of API calls
                // In a real implementation, you would make actual API calls

                // Generate mock options based on entity type
                let mockOptions: EntityOption[] = [];

                switch (watchSourceType) {
                    case MapNodeTypeEnum.USER:
                        mockOptions = [
                            { id: 'user-1', name: 'John Doe' },
                            { id: 'user-2', name: 'Jane Smith' },
                            { id: 'user-3', name: 'Robert Johnson' },
                        ];
                        break;
                    case MapNodeTypeEnum.TEAM:
                        mockOptions = [
                            { id: 'team-1', name: 'Research Team' },
                            { id: 'team-2', name: 'Development Team' },
                            { id: 'team-3', name: 'Marketing Team' },
                        ];
                        break;
                    case MapNodeTypeEnum.PROJECT:
                        mockOptions = [
                            { id: 'project-1', name: 'AI Research Project' },
                            { id: 'project-2', name: 'Platform Development' },
                            { id: 'project-3', name: 'Market Analysis' },
                        ];
                        break;
                    case MapNodeTypeEnum.GOAL:
                        mockOptions = [
                            { id: 'goal-1', name: 'Increase Research Output' },
                            { id: 'goal-2', name: 'Improve Platform Stability' },
                            { id: 'goal-3', name: 'Expand Market Reach' },
                        ];
                        break;
                    case MapNodeTypeEnum.KNOWLEDGE_ASSET:
                        mockOptions = [
                            { id: 'asset-1', name: 'Research Paper' },
                            { id: 'asset-2', name: 'Technical Documentation' },
                            { id: 'asset-3', name: 'Market Analysis Report' },
                        ];
                        break;
                    default:
                        break;
                }

                setSourceOptions(mockOptions);
            } catch (error) {
                console.error('Error fetching source options:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load source options.',
                    status: 'error',
                    duration: 3000,
                });
            } finally {
                setIsLoadingSourceOptions(false);
            }
        };

        fetchSourceOptions();
    }, [watchSourceType, toast]);

    // Load target entity options when target type changes
    useEffect(() => {
        const fetchTargetOptions = async () => {
            if (!watchTargetType) return;

            setIsLoadingTargetOptions(true);
            try {
                // For demo purposes, we'll use mock data instead of API calls
                // In a real implementation, you would make actual API calls

                // Generate mock options based on entity type
                let mockOptions: EntityOption[] = [];

                switch (watchTargetType) {
                    case MapNodeTypeEnum.USER:
                        mockOptions = [
                            { id: 'user-1', name: 'John Doe' },
                            { id: 'user-2', name: 'Jane Smith' },
                            { id: 'user-3', name: 'Robert Johnson' },
                        ];
                        break;
                    case MapNodeTypeEnum.TEAM:
                        mockOptions = [
                            { id: 'team-1', name: 'Research Team' },
                            { id: 'team-2', name: 'Development Team' },
                            { id: 'team-3', name: 'Marketing Team' },
                        ];
                        break;
                    case MapNodeTypeEnum.PROJECT:
                        mockOptions = [
                            { id: 'project-1', name: 'AI Research Project' },
                            { id: 'project-2', name: 'Platform Development' },
                            { id: 'project-3', name: 'Market Analysis' },
                        ];
                        break;
                    case MapNodeTypeEnum.GOAL:
                        mockOptions = [
                            { id: 'goal-1', name: 'Increase Research Output' },
                            { id: 'goal-2', name: 'Improve Platform Stability' },
                            { id: 'goal-3', name: 'Expand Market Reach' },
                        ];
                        break;
                    case MapNodeTypeEnum.KNOWLEDGE_ASSET:
                        mockOptions = [
                            { id: 'asset-1', name: 'Research Paper' },
                            { id: 'asset-2', name: 'Technical Documentation' },
                            { id: 'asset-3', name: 'Market Analysis Report' },
                        ];
                        break;
                    default:
                        break;
                }

                setTargetOptions(mockOptions);
            } catch (error) {
                console.error('Error fetching target options:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to load target options.',
                    status: 'error',
                    duration: 3000,
                });
            } finally {
                setIsLoadingTargetOptions(false);
            }
        };

        fetchTargetOptions();
    }, [watchTargetType, toast]);

    // Update relationship options based on source and target types
    useEffect(() => {
        // Set appropriate default relationship type based on source and target
        if (watchSourceType === MapNodeTypeEnum.PROJECT && watchTargetType === MapNodeTypeEnum.GOAL) {
            setValue('relationshipType', MapEdgeTypeEnum.ALIGNED_TO);
        } else if (watchSourceType === MapNodeTypeEnum.USER && watchTargetType === MapNodeTypeEnum.TEAM) {
            setValue('relationshipType', MapEdgeTypeEnum.MEMBER_OF);
        } else if (watchSourceType === MapNodeTypeEnum.USER && watchTargetType === MapNodeTypeEnum.USER) {
            setValue('relationshipType', MapEdgeTypeEnum.REPORTS_TO);
        } else if (watchSourceType === MapNodeTypeEnum.TEAM && watchTargetType === MapNodeTypeEnum.PROJECT) {
            setValue('relationshipType', MapEdgeTypeEnum.OWNS);
        } else if (watchSourceType === MapNodeTypeEnum.USER && watchTargetType === MapNodeTypeEnum.PROJECT) {
            setValue('relationshipType', MapEdgeTypeEnum.PARTICIPATES_IN);
        } else {
            setValue('relationshipType', MapEdgeTypeEnum.RELATED_TO);
        }
    }, [watchSourceType, watchTargetType, setValue]);

    const getValidRelationshipTypes = (): MapEdgeTypeEnum[] => {
        // Return appropriate relationship types based on source and target types
        if (watchSourceType === MapNodeTypeEnum.PROJECT && watchTargetType === MapNodeTypeEnum.GOAL) {
            return [MapEdgeTypeEnum.ALIGNED_TO];
        } else if (watchSourceType === MapNodeTypeEnum.USER && watchTargetType === MapNodeTypeEnum.TEAM) {
            return [MapEdgeTypeEnum.MEMBER_OF];
        } else if (watchSourceType === MapNodeTypeEnum.USER && watchTargetType === MapNodeTypeEnum.USER) {
            return [MapEdgeTypeEnum.REPORTS_TO];
        } else if (watchSourceType === MapNodeTypeEnum.TEAM && watchTargetType === MapNodeTypeEnum.PROJECT) {
            return [MapEdgeTypeEnum.OWNS];
        } else if (watchSourceType === MapNodeTypeEnum.USER && watchTargetType === MapNodeTypeEnum.PROJECT) {
            return [MapEdgeTypeEnum.PARTICIPATES_IN];
        } else if (watchSourceType === MapNodeTypeEnum.GOAL && watchTargetType === MapNodeTypeEnum.GOAL) {
            return [MapEdgeTypeEnum.PARENT_OF, MapEdgeTypeEnum.ALIGNED_TO];
        } else {
            return [
                MapEdgeTypeEnum.RELATED_TO,
                MapEdgeTypeEnum.ALIGNED_TO,
                MapEdgeTypeEnum.PARTICIPATES_IN,
                MapEdgeTypeEnum.OWNS,
                MapEdgeTypeEnum.MEMBER_OF,
                MapEdgeTypeEnum.REPORTS_TO,
                MapEdgeTypeEnum.PARENT_OF
            ];
        }
    };

    const onFormSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            // For demo purposes, we'll just simulate a successful API call
            console.log('Linking entities with data:', {
                sourceId: data.sourceId,
                sourceType: data.sourceType,
                targetId: data.targetId,
                targetType: data.targetType,
                relationshipType: data.relationshipType
            });

            // Simulate a delay for the API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            toast({
                title: 'Success',
                description: 'Entities linked successfully.',
                status: 'success',
                duration: 3000,
            });

            onLinkCreated?.();
            onClose();
        } catch (error) {
            console.error('Error linking entities:', error);
            toast({
                title: 'Error',
                description: 'Failed to link entities. Please try again.',
                status: 'error',
                duration: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Link Entities</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <form onSubmit={handleSubmit(onFormSubmit)}>
                        <VStack spacing={4} align="stretch">
                            <Text fontWeight="bold">Source Entity</Text>
                            <FormControl isRequired isInvalid={!!errors.sourceType}>
                                <FormLabel>Entity Type</FormLabel>
                                <Controller
                                    name="sourceType"
                                    control={control}
                                    rules={{ required: 'Source type is required' }}
                                    render={({ field }) => (
                                        <Select {...field} isDisabled={!!sourceNodeType}>
                                            <option value={MapNodeTypeEnum.USER}>Person</option>
                                            <option value={MapNodeTypeEnum.TEAM}>Team</option>
                                            <option value={MapNodeTypeEnum.PROJECT}>Project</option>
                                            <option value={MapNodeTypeEnum.GOAL}>Goal</option>
                                            <option value={MapNodeTypeEnum.KNOWLEDGE_ASSET}>Knowledge Asset</option>
                                        </Select>
                                    )}
                                />
                                <FormErrorMessage>{errors.sourceType?.message}</FormErrorMessage>
                            </FormControl>

                            <FormControl isRequired isInvalid={!!errors.sourceId}>
                                <FormLabel>Source Entity</FormLabel>
                                <Controller
                                    name="sourceId"
                                    control={control}
                                    rules={{ required: 'Source entity is required' }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            placeholder="Select source entity..."
                                            isDisabled={isLoadingSourceOptions || !!sourceNodeId}
                                        >
                                            {sourceOptions.map((option) => (
                                                <option key={option.id} value={option.id}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </Select>
                                    )}
                                />
                                <FormErrorMessage>{errors.sourceId?.message}</FormErrorMessage>
                            </FormControl>

                            <Divider my={2} />

                            <FormControl isRequired isInvalid={!!errors.relationshipType}>
                                <FormLabel>Relationship Type</FormLabel>
                                <Controller
                                    name="relationshipType"
                                    control={control}
                                    rules={{ required: 'Relationship type is required' }}
                                    render={({ field }) => (
                                        <Select {...field}>
                                            {getValidRelationshipTypes().map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </Select>
                                    )}
                                />
                                <FormErrorMessage>{errors.relationshipType?.message}</FormErrorMessage>
                            </FormControl>

                            <Divider my={2} />

                            <Text fontWeight="bold">Target Entity</Text>
                            <FormControl isRequired isInvalid={!!errors.targetType}>
                                <FormLabel>Entity Type</FormLabel>
                                <Controller
                                    name="targetType"
                                    control={control}
                                    rules={{ required: 'Target type is required' }}
                                    render={({ field }) => (
                                        <Select {...field} isDisabled={!!targetNodeType}>
                                            <option value={MapNodeTypeEnum.USER}>Person</option>
                                            <option value={MapNodeTypeEnum.TEAM}>Team</option>
                                            <option value={MapNodeTypeEnum.PROJECT}>Project</option>
                                            <option value={MapNodeTypeEnum.GOAL}>Goal</option>
                                            <option value={MapNodeTypeEnum.KNOWLEDGE_ASSET}>Knowledge Asset</option>
                                        </Select>
                                    )}
                                />
                                <FormErrorMessage>{errors.targetType?.message}</FormErrorMessage>
                            </FormControl>

                            <FormControl isRequired isInvalid={!!errors.targetId}>
                                <FormLabel>Target Entity</FormLabel>
                                <Controller
                                    name="targetId"
                                    control={control}
                                    rules={{ required: 'Target entity is required' }}
                                    render={({ field }) => (
                                        <Select
                                            {...field}
                                            placeholder="Select target entity..."
                                            isDisabled={isLoadingTargetOptions || !!targetNodeId}
                                        >
                                            {targetOptions.map((option) => (
                                                <option key={option.id} value={option.id}>
                                                    {option.name}
                                                </option>
                                            ))}
                                        </Select>
                                    )}
                                />
                                <FormErrorMessage>{errors.targetId?.message}</FormErrorMessage>
                            </FormControl>

                            <Box pt={4}>
                                <Button
                                    colorScheme="blue"
                                    isLoading={isSubmitting}
                                    type="submit"
                                    width="100%"
                                >
                                    Create Link
                                </Button>
                            </Box>
                        </VStack>
                    </form>
                </ModalBody>
                <ModalFooter>
                    <Button variant="ghost" onClick={onClose} isDisabled={isSubmitting}>
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default EntityLinkingModal;
