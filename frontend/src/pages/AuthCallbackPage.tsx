import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Spinner, Text, Center, VStack } from '@chakra-ui/react';

/**
 * Processes OAuth callbacks and handles token extraction from URL parameters
 */
export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      const accessToken = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      try {
        if (accessToken) {
          // Store tokens using the TokenManager directly
          // This is a special case for OAuth callbacks
          localStorage.setItem('knowledge_plane_token', accessToken);
          if (refreshToken) {
            localStorage.setItem('knowledge_plane_refresh_token', refreshToken);
          }
          
          // Navigate to workspace
          navigate('/workspace', { replace: true });
        } else if (error) {
          await logout();
          navigate('/login?error=callback_failed', { replace: true });
        } else {
          await logout();
          navigate('/login?error=invalid_callback', { replace: true });
        }
      } catch (err) {
        console.error("Error processing auth callback:", err);
        navigate('/login?error=callback_error', { replace: true });
      }
    };
    
    processCallback();
  }, [searchParams, navigate, logout]);

  return (
    <Center h="100vh">
      <VStack>
        <Spinner size="xl" />
        <Text mt={4}>Processing authentication...</Text>
      </VStack>
    </Center>
  );
} 