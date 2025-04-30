import React, { useState } from 'react';
import {
    FormControl,
    FormLabel,
    Input,
    Textarea,
    Select,
    Button,
    VStack,
    useToast,
    FormErrorMessage,
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { useApiClient } from '../../hooks/useApiClient';
import { KnowledgeAssetTypeEnum, KnowledgeAssetRead } from '../../types/knowledge_asset';

interface KnowledgeAssetFormProps {
    onSubmit: (asset: KnowledgeAssetRead) => void;
    initialData?: Partial<KnowledgeAssetRead>;
}

interface FormData {
    title: string;
    type: KnowledgeAssetTypeEnum;
    source?: string;
    link?: string;
    description?: string;
    project_id?: string;
}

const KnowledgeAssetForm: React.FC<KnowledgeAssetFormProps> = ({ onSubmit, initialData }) => {
    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            title: initialData?.title || '',
            type: initialData?.type || KnowledgeAssetTypeEnum.DOCUMENT,
            source: initialData?.source || '',
            link: initialData?.link || '',
            description: initialData?.properties?.description || '',
            project_id: initialData?.project_id || '',
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const apiClient = useApiClient();
    const toast = useToast();

    const onFormSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            // For demo purposes, we'll just simulate a successful API call
            console.log('Creating knowledge asset with data:', data);

            // Simulate API response
            const mockResponse: KnowledgeAssetRead = {
                id: `asset-${Date.now()}`,
                tenant_id: 'tenant-1',
                type: data.type,
                title: data.title,
                source: data.source || null,
                link: data.link || null,
                properties: {
                    description: data.description
                },
                project_id: data.project_id || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by_user_id: 'user-1',
            };

            // Call the onSubmit callback with the mock response
            onSubmit(mockResponse);

            toast({
                title: 'Success',
                description: `Knowledge asset "${data.title}" created successfully.`,
                status: 'success',
                duration: 3000,
            });
        } catch (error) {
            console.error('Error creating knowledge asset:', error);
            toast({
                title: 'Error',
                description: 'Failed to create knowledge asset. Please try again.',
                status: 'error',
                duration: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)}>
            <VStack spacing={4} align="stretch">
                <FormControl isRequired isInvalid={!!errors.title}>
                    <FormLabel>Title</FormLabel>
                    <Controller
                        name="title"
                        control={control}
                        rules={{ required: 'Title is required' }}
                        render={({ field }) => <Input {...field} />}
                    />
                    <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.type}>
                    <FormLabel>Type</FormLabel>
                    <Controller
                        name="type"
                        control={control}
                        rules={{ required: 'Type is required' }}
                        render={({ field }) => (
                            <Select {...field}>
                                {Object.values(KnowledgeAssetTypeEnum).map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </Select>
                        )}
                    />
                    <FormErrorMessage>{errors.type?.message}</FormErrorMessage>
                </FormControl>

                <FormControl>
                    <FormLabel>Source</FormLabel>
                    <Controller
                        name="source"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                placeholder="e.g., Google Drive, Slack, etc."
                            />
                        )}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Link</FormLabel>
                    <Controller
                        name="link"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                placeholder="https://..."
                            />
                        )}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <Textarea
                                {...field}
                                placeholder="Enter a description..."
                            />
                        )}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Project ID (Optional)</FormLabel>
                    <Controller
                        name="project_id"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                placeholder="Link to a project..."
                            />
                        )}
                    />
                </FormControl>

                <Button
                    mt={4}
                    colorScheme="blue"
                    isLoading={isSubmitting}
                    type="submit"
                >
                    Create Knowledge Asset
                </Button>
            </VStack>
        </form>
    );
};

export default KnowledgeAssetForm;
