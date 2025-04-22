import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Icon, HStack } from '@chakra-ui/react';
import { GoGoal } from 'react-icons/go'; // Example icon for goal
// import { GoalRead } from '../../types/goal'; // Add this later if needed

// Assuming data structure includes label
interface GoalNodeData {
    label: string;
    title?: string; // For tooltip
    // Add other GoalRead fields if needed
    // originalApiNode?: { data: GoalRead };
}

const GoalNode: React.FC<NodeProps<GoalNodeData>> = ({ data }) => {
    // const goalData = data.originalApiNode?.data;

    return (
        <Box
            title={data.title || data.label} // Add title attribute
            _hover={{ // Add hover styles
                outline: '2px solid #f59e0b', // Example amber outline for goals
                outlineOffset: '1px',
                shadow: 'md', 
                zIndex: 10,
            }}
            p={2}
            borderWidth="1px"
            borderRadius="md"
            bg="orange.50"
            borderColor="orange.300"
            shadow="sm"
            minWidth="150px"
        >
            <HStack spacing={2}>
                <Icon as={GoGoal} color="orange.600" />
                <Text fontWeight="medium" fontSize="sm" noOfLines={1}>{data.label}</Text>
            </HStack>
            {/* Handles - Adjust positions based on typical connections */}
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
        </Box>
    );
};

export default memo(GoalNode); 