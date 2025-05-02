/**
 * BreadcrumbNav.tsx
 * Enhanced navigation breadcrumbs for panel exploration history
 * Shows exploration path and allows easy navigation between previously viewed entities
 */
import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbProps,
  Text,
  HStack,
  Icon,
  useColorModeValue,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Box,
  List,
  ListItem,
  useDisclosure,
  Badge,
  IconButton,
  Flex
} from '@chakra-ui/react';
import { 
  FiChevronRight, 
  FiHome, 
  FiUser, 
  FiUsers,
  FiFolder,
  FiTarget,
  FiBook,
  FiBriefcase,
  FiFlag,
  FiMoreHorizontal,
  FiCornerLeftUp
} from 'react-icons/fi';
import { MapNodeTypeEnum } from '../../../types/map';

export interface NavHistoryItem {
  nodeId: string;
  nodeType: MapNodeTypeEnum;
  label: string;
}

interface BreadcrumbNavProps extends Omit<BreadcrumbProps, 'children'> {
  history: NavHistoryItem[];
  onNavigate: (item: NavHistoryItem) => void;
  maxDisplayed?: number;
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  history,
  onNavigate,
  maxDisplayed = 3,
  ...breadcrumbProps
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const linkColor = useColorModeValue('blue.600', 'blue.300');
  const currentColor = useColorModeValue('gray.700', 'gray.300');
  const popoverBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // Get the items to display (most recent)
  const displayItems = history.length <= maxDisplayed 
    ? history 
    : [
        // Show first item
        history[0],
        // Add ellipsis item if needed
        ...(history.length > maxDisplayed + 1 ? [{ nodeId: 'ellipsis', label: '...', nodeType: '' as MapNodeTypeEnum }] : []),
        // Show most recent items
        ...history.slice(-(maxDisplayed - 1))
      ];

  // Get icon based on node type
  const getNodeIcon = (type: MapNodeTypeEnum) => {
    switch (type) {
      case MapNodeTypeEnum.USER:
        return FiUser;
      case MapNodeTypeEnum.TEAM:
        return FiUsers;
      case MapNodeTypeEnum.PROJECT:
        return FiFolder;
      case MapNodeTypeEnum.GOAL:
        return FiTarget;
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return FiBook;
      case MapNodeTypeEnum.DEPARTMENT:
        return FiBriefcase;
      default:
        return FiFlag;
    }
  };
      
  // Don't render if no history or only one item
  if (history.length <= 1) return null;
  
  // Hidden history items (those not displayed in the breadcrumb)
  const hiddenItems = history.length > maxDisplayed 
    ? history.slice(1, history.length - (maxDisplayed - 1))
    : [];
    
  // Get badge color based on node type
  const getNodeColor = (type: MapNodeTypeEnum): string => {
    switch (type) {
      case MapNodeTypeEnum.USER:
        return 'blue';
      case MapNodeTypeEnum.TEAM:
        return 'green';
      case MapNodeTypeEnum.PROJECT:
        return 'purple';
      case MapNodeTypeEnum.GOAL:
        return 'orange';
      case MapNodeTypeEnum.KNOWLEDGE_ASSET:
        return 'cyan';
      case MapNodeTypeEnum.DEPARTMENT:
        return 'teal';
      default:
        return 'gray';
    }
  };
  
  return (
    <HStack spacing={2} width="100%" justify="space-between">
      {/* Main breadcrumb navigation */}
      <Breadcrumb 
        spacing="2px" 
        separator={<Icon as={FiChevronRight} color="gray.500" boxSize={3} />}
        fontSize="xs"
        {...breadcrumbProps}
        overflow="hidden"
        maxWidth="calc(100% - 40px)"
        whiteSpace="nowrap"
      >
        {/* Home/First item */}
        <BreadcrumbItem>
          <Tooltip label={displayItems[0].label} hasArrow openDelay={500}>
            <BreadcrumbLink 
              href="#"
              color={linkColor}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(displayItems[0]);
              }}
              fontSize="xs"
            >
              <HStack spacing={1}>
                <Icon as={getNodeIcon(displayItems[0].nodeType)} boxSize={3} />
                <Text noOfLines={1}>Start</Text>
              </HStack>
            </BreadcrumbLink>
          </Tooltip>
        </BreadcrumbItem>
        
        {/* Popover for hidden history */}
        {hiddenItems.length > 0 && (
          <BreadcrumbItem>
            <Popover 
              isOpen={isOpen} 
              onClose={onClose}
              placement="bottom"
              trigger="click"
            >
              <PopoverTrigger>
                <Box 
                  as="button"
                  color="gray.500" 
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                  fontSize="xs"
                  cursor="pointer"
                  onClick={onOpen}
                  _hover={{ color: linkColor }}
                >
                  <HStack>
                    <Icon as={FiMoreHorizontal} />
                    <Text>{hiddenItems.length}</Text>
                  </HStack>
                </Box>
              </PopoverTrigger>
              <PopoverContent width="240px" bg={popoverBg}>
                <PopoverArrow />
                <PopoverBody p={0}>
                  <List spacing={0}>
                    {hiddenItems.map((item, idx) => (
                      <ListItem 
                        key={item.nodeId} 
                        onClick={() => {
                          onNavigate(item);
                          onClose();
                        }}
                        p={2}
                        cursor="pointer"
                        _hover={{ bg: hoverBg }}
                        borderBottomWidth={idx < hiddenItems.length - 1 ? '1px' : '0'}
                        borderColor={borderColor}
                      >
                        <HStack spacing={2}>
                          <Badge 
                            colorScheme={getNodeColor(item.nodeType)}
                            variant="subtle"
                            p={1}
                            borderRadius="full"
                          >
                            <Icon as={getNodeIcon(item.nodeType)} boxSize={2} />
                          </Badge>
                          <Text fontSize="xs" noOfLines={1} flex="1">
                            {item.label}
                          </Text>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </BreadcrumbItem>
        )}
        
        {/* Display most recent items in the path */}
        {displayItems.slice(hiddenItems.length > 0 ? 0 : 1).map((item, index, array) => {
          const isLast = index === array.length - 1;
          if (item.nodeId === 'ellipsis') return null; // Skip ellipsis item as we use a popover instead
          
          return (
            <BreadcrumbItem 
              key={item.nodeId} 
              isCurrentPage={isLast}
            >
              {isLast ? (
                <HStack spacing={1}>
                  <Icon 
                    as={getNodeIcon(item.nodeType)} 
                    boxSize={3} 
                    color={getNodeColor(item.nodeType) + '.500'} 
                  />
                  <Text 
                    color={currentColor} 
                    fontWeight="medium" 
                    noOfLines={1}
                    maxWidth="200px"
                    title={item.label}
                  >
                    {item.label}
                  </Text>
                </HStack>
              ) : (
                <Tooltip label={item.label} hasArrow openDelay={500}>
                  <BreadcrumbLink 
                    href="#"
                    color={linkColor}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(item);
                    }}
                  >
                    <HStack spacing={1}>
                      <Icon as={getNodeIcon(item.nodeType)} boxSize={3} />
                      <Text noOfLines={1} maxWidth="80px">{item.label}</Text>
                    </HStack>
                  </BreadcrumbLink>
                </Tooltip>
              )}
            </BreadcrumbItem>
          );
        })}
      </Breadcrumb>
      
      {/* Back button - only if we have more than 2 items in history */}
      {history.length > 2 && (
        <Tooltip label="Back to previous" placement="top" hasArrow>
          <IconButton
            aria-label="Go back"
            icon={<FiCornerLeftUp />}
            size="xs"
            variant="ghost"
            onClick={() => {
              // Navigate to second-to-last item (back one step)
              if (history.length >= 2) {
                onNavigate(history[history.length - 2]);
              }
            }}
          />
        </Tooltip>
      )}
    </HStack>
  );
};

export default BreadcrumbNav;