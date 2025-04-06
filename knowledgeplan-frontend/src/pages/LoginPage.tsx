import React from 'react'; // Needed for JSX types
import { useNavigate } from "react-router-dom";
import { Box, Heading, Text, Flex, Button, VStack } from "@chakra-ui/react"; 
import { EmailIcon } from '@chakra-ui/icons';

export default function LoginPage() {
  const navigate = useNavigate(); // Hook for navigation

  // Simulate navigation on button click for Slice 0
  const handleFakeLogin = () => {
    navigate('/workspace', { replace: true }); 
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
            leftIcon={<EmailIcon />} // Placeholder icon
            onClick={handleFakeLogin}
            width="100%"
          >
            Sign in with Google
          </Button>
          <Button 
            colorScheme="gray" 
            leftIcon={<EmailIcon />} // Placeholder icon
            onClick={handleFakeLogin}
            width="100%"
          >
            Sign in with Microsoft
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
} 