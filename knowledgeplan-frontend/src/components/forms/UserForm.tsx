import React, { useState } from 'react';
import {
    FormControl,
    FormLabel,
    Input,
    Button,
    VStack,
    useToast,
    FormErrorMessage,
    Select,
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { useApiClient } from '../../hooks/useApiClient';
import { User, UserCreate } from '../../types/user';

interface UserFormProps {
    onSubmit: (user: User) => void;
    initialData?: Partial<User>;
}

interface FormData {
    name: string;
    email: string;
    title?: string;
    team_id?: string;
    manager_id?: string;
}

const UserForm: React.FC<UserFormProps> = ({ onSubmit, initialData }) => {
    const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            name: initialData?.name || '',
            email: initialData?.email || '',
            title: initialData?.title || '',
            team_id: initialData?.team_id || '',
            manager_id: initialData?.manager_id || '',
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const apiClient = useApiClient();
    const toast = useToast();

    const onFormSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            // For demo purposes, we'll just simulate a successful API call
            // In a real implementation, you would make an actual API call
            console.log('Creating user with data:', data);

            // Simulate API response
            const mockResponse: User = {
                id: `user-${Date.now()}`,
                tenant_id: 'tenant-1',
                name: data.name,
                email: data.email,
                title: data.title || null,
                team_id: data.team_id || null,
                manager_id: data.manager_id || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            // Call the onSubmit callback with the mock response
            onSubmit(mockResponse);

            toast({
                title: 'Success',
                description: `User ${data.name} created successfully.`,
                status: 'success',
                duration: 3000,
            });
        } catch (error) {
            console.error('Error creating user:', error);
            toast({
                title: 'Error',
                description: 'Failed to create user. Please try again.',
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
                <FormControl isRequired isInvalid={!!errors.name}>
                    <FormLabel>Name</FormLabel>
                    <Controller
                        name="name"
                        control={control}
                        rules={{ required: 'Name is required' }}
                        render={({ field }) => <Input {...field} />}
                    />
                    <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.email}>
                    <FormLabel>Email</FormLabel>
                    <Controller
                        name="email"
                        control={control}
                        rules={{
                            required: 'Email is required',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Invalid email address'
                            }
                        }}
                        render={({ field }) => <Input {...field} type="email" />}
                    />
                    <FormErrorMessage>{errors.email?.message}</FormErrorMessage>
                </FormControl>

                <FormControl>
                    <FormLabel>Title</FormLabel>
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                placeholder="e.g., Research Scientist, Project Manager"
                            />
                        )}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Team ID (Optional)</FormLabel>
                    <Controller
                        name="team_id"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                placeholder="Link to a team..."
                            />
                        )}
                    />
                </FormControl>

                <FormControl>
                    <FormLabel>Manager ID (Optional)</FormLabel>
                    <Controller
                        name="manager_id"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                placeholder="Link to a manager..."
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
                    Add Person
                </Button>
            </VStack>
        </form>
    );
};

export default UserForm;
