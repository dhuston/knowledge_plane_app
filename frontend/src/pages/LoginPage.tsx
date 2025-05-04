import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { 
  Box, Heading, Text, Flex, Button, VStack, useToast, 
  FormControl, FormLabel, FormErrorMessage,
  Spinner, Select
} from "@chakra-ui/react"; 
import { EmailIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

// Get backend API base URL (adjust if needed, could use env var later)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

interface TenantInfo {
  id: string;
  name: string;
  domain: string;
  is_active: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setToken } = useAuth();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({ email: "", password: "", tenant: "" });
  
  // Tenant state
  const [tenants, setTenants] = useState<TenantInfo[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [loadingTenants, setLoadingTenants] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // Fetch tenants when component mounts
  useEffect(() => {
    const loadTenants = async () => {
      setIsLoading(true);
      setLoadingTenants(true);
      
      try {
        // Use static tenant data while backend endpoint is having issues
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
            id: "5fa85f64-5717-4562-b3fc-2c963f66afa8", // Static UUID for UltraThink demo tenant
            name: "UltraThink",
            domain: "ultrathink.demo.biosphere.ai", 
            is_active: true
          }
        ];
        
        console.log("Using static tenant data:", staticTenants);
        setTenants(staticTenants);
        
        // Select the first tenant by default
        if (staticTenants.length > 0) {
          setSelectedTenant(staticTenants[0].id);
        }
        
        /* Backend API call disabled temporarily due to server issues
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
  
  // Handle tenant login (demo login for all tenants)
  const handleTenantLogin = async () => {
    // Validate tenant selection
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
    
    setIsLoginLoading(true);
    
    try {
      const loginUrl = `${API_BASE_URL}/api/v1/auth/demo-login?tenant_id=${selectedTenant}`;
      const response = await fetch(loginUrl);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(errorData.detail || `HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Tenant login successful");
      
      // Store the tokens
      setToken(data.access_token, data.refresh_token);
      
      // Navigate to the main app
      navigate("/workspace");
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Could not log in to the selected tenant",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoginLoading(false);
    }
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
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tenant_id: selectedTenant }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(errorData.detail || `HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      setToken(data.access_token, data.refresh_token);
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
        
        {/* Tenant Selection Dropdown */}
        <FormControl mb={6} isInvalid={!!formErrors.tenant}>
          <FormLabel>Select Tenant</FormLabel>
          <Select 
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            placeholder="Select a tenant"
            isDisabled={loadingTenants}
          >
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} {tenant.domain ? `(${tenant.domain})` : ''}
              </option>
            ))}
          </Select>
          <FormErrorMessage>{formErrors.tenant}</FormErrorMessage>
        </FormControl>
        
        <Button
          colorScheme="teal"
          width="100%"
          mb={6}
          onClick={handleTenantLogin}
          isLoading={isLoginLoading}
          isDisabled={!selectedTenant || loadingTenants}
        >
          Login to {selectedTenant ? tenants.find(t => t.id === selectedTenant)?.name || 'Selected Tenant' : 'Tenant'}
        </Button>
        
        <Box mt={6} pt={4} borderTopWidth={1}>
          <Text mb={4} fontWeight="medium">Additional Login Options</Text>
          
          <Button 
            colorScheme="red" 
            leftIcon={<EmailIcon />} 
            onClick={handleGoogleLogin}
            width="100%"
            mb={4}
            variant="outline"
          >
            Sign in with Google
          </Button>
          
          <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
            Need help? Contact your administrator
          </Text>
        </Box>
      </Box>
    </Flex>
  );
} 