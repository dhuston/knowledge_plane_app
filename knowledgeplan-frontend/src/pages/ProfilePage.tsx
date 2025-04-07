import React from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
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
  HStack,
  Icon,
  Tag,
  SimpleGrid 
} from "@chakra-ui/react"; 
import { InfoIcon, WarningIcon } from '@chakra-ui/icons'; // Only needed icons
// Import shared mock data
import { mockUsers, mockTeams, mockProjects } from '../mockData'; // Adjust path as needed

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const profileUser = userId ? mockUsers[userId] : mockUsers['demo-user'];
  const managerUser = profileUser?.manager ? mockUsers[profileUser.manager] : null;
  const userTeam = profileUser?.teamId ? mockTeams[profileUser.teamId] : null;
  const userProjects = Object.values(mockProjects).filter(h => h.teamId === profileUser?.teamId);

  if (!profileUser) {
    return <Box>User not found.</Box>;
  }

  return (
    <Box>
      {/* Header Section */}
      <Flex alignItems="center" mb={6}>
        <Avatar size="xl" name={profileUser.name} src={profileUser.avatar} mr={4} />
        <Box>
          <Heading size="lg">{profileUser.name}</Heading>
          <Text color="gray.600">{profileUser.title}</Text>
          <Text color="gray.500" fontSize="sm">{profileUser.email}</Text>
        </Box>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
         {/* Column 1: Details Card */}
         <Card variant="outline">
           <CardHeader><Heading size="md">Details</Heading></CardHeader>
           <CardBody>
              <VStack spacing={3} align="stretch">
                <Flex>
                  <Text fontWeight="bold" width="100px">Manager:</Text>
                  {managerUser ? (
                     <Link as={RouterLink} to={`/profile/${managerUser.id}`} color="brand.700">{profileUser.manager}</Link>
                  ) : (
                     <Text>{profileUser.manager || 'N/A'}</Text>
                  )}
                </Flex>
                <Flex>
                  <Text fontWeight="bold" width="100px">Team:</Text>
                   {userTeam ? (
                     <Link as={RouterLink} to={`/team/${profileUser.teamId}`} color="brand.700">{userTeam.name}</Link>
                  ) : (
                     <Text>{profileUser.teamId || 'N/A'}</Text>
                  )}
                </Flex>
              </VStack>
           </CardBody>
         </Card>

         {/* Column 2: Projects Card */}
         <Card variant="outline">
           <CardHeader><Heading size="md">Projects ({userProjects.length})</Heading></CardHeader>
           <CardBody>
              {userProjects.length > 0 ? (
                 <VStack spacing={3} align="stretch">
                   {userProjects.map(project => (
                     <HStack key={project.id}>
                        <Icon as={project.statusIcon} color={`${project.statusColorScheme}.500`} mr={2}/>
                        <Link as={RouterLink} to={`/hub/${project.id}`} fontSize="sm" fontWeight="medium">{project.name}</Link>
                        <Tag size="sm" colorScheme={project.statusColorScheme}>{project.status}</Tag>
                     </HStack>
                   ))}
                 </VStack>
              ) : (
                 <Text fontSize="sm" color="gray.500">No projects found for this user.</Text>
              )}
           </CardBody>
         </Card>
      </SimpleGrid>
    </Box>
  );
} 