import React, { memo, type FC } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Icon, HStack } from '@chakra-ui/react';
import { FaUsers } from 'react-icons/fa'; // Example icon

// Assuming data structure includes label and TeamRead
interface TeamNodeData {
    label: string;
    title?: string; // Add title prop
    // Add other TeamRead fields if needed
    originalApiNode?: { data: Record<string, unknown> };
}

const TeamNode: FC<NodeProps<TeamNodeData>> = ({ data }) => {
    // const teamData = data.originalApiNode?.data;

    return (
        <Box
            title={data.title || data.label} // Add title attribute
            _hover={{ 
                outline: '2px solid #0BC5EA', // Example cyan outline for teams
                outlineOffset: '2px',
                shadow: 'md', 
                zIndex: 10,
                transform: 'scale(1.03)', // Add scale
            }}
            transition="transform 0.1s ease-in-out" // Add transition
            p={2}
            borderWidth="1px"
            borderRadius="md"
            bg="green.50"
            borderColor="green.300"
            shadow="sm"
            minWidth="150px"
        >
            <HStack spacing={2}>
                <Icon as={FaUsers} color="green.600" />
                <Text fontWeight="medium" fontSize="sm" noOfLines={1}>{data.label}</Text>
            </HStack>
            {/* Handles */}
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
        </Box>
    );
};

export default memo(TeamNode); 