import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { 
  Box, Heading, Text, Flex, Button, VStack, useToast, 
  FormControl, FormLabel, Input, InputGroup, 
  InputRightElement, FormErrorMessage,
  Spinner, Divider
} from "@chakra-ui/react"; 
import { EmailIcon, LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

// Get backend API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

interface AuthMode {
  mode: string;
  oauth_enabled: boolean;
  password_auth_enabled: boolean;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setToken } = useAuth();
  
  // State for auth mode
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [loadingMode, setLoadingMode] = useState(true);
  
  // Form state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({ 
    email: "", name: "", password: "", confirmPassword: ""
  });
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch auth mode when component mounts
  useEffect(() => {
    const fetchAuthMode = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/mode`);
        if (response.ok) {
          const data: AuthMode = await response.json();
          setAuthMode(data);
          
          // Redirect if not in demo mode and registration is not allowed
          if (data.mode !== "demo") {
            toast({
              title: "Registration not available",
              description: "This instance does not support user registration",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            navigate("/login");
          }
        } else {
          console.error("Failed to fetch auth mode");
          setAuthMode({ mode: "demo", oauth_enabled: false, password_auth_enabled: true });
        }
      } catch (error) {
        console.error("Error fetching auth mode:", error);
        setAuthMode({ mode: "demo", oauth_enabled: false, password_auth_enabled: true });
      } finally {
        setLoadingMode(false);
      }
    };
    
    fetchAuthMode();
  }, [navigate, toast]);

  // Validate form
  const validateForm = () => {
    const errors = { email: "", name: "", password: "", confirmPassword: "" };
    let isValid = true;
    
    if (!email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "Email is invalid";
      isValid = false;
    }
    
    if (!name) {
      errors.name = "Name is required";
      isValid = false;
    }
    
    if (!password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
      isValid = false;
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // Handle registration submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Registration failed" }));
        throw new Error(errorData.detail || `HTTP error ${response.status}`);
      }
      
      const data = await response.json();
      
      toast({
        title: "Registration successful!",
        description: "Your account has been created",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Store the tokens and navigate to the app
      setToken(data.access_token, data.refresh_token);
      navigate("/workspace");
      
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        status: "error",
        duration: 7000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (loadingMode) {
    return (
      <Flex minHeight="100vh" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading...</Text>
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
      >
        <Heading mb={2} textAlign="center">Create Account</Heading>
        <Text mb={6} textAlign="center" color="gray.600">
          Register for demo access to Biosphere AI
        </Text>
        
        <form onSubmit={handleRegister}>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!formErrors.email}>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
              <FormErrorMessage>{formErrors.email}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={!!formErrors.name}>
              <FormLabel>Full Name</FormLabel>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
              <FormErrorMessage>{formErrors.name}</FormErrorMessage>
            </FormControl>
            
            <FormControl isRequired isInvalid={!!formErrors.password}>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min. 8 characters)"
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
            
            <FormControl isRequired isInvalid={!!formErrors.confirmPassword}>
              <FormLabel>Confirm Password</FormLabel>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
              <FormErrorMessage>{formErrors.confirmPassword}</FormErrorMessage>
            </FormControl>
            
            <Button
              mt={6}
              colorScheme="blue"
              width="100%"
              type="submit"
              isLoading={isLoading}
            >
              Create Account
            </Button>
            
            <Text fontSize="sm">
              Already have an account? <Link to="/login" style={{ color: 'blue' }}>Sign in</Link>
            </Text>
          </VStack>
        </form>
      </Box>
    </Flex>
  );
}