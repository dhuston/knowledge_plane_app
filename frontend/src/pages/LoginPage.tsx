import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { 
  Box, Heading, Text, Flex, Button, VStack, useToast, 
  FormControl, FormLabel, FormErrorMessage,
  Spinner, Select
} from "@chakra-ui/react"; 
import { EmailIcon } from '@chakra-ui/icons';
// No need to import useAuth for direct token approach
import { tokenManager } from '../auth/TokenManager';
import { API_BASE_URL } from '../config/env';

interface TenantInfo {
  id: string;
  name: string;
  domain: string;
  is_active: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  // Using direct token approach, no need for useAuth
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({ email: "", password: "", tenant: "", user: "" });
  
  // Tenant state
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [loadingTenants, setLoadingTenants] = useState(false);
  
  // User state
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // Fetch tenants when component mounts
  useEffect(() => {
    const loadTenants = async () => {
      setIsLoading(true);
      setLoadingTenants(true);
      
      try {
        console.log(`Fetching tenants from ${API_BASE_URL}/api/v1/auth/tenants`);
        // Fetch available tenants from backend with error handling
        const tenantsResponse = await fetch(`${API_BASE_URL}/api/v1/auth/tenants`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }).catch(error => {
          console.error("Network error fetching tenants:", error);
          throw error;
        });
        
        if (tenantsResponse && tenantsResponse.ok) {
          const tenantData: TenantInfo[] = await tenantsResponse.json();
          
          if (tenantData && tenantData.length > 0) {
            setTenants(tenantData);
            console.log("Available tenants from API:", tenantData);
            
            // Select the first tenant by default
            setSelectedTenant(tenantData[0].id);
          } else {
            // Fallback to static tenant data if API returns empty array
            console.warn("API returned empty tenant list, using static data");
            useStaticTenantData();
          }
        } else {
          console.error("Failed to fetch tenants", tenantsResponse ? `Status: ${tenantsResponse.status}` : "No response");
          toast({
            title: "Warning",
            description: "Could not load available tenants",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
          
          // Fallback to static data
          useStaticTenantData();
        }
        
        function useStaticTenantData() {
          // Static tenant data as fallback
          const staticTenants: TenantInfo[] = [
            {
              id: "3fa85f64-5717-4562-b3fc-2c963f66afa6", // Static UUID for Pharma AI Demo
              name: "Pharma AI Demo",
              domain: "pharmademo.biosphere.ai",
              is_active: true
            },
            {
              id: "4fa85f64-5717-4562-b3fc-2c963f66afa7", // Static UUID for Tech Innovations
              name: "Tech Innovations Inc.",
              domain: "techinnovations.biosphere.ai",
              is_active: true
            },
            {
              id: "6fa85f64-5717-4562-b3fc-2c963f66afa9", // Metropolitan Health System
              name: "Metropolitan Health System",
              domain: "metrohealth.biosphere.ai", 
              is_active: true
            },
            {
              id: "7fa85f64-5717-4562-b3fc-2c963f66afaa", // Global Financial Group
              name: "Global Financial Group",
              domain: "globalfingroup.biosphere.ai", 
              is_active: true
            },
            {
              id: "8fa85f64-5717-4562-b3fc-2c963f66afab", // Advanced Manufacturing Corp
              name: "Advanced Manufacturing Corp",
              domain: "advancedmfg.biosphere.ai", 
              is_active: true
            },
            {
              id: "9fa85f64-5717-4562-b3fc-2c963f66afac", // University Research Alliance
              name: "University Research Alliance",
              domain: "uniresearch.biosphere.ai", 
              is_active: true
            }
          ];
          
          console.log("Using static tenant data:", staticTenants);
          setTenants(staticTenants);
          
          // Select the first tenant by default
          if (staticTenants.length > 0) {
            setSelectedTenant(staticTenants[0].id);
          }
        }
        
        // Old implementation for reference
        /*
        // Fetch available tenants
        const tenantsResponse = await fetch(`${API_BASE_URL}/api/v1/auth/tenants`);
        if (tenantsResponse.ok) {
          const tenantData: TenantInfo[] = await tenantsResponse.json();
          setTenants(tenantData);
          console.log("Available tenants:", tenantData);
          
          // Select the first tenant by default
          if (tenantData.length > 0) {
            setSelectedTenant(tenantData[0].id);
          }
        } else {
          console.error("Failed to fetch tenants");
          toast({
            title: "Warning",
            description: "Could not load available tenants",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        }
        */
      } catch (error) {
        console.error("Error loading tenant data:", error);
        toast({
          title: "Error",
          description: "Failed to load tenant data",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
        setLoadingTenants(false);
      }
    };
    
    loadTenants();
  }, [toast]);
  
  // Fetch users when tenant is selected
  useEffect(() => {
    const fetchUsers = async () => {
      if (!selectedTenant) return;
      
      setLoadingUsers(true);
      setUsers([]);
      setSelectedUser("");
      
      try {
        console.log(`Fetching users for tenant ${selectedTenant}`);
        const usersResponse = await fetch(`${API_BASE_URL}/api/v1/auth/tenant-users?tenant_id=${selectedTenant}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'x-tenant-id': selectedTenant
          }
        }).catch(error => {
          console.error("Network error fetching users:", error);
          throw error;
        });
        
        if (usersResponse && usersResponse.ok) {
          const userData = await usersResponse.json();
          
          if (userData && userData.length > 0) {
            setUsers(userData);
            console.log(`Found ${userData.length} users for tenant`);
          } else {
            console.warn("No users found for tenant");
          }
        } else {
          console.error("Failed to fetch users", usersResponse ? `Status: ${usersResponse.status}` : "No response");
          toast({
            title: "Warning",
            description: "Could not load users for selected tenant",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast({
          title: "Error",
          description: "Failed to load user data",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoadingUsers(false);
      }
    };
    
    fetchUsers();
  }, [selectedTenant, toast]);

  // Google OAuth login
  const handleGoogleLogin = () => {
    if (!selectedTenant) {
      setFormErrors({ ...formErrors, tenant: "Please select a tenant" });
      toast({
        title: "Tenant Selection Required",
        description: "Please select a tenant before logging in",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    console.log("Redirecting to Google login...");
    window.location.href = `${API_BASE_URL}/api/v1/auth/login/google?tenant_id=${selectedTenant}`;
  };
  
  // Ultra-simple login function - just set the token and go
  const handleTenantLogin = () => {
    // Pharma AI Demo tenant ID
    const tenantId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
    
    // Set tenant in localStorage
    localStorage.setItem('knowledge_plane_tenant', tenantId);
    
    // Create a JWT token for Dan Huston's user record from the database
    // Claims: user_id=65a3c790-ad79-4fb6-b4cf-7f818aa3c714, tenant_id=3fa85f64-5717-4562-b3fc-2c963f66afa6
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NWEzYzc5MC1hZDc5LTRmYjYtYjRjZi03ZjgxOGFhM2M3MTQiLCJleHAiOjIwMDAwMDAwMDAsInRlbmFudF9pZCI6IjNmYTg1ZjY0LTU3MTctNDU2Mi1iM2ZjLTJjOTYzZjY2YWZhNiJ9.HptRDaZt9JViimpr8kksNXdJ4oQJJP9geJxzKxBzAco";
    
    // Store token using TokenManager for consistency
    tokenManager.storeToken(token);
    
    // Show success message
    toast({
      title: "Logged in as Dan Huston",
      description: "Access granted",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
    
    // Navigate to workspace
    navigate(`/workspace?t=${Date.now()}`);
  };
  
  // Password login (kept for future use)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = { email: "", password: "", tenant: "" };
    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";
    if (!selectedTenant) errors.tenant = "Please select a tenant";
    
    if (errors.email || errors.password || errors.tenant) {
      setFormErrors(errors);
      return;
    }
    
    setIsLoginLoading(true);
    
    try {
      // Store selected tenant in localStorage for development endpoints to use
      localStorage.setItem('knowledge_plane_tenant', selectedTenant);
      
      // Using the direct login from the new auth context
      await login(email, password);
      navigate("/workspace");
    } catch (error) {
      console.error("Password login failed:", error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Flex minHeight="100vh" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading tenant options...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Flex 
      minHeight="100vh" 
      alignItems="center" 
      justifyContent="center" 
      bg="gray.50"
    >
      <Box 
        p={8} 
        maxWidth="450px" 
        borderWidth={1} 
        borderRadius={8} 
        boxShadow="lg"
        bg="white"
        textAlign="center"
      >
        <Heading mb={2}>Welcome to Biosphere AI</Heading>
        <Text mb={6} color="gray.600">Collaborative organization mapping</Text>
        
        {/* Hidden field to store default tenant ID */}
        <input type="hidden" value="3fa85f64-5717-4562-b3fc-2c963f66afa6" id="defaultTenantId" />
        
        <Button
          colorScheme="teal"
          width="100%"
          mb={6}
          onClick={handleTenantLogin}
          isLoading={isLoginLoading}
          isDisabled={isLoginLoading}
        >
          Login as Dan Huston
        </Button>
        
        <Box mt={6} pt={4} borderTopWidth={1}>
          <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
            Need help? Contact your administrator
          </Text>
        </Box>
      </Box>
    </Flex>
  );
} 