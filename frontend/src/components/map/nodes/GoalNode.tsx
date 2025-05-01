import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Text, Icon, HStack, Badge } from '@chakra-ui/react';
// Import different icons
import { GoGoal } from 'react-icons/go'; 
import { FaBuilding, FaBriefcase, FaUsers, FaUser, FaExclamationTriangle } from 'react-icons/fa'; 
import { GoalTypeEnum } from '../../../types/goal'; // Import GoalTypeEnum

// Add type to node data
interface GoalNodeData {
    label: string;
    title?: string; // For tooltip
    type?: GoalTypeEnum | string; // Allow string for safety, map from API
    status?: string;
    due_date?: string; // ISO string
    originalApiNode?: { data?: { type?: GoalTypeEnum | string, status?: string, due_date?: string } }; // Include original data if needed
    [key: string]: unknown; // Allow additional properties from backend without using 'any'
}

const GoalNode: React.FC<NodeProps<GoalNodeData>> = ({ data }) => {
    // Determine icon and color based on type
    const goalType = data.type || data.originalApiNode?.data?.type;

    // --- Determine At-Risk or Due Soon ---
    const statusRaw = data.status || data.originalApiNode?.data?.status;
    const statusLower = (statusRaw || '').toString().toLowerCase();
    const isAtRiskStatus = statusLower.includes('risk') || statusLower.includes('blocked') || statusLower.includes('delayed');

    const dueDateStr = data.due_date || data.originalApiNode?.data?.due_date;
    let isDueSoon = false;
    if (dueDateStr) {
        const dueDate = new Date(dueDateStr);
        if (!isNaN(dueDate.getTime())) {
            const today = new Date();
            const diffMs = dueDate.getTime() - today.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            if (diffDays >= 0 && diffDays <= 7) {
                isDueSoon = true;
            }
        }
    }

    const isCritical = isAtRiskStatus || isDueSoon;

    let GoalIcon = GoGoal; // Default icon
    let iconColor = "orange.600";
    let borderColor = "orange.300";
    let bgColor = "orange.50";
    let hoverOutlineColor = "#f59e0b"; // amber-500

    switch (goalType) {
        case GoalTypeEnum.ENTERPRISE:
            GoalIcon = FaBuilding;
            iconColor = "red.600";
            borderColor = "red.300";
            bgColor = "red.50";
            hoverOutlineColor = "#dc2626"; // red-600
            break;
        case GoalTypeEnum.DEPARTMENT:
            GoalIcon = FaBriefcase;
            iconColor = "blue.600";
            borderColor = "blue.300";
            bgColor = "blue.50";
            hoverOutlineColor = "#2563eb"; // blue-600
            break;
        case GoalTypeEnum.TEAM:
            GoalIcon = FaUsers;
            iconColor = "teal.600";
            borderColor = "teal.300";
            bgColor = "teal.50";
            hoverOutlineColor = "#0d9488"; // teal-600
            break;
        case GoalTypeEnum.INDIVIDUAL:
            GoalIcon = FaUser;
            iconColor = "purple.600";
            borderColor = "purple.300";
            bgColor = "purple.50";
            hoverOutlineColor = "#7e22ce"; // purple-600
            break;
    }

    // Override colors if critical
    if (isCritical) {
        borderColor = "red.400";
        bgColor = "red.50";
        hoverOutlineColor = "#dc2626";
    }

    const tooltipTitle = `${data.label}${statusRaw ? ` (${statusRaw})` : ''}${dueDateStr ? ` - Due: ${new Date(dueDateStr).toLocaleDateString()}` : ''}`;

    return (
        <Box
            title={tooltipTitle}
            _hover={{ 
                outline: `2px solid ${hoverOutlineColor}`,
                outlineOffset: '1px',
                shadow: 'md', 
                zIndex: 10,
                transform: 'scale(1.03)',
            }}
            transition="transform 0.1s ease-in-out, outline 0.1s ease-in-out"
            p={2}
            borderWidth="1px"
            borderRadius="full"
            bg={bgColor}
            borderColor={borderColor}
            shadow="sm"
            minWidth="150px"
        >
            <HStack spacing={2}>
                <Icon as={GoalIcon} color={iconColor} />
                <Text fontWeight="medium" fontSize="sm" noOfLines={1}>{data.label}</Text>
                {isCritical && (
                    <Icon as={FaExclamationTriangle} color="red.500" boxSize={3} title={isAtRiskStatus ? 'At Risk' : 'Due Soon'} />
                )}
            </HStack>
            {/* Optional badge for status */}
            {statusRaw && (
                <Badge colorScheme={isCritical ? 'red' : 'gray'} size="xs" mt={1}>{statusRaw}</Badge>
            )}
            {/* Handles */}
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
        </Box>
    );
};

export default memo(GoalNode); 