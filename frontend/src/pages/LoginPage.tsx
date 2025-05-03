import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { 
  Box, Heading, Text, Flex, Button, VStack, useToast, 
  Tabs, TabList, TabPanels, Tab, TabPanel,
  FormControl, FormLabel, Input, InputGroup, 
  InputRightElement, FormErrorMessage,
  Spinner, Divider
} from "@chakra-ui/react"; 
import { EmailIcon, LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

// Get backend API base URL (adjust if needed, could use env var later)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

interface AuthMode {
  mode: string;
  oauth_enabled: boolean;
  password_auth_enabled: boolean;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setToken } = useAuth();
  
  // State for auth mode
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [loadingMode, setLoadingMode] = useState(true);
  
  // Form state for password login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({ email: "", password: "" });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  
  // Fetch auth mode when component mounts
  useEffect(() => {
    const fetchAuthMode = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/mode`);
        if (response.ok) {
          const data: AuthMode = await response.json();
          setAuthMode(data);
          console.log("Auth mode:", data);
        } else {
          console.error("Failed to fetch auth mode");
          // Default to demo mode if we can't fetch
          setAuthMode({ mode: "demo", oauth_enabled: false, password_auth_enabled: true });
        }
      } catch (error) {
        console.error("Error fetching auth mode:", error);
        // Default to demo mode if we can't fetch
        setAuthMode({ mode: "demo", oauth_enabled: false, password_auth_enabled: true });
      } finally {
        setLoadingMode(false);
      }
    };
    
    fetchAuthMode();
  }, []);

  // Redirect to backend Google login endpoint
  const handleGoogleLogin = () => {
    console.log("Redirecting to Google login...");
    window.location.href = `${API_BASE_URL}/api/v1/auth/login/google`;
  };
  
  // Password-based authentication
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors = { email: "", password: "" };
    if (!email) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";
    
    if (errors.email || errors.password) {
      setFormErrors(errors);
      return;
    }
    
    setIsPasswordLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Login failed" }));
        throw new Error(errorData.detail || `HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Password login successful");
      
      // Store the tokens
      setToken(data.access_token, data.refresh_token);
      
      // Navigate to the main app
      navigate("/workspace");
    } catch (error) {
      console.error("Password login failed:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Could not log in with these credentials",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };
  
  // One-click demo login
  const handleDemoLogin = async () => {
    console.log("Using demo login endpoint...");
    setIsDemoLoading(true);
    
    try {
      // Log the full URL for debugging
      console.log(`Demo login URL: ${API_BASE_URL}/api/v1/auth/demo-login`);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/demo-login`);
      
      // Log the response status and headers for debugging
      console.log(`Demo login response status: ${response.status}`);
      console.log(`Demo login response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorDetail = "Demo login failed";
        try {
          // Try to get JSON error message
          const errorData = await response.json();
          errorDetail = errorData.detail || `HTTP error ${response.status}`;
          console.log("Error data:", errorData);
        } catch (parseError) {
          // If parsing fails, try to get text response
          try {
            const errorText = await response.text();
            console.log("Error text response:", errorText || "(empty response)");
            errorDetail = errorText || `HTTP error ${response.status}`;
          } catch (textError) {
            console.log("Failed to parse error response as text");
          }
        }
        throw new Error(errorDetail);
      }
      
      const data = await response.json();
      console.log("Demo login successful");
      
      // Store the tokens
      setToken(data.access_token, data.refresh_token);
      
      // Navigate to the main app
      navigate("/workspace");
    } catch (error) {
      console.error("Demo login failed:", error);
      toast({
        title: "Demo login failed",
        description: error instanceof Error ? error.message : "Could not complete demo login",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDemoLoading(false);
    }
  };

  if (loadingMode) {
    return (
      <Flex minHeight="100vh" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading authentication options...</Text>
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
        
        {authMode?.mode === "demo" && (
          <Button
            colorScheme="teal"
            width="100%"
            mb={6}
            onClick={handleDemoLogin}
            isLoading={isDemoLoading}
          >
            Quick Demo Login (No Registration Required)
          </Button>
        )}
        
        <Tabs isFitted variant="enclosed">
          <TabList mb="1em">
            {authMode?.password_auth_enabled && (
              <Tab>Password Login</Tab>
            )}
            {authMode?.oauth_enabled && (
              <Tab>Single Sign-On</Tab>
            )}
          </TabList>
          <TabPanels>
            {authMode?.password_auth_enabled && (
              <TabPanel>
                <form onSubmit={handlePasswordLogin}>
                  <VStack spacing={4}>
                    <FormControl isInvalid={!!formErrors.email}>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                      />
                      <FormErrorMessage>{formErrors.email}</FormErrorMessage>
                    </FormControl>
                    
                    <FormControl isInvalid={!!formErrors.password}>
                      <FormLabel>Password</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                        />
                        <InputRightElement width="4.5rem">
                          <Button
                            h="1.75rem" 
                            size="sm" 
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                          </Button>
                        </InputRightElement>
                      </InputGroup>
                      <FormErrorMessage>{formErrors.password}</FormErrorMessage>
                    </FormControl>
                    
                    <Button
                      colorScheme="blue"
                      width="100%"
                      type="submit"
                      isLoading={isPasswordLoading}
                      leftIcon={<LockIcon />}
                    >
                      Sign In
                    </Button>
                    
                    {authMode?.mode === "demo" && (
                      <Text fontSize="sm" mt={2}>
                        Don't have an account? <Link to="/register" style={{ color: 'blue' }}>Register</Link>
                      </Text>
                    )}
                  </VStack>
                </form>
              </TabPanel>
            )}
            
            {authMode?.oauth_enabled && (
              <TabPanel>
                <VStack spacing={4}>
                  <Button 
                    colorScheme="red" 
                    leftIcon={<EmailIcon />} 
                    onClick={handleGoogleLogin}
                    width="100%"
                  >
                    Sign in with Google
                  </Button>
                  
                  {/* Add other OAuth providers here */}
                </VStack>
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      </Box>
    </Flex>
  );
} 