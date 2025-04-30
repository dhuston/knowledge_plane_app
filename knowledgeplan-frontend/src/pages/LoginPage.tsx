import React from 'react'; // Needed for JSX types
// import { useNavigate } from "react-router-dom"; // Removed unused hook
import { Box, Heading, Text, Flex, Button, VStack } from "@chakra-ui/react"; 
import { EmailIcon } from '@chakra-ui/icons';

// Get backend API base URL (adjust if needed, could use env var later)
const API_BASE_URL = "http://localhost:8001"; // As defined in docker-compose

export default function LoginPage() {
  // Remove navigate hook if no longer needed for fake login
  // const navigate = useNavigate();

  // Redirect to backend Google login endpoint
  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/v1/auth/login/google`;
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
            colorScheme="gray" 
            leftIcon={<EmailIcon />} 
            // onClick={handleFakeLogin} // Keep Microsoft button disabled/fake for now
            width="100%"
            isDisabled // Disable Microsoft login for now
          >
            Sign in with Microsoft
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
} 