import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner, Text, Center, VStack } from '@chakra-ui/react';

export default function AuthCallbackPage() {
  // console.log("[AuthCallbackPage] Rendering...");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    // console.log("[AuthCallbackPage] useEffect running...");
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      // console.log("[AuthCallbackPage] Received token:", token);
      setToken(token);
      // console.log("[AuthCallbackPage] Called setToken via context.");
      navigate('/workspace', { replace: true });
      // console.log("[AuthCallbackPage] Navigated to /workspace.");
    } else if (error) {
      // console.error("[AuthCallbackPage] Authentication error received:", error);
      setToken(null); 
      navigate('/login?error=callback_failed', { replace: true });
    } else {
      // console.error("[AuthCallbackPage] No token or error found in callback.");
       setToken(null);
       navigate('/login?error=invalid_callback', { replace: true });
    }
  }, [searchParams, navigate, setToken]);

  return (
    <Center h="100vh">
      <VStack>
        <Spinner size="xl" />
        <Text mt={4}>Processing authentication...</Text>
      </VStack>
    </Center>
  );
} 