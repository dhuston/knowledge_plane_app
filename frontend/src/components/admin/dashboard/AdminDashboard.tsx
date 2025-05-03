import React, { useEffect, useState } from 'react';
import {
  Grid,
  GridItem,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Box,
  Flex,
  Icon,
  Skeleton,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiUsers, FiLayers, FiActivity, FiLink, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useAdmin } from '../../../context/AdminContext';
import AdminLayout from '../common/AdminLayout';

// Mock data - In a real implementation we would fetch this from the API
interface DashboardStats {
  userCount: number;
  activeUserCount: number;
  teamCount: number;
  projectCount: number;
  integrationCount: number;
  activeIntegrations: number;
  featureFlagCount: number;
  enabledFeatures: number;
}

// Status component for system health indicators
interface StatusIndicatorProps {
  label: string;
  status: 'healthy' | 'warning' | 'error';
  message?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ label, status, message }) => {
  // Status colors
  const statusColors = {
    healthy: 'green.500',
    warning: 'orange.500',
    error: 'red.500'
  };
  
  // Status icons
  const statusIcons = {
    healthy: FiCheckCircle,
    warning: FiActivity,
    error: FiAlertCircle
  };
  
  return (
    <Flex alignItems="center" mb={2}>
      <Icon as={statusIcons[status]} color={statusColors[status]} mr={2} />
      <Text fontWeight="medium">{label}</Text>
      <Box flex="1" />
      {message && <Text fontSize="sm" color="gray.500">{message}</Text>}
    </Flex>
  );
};

// Stat card component for displaying key metrics
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  helperText?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, helperText, isLoading = false }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Card 
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="sm"
      borderRadius="lg"
      overflow="hidden"
    >
      <CardHeader pb={0}>
        <Flex align="center">
          <Box
            p={2}
            borderRadius="md"
            bg={useColorModeValue('blue.50', 'blue.900')}
            color={useColorModeValue('blue.500', 'blue.200')}
            mr={3}
          >
            <Icon as={icon} boxSize={5} />
          </Box>
          <Text fontWeight="medium" fontSize="sm" color="gray.500">
            {label}
          </Text>
        </Flex>
      </CardHeader>
      <CardBody pt={2}>
        <Stat>
          <Skeleton isLoaded={!isLoading} height={isLoading ? "30px" : "auto"}>
            <StatNumber fontSize="2xl">{value}</StatNumber>
          </Skeleton>
          {helperText && (
            <Skeleton isLoaded={!isLoading} mt={1}>
              <StatHelpText>{helperText}</StatHelpText>
            </Skeleton>
          )}
        </Stat>
      </CardBody>
    </Card>
  );
};

const AdminDashboard: React.FC = () => {
  const { refreshData, isRefreshing } = useAdmin();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would be an API call
        // For now, we'll use mock data after a simulated delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStats({
          userCount: 124,
          activeUserCount: 87,
          teamCount: 15,
          projectCount: 28,
          integrationCount: 6,
          activeIntegrations: 4,
          featureFlagCount: 12,
          enabledFeatures: 8
        });
      } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  // Custom refresh function
  const handleRefresh = async () => {
    await refreshData();
    setIsLoading(true);
    
    // Simulate fetching fresh data
    setTimeout(() => {
      setStats(prevStats => {
        if (!prevStats) return null;
        
        return {
          ...prevStats,
          activeUserCount: prevStats.activeUserCount + Math.floor(Math.random() * 5) - 2
        };
      });
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <AdminLayout title="Admin Dashboard" onRefresh={handleRefresh}>
      {/* Stats overview */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <StatCard
          label="Total Users"
          value={stats?.userCount || 0}
          icon={FiUsers}
          helperText={`${stats?.activeUserCount || 0} active now`}
          isLoading={isLoading}
        />
        <StatCard
          label="Teams"
          value={stats?.teamCount || 0}
          icon={FiUsers}
          isLoading={isLoading}
        />
        <StatCard
          label="Projects"
          value={stats?.projectCount || 0}
          icon={FiLayers}
          isLoading={isLoading}
        />
        <StatCard
          label="Integrations"
          value={`${stats?.activeIntegrations || 0}/${stats?.integrationCount || 0}`}
          icon={FiLink}
          helperText="Active / Total"
          isLoading={isLoading}
        />
      </SimpleGrid>
      
      {/* System status */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
        <GridItem>
          <Card p={4} height="100%" boxShadow="sm">
            <Heading size="md" mb={4}>System Status</Heading>
            <Box>
              <StatusIndicator label="API Service" status="healthy" message="100% uptime" />
              <StatusIndicator label="Database" status="healthy" message="24ms response" />
              <StatusIndicator label="Storage" status="healthy" message="2.1TB used" />
              <StatusIndicator label="Integration Service" status="warning" message="High latency" />
              <StatusIndicator label="Background Jobs" status="healthy" message="All running" />
            </Box>
          </Card>
        </GridItem>
        
        <GridItem>
          <Card p={4} height="100%" boxShadow="sm">
            <Heading size="md" mb={4}>Feature Flags</Heading>
            <Text mb={4}>
              {stats?.enabledFeatures || 0} of {stats?.featureFlagCount || 0} features enabled
            </Text>
            <Text fontSize="sm" color="gray.500">
              Recently updated:
            </Text>
            <Box mt={2}>
              <Text fontSize="sm">• Analytics Engine (Enabled 2 days ago)</Text>
              <Text fontSize="sm">• Team Clustering (Disabled 5 days ago)</Text>
              <Text fontSize="sm">• Integration Framework (Enabled 1 week ago)</Text>
            </Box>
          </Card>
        </GridItem>
      </Grid>
    </AdminLayout>
  );
};

export default AdminDashboard;