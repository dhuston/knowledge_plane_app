import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Icon, HStack, Badge } from '@chakra-ui/react';
import { GoProject } from 'react-icons/go'; // Example icon for project
import { ProjectRead } from '../../types/project'; // Adjust path as needed

// Assuming data structure includes label and ProjectRead
interface ProjectNodeData {
    label: string;
    // Add other ProjectRead fields if needed (e.g., status)
    status?: string;
    originalApiNode?: { data: ProjectRead };
}

const ProjectNode: React.FC<NodeProps<ProjectNodeData>> = ({ data }) => {
    const projectData = data.originalApiNode?.data;
    const status = projectData?.status || data.status || 'Unknown'; // Get status

    // Define badge color based on status (example)
    let statusColorScheme = 'gray';
    if (status?.toLowerCase().includes('active')) statusColorScheme = 'green';
    if (status?.toLowerCase().includes('planning')) statusColorScheme = 'blue';
    if (status?.toLowerCase().includes('paused')) statusColorScheme = 'orange';

    return (
        <Box
            p={2}
            borderWidth="1px"
            borderRadius="lg" // Slightly larger radius
            bg="purple.50"
            borderColor="purple.300"
            shadow="sm"
            minWidth="170px"
        >
            <HStack spacing={2} mb={1}>
                <Icon as={GoProject} color="purple.600" />
                <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{data.label}</Text>
            </HStack>
            <Badge colorScheme={statusColorScheme} size="sm" variant="subtle">
                {status}
            </Badge>
            {/* Handles */}
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
        </Box>
    );
};

export default memo(ProjectNode); 