import React from 'react';
import { Box, Flex, Alert, AlertTitle, AlertDescription, AlertIcon } from '@chakra-ui/react';
import { FiGrid, FiUsers, FiToggleRight, FiLink, FiDatabase, FiSettings, FiList } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { AdminProvider, useAdmin, AdminViews } from '../../context/AdminContext';

// Import admin components
import AdminSidebarNav from './common/AdminSidebarNav';
import AdminDashboard from './dashboard/AdminDashboard';
import EnhancedFeatureFlags from './features/EnhancedFeatureFlags';
import EnhancedIntegrationsPanel from './integrations/EnhancedIntegrationsPanel';
import UserManagement from './users/UserManagement';

interface AdminUser {
  is_superuser?: boolean;
  email?: string;
  name?: string;
  role?: string[];
}

// Helper function to check if user has admin access
const hasAdminAccess = (user: AdminUser | null): boolean => {
  if (!user) return false;

  // Check for superuser flag directly on user object
  if (user.is_superuser === true) {
    return true;
  }
  
  // For development, allow specific test users
  if (user.email === 'dev@example.com' || user.name === 'Development User') {
    return true;
  }
  
  // Also check for admin role if present
  if (user.role?.includes('admin')) {
    return true;
  }
  
  // Default to false - no access
  return false;
};

// Main component content (separated to allow for provider wrapping)
const AdminConsoleContent: React.FC = () => {
  const { user } = useAuth();
  const { activeView, setActiveView, setBreadcrumbs } = useAdmin();
  
  // Check if user has admin access
  if (!user || !hasAdminAccess(user)) {
    return (
      <Box p={8}>
        <Alert 
          status="error" 
          variant="solid" 
          borderRadius="md"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          py={4}
          px={8}
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Access Denied
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            You don't have permission to access the admin console.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }
  
  // Navigation items for the sidebar
  const navItems = [
    { id: AdminViews.DASHBOARD, label: 'Dashboard', icon: <FiGrid /> },
    { id: AdminViews.USERS, label: 'Users', icon: <FiUsers /> },
    { id: AdminViews.FEATURES, label: 'Features', icon: <FiToggleRight /> },
    { id: AdminViews.INTEGRATIONS, label: 'Integrations', icon: <FiLink /> },
    { id: AdminViews.TENANTS, label: 'Tenants', icon: <FiDatabase /> },
    { id: AdminViews.SETTINGS, label: 'Settings', icon: <FiSettings /> },
    { id: AdminViews.LOGS, label: 'Logs', icon: <FiList /> },
  ];
  
  // Handle navigation item click
  const handleNavigation = (viewId: string) => {
    setActiveView(viewId);
    
    // Update breadcrumbs based on selected view
    const viewLabel = navItems.find(item => item.id === viewId)?.label || '';
    setBreadcrumbs([
      { label: 'Admin Console' },
      { label: viewLabel }
    ]);
  };
  
  // Render the current view based on activeView state
  const renderActiveView = () => {
    switch (activeView) {
      case AdminViews.DASHBOARD:
        return <AdminDashboard />;
      case AdminViews.USERS:
        return <UserManagement />;
      case AdminViews.FEATURES:
        return <EnhancedFeatureFlags />;
      case AdminViews.INTEGRATIONS:
        return <EnhancedIntegrationsPanel />;
      // Other views will be implemented later
      case AdminViews.TENANTS:
      case AdminViews.SETTINGS:
      case AdminViews.LOGS:
        return <Box p={4}>This section is coming soon.</Box>;
      default:
        return <AdminDashboard />;
    }
  };
  
  return (
    <Flex h="calc(100vh - 60px)" overflow="hidden">
      {/* Sidebar Navigation */}
      <AdminSidebarNav
        items={navItems}
        onItemClick={handleNavigation}
        activeItemId={activeView}
      />
      
      {/* Main Content */}
      <Box flex="1" overflow="auto">
        {renderActiveView()}
      </Box>
    </Flex>
  );
};

// Main component with provider wrapping
const AdminConsole: React.FC = () => {
  return (
    <AdminProvider>
      <AdminConsoleContent />
    </AdminProvider>
  );
};

export default AdminConsole;