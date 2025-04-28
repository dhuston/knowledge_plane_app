import React, { useState } from 'react';
import { VStack, Textarea, Button } from '@chakra-ui/react';

interface NoteInputProps {
    onSubmit: (content: string) => Promise<void> | void;
    placeholder?: string;
    isSubmitting?: boolean;
}

export const NoteInput: React.FC<NoteInputProps> = ({ onSubmit, placeholder = 'Add a note...', isSubmitting = false }) => {
    const [content, setContent] = useState('');

    const handleSubmit = async () => {
        if (!content.trim()) return;
        await onSubmit(content.trim());
        setContent('');
    };

    return (
        <VStack align="stretch" spacing={2} mb={2}>
            <Textarea
                size="sm"
                resize="vertical"
                minH="60px"
                value={content}
                placeholder={placeholder}
                onChange={(e) => setContent(e.target.value)}
            />
            <Button size="sm" colorScheme="blue" onClick={handleSubmit} isLoading={isSubmitting || undefined}>
                Add Note
            </Button>
        </VStack>
    );
}; 