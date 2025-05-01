/**
 * PanelHeader.tsx
 * Header component for context panels
 */
import React from 'react';
import { HStack, Icon, VStack, Heading, Text, CloseButton, useColorModeValue } from '@chakra-ui/react';
import { 
  MdOutlinePerson, 
  MdOutlineGroup, 
  MdOutlineFolder, 
  MdOutlineFlag,
  MdOutlineBook,
  MdOutlineBusinessCenter,
  MdOutlineQuestionMark
} from 'react-icons/md';
import { MapNodeTypeEnum } from '../../../types/map';

interface PanelHeaderProps {
  label: string;
  type?: MapNodeTypeEnum;
  onClose: () => void;
}

const PanelHeader: React.FC<PanelHeaderProps> = ({
  label,
  type,
  onClose
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Get node icon based on type
  const getNodeIcon = (type: MapNodeTypeEnum | undefined) => {
    switch (type) {
      case MapNodeTypeEnum.USER:
        return MdOutlinePerson;
      case MapNodeTypeEnum.TEAM:
        return MdOutlineGroup;
      case MapNodeTypeEnum.PROJECT:
        return MdOutlineFolder;
      case MapNodeTypeEnum.GOAL:
        return MdOutlineFlag;
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return MdOutlineBook;
      case MapNodeTypeEnum.DEPARTMENT:
        return MdOutlineBusinessCenter;
      case MapNodeTypeEnum.TEAM_CLUSTER:
        return MdOutlineGroup;
      default:
        return MdOutlineQuestionMark;
    }
  };

  // Get type label
  const getTypeLabel = (type: MapNodeTypeEnum | undefined): string => {
    if (!type) return 'Unknown';
    // Convert snake_case to Title Case (e.g., "knowledge_asset" to "Knowledge Asset")
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <HStack 
      p={4} 
      borderBottom="1px solid" 
      borderColor={borderColor} 
      justifyContent="space-between"
    >
      <HStack>
        <Icon as={getNodeIcon(type)} boxSize={5} />
        <VStack align="flex-start" spacing={0}>
          <Heading size="sm">{label}</Heading>
          <Text color="gray.500" fontSize="sm">{getTypeLabel(type)}</Text>
        </VStack>
      </HStack>
      <CloseButton 
        onClick={onClose} 
        aria-label="Close panel"
      />
    </HStack>
  );
};

export default PanelHeader;