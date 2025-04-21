import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Icon, HStack } from '@chakra-ui/react';
import { FaUsers } from 'react-icons/fa'; // Example icon
import { TeamRead } from '../../types/team'; // Corrected path assumption

// Assuming data structure includes label and TeamRead
interface TeamNodeData {
    label: string;
    // Add other TeamRead fields if needed
    originalApiNode?: { data: TeamRead };
}

const TeamNode: React.FC<NodeProps<TeamNodeData>> = ({ data }) => {
    // const teamData = data.originalApiNode?.data;

    return (
        <Box
            p={2}
            borderWidth="1px"
            borderRadius="md"
            bg="gray.50"
            borderColor="gray.300"
            shadow="sm"
            minWidth="150px"
        >
            <HStack spacing={2}>
                <Icon as={FaUsers} color="gray.500" />
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