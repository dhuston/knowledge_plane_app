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
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
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
      bg={useColorModeValue('gray.50', 'gray.900')}
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
            {title && <Heading size="lg" mb={2}>{title}</Heading>}
            
            {/* Breadcrumb navigation */}
            <Breadcrumb 
              fontSize="sm" 
              color="gray.500"
              aria-label="breadcrumb-navigation"
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
                />
              </Tooltip>
            )}
          </HStack>
        </Flex>
        
        {/* Main content */}
        <Box
          bg={bgColor}
          borderRadius="lg"
          boxShadow="sm"
          p={{ base: 4, md: 6 }}
          borderWidth="1px"
          borderColor={borderColor}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;