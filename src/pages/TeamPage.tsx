import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  Avatar,
  Badge,
  Icon,
  Button,
  Divider,
  Spinner,
  Center,
  useColorModeValue,
  Link,
  Flex,
  Tag,
} from "@chakra-ui/react";
import { FiUsers, FiFileText, FiClock, FiLink, FiCheckCircle, FiMap } from 'react-icons/fi';
import { useApiClient } from '../hooks/useApiClient';
import { TeamRead } from '../types/team';
import { UserReadBasic } from '../types/user';
import { ProjectRead } from '../types/project';
import { GoalReadMinimal } from '../types/goal';
import ErrorBoundary from '../components/error/ErrorBoundary';
import TeamMembersList from '../components/team/TeamMembersList';
import TeamProjectsList from '../components/team/TeamProjectsList';
import TeamResearchHighlights from '../components/team/TeamResearchHighlights';

const TeamPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const apiClient = useApiClient();

  // State for team data
  const [team, setTeam] = useState<TeamRead | null>(null);
  const [teamLead, setTeamLead] = useState<UserReadBasic | null>(null);
  const [members, setMembers] = useState<UserReadBasic[]>([]);
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [goals, setGoals] = useState<GoalReadMinimal[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.700', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Fetch team data
  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch team details
        const teamData = await apiClient.get<TeamRead>(`/teams/${teamId}`);
        setTeam(teamData);

        // Fetch team lead if available
        if (teamData.lead_id) {
          const leadData = await apiClient.get<UserReadBasic>(`/users/${teamData.lead_id}`);
          setTeamLead(leadData);
        }

        // Fetch team members
        // Note: This endpoint might need to be implemented in the backend
        try {
          const membersData = await apiClient.get<UserReadBasic[]>(`/teams/${teamId}/members`);
          setMembers(membersData);
        } catch (err) {
          console.warn("Could not fetch team members, using mock data");
          // Mock data for now
          setMembers([
            { id: "1", name: "Jane Smith", title: "Research Lead", email: "jane@example.com" },
            { id: "2", name: "John Doe", title: "Senior Researcher", email: "john@example.com" },
            { id: "3", name: "Alice Johnson", title: "Data Scientist", email: "alice@example.com" },
          ]);
        }

        // Fetch team projects
        try {
          const projectsData = await apiClient.get<ProjectRead[]>(`/teams/${teamId}/projects`);
          setProjects(projectsData);
        } catch (err) {
          console.warn("Could not fetch team projects, using mock data");
          // Mock data for now
          setProjects([
            { id: "1", title: "PDAC Biomarker Analysis", status: "active", description: "Analyzing biomarkers for early detection" },
            { id: "2", title: "Clinical Trial Support", status: "planning", description: "Supporting phase 2 clinical trials" },
          ]);
        }

        // Fetch team goals
        try {
          const goalsData = await apiClient.get<GoalReadMinimal[]>(`/teams/${teamId}/goals`);
          setGoals(goalsData);
        } catch (err) {
          console.warn("Could not fetch team goals, using mock data");
          // Mock data for now
          setGoals([
            { id: "1", title: "Complete biomarker validation", status: "on_track" },
            { id: "2", title: "Publish research findings", status: "at_risk" },
          ]);
        }

      } catch (err) {
        console.error("Error fetching team data:", err);
        setError("Failed to load team information. Please try again later.");

        // Mock data for development
        setTeam({
          id: teamId || "mock-id",
          name: "PDAC Basal Working Group 1",
          description: "Research team focused on pancreatic ductal adenocarcinoma basal subtype",
          tenant_id: "tenant-1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, apiClient]);

  // Render loading state
  if (isLoading) {
    return (
      <Center h="100%" minH="200px">
        <Spinner size="xl" color="primary.500" />
      </Center>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box p={5} textAlign="center">
        <Text color="red.500">{error}</Text>
        <Button mt={4} onClick={() => navigate(-1)}>Go Back</Button>
      </Box>
    );
  }

  // Render team page
  return (
    <ErrorBoundary>
      <Box p={6} maxW="1200px" mx="auto">
        {/* Navigation */}
        <Button
          leftIcon={<FiMap />}
          variant="outline"
          size="sm"
          mb={4}
          onClick={() => navigate('/map')}
        >
          Back to Map
        </Button>
        {/* Team Header */}
        <Card mb={6} bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="lg" overflow="hidden">
          <CardBody>
            <HStack spacing={4} align="flex-start">
              <Box
                bg="gray.200"
                borderRadius="md"
                p={4}
                width="80px"
                height="80px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FiUsers} boxSize={10} color="gray.500" />
              </Box>
              <VStack align="flex-start" spacing={1} flex={1}>
                <Heading as="h1" size="lg" color={headingColor}>{team?.name || "Team"}</Heading>
                <Text color={textColor}>{team?.description || "No description available"}</Text>
                {teamLead && (
                  <HStack mt={2}>
                    <Text fontWeight="medium" fontSize="sm">Team Lead:</Text>
                    <HStack>
                      <Avatar size="xs" name={teamLead.name} src={teamLead.avatar_url} />
                      <Text fontSize="sm">{teamLead.name}</Text>
                    </HStack>
                  </HStack>
                )}
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        {/* Main Content Grid */}
        <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={6}>
          {/* Left Column */}
          <GridItem>
            {/* Overview Section */}
            <Card mb={6} bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="lg" overflow="hidden">
              <CardHeader pb={0}>
                <Heading size="md">Overview</Heading>
              </CardHeader>
              <CardBody>
                <Text mb={4}>
                  {team?.description || "This team is working on research and development projects."}
                </Text>
                <Box bg="gray.50" p={4} borderRadius="md">
                  {/* Placeholder for overview content */}
                  <Box h="100px" bg="gray.100" mb={2} borderRadius="md" />
                  <Box h="20px" w="80%" bg="gray.100" mb={2} borderRadius="md" />
                  <Box h="20px" w="60%" bg="gray.100" borderRadius="md" />
                </Box>
              </CardBody>
            </Card>

            {/* Research Highlight */}
            <Card mb={6} bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="lg" overflow="hidden">
              <CardHeader pb={0}>
                <Heading size="md">Research Highlight</Heading>
              </CardHeader>
              <CardBody>
                <TeamResearchHighlights />
              </CardBody>
            </Card>

            {/* Resources */}
            <Card mb={6} bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="lg" overflow="hidden">
              <CardHeader pb={0}>
                <Heading size="md">Resources</Heading>
              </CardHeader>
              <CardBody>
                <Grid templateColumns={{ base: "1fr", sm: "repeat(4, 1fr)" }} gap={4}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} p={4} bg="gray.50" borderRadius="md" height="80px">
                      <Center h="100%">
                        <Icon as={i % 2 === 0 ? FiFileText : FiLink} boxSize={6} color="gray.400" />
                      </Center>
                    </Card>
                  ))}
                </Grid>
              </CardBody>
            </Card>
          </GridItem>

          {/* Right Column */}
          <GridItem>
            {/* Core Team */}
            <Card mb={6} bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="lg" overflow="hidden">
              <CardHeader pb={0}>
                <Heading size="md">Core Team</Heading>
              </CardHeader>
              <CardBody>
                <TeamMembersList members={members} teamLead={teamLead} />
              </CardBody>
            </Card>

            {/* Projects */}
            <Card mb={6} bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="lg" overflow="hidden">
              <CardHeader pb={0}>
                <Heading size="md">Projects</Heading>
              </CardHeader>
              <CardBody>
                <TeamProjectsList projects={projects} />
              </CardBody>
            </Card>

            {/* Goals */}
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="lg" overflow="hidden">
              <CardHeader pb={0}>
                <Heading size="md">Goals</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  {goals.length > 0 ? (
                    goals.map((goal) => (
                      <HStack key={goal.id} p={3} bg="gray.50" borderRadius="md">
                        <Icon
                          as={FiCheckCircle}
                          color={goal.status === 'on_track' ? 'green.500' : 'orange.500'}
                        />
                        <Text>{goal.title}</Text>
                        <Badge ml="auto" colorScheme={goal.status === 'on_track' ? 'green' : 'orange'}>
                          {goal.status?.replace('_', ' ')}
                        </Badge>
                      </HStack>
                    ))
                  ) : (
                    <Text color="gray.500">No goals found</Text>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Links Section */}
        <Card mt={6} bg={cardBg} borderColor={borderColor} borderWidth="1px" borderRadius="lg" overflow="hidden">
          <CardHeader pb={0}>
            <Heading size="md">Links</Heading>
          </CardHeader>
          <CardBody>
            <Grid templateColumns={{ base: "1fr", sm: "repeat(4, 1fr)" }} gap={4}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Box key={i} p={3} bg="gray.50" borderRadius="md" height="60px">
                  <Center h="100%">
                    <Text color="gray.500">Link {i + 1}</Text>
                  </Center>
                </Box>
              ))}
            </Grid>
          </CardBody>
        </Card>
      </Box>
    </ErrorBoundary>
  );
};

export default TeamPage;
