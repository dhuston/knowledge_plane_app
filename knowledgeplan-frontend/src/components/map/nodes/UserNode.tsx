import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Avatar, HStack, VStack } from '@chakra-ui/react';
import { UserRead } from '../../../types/user'; // Adjust path as necessary

// Assuming data structure passed from LivingMap includes label and UserRead object
interface UserNodeData {
    label: string;
    // Add other UserRead fields you want to display directly on the node
    email?: string;
    avatar_url?: string;
    title?: string;
    // Include the original UserRead data if needed for interactions
    originalApiNode?: { data: UserRead }; 
}

const UserNode: React.FC<NodeProps<UserNodeData>> = ({ data }) => {
    const userData = data.originalApiNode?.data;

    return (
        <Box
            p={2}
            borderWidth="1px"
            borderRadius="md"
            bg="white"
            borderColor="gray.300"
            shadow="sm"
            minWidth="150px" // Ensure minimum width
        >
            <HStack spacing={3}>
                <Avatar 
                    size="sm" 
                    name={data.label} 
                    src={userData?.avatar_url || undefined} 
                />
                <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{data.label}</Text>
                    {userData?.title && <Text fontSize="xs" color="gray.500" noOfLines={1}>{userData.title}</Text>}
                </VStack>
            </HStack>
            {/* Handles allow connecting edges */}
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
            {/* Add Left/Right handles if needed for different layouts */}
            {/* <Handle type="target" position={Position.Left} style={{ background: '#555' }} /> */}
            {/* <Handle type="source" position={Position.Right} style={{ background: '#555' }} /> */}
        </Box>
    );
};

export default memo(UserNode); 