import React from 'react';
import { VStack, Box, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { Note as NoteType } from '../../types/knowledge_asset';

interface NoteListProps {
    notes: NoteType[];
    isLoading?: boolean;
    error?: string | null;
}

export const NoteList: React.FC<NoteListProps> = ({ notes, isLoading = false, error = null }) => {
    if (isLoading) {
        return <Spinner size="sm" />;
    }

    if (error) {
        return (
            <Alert status="error" fontSize="sm" p={1}>
                <AlertIcon />
                {error}
            </Alert>
        );
    }

    if (!notes.length) {
        return <Text fontSize="sm" color="gray.500">No notes yet.</Text>;
    }

    return (
        <VStack align="stretch" spacing={2} mt={2}>
            {notes.map((note) => (
                <Box key={note.id} p={2} borderWidth="1px" borderRadius="md">
                    {/* For now, just show content – can enhance with author, timestamps, etc. */}
                    <Text fontSize="sm" whiteSpace="pre-wrap">{note.content}</Text>
                </Box>
            ))}
        </VStack>
    );
}; 