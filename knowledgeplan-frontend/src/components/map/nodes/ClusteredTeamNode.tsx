import React, { memo, type FC } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Icon, HStack, Badge, VStack } from '@chakra-ui/react';
import { FaUsers } from 'react-icons/fa';

// Data expected by this clustered node
interface ClusteredTeamNodeData {
    label: string; // Team Name
    memberCount: number;
    // originalApiNode?: { data: Record<string, unknown> }; // Might not be needed for cluster node
}

const ClusteredTeamNode: FC<NodeProps<ClusteredTeamNodeData>> = ({ data }) => {

    return (
        <Box
            title={`${data.label} (${data.memberCount} members)`} 
            _hover={{ 
                outline: '2px solid #276749', // Darker green outline
                outlineOffset: '2px',
                shadow: 'lg', // Larger shadow
                zIndex: 10,
                transform: 'scale(1.03)', 
            }}
            transition="transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out"
            p={3} // Slightly larger padding
            borderWidth="2px" // Thicker border
            borderStyle="dashed" // Dashed border to indicate cluster
            borderRadius="lg" // Larger radius
            bg="green.50"
            borderColor="green.400" // Slightly darker border
            shadow="md"
            minWidth="160px" // Slightly wider
        >
            <VStack spacing={1} align="start">
                <HStack spacing={2}>
                    <Icon as={FaUsers} color="green.600" boxSize={5} />
                    <Text fontWeight="bold" fontSize="md" noOfLines={1}>{data.label}</Text>
                </HStack>
                <Badge 
                    colorScheme="green" 
                    variant="solid" 
                    size="sm"
                    ml={7} // Indent badge slightly
                >
                    {data.memberCount} Members
                </Badge>
            </VStack>
            
            {/* Handles - Standard positions */}
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
        </Box>
    );
};

export default memo(ClusteredTeamNode); 