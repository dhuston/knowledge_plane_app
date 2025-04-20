import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Icon, VStack, Badge } from '@chakra-ui/react';
import { GoProject } from 'react-icons/go'; // Example icon

// Define the expected structure of the data prop for a ProjectNode
interface ProjectNodeData {
    label: string; // Project Name
    status?: string;
    // Add other relevant project data
}

const ProjectNode: React.FC<NodeProps<ProjectNodeData>> = ({ data }) => {
    // Map status to Chakra Badge color scheme
    const getStatusColorScheme = (status?: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
            case 'on_track':
                return 'green';
            case 'at_risk':
            case 'delayed':
                return 'orange';
            case 'completed':
                return 'blue';
            default:
                return 'gray';
        }
    };

    return (
        <Box
            p={3}
            borderRadius="md" // Rounded rectangle
            bg="purple.100"
            border="1px solid"
            borderColor="purple.300"
            minW="150px"
            textAlign="center"
            boxShadow="sm"
        >
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
            <VStack spacing={1} align="center">
                <Icon as={GoProject} boxSize={5} color="purple.600" />
                <Text fontSize="sm" fontWeight="bold" noOfLines={1} px={2}>
                    {data.label}
                </Text>
                {data.status && (
                    <Badge size="xs" colorScheme={getStatusColorScheme(data.status)}>
                        {data.status}
                    </Badge>
                )}
            </VStack>
        </Box>
    );
};

export default ProjectNode; 