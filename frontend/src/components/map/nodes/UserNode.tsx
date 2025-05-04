import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Avatar, HStack, VStack } from '@chakra-ui/react';
import NodeWithNotifications from '../notifications/NodeWithNotifications';

// Assuming data structure passed from LivingMap includes label and UserRead object
interface UserNodeData {
    label: string;
    // Add title explicitly to the expected data
    title?: string; 
    // Add other UserRead fields you want to display directly on the node
    email?: string;
    avatar_url?: string;
    id: string; // Node ID needed for notification matching
    // Include the original UserRead data if needed for interactions
    originalApiNode?: { data: Record<string, unknown> }; 
}

const UserNode: React.FC<NodeProps<UserNodeData>> = ({ data }) => {
    // Ensure userData access is safe and avatar_url is treated as string | undefined
    const userData = data.originalApiNode?.data as Record<string, unknown> | undefined;
    const avatarUrl = typeof userData?.avatar_url === 'string' ? userData.avatar_url : undefined;
    
    // Node properties for notification matching
    const nodeId = data.id || '';
    
    const UserNodeContent = () => (
        <Box
            title={data.title || data.label} // Use title if available, fallback to label
            _hover={{ 
                outline: '2px solid #3b82f6', // Match user node color theme
                outlineOffset: '1px', 
                shadow: 'md', 
                zIndex: 10,
                transform: 'scale(1.03)', // Add slight scale on hover
            }}
            transition="transform 0.1s ease-in-out" // Smooth the transition
            p={2}
            borderWidth="1px"
            borderRadius="md"
            bg="white"
            borderColor="blue.300"
            shadow="sm"
            minWidth="150px" // Ensure minimum width
        >
            <HStack spacing={3}>
                <Avatar 
                    size="sm" 
                    name={data.label}
                />
                <VStack align="start" spacing={0}>
                    <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{data.label}</Text>
                    {/* Ensure title access is also safe */} 
                    {typeof userData?.title === 'string' && userData.title && 
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>{userData.title}</Text>}
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

    return (
        <NodeWithNotifications 
            node={{ 
                id: nodeId, 
                type: 'user' 
            }} 
            animate={true}
        >
            <UserNodeContent />
        </NodeWithNotifications>
    );
};

export default memo(UserNode);