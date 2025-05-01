import React, { useState } from 'react'; // Needed for JSX types
import { useNavigate } from "react-router-dom";
import { Box, Heading, Text, Flex, Button, VStack, useToast } from "@chakra-ui/react"; 
import { EmailIcon } from '@chakra-ui/icons';
import { useAuth } from '../context/AuthContext';

// Get backend API base URL (adjust if needed, could use env var later)
const API_BASE_URL = "http://localhost:8001"; // As defined in docker-compose

export default function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { setToken } = useAuth();

  // Redirect to backend Google login endpoint
  const handleGoogleLogin = () => {
    console.log("Redirecting to Google login...");
    window.location.href = `${API_BASE_URL}/api/v1/auth/login/google`;
  };
  
  // Development-mode direct login (no redirect)
  const handleDevLogin = async () => {
    console.log("Using development login endpoint...");
    setIsLoading(true);
    
    try {
      // Call our development endpoint directly with proper CORS settings
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/dev-login`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Login successful, received tokens");
      
      // Store the tokens using the auth context
      setToken(data.access_token, data.refresh_token);
      
      // Navigate to the main app
      navigate("/workspace");
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Login failed",
        description: "Could not complete login. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex 
      minHeight="100vh" 
      alignItems="center" 
      justifyContent="center" 
      bg="gray.50"
    >
      <Box 
        p={8} 
        maxWidth="400px" 
        borderWidth={1} 
        borderRadius={8} 
        boxShadow="lg"
        bg="white"
        textAlign="center"
      >
        <Heading mb={6}>Welcome to KnowledgePlane AI</Heading>
        <Text mb={6}>Please sign in</Text>
        <VStack spacing={4}> { /* Use VStack for vertical spacing */ }
          <Button 
            colorScheme="blue" 
            leftIcon={<EmailIcon />} 
            onClick={handleGoogleLogin} // Use real login handler
            width="100%"
          >
            Sign in with Google
          </Button>
          <Button 
            colorScheme="teal" 
            leftIcon={<EmailIcon />} 
            onClick={handleDevLogin}
            width="100%"
            isLoading={isLoading}
          >
            Dev Login (No Redirect)
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
} 