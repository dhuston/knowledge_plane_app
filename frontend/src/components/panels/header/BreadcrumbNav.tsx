/**
 * BreadcrumbNav.tsx
 * Enhanced navigation breadcrumbs for panel exploration history
 * Shows exploration path and allows easy navigation between previously viewed entities
 */
import React, { useState } from 'react';
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
  Flex,
  ButtonGroup,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  VStack,
  Heading,
  Divider,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Avatar
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
  FiCornerLeftUp,
  FiArrowLeft,
  FiArrowRight,
  FiClock,
  FiList,
  FiChevronLeft
} from 'react-icons/fi';
import { MapNodeTypeEnum } from '../../../types/map';

export interface NavHistoryItem {
  nodeId: string;
  nodeType: MapNodeTypeEnum;
  label: string;
  timestamp?: number;
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
  // Track current position in navigation history for forward/back navigation
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(history.length - 1);
  const { isOpen: isPopoverOpen, onOpen: onPopoverOpen, onClose: onPopoverClose } = useDisclosure();
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure();
  
  // Theme colors
  const linkColor = useColorModeValue('blue.600', 'blue.300');
  const currentColor = useColorModeValue('gray.700', 'gray.300');
  const popoverBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const disabledColor = useColorModeValue('gray.300', 'gray.600');
  const drawerBg = useColorModeValue('white', 'gray.800');
  const activeTabBg = useColorModeValue('blue.50', 'blue.900');
  
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
  
  // Navigation forward/backward handlers
  const handleBackNavigation = () => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      onNavigate(history[newIndex]);
    }
  };

  const handleForwardNavigation = () => {
    if (currentHistoryIndex < history.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(newIndex);
      onNavigate(history[newIndex]);
    }
  };
  
  // Group history items by type for the history drawer
  const historyByType = React.useMemo(() => {
    const groups: Record<string, NavHistoryItem[]> = {};
    
    history.forEach(item => {
      if (!groups[item.nodeType]) {
        groups[item.nodeType] = [];
      }
      // Only add if not already in the array (avoid duplicates)
      if (!groups[item.nodeType].some(i => i.nodeId === item.nodeId)) {
        groups[item.nodeType].push(item);
      }
    });
    
    return groups;
  }, [history]);
  
  // Get unique entity types present in history
  const entityTypes = Object.keys(historyByType);
  
  // Sort history items by timestamp if available (most recent first)
  const sortedHistory = [...history].sort((a, b) => {
    // If timestamps are available, use them
    if (a.timestamp && b.timestamp) {
      return b.timestamp - a.timestamp;
    }
    // Otherwise use the order in the array
    return 0;
  });
  
  return (
    <>
      <HStack spacing={2} width="100%" justify="space-between">
        {/* Navigation buttons */}
        <ButtonGroup size="xs" variant="ghost" spacing={1} mr={1}>
          <Tooltip label="Back" hasArrow>
            <IconButton
              aria-label="Navigate back"
              icon={<FiArrowLeft />}
              size="xs"
              isDisabled={currentHistoryIndex <= 0}
              onClick={handleBackNavigation}
              color={currentHistoryIndex <= 0 ? disabledColor : undefined}
            />
          </Tooltip>
          <Tooltip label="Forward" hasArrow>
            <IconButton
              aria-label="Navigate forward"
              icon={<FiArrowRight />}
              size="xs"
              isDisabled={currentHistoryIndex >= history.length - 1}
              onClick={handleForwardNavigation}
              color={currentHistoryIndex >= history.length - 1 ? disabledColor : undefined}
            />
          </Tooltip>
          <Tooltip label="History" hasArrow>
            <IconButton
              aria-label="View full history"
              icon={<FiList />}
              size="xs"
              onClick={onDrawerOpen}
            />
          </Tooltip>
        </ButtonGroup>
      
        {/* Main breadcrumb navigation */}
        <Breadcrumb 
          spacing="2px" 
          separator={<Icon as={FiChevronRight} color="gray.500" boxSize={3} />}
          fontSize="xs"
          {...breadcrumbProps}
          overflow="hidden"
          maxWidth="calc(100% - 100px)" // Adjusted for additional buttons
          whiteSpace="nowrap"
          flex={1}
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
                  setCurrentHistoryIndex(0);
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
                isOpen={isPopoverOpen} 
                onClose={onPopoverClose}
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
                    onClick={onPopoverOpen}
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
                            const itemIndex = history.findIndex(h => h.nodeId === item.nodeId);
                            if (itemIndex !== -1) {
                              setCurrentHistoryIndex(itemIndex);
                              onNavigate(item);
                              onPopoverClose();
                            }
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
                        const itemIndex = history.findIndex(h => h.nodeId === item.nodeId);
                        if (itemIndex !== -1) {
                          setCurrentHistoryIndex(itemIndex);
                          onNavigate(item);
                        }
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
                  const newIndex = history.length - 2;
                  setCurrentHistoryIndex(newIndex);
                  onNavigate(history[newIndex]);
                }
              }}
            />
          </Tooltip>
        )}
      </HStack>
      
      {/* Full history drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        placement="right"
        onClose={onDrawerClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent bg={drawerBg}>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor}>
            <HStack>
              <Icon as={FiClock} />
              <Text>Navigation History</Text>
            </HStack>
          </DrawerHeader>

          <DrawerBody p={0}>
            <Tabs isLazy>
              <TabList borderColor={borderColor} px={2}>
                <Tab _selected={{ color: linkColor, bg: activeTabBg, fontWeight: "semibold" }}>
                  <HStack spacing={2}>
                    <Icon as={FiClock} />
                    <Text>Recent</Text>
                  </HStack>
                </Tab>
                <Tab _selected={{ color: linkColor, bg: activeTabBg, fontWeight: "semibold" }}>
                  <HStack spacing={2}>
                    <Icon as={FiList} />
                    <Text>By Type</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* Recent history tab */}
                <TabPanel p={0}>
                  <List spacing={0}>
                    {sortedHistory.map((item, idx) => {
                      const colorScheme = getNodeColor(item.nodeType);
                      const isCurrentItem = idx === currentHistoryIndex;
                      
                      return (
                        <ListItem 
                          key={`${item.nodeId}-${idx}`}
                          onClick={() => {
                            const itemIndex = history.findIndex(h => h.nodeId === item.nodeId && h === item);
                            if (itemIndex !== -1) {
                              setCurrentHistoryIndex(itemIndex);
                              onNavigate(item);
                              onDrawerClose();
                            }
                          }}
                          p={3}
                          cursor="pointer"
                          _hover={{ bg: hoverBg }}
                          borderBottomWidth="1px"
                          borderColor={borderColor}
                          bg={isCurrentItem ? activeTabBg : undefined}
                        >
                          <HStack spacing={3}>
                            {item.nodeType === MapNodeTypeEnum.USER ? (
                              <Avatar 
                                name={item.label} 
                                size="sm" 
                                bg={`${colorScheme}.500`}
                              />
                            ) : (
                              <Flex 
                                w="32px" 
                                h="32px" 
                                borderRadius="full" 
                                bg={`${colorScheme}.100`} 
                                color={`${colorScheme}.700`}
                                justify="center"
                                align="center"
                                _dark={{
                                  bg: `${colorScheme}.900`,
                                  color: `${colorScheme}.200`
                                }}
                              >
                                <Icon as={getNodeIcon(item.nodeType)} boxSize="16px" />
                              </Flex>
                            )}
                            <VStack spacing={0} align="start" flex="1">
                              <Text fontWeight={isCurrentItem ? "bold" : "medium"}>
                                {item.label}
                              </Text>
                              <HStack>
                                <Badge 
                                  colorScheme={colorScheme} 
                                  variant={isCurrentItem ? "solid" : "subtle"}
                                >
                                  {item.nodeType.replace('_', ' ').toLowerCase()}
                                </Badge>
                                {item.timestamp && (
                                  <Text fontSize="xs" color="gray.500">
                                    {new Date(item.timestamp).toLocaleTimeString()}
                                  </Text>
                                )}
                              </HStack>
                            </VStack>
                            {isCurrentItem && (
                              <Badge colorScheme="blue">Current</Badge>
                            )}
                          </HStack>
                        </ListItem>
                      );
                    })}
                  </List>
                </TabPanel>
                
                {/* By type tab */}
                <TabPanel>
                  <VStack spacing={0} divider={<Divider />} align="stretch">
                    {entityTypes.map(type => (
                      <Box key={type} p={3}>
                        <Flex align="center" mb={2}>
                          <Icon 
                            as={getNodeIcon(type as MapNodeTypeEnum)} 
                            mr={2} 
                            color={`${getNodeColor(type as MapNodeTypeEnum)}.500`} 
                          />
                          <Heading size="sm" textTransform="capitalize">
                            {type.replace('_', ' ').toLowerCase()}s
                          </Heading>
                        </Flex>
                        <List spacing={1}>
                          {historyByType[type].map((item, idx) => (
                            <ListItem 
                              key={`${type}-${item.nodeId}`}
                              p={2}
                              borderRadius="md"
                              _hover={{ bg: hoverBg }}
                              cursor="pointer"
                              onClick={() => {
                                const itemIndex = history.findIndex(h => h.nodeId === item.nodeId);
                                if (itemIndex !== -1) {
                                  setCurrentHistoryIndex(itemIndex);
                                  onNavigate(item);
                                  onDrawerClose();
                                }
                              }}
                            >
                              <HStack justify="space-between">
                                <Text fontSize="sm">{item.label}</Text>
                                <Icon as={FiChevronRight} boxSize={3} color="gray.500" />
                              </HStack>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    ))}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default BreadcrumbNav;