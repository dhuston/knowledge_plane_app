import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, Navigate } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  Avatar, 
  VStack,
  Card,
  CardBody,
  CardHeader,
  Link,
  SimpleGrid,
  Spinner,
  Center,
  Alert,
  AlertIcon
} from "@chakra-ui/react"; 
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import type { User } from '../context/AuthContext';

// Define Team type (mirroring backend schema)
interface Team {
  id: string;
  name: string;
  description?: string | null;
  tenant_id: string;
  created_at: string;
  updated_at?: string | null;
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId?: string }>();
  const { user: loggedInUser, isLoading: authLoading } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [manager, setManager] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      setProfileLoading(true);
      setError(null);
      setManager(null);
      setTeam(null);

      const targetUserId = userId || loggedInUser?.id;

      if (!targetUserId) {
        if (!authLoading) {
           console.error("ProfilePage: Cannot determine user ID.");
           setError("Could not determine user profile to load.");
           setProfileLoading(false);
        }
        return;
      }

      try {
        // console.log(`[ProfilePage] Fetching profile for userId: ${targetUserId}`);
        const fetchedUser = await apiClient.get<User>(`/users/${targetUserId}`);
        setProfileUser(fetchedUser);
        // console.log("[ProfilePage] Fetched profile user:", fetchedUser);

        if (fetchedUser?.manager_id) {
           // console.log(`[ProfilePage] Fetching manager data for managerId: ${fetchedUser.manager_id}`);
           try {
             const fetchedManager = await apiClient.get<User>(`/users/${fetchedUser.manager_id}`);
             setManager(fetchedManager);
             // console.log("[ProfilePage] Fetched manager:", fetchedManager);
           } catch /* (managerError) */ {
             // console.error("[ProfilePage] Failed to fetch manager:", managerError);
           }
        }
        
        if (fetchedUser?.team_id) {
           // console.log(`[ProfilePage] Fetching team data for teamId: ${fetchedUser.team_id}`);
           try {
             const fetchedTeam = await apiClient.get<Team>(`/teams/${fetchedUser.team_id}`);
             setTeam(fetchedTeam);
             // console.log("[ProfilePage] Fetched team:", fetchedTeam);
           } catch /* (teamError) */ {
             // console.error("[ProfilePage] Failed to fetch team:", teamError);
           }
        }
        
      } catch /* (err) */ {
        // console.error("[ProfilePage] Failed to fetch profile user:", err);
        setError("Could not load user profile.");
        setProfileUser(null);
      } finally {
        setProfileLoading(false);
      }
    };

    if (!authLoading) {
       fetchProfileData();
    }

  }, [userId, loggedInUser, authLoading]);

  if (authLoading || profileLoading) {
     return (
          <Center h="calc(100vh - 60px)">
             <Spinner size="xl" />
          </Center>
      );
  }
  
  if (error) {
     return (
         <Center h="calc(100vh - 60px)">
           <Alert status="error">
             <AlertIcon />
             {error}
           </Alert>
         </Center>
     );
  }
  
  if (!profileUser) {
      return <Navigate to="/map" replace />;
  }

  return (
    <Box>
      <Flex alignItems="center" mb={6}>
        <Avatar 
          size="xl" 
          name={profileUser.name} 
          src={profileUser.avatar_url || undefined}
          mr={4} 
        />
        <Box>
          <Heading size="lg">{profileUser.name}</Heading>
          <Text color="gray.600">{profileUser.title || 'N/A'}</Text>
          <Text color="gray.500" fontSize="sm">{profileUser.email}</Text>
        </Box>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
         <Card variant="outline">
           <CardHeader><Heading size="md">Details</Heading></CardHeader>
           <CardBody>
              <VStack spacing={3} align="stretch">
                <Flex>
                  <Text fontWeight="bold" width="100px">Manager:</Text>
                  {profileUser.manager_id ? (
                     <Link as={RouterLink} to={`/profile/${profileUser.manager_id}`} color="brand.700">
                       {manager ? manager.name : profileUser.manager_id}
                     </Link>
                  ) : (
                     <Text>N/A</Text>
                  )}
                </Flex>
                <Flex>
                  <Text fontWeight="bold" width="100px">Team:</Text>
                   {profileUser.team_id ? (
                     <Link as={RouterLink} to={`/team/${profileUser.team_id}`} color="brand.700">
                       {team ? team.name : profileUser.team_id}
                     </Link>
                  ) : (
                     <Text>N/A</Text>
                  )}
                </Flex>
              </VStack>
           </CardBody>
         </Card>

         {/* Column 2: Projects Card (Placeholder) */}
         <Card variant="outline">
           <CardHeader><Heading size="md">Projects</Heading></CardHeader>
           <CardBody>
              <Text fontSize="sm" color="gray.500">User projects will be loaded here.</Text>
           </CardBody>
         </Card>
      </SimpleGrid>
    </Box>
  );
} 