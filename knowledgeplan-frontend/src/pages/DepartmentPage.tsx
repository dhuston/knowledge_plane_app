import React from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Text, 
  VStack, 
  HStack, 
  Card, 
  CardBody, 
  CardHeader, 
  Icon, 
  Link, 
  SimpleGrid,
  Avatar
} from "@chakra-ui/react";
import { 
  // Removed unused icons
} from '@chakra-ui/icons';
import { 
  TbBuildingSkyscraper, 
  TbUsers, 
  // Removed unused TbTargetArrow,
  // Removed unused TbChartBar,
  // Removed unused TbBulb
} from 'react-icons/tb';
// Import shared mock data
import { mockDepartments, mockTeams, mockUsers } from '../mockData'; // Adjust path as needed

export default function DepartmentPage() {
  const { deptId } = useParams<{ deptId: string }>();
  const department = deptId ? mockDepartments[deptId] : null;
  const departmentTeams = Object.values(mockTeams).filter(team => team.deptId === deptId);
  const leadUser = department?.lead ? mockUsers[department.lead] : null; // Find lead user by ID

  const textColor = useColorModeValue('gray.600', 'gray.300');

  if (!department) {
    return <Box>Department not found.</Box>;
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header Section */}
      <Box>
        <HStack mb={2}>
          <Icon as={TbBuildingSkyscraper} boxSize={6} color="brand.500" />
          <Heading size="lg">{department.name}</Heading>
        </HStack>
        {leadUser && (
          <HStack spacing={4} color={textColor}>
            <Avatar size="xs" name={leadUser.name} mr={1} />
            <Text fontSize="sm">Lead: 
              <Link as={RouterLink} to={`/profile/${leadUser.id}`} fontWeight="medium">
                 {leadUser.name}
              </Link>
            </Text>
          </HStack>
        )}
      </Box>

      {/* Main Content: Just Teams for now */}
      <Card variant="outline">
        <CardHeader>
          <HStack>
            <Icon as={TbUsers} color="brand.500" />
            <Heading size="md">Teams ({departmentTeams.length})</Heading>
          </HStack>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {departmentTeams.map(team => {
              const teamLeadUser = team.lead ? mockUsers[team.lead] : null; 
              return (
                <Card key={team.id} variant="outline">
                  <CardBody>
                    <VStack align="stretch" spacing={3}>
                       <Heading size="sm">
                          <Link as={RouterLink} to={`/team/${team.id}`}>
                            {team.name}
                          </Link>
                       </Heading>
                       {teamLeadUser && (
                         <HStack fontSize="sm" color={textColor}>
                           <Avatar size="xs" name={teamLeadUser.name} mr={1} />
                           <Text>Lead: 
                             <Link as={RouterLink} to={`/profile/${teamLeadUser.id}`}>{teamLeadUser.name}</Link>
                           </Text>
                         </HStack>
                       )}
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        </CardBody>
      </Card>
    </VStack>
  );
} 