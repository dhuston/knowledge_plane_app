import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Avatar, VStack } from '@chakra-ui/react';

// Define the expected structure of the data prop for a UserNode
interface UserNodeData {
    label: string; // Name
    title?: string;
    avatar_url?: string;
    // Add other relevant user data from backend MapNode.data payload
}

const UserNode: React.FC<NodeProps<UserNodeData>> = ({ data }) => {
    // Basic styling for a user node
    return (
        <Box
            p={2}
            borderRadius="full" // Make it circular
            bg="blue.100"
            border="1px solid"
            borderColor="blue.300"
            minW="100px"
            textAlign="center"
        >
            {/* Handles are connection points */}
            <Handle type="target" position={Position.Top} />
            <VStack spacing={1} align="center">
                <Avatar size="sm" name={data.label} src={data.avatar_url} />
                <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                    {data.label}
                </Text>
                {data.title && (
                    <Text fontSize="xx-small" color="gray.600" noOfLines={1}>
                        {data.title}
                    </Text>
                )}
            </VStack>
            <Handle type="source" position={Position.Bottom} />
            {/* Add more handles if needed, e.g., Left/Right */}
        </Box>
    );
};

export default UserNode; 