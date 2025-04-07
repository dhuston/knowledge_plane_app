import React from 'react';
import { Box, Heading, Text, Card, CardBody, CardHeader, Icon, Link, HStack, Avatar, Tag, Flex } from "@chakra-ui/react";
import { Link as RouterLink } from 'react-router-dom';
import { TbBuildingSkyscraper, TbUsers } from 'react-icons/tb';
import { mockDepartments, mockTeams, mockUsers } from '../mockData';
import type { Department, Team, User } from '../mockData';

function isDepartment(unit: Department | Team): unit is Department {
  return 'deptId' in unit === false;
}

const OrgUnitCard: React.FC<{ unit: Department | Team; level: number }> = ({ unit, level }) => {
  const isDept = isDepartment(unit);
  const unitType = isDept ? 'Department' : 'Team';
  const unitTeams: Team[] = isDept ? Object.values(mockTeams).filter(t => t.deptId === unit.id) : [];
  const leadUser: User | null = unit.lead ? mockUsers[unit.lead] : null;

  const icon = isDept ? TbBuildingSkyscraper : TbUsers;
  const colorScheme = isDept ? 'orange' : 'blue';
  const linkTo = isDept ? `/department/${unit.id}` : `/team/${unit.id}`;

  return (
    <Card variant="outline" size="sm" w="100%" mb={4} bg={level % 2 === 0 ? "white" : "gray.50"} _dark={{ bg: level % 2 === 0 ? "gray.800" : "gray.700" }}>
      <CardHeader pb={1} pt={2} px={3}>
        <Flex alignItems="center" justify="space-between">
          <HStack>
            <Icon as={icon} color={`${colorScheme}.500`} />
            <Link as={RouterLink} to={linkTo} fontWeight="bold" color={`brand.${isDept ? 700 : 600}`}>
              {unit.name}
            </Link>
            <Tag size="sm" variant="subtle" colorScheme={colorScheme}>{unitType}</Tag>
          </HStack>
          {leadUser && (
            <HStack fontSize="xs">
              <Text>Lead:</Text>
              <Link as={RouterLink} to={`/profile/${leadUser.id}`} color="gray.600" _dark={{ color: "gray.400"}} fontWeight="medium">
                <Avatar name={leadUser.name} size="2xs" mr={1}/> {leadUser.name}
              </Link>
            </HStack>
          )}
        </Flex>
      </CardHeader>
      {(isDept && unitTeams.length > 0) && (
        <CardBody pl={`${level * 1.5 + 3}rem`} pt={1} pb={2}>
          {unitTeams.map(team => (
            <OrgUnitCard key={team.id} unit={team} level={level + 1} />
          ))}
        </CardBody>
      )}
    </Card>
  );
};

export default function ExplorePage() {
  const topLevelDepartments = Object.values(mockDepartments).filter(d => d.id !== 'leadership');

  return (
    <Box>
      <Heading size="lg" mb={6}>Explore Organization Structure (Simulation)</Heading>
      <Text mb={4} color="gray.600">
         This is a static representation of the connections KnowledgePlane understands between Departments, Teams, and People based on current data. 
         Click names to navigate. The full dynamic graph explorer is coming soon.
      </Text>
      {topLevelDepartments.map(dept => (
        <OrgUnitCard key={dept.id} unit={dept} level={0} />
      ))}
    </Box>
  );
} 