import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Icon,
  Spinner,
  Select,
  Badge,
  Divider,
  List,
  ListItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
} from '@chakra-ui/react';
import { MdOutlineInsights, MdDataUsage, MdGroups, MdOutlineHub, MdFilterAlt, MdDownload, MdPictureAsPdf, MdOutlineTableChart } from 'react-icons/md';
import { FaChevronDown } from 'react-icons/fa';

import { MapNode, MapNodeTypeEnum } from '../../types/map';
import { NodeMetrics, GraphMetrics, Cluster } from '../analytics/AnalyticsEngine';
import { exportToPDF, exportToCSV } from '../../utils/export';

interface InsightsPanelProps {
  graphMetrics: GraphMetrics | null;
  isLoading: boolean;
  selectedNode: MapNode | null;
  nodes: MapNode[];
  onNodeSelect: (nodeId: string) => void;
  onMetricModeChange: (mode: string) => void;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({
  graphMetrics,
  isLoading,
  selectedNode,
  nodes,
  onNodeSelect,
  onMetricModeChange
}) => {
  const [metricMode, setMetricMode] = useState<string>('betweenness');
  const [filterType, setFilterType] = useState<string>('all');

  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.700', 'gray.200');
  const badgeBg = useColorModeValue('blue.100', 'blue.800');
  const badgeColor = useColorModeValue('blue.700', 'blue.200');
  const statBg = useColorModeValue('gray.50', 'gray.700');

  // Handle metric mode change
  const handleMetricModeChange = (mode: string) => {
    setMetricMode(mode);
    onMetricModeChange(mode);
  };

  // Filter nodes by type
  const filteredNodes = filterType === 'all' 
    ? nodes 
    : nodes.filter(node => node.type === filterType);

  // Get node by id
  const getNodeById = (nodeId: string): MapNode | undefined => {
    return nodes.find(node => node.id === nodeId);
  };

  // Format metric value for display
  const formatMetricValue = (value: number): string => {
    return (value * 100).toFixed(1) + '%';
  };

  // Get top nodes based on selected metric
  const getTopNodesByMetric = (count: number = 5): MapNode[] => {
    if (!graphMetrics || !graphMetrics.nodes) return [];
    
    try {
      const nodeScores = Object.entries(graphMetrics.nodes || {}).map(([nodeId, metrics]) => {
        if (!metrics) return { nodeId, score: 0 };
        
        let score = 0;
        switch (metricMode) {
          case 'degree':
            score = metrics.degreeCentrality || 0;
            break;
          case 'betweenness':
            score = metrics.betweennessCentrality || 0;
            break;
          case 'closeness':
            score = metrics.closenessCentrality || 0;
            break;
          case 'clustering':
            score = metrics.clusteringCoefficient || 0;
            break;
          default:
            score = metrics.betweennessCentrality || 0;
        }
        return { nodeId, score };
      });
      
      // Sort by score and get top nodes
      const topNodeIds = nodeScores
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
        .map(item => item.nodeId);
        
      // Map to actual node objects
      return topNodeIds
        .map(id => getNodeById(id))
        .filter((node): node is MapNode => !!node);
    } catch (error) {
      console.error("Error getting top nodes by metric:", error);
      return [];
    }
  };

  // Generate recommendations based on metrics
  const generateRecommendations = (): string[] => {
    if (!graphMetrics || !graphMetrics.nodes || !selectedNode) return [];
    
    const recommendations: string[] = [];
    
    try {
      // Get metrics for the selected node
      const metrics = graphMetrics.nodes[selectedNode.id];
      if (!metrics) return [];
      
      // Recommendation based on betweenness
      if ((metrics.betweennessCentrality || 0) > 0.7) {
        recommendations.push(
          "This node is a critical connector. Consider reducing dependency on this entity."
        );
      } else if ((metrics.betweennessCentrality || 0) < 0.1) {
        recommendations.push(
          "This entity has low connectivity. Consider establishing more relationships."
        );
      }
      
      // Recommendation based on clustering
      if ((metrics.clusteringCoefficient || 0) > 0.8) {
        recommendations.push(
          "This entity is in a highly clustered group. Look for opportunities to connect with other clusters."
        );
      } else if ((metrics.clusteringCoefficient || 0) < 0.2) {
        recommendations.push(
          "This entity's connections are not well connected to each other. Consider strengthening internal relationships."
        );
      }
      
      // Add more recommendations based on other metrics
      if ((metrics.degreeCentrality || 0) > 0.6) {
        recommendations.push(
          "This entity has many direct connections. Review if all connections are necessary."
        );
      }
      
      return recommendations;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return ["Unable to generate recommendations due to data issues."];
    }
  };

  return (
    <Box
      width="100%"
      height="100%"
      bg={bgColor}
      borderLeft="1px solid"
      borderColor={borderColor}
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Header */}
      <HStack 
        p={4} 
        borderBottom="1px solid" 
        borderColor={borderColor} 
        justifyContent="space-between"
      >
        <HStack>
          <Icon as={MdOutlineInsights} boxSize={5} />
          <VStack align="flex-start" spacing={0}>
            <Heading size="sm" color={headingColor}>Insights & Analytics</Heading>
            <Text fontSize="xs" color="gray.500">Network analysis and recommendations</Text>
          </VStack>
        </HStack>
        
        {/* Export dropdown menu */}
        <Menu>
          <MenuButton
            as={Button}
            size="sm"
            rightIcon={<FaChevronDown />}
            variant="outline"
            colorScheme="blue"
            isDisabled={isLoading || !graphMetrics}
          >
            <Icon as={MdDownload} mr={1} /> Export
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => exportToPDF()} icon={<Icon as={MdPictureAsPdf} />}>
              Export as PDF
            </MenuItem>
            <MenuItem onClick={() => exportToCSV()} icon={<Icon as={MdOutlineTableChart} />}>
              Export as CSV
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      {/* Loading state */}
      {isLoading && (
        <Box flex="1" display="flex" alignItems="center" justifyContent="center">
          <Spinner size="xl" />
        </Box>
      )}

      {/* Content */}
      {!isLoading && graphMetrics && (
        <Box flex="1" overflowY="auto">
          <Tabs variant="enclosed" colorScheme="blue" size="sm" p={2}>
            <TabList>
              <Tab><Icon as={MdDataUsage} mr={2} />Metrics</Tab>
              <Tab><Icon as={MdGroups} mr={2} />Clusters</Tab>
              <Tab><Icon as={MdOutlineHub} mr={2} />Network</Tab>
            </TabList>
            <TabPanels>
              {/* Metrics Panel */}
              <TabPanel>
                {/* Metric selection */}
                <HStack mb={4}>
                  <Text fontSize="sm" fontWeight="medium">Metric:</Text>
                  <Select
                    size="sm"
                    value={metricMode}
                    onChange={(e) => handleMetricModeChange(e.target.value)}
                  >
                    <option value="degree">Degree Centrality</option>
                    <option value="betweenness">Betweenness Centrality</option>
                    <option value="closeness">Closeness Centrality</option>
                    <option value="clustering">Clustering Coefficient</option>
                  </Select>
                </HStack>

                {/* Top nodes by metric */}
                <Box mb={4}>
                  <Heading size="xs" mb={2}>Top Entities by {metricMode.charAt(0).toUpperCase() + metricMode.slice(1)}</Heading>
                  <List spacing={1}>
                    {getTopNodesByMetric(5).length > 0 ? (
                      getTopNodesByMetric(5).map((node) => (
                        <ListItem
                          key={node.id}
                          p={2}
                          borderRadius="md"
                          _hover={{ bg: useColorModeValue('gray.100', 'gray.700') }}
                          cursor="pointer"
                          onClick={() => onNodeSelect(node.id)}
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <HStack>
                            <Badge colorScheme={node.type === MapNodeTypeEnum.USER ? 'green' : node.type === MapNodeTypeEnum.TEAM ? 'blue' : 'purple'}>
                              {node.type}
                            </Badge>
                            <Text fontSize="sm">{node.label}</Text>
                          </HStack>
                          <Badge bg={badgeBg} color={badgeColor}>
                            {formatMetricValue(graphMetrics?.nodes?.[node.id]?.[`${metricMode}Centrality` as keyof NodeMetrics] as number || 0)}
                          </Badge>
                        </ListItem>
                      ))
                    ) : (
                      <ListItem p={2} borderRadius="md">
                        <Text fontSize="sm" color="gray.500">
                          No entities found. Try selecting a different metric or check that nodes have been loaded.
                        </Text>
                      </ListItem>
                    )}
                  </List>
                </Box>

                {/* Selected node metrics */}
                {selectedNode && graphMetrics?.nodes && graphMetrics.nodes[selectedNode.id] && (
                  <Box mb={4} p={3} bg={statBg} borderRadius="md">
                    <Heading size="xs" mb={2}>Selected Entity Metrics</Heading>
                    <SimpleGrid columns={2} spacing={4}>
                      <Stat size="sm">
                        <StatLabel>Degree Centrality</StatLabel>
                        <StatNumber>
                          {formatMetricValue(graphMetrics.nodes[selectedNode.id]?.degreeCentrality || 0)}
                        </StatNumber>
                        <StatHelpText>Direct connections</StatHelpText>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Betweenness</StatLabel>
                        <StatNumber>
                          {formatMetricValue(graphMetrics.nodes[selectedNode.id]?.betweennessCentrality || 0)}
                        </StatNumber>
                        <StatHelpText>Bridge importance</StatHelpText>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Closeness</StatLabel>
                        <StatNumber>
                          {formatMetricValue(graphMetrics.nodes[selectedNode.id]?.closenessCentrality || 0)}
                        </StatNumber>
                        <StatHelpText>Network proximity</StatHelpText>
                      </Stat>
                      <Stat size="sm">
                        <StatLabel>Clustering</StatLabel>
                        <StatNumber>
                          {formatMetricValue(graphMetrics.nodes[selectedNode.id]?.clusteringCoefficient || 0)}
                        </StatNumber>
                        <StatHelpText>Connected neighbors</StatHelpText>
                      </Stat>
                    </SimpleGrid>
                  </Box>
                )}
              </TabPanel>

              {/* Clusters Panel */}
              <TabPanel>
                <Box mb={4}>
                  <Heading size="xs" mb={2}>Clusters</Heading>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    {graphMetrics?.clusters?.length || 0} clusters identified
                  </Text>
                  
                  <List spacing={2}>
                    {(graphMetrics?.clusters || []).map((cluster: Cluster) => (
                      <Box 
                        key={cluster.id} 
                        p={3} 
                        borderWidth="1px" 
                        borderRadius="md"
                        borderColor={borderColor}
                      >
                        <Heading size="xs" mb={1}>
                          Cluster {cluster.id.replace('cluster-', '')}
                          <Badge ml={2} colorScheme="blue">
                            {cluster.nodeIds.length} entities
                          </Badge>
                        </Heading>
                        
                        <Text fontSize="sm" mb={2}>
                          Top entities in cluster:
                        </Text>
                        
                        <List>
                          {cluster.nodeIds
                            .slice(0, 3)
                            .map(id => getNodeById(id))
                            .filter((node): node is MapNode => !!node)
                            .map(node => (
                              <ListItem 
                                key={node.id} 
                                fontSize="sm" 
                                cursor="pointer"
                                onClick={() => onNodeSelect(node.id)}
                                _hover={{ textDecoration: "underline" }}
                              >
                                {node.label} ({node.type})
                              </ListItem>
                            ))
                          }
                          {cluster.nodeIds.length > 3 && (
                            <Text fontSize="xs" color="gray.500">
                              ...and {cluster.nodeIds.length - 3} more
                            </Text>
                          )}
                        </List>
                      </Box>
                    ))}
                  </List>
                </Box>
              </TabPanel>

              {/* Network Panel */}
              <TabPanel>
                {/* Filter controls */}
                <HStack mb={4} alignItems="center">
                  <Icon as={MdFilterAlt} />
                  <Text fontSize="sm">Filter by:</Text>
                  <Select
                    size="sm" 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    <option value={MapNodeTypeEnum.USER}>Users</option>
                    <option value={MapNodeTypeEnum.TEAM}>Teams</option>
                    <option value={MapNodeTypeEnum.PROJECT}>Projects</option>
                    <option value={MapNodeTypeEnum.GOAL}>Goals</option>
                  </Select>
                </HStack>

                {/* Network statistics */}
                <Box mb={4} p={3} bg={statBg} borderRadius="md">
                  <Heading size="xs" mb={2}>Network Statistics</Heading>
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat size="sm">
                      <StatLabel>Total Nodes</StatLabel>
                      <StatNumber>{nodes.length}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Filtered Nodes</StatLabel>
                      <StatNumber>{filteredNodes.length}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Clusters</StatLabel>
                      <StatNumber>{graphMetrics?.clusters?.length || 0}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel>Central Nodes</StatLabel>
                      <StatNumber>{graphMetrics?.mostCentralNodes?.length || 0}</StatNumber>
                    </Stat>
                  </SimpleGrid>
                </Box>

                {/* Recommendations based on metrics */}
                {selectedNode && (
                  <Box mb={4}>
                    <Heading size="xs" mb={2}>Recommendations</Heading>
                    {generateRecommendations().length > 0 ? (
                      <List spacing={2}>
                        {generateRecommendations().map((recommendation, index) => (
                          <ListItem 
                            key={index} 
                            fontSize="sm" 
                            p={2} 
                            borderRadius="md" 
                            bg={useColorModeValue('yellow.50', 'yellow.900')}
                            color={useColorModeValue('yellow.800', 'yellow.200')}
                          >
                            {recommendation}
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        Select a node to see recommendations
                      </Text>
                    )}
                  </Box>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      )}
    </Box>
  );
};

export default InsightsPanel;