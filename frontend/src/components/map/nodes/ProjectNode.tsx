import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Icon, HStack, Badge } from '@chakra-ui/react';
import { GoProject } from 'react-icons/go'; // Example icon for project
import { FaExclamationTriangle } from 'react-icons/fa'; // Import warning icon
import NodeWithNotifications from '../notifications/NodeWithNotifications';

// Assuming data structure includes label and ProjectRead
interface ProjectNodeData {
    label: string;
    title?: string; // Add title prop
    id: string; // Node ID needed for notification matching
    // Add other ProjectRead fields if needed (e.g., status)
    status?: string;
    hasOverlaps?: boolean; // Flag indicating potential overlaps
    originalApiNode?: { data: Record<string, unknown> };
}

const ProjectNode: React.FC<NodeProps<ProjectNodeData>> = ({ data }) => {
    const projectData = data.originalApiNode?.data as Record<string, unknown> | undefined;
    const statusRaw = projectData?.status ?? data.status ?? 'Unknown';
    const status = typeof statusRaw === 'string' ? statusRaw : 'Unknown';
    
    // Node properties for notification matching
    const nodeId = data.id || '';

    // Define badge color based on status (example)
    let statusColorScheme: string = 'gray';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active')) statusColorScheme = 'green';
    else if (statusLower.includes('planning')) statusColorScheme = 'blue';
    else if (statusLower.includes('paused')) statusColorScheme = 'orange';
    else if (statusLower.includes('at risk') || statusLower.includes('blocked')) statusColorScheme = 'red'; // Highlight at risk
    
    const ProjectNodeContent = () => (
        <Box
            title={`${data.label} (${status})`} // Add status to title attribute
            _hover={{ 
                outline: '2px solid #805AD5', // Example purple outline for projects
                outlineOffset: '2px',
                shadow: 'md',
                zIndex: 10,
                transform: 'scale(1.03)', // Add scale
            }}
            transition="transform 0.1s ease-in-out" // Add transition
            p={2}
            borderWidth="1px"
            borderRadius="lg" // Slightly larger radius
            bg="purple.50"
            borderColor="purple.300"
            shadow="sm"
            minWidth="170px"
        >
            <HStack spacing={1} mb={1} justifyContent="space-between"> {/* Adjust spacing and justify */} 
                <HStack spacing={1} flexShrink={1} minWidth={0}> {/* Inner stack for icon/text */} 
                    <Icon as={GoProject} color="purple.600" />
                    <Text fontWeight="bold" fontSize="sm" noOfLines={1} title={data.label}>{data.label}</Text>
                </HStack>
                {/* Conditionally render overlap icon */} 
                {data.hasOverlaps && (
                    <Icon 
                        as={FaExclamationTriangle} 
                        color="orange.400" 
                        title="Potential project overlap detected" 
                        boxSize={3} // Smaller icon
                        ml={1} // Margin left
                    />
                )}
            </HStack>
            <Badge colorScheme={statusColorScheme} size="sm" variant="subtle">
                {status as string}
            </Badge>
            {/* Handles */}
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
        </Box>
    );

    return (
        <NodeWithNotifications 
            node={{ 
                id: nodeId, 
                type: 'project' 
            }} 
            animate={true}
        >
            <ProjectNodeContent />
        </NodeWithNotifications>
    );
};

export default memo(ProjectNode);