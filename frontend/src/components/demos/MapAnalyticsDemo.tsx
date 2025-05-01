/**
 * MapAnalyticsDemo.tsx
 * Demo component for showcasing Map Insights and Analytics features
 */
import React, { useState, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Card,
  CardHeader,
  CardBody,
  Stack,
  VStack,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Divider,
  List,
  ListItem,
  ListIcon,
  useColorModeValue
} from '@chakra-ui/react';
import { MdInfoOutline, MdCheck, MdTimeline } from 'react-icons/md';

import MapWithAnalytics from '../map/MapWithAnalytics';
import { MapNode, MapNodeTypeEnum } from '../../types/map';

const MapAnalyticsDemo: React.FC = () => {
  // State for demo controls
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);

  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const border = useColorModeValue('gray.200', 'gray.600');
  
  // Handle node selection
  const handleNodeClick = useCallback((node: MapNode | null) => {
    console.log("Node clicked:", node);
    if (node && !node.type) {
      // Make sure node has a valid type
      console.log("Node missing type, setting default type");
      node.type = MapNodeTypeEnum.USER; // Set a default type if missing
    }
    setSelectedNode(node);
  }, []);
  
  // Toggle analytics
  const handleToggleAnalytics = useCallback(() => {
    setAnalyticsEnabled(prev => !prev);
  }, []);

  return (
    <Box width="100%">
      {/* Demo Header */}
      <Box mb={4}>
        <Heading size="lg" mb={2}>Map Insights &amp; Analytics Demo</Heading>
        <Text color="gray.500" mb={4}>
          Explore organizational patterns and insights with graph analytics features
        </Text>
      </Box>
      
      {/* Demo Controls */}
      <Card mb={4} bg={cardBg} borderColor={border} borderWidth="1px">
        <CardHeader pb={0}>
          <Heading size="md">Demo Controls</Heading>
        </CardHeader>
        <CardBody>
          <Stack direction={["column", "row"]} spacing={6} alignItems="center">
            <FormControl display="flex" alignItems="center" w="auto">
              <FormLabel htmlFor="analytics-toggle" mb="0">
                Enable Analytics
              </FormLabel>
              <Switch
                id="analytics-toggle"
                isChecked={analyticsEnabled}
                onChange={handleToggleAnalytics}
                colorScheme="blue"
              />
            </FormControl>
            
            <Badge colorScheme={analyticsEnabled ? "green" : "gray"} px={3} py={1}>
              Analytics {analyticsEnabled ? "Enabled" : "Disabled"}
            </Badge>
            
            {analyticsEnabled && (
              <Button 
                size="sm" 
                leftIcon={<MdInfoOutline />}
                colorScheme="blue" 
                variant="outline"
                onClick={() => window.alert('Analytics instructions shown')}
              >
                How to Use
              </Button>
            )}
          </Stack>
        </CardBody>
      </Card>
      
      {/* Instructions */}
      {analyticsEnabled && (
        <Alert status="info" mb={4} borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Analytics Features Enabled</AlertTitle>
            <AlertDescription>
              <List spacing={1} mt={2}>
                <ListItem>
                  <ListIcon as={MdCheck} color="blue.500" />
                  Click on any node to see its network metrics
                </ListItem>
                <ListItem>
                  <ListIcon as={MdCheck} color="blue.500" />
                  Node colors indicate different network metrics (centrality, clustering)
                </ListItem>
                <ListItem>
                  <ListIcon as={MdCheck} color="blue.500" />
                  Use the insights panel to explore clusters and recommendations
                </ListItem>
              </List>
            </AlertDescription>
          </Box>
        </Alert>
      )}
      
      {/* Map Container */}
      <Box 
        height="600px" 
        borderWidth="1px" 
        borderColor={border} 
        borderRadius="md" 
        overflow="hidden" 
        position="relative"
        mb={4}
      >
        {/* Analytics Toggle Instructions (overlaid) */}
        {!analyticsEnabled && (
          <Box
            position="absolute"
            top={4}
            right={4}
            zIndex={5}
            bg={cardBg}
            p={3}
            borderRadius="md"
            boxShadow="md"
            maxW="300px"
          >
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold">Enable Analytics</Text>
              <Text fontSize="sm">
                Toggle on the "Enable Analytics" switch above to see network insights and patterns
              </Text>
            </VStack>
          </Box>
        )}
        
        {/* Map with Analytics */}
        <MapWithAnalytics 
          onNodeClick={handleNodeClick}
          showAnalyticsByDefault={analyticsEnabled}
          onLoad={() => {
            console.log("Map loaded in demo");
            // Explicitly update analytics state after map loads
            if (analyticsEnabled) {
              console.log("Analytics should be enabled");
            }
          }}
        />
      </Box>
      
      {/* Selected Node Info */}
      {selectedNode && (
        <Card bg={cardBg} borderColor={border} borderWidth="1px" mt={4}>
          <CardHeader pb={2}>
            <Stack direction="row" alignItems="center">
              <Heading size="md">Selected Node</Heading>
              <Badge colorScheme="purple" ml={2}>{selectedNode.type}</Badge>
            </Stack>
          </CardHeader>
          <CardBody pt={0}>
            <Text fontWeight="bold">{selectedNode.label}</Text>
            
            {selectedNode.data && (
              <Box mt={2}>
                <Divider my={2} />
                <Text fontWeight="medium" mb={1}>Node Properties:</Text>
                <List spacing={1}>
                  {Object.entries(selectedNode.data).map(([key, value]) => {
                    // Skip rendering relationship arrays
                    if (key === 'relationships' || Array.isArray(value)) return null;
                    return (
                      <ListItem key={key} fontSize="sm">
                        <Text as="span" fontWeight="medium">{key}:</Text>{' '}
                        {typeof value === 'object' ? JSON.stringify(value) : value}
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            )}
            
            <Text color="gray.500" fontSize="sm" mt={3}>
              With analytics enabled, select this node to see its network metrics in the analytics panel.
            </Text>
          </CardBody>
        </Card>
      )}
    </Box>
  );
};

export default MapAnalyticsDemo;