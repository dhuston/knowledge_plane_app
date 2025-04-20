import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Icon, VStack } from '@chakra-ui/react';
import { FaUsers } from 'react-icons/fa'; // Example icon

// Define the expected structure of the data prop for a TeamNode
interface TeamNodeData {
    label: string; // Team Name
    // Add other relevant team data
}

const TeamNode: React.FC<NodeProps<TeamNodeData>> = ({ data }) => {
    return (
        <Box
            p={3} // Slightly larger padding
            borderRadius="full" // Still circular, but larger overall
            bg="green.100"
            border="1px solid"
            borderColor="green.300"
            minW="120px" // Slightly wider
            textAlign="center"
            boxShadow="sm"
        >
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
            <VStack spacing={1} align="center">
                <Icon as={FaUsers} boxSize={5} color="green.600" />
                <Text fontSize="sm" fontWeight="bold" noOfLines={1}>
                    {data.label}
                </Text>
            </VStack>
        </Box>
    );
};

export default TeamNode; 