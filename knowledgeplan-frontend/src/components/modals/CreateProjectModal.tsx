import React, { useState } from 'react';
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
    Input,
    Textarea,
    VStack,
    useToast,
} from '@chakra-ui/react';

import { useApiClient } from '../../hooks/useApiClient';
import { Project, ProjectCreate } from '../../types/project';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectCreated?: (newProject: Project) => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onProjectCreated }) => {
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const apiClient = useApiClient();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!projectName.trim()) {
            toast({ title: "Project name is required", status: "error", duration: 3000 });
            return;
        }

        setIsLoading(true);
        const projectData: ProjectCreate = {
            name: projectName.trim(),
            description: projectDescription.trim() || undefined,
        };

        try {
            const response = await apiClient.post<Project>('/projects/', projectData);
            onProjectCreated?.(response.data);
            toast({ title: "Project created!", status: "success", duration: 3000 });
            handleClose();
        } catch (error: unknown) {
            console.error("Failed to create project:", error);
            let errorMessage = "Could not create project.";
            if (typeof error === 'object' && error !== null && 'response' in error) {
                const responseError = error as { response?: { data?: { detail?: string } } };
                errorMessage = responseError.response?.data?.detail || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            toast({ title: "Error creating project", description: errorMessage, status: "error", duration: 5000 });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setProjectName('');
        setProjectDescription('');
        setIsLoading(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} isCentered>
            <ModalOverlay />
            <ModalContent as="form" onSubmit={handleSubmit}>
                <ModalHeader>Create New Project Hub</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>Project Name</FormLabel>
                            <Input
                                placeholder="Enter project name"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                isDisabled={isLoading}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Description (Optional)</FormLabel>
                            <Textarea
                                placeholder="Enter a brief description"
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                                isDisabled={isLoading}
                            />
                        </FormControl>
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button 
                        colorScheme="brand" 
                        mr={3} 
                        type="submit" 
                        isLoading={isLoading}
                    >
                        Create
                    </Button>
                    <Button variant="ghost" onClick={handleClose} isDisabled={isLoading}>Cancel</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default CreateProjectModal; 