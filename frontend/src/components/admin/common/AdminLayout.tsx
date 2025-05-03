import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Spacer,
  IconButton,
  useColorModeValue,
  HStack,
  Tooltip
} from '@chakra-ui/react';
import { FiRefreshCcw } from 'react-icons/fi';
import { useAdmin } from '../../../context/AdminContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  showRefresh?: boolean;
  onRefresh?: () => Promise<void>;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  showRefresh = true,
  onRefresh
}) => {
  const { breadcrumbs, isRefreshing, refreshData } = useAdmin();
  
  // Theme colors
  const bgColor = useColorModeValue('surface.500', '#262626'); // White : Button color
  const borderColor = useColorModeValue('primary.300', 'primary.600'); // Light mint green : Sage green
  const containerBg = useColorModeValue('secondary.400', '#262626'); // Off-white/cream : Button color
  const textColor = useColorModeValue('#484848', 'secondary.400'); // Airbnb dark gray : Off-white/cream
  const secondaryTextColor = useColorModeValue('#717171', 'gray.400'); // Medium gray
  
  // Handle refresh action
  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      await refreshData();
    }
  };
  
  return (
    <Box 
      bg={containerBg}
      minH="calc(100vh - 60px)"
      p={{ base: 4, md: 8 }}
    >
      <Box
        maxWidth="1400px"
        mx="auto"
      >
        {/* Header */}
        <Flex
          mb={6}
          align="center"
          borderBottomWidth="1px"
          borderColor={borderColor}
          pb={4}
        >
          <Box>
            {/* Title */}
            {title && <Heading size="lg" mb={2} color={textColor}>{title}</Heading>}
            
            {/* Breadcrumb navigation */}
            <Breadcrumb 
              fontSize="sm" 
              color={secondaryTextColor}
              aria-label="breadcrumb-navigation"
              separator=">"
            >
              {breadcrumbs.map((crumb, index) => (
                <BreadcrumbItem key={`${crumb.label}-${index}`}>
                  {crumb.path ? (
                    <BreadcrumbLink href={crumb.path}>{crumb.label}</BreadcrumbLink>
                  ) : (
                    <Box>{crumb.label}</Box>
                  )}
                </BreadcrumbItem>
              ))}
            </Breadcrumb>
          </Box>
          
          <Spacer />
          
          {/* Action buttons */}
          <HStack spacing={3}>
            {showRefresh && (
              <Tooltip label="Refresh data">
                <IconButton
                  icon={<FiRefreshCcw />}
                  aria-label="Refresh data"
                  variant="outline"
                  isLoading={isRefreshing}
                  onClick={handleRefresh}
                  colorScheme="primary"
                />
              </Tooltip>
            )}
          </HStack>
        </Flex>
        
        {/* Main content */}
        <Box
          bg={bgColor}
          borderRadius="lg"
          boxShadow="md"
          p={{ base: 4, md: 6 }}
          borderWidth="1px"
          borderColor={borderColor}
          layerStyle="card"
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;