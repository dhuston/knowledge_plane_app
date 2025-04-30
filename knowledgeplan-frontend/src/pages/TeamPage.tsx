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
import { FiUsers, FiFileText, FiClock, FiLink, FiCheckCircle, FiMap, FiBarChart2, FiAlertTriangle, FiCalendar } from 'react-icons/fi';
import { useApiClient } from '../hooks/useApiClient';
import { TeamRead } from '../types/team';
import { UserReadBasic } from '../types/user';
import { ProjectRead } from '../types/project';
import { GoalReadMinimal, GoalTypeEnum } from '../types/goal';
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
  const accentColor = useColorModeValue('primary.600', 'primary.300');
  const heroBg = useColorModeValue('primary.50', 'gray.800');
  const sectionBg = useColorModeValue('gray.50', 'gray.600');
  const hoverBg = useColorModeValue('gray.100', 'gray.600');

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
          console.info("Using mock team members data for development");
          // Mock data for now
          setMembers([
            { id: "1", name: "Jane Smith", title: "Research Lead", email: "jane@example.com" },
            { id: "2", name: "John Doe", title: "Senior Researcher", email: "john@example.com" },
            { id: "3", name: "Alice Johnson", title: "Data Scientist", email: "alice@example.com" },
            { id: "4", name: "Bob Brown", title: "Clinical Specialist", email: "bob@example.com" },
            { id: "5", name: "Carol White", title: "Research Assistant", email: "carol@example.com" },
          ]);
        }

        // Fetch team projects
        try {
          const projectsData = await apiClient.get<ProjectRead[]>(`/teams/${teamId}/projects`);
          setProjects(projectsData);
        } catch (err) {
          console.info("Using mock project data for development");
          // Mock data for now
          setProjects([
            { id: "1", title: "PDAC Biomarker Analysis", status: "active", description: "Analyzing biomarkers for early detection of pancreatic cancer in high-risk populations." },
            { id: "2", title: "Clinical Trial Support", status: "planning", description: "Supporting phase 2 clinical trials for novel therapeutic approaches." },
            { id: "3", title: "Genomic Data Analysis", status: "at_risk", description: "Comprehensive analysis of genomic data from patient samples." },
          ]);
        }

        // Fetch team goals
        try {
          const goalsData = await apiClient.get<GoalReadMinimal[]>(`/teams/${teamId}/goals`);
          setGoals(goalsData);
        } catch (err) {
          console.info("Using mock goals data for development");
          // Mock data for now
          setGoals([
            { id: "1", title: "Complete biomarker validation", status: "on_track", type: GoalTypeEnum.TEAM },
            { id: "2", title: "Publish research findings", status: "at_risk", type: GoalTypeEnum.TEAM },
            { id: "3", title: "Recruit clinical trial participants", status: "on_track", type: GoalTypeEnum.TEAM },
            { id: "4", title: "Develop analysis pipeline", status: "on_track", type: GoalTypeEnum.TEAM },
          ]);
        }

      } catch (err) {
        console.info("Using mock team data for development");

        // Mock data for development
        setTeam({
          id: teamId || "mock-id",
          name: "PDAC Basal Working Group 1",
          description: "Research team focused on pancreatic ductal adenocarcinoma basal subtype. This team is working on identifying biomarkers and developing novel therapeutic approaches for pancreatic cancer.",
          tenant_id: "tenant-1",
          lead_id: "1", // Jane Smith from our mock members
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // Set team lead from mock members
        setTeamLead({
          id: "1",
          name: "Jane Smith",
          title: "Research Lead",
          email: "jane@example.com"
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
      {/* Hero Header Section */}
      <Box
        bg={heroBg}
        py={8}
        mb={8}
        borderBottom="1px"
        borderColor={borderColor}
        boxShadow="sm"
      >
        <Box maxW="1200px" mx="auto" px={6}>
          {/* Navigation */}
          <Button
            leftIcon={<FiMap />}
            variant="outline"
            size="sm"
            mb={6}
            onClick={() => navigate('/workspace')}
            bg={cardBg}
            _hover={{ bg: hoverBg }}
          >
            Back to Workspace
          </Button>

          {/* Team Header Content */}
          <Grid templateColumns={{ base: "1fr", md: "auto 1fr auto" }} gap={6} alignItems="center">
            {/* Team Icon/Logo */}
            <Box
              bg={accentColor}
              color="white"
              borderRadius="lg"
              p={5}
              width="100px"
              height="100px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="md"
            >
              <Icon as={FiUsers} boxSize={12} />
            </Box>

            {/* Team Info */}
            <VStack align="flex-start" spacing={2}>
              <Heading as="h1" size="xl" color={headingColor} fontWeight="bold">
                {team?.name || "Team"}
              </Heading>
              <Text fontSize="lg" color={textColor} maxW="700px">
                {team?.description || "No description available"}
              </Text>

              {/* Team Stats */}
              <HStack spacing={6} mt={2}>
                <HStack>
                  <Icon as={FiUsers} color={accentColor} />
                  <Text fontWeight="medium">{members.length} Members</Text>
                </HStack>
                <HStack>
                  <Icon as={FiFileText} color={accentColor} />
                  <Text fontWeight="medium">{projects.length} Projects</Text>
                </HStack>
                <HStack>
                  <Icon as={FiCheckCircle} color={accentColor} />
                  <Text fontWeight="medium">{goals.length} Goals</Text>
                </HStack>
              </HStack>
            </VStack>

            {/* Team Lead */}
            {teamLead && (
              <VStack
                bg={cardBg}
                p={4}
                borderRadius="lg"
                boxShadow="sm"
                align="center"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <Avatar
                  size="lg"
                  name={teamLead.name}
                  src={teamLead.avatar_url}
                  mb={2}
                  border="3px solid"
                  borderColor={accentColor}
                />
                <Text fontWeight="bold">{teamLead.name}</Text>
                <Text fontSize="sm" color={textColor}>{teamLead.title || "Team Lead"}</Text>
                <Badge colorScheme="primary" mt={1}>Lead</Badge>
              </VStack>
            )}
          </Grid>
        </Box>
      </Box>

      {/* Main Content */}
      <Box maxW="1200px" mx="auto" px={6} pb={10}>

        {/* Main Content Grid - Improved Layout */}
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
          {/* Left Column */}
          <GridItem>
            {/* Overview Section - Improved Design */}
            <Card
              mb={8}
              bg={cardBg}
              borderColor={borderColor}
              borderWidth="1px"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="sm"
              transition="all 0.2s"
              _hover={{ boxShadow: "md" }}
            >
              <CardHeader
                pb={2}
                borderBottom="1px"
                borderColor={borderColor}
                bg={sectionBg}
              >
                <HStack>
                  <Icon as={FiBarChart2} color={accentColor} boxSize={5} mr={2} />
                  <Heading size="md">Team Overview</Heading>
                </HStack>
              </CardHeader>
              <CardBody p={6}>
                <VStack align="stretch" spacing={6}>
                  <Text fontSize="md" lineHeight="tall">
                    {team?.description || "This team is working on research and development projects."}
                  </Text>

                  {/* Team Progress Overview */}
                  <Box
                    bg={sectionBg}
                    p={5}
                    borderRadius="lg"
                    borderLeft="4px solid"
                    borderColor={accentColor}
                  >
                    <Heading size="sm" mb={4}>Current Progress</Heading>
                    <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                      <VStack align="center">
                        <Box
                          position="relative"
                          h="80px"
                          w="80px"
                          borderRadius="full"
                          borderWidth="8px"
                          borderColor="gray.200"
                        >
                          <Box
                            position="absolute"
                            top="0"
                            left="0"
                            h="100%"
                            w="100%"
                            borderRadius="full"
                            borderWidth="8px"
                            borderColor={accentColor}
                            clipPath="polygon(0 0, 100% 0, 100% 75%, 0 75%)"
                          />
                          <Center h="100%" w="100%">
                            <Text fontWeight="bold" fontSize="lg">75%</Text>
                          </Center>
                        </Box>
                        <Text fontWeight="medium" mt={2}>Research</Text>
                      </VStack>

                      <VStack align="center">
                        <Box
                          position="relative"
                          h="80px"
                          w="80px"
                          borderRadius="full"
                          borderWidth="8px"
                          borderColor="gray.200"
                        >
                          <Box
                            position="absolute"
                            top="0"
                            left="0"
                            h="100%"
                            w="100%"
                            borderRadius="full"
                            borderWidth="8px"
                            borderColor="blue.400"
                            clipPath="polygon(0 0, 100% 0, 100% 60%, 0 60%)"
                          />
                          <Center h="100%" w="100%">
                            <Text fontWeight="bold" fontSize="lg">60%</Text>
                          </Center>
                        </Box>
                        <Text fontWeight="medium" mt={2}>Projects</Text>
                      </VStack>

                      <VStack align="center">
                        <Box
                          position="relative"
                          h="80px"
                          w="80px"
                          borderRadius="full"
                          borderWidth="8px"
                          borderColor="gray.200"
                        >
                          <Box
                            position="absolute"
                            top="0"
                            left="0"
                            h="100%"
                            w="100%"
                            borderRadius="full"
                            borderWidth="8px"
                            borderColor="green.400"
                            clipPath="polygon(0 0, 100% 0, 100% 85%, 0 85%)"
                          />
                          <Center h="100%" w="100%">
                            <Text fontWeight="bold" fontSize="lg">85%</Text>
                          </Center>
                        </Box>
                        <Text fontWeight="medium" mt={2}>Goals</Text>
                      </VStack>
                    </Grid>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Research Highlights - Improved Design */}
            <Card
              mb={8}
              bg={cardBg}
              borderColor={borderColor}
              borderWidth="1px"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="sm"
              transition="all 0.2s"
              _hover={{ boxShadow: "md" }}
            >
              <CardHeader
                pb={2}
                borderBottom="1px"
                borderColor={borderColor}
                bg={sectionBg}
              >
                <HStack>
                  <Icon as={FiFileText} color={accentColor} boxSize={5} mr={2} />
                  <Heading size="md">Research Highlights</Heading>
                </HStack>
              </CardHeader>
              <CardBody p={6}>
                <TeamResearchHighlights />
              </CardBody>
            </Card>

            {/* Resources - Improved Design */}
            <Card
              mb={8}
              bg={cardBg}
              borderColor={borderColor}
              borderWidth="1px"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="sm"
              transition="all 0.2s"
              _hover={{ boxShadow: "md" }}
            >
              <CardHeader
                pb={2}
                borderBottom="1px"
                borderColor={borderColor}
                bg={sectionBg}
              >
                <HStack>
                  <Icon as={FiLink} color={accentColor} boxSize={5} mr={2} />
                  <Heading size="md">Resources</Heading>
                </HStack>
              </CardHeader>
              <CardBody p={6}>
                <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={4}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Card
                      key={i}
                      p={4}
                      bg={sectionBg}
                      borderRadius="md"
                      height="80px"
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: 'md',
                        bg: hoverBg
                      }}
                      transition="all 0.2s"
                      cursor="pointer"
                    >
                      <Center h="100%">
                        <VStack>
                          <Icon
                            as={i % 4 === 0 ? FiFileText :
                                i % 4 === 1 ? FiLink :
                                i % 4 === 2 ? FiClock : FiBarChart2}
                            boxSize={6}
                            color={
                              i % 4 === 0 ? "blue.500" :
                              i % 4 === 1 ? "purple.500" :
                              i % 4 === 2 ? "green.500" : "orange.500"
                            }
                          />
                          <Text fontSize="xs" fontWeight="medium">
                            {i % 4 === 0 ? "Document" :
                             i % 4 === 1 ? "Link" :
                             i % 4 === 2 ? "Timeline" : "Data"}
                          </Text>
                        </VStack>
                      </Center>
                    </Card>
                  ))}
                </Grid>
              </CardBody>
            </Card>
          </GridItem>

          {/* Right Column */}
          <GridItem>
            {/* Core Team - Improved Design */}
            <Card
              mb={8}
              bg={cardBg}
              borderColor={borderColor}
              borderWidth="1px"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="sm"
              transition="all 0.2s"
              _hover={{ boxShadow: "md" }}
            >
              <CardHeader
                pb={2}
                borderBottom="1px"
                borderColor={borderColor}
                bg={sectionBg}
              >
                <HStack>
                  <Icon as={FiUsers} color={accentColor} boxSize={5} mr={2} />
                  <Heading size="md">Core Team</Heading>
                </HStack>
              </CardHeader>
              <CardBody p={6}>
                <TeamMembersList members={members} teamLead={teamLead} />
              </CardBody>
            </Card>

            {/* Projects - Improved Design */}
            <Card
              mb={8}
              bg={cardBg}
              borderColor={borderColor}
              borderWidth="1px"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="sm"
              transition="all 0.2s"
              _hover={{ boxShadow: "md" }}
            >
              <CardHeader
                pb={2}
                borderBottom="1px"
                borderColor={borderColor}
                bg={sectionBg}
              >
                <HStack>
                  <Icon as={FiFileText} color={accentColor} boxSize={5} mr={2} />
                  <Heading size="md">Projects</Heading>
                </HStack>
              </CardHeader>
              <CardBody p={6}>
                <TeamProjectsList projects={projects} />
              </CardBody>
            </Card>

            {/* Goals - Improved Design */}
            <Card
              bg={cardBg}
              borderColor={borderColor}
              borderWidth="1px"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="sm"
              transition="all 0.2s"
              _hover={{ boxShadow: "md" }}
            >
              <CardHeader
                pb={2}
                borderBottom="1px"
                borderColor={borderColor}
                bg={sectionBg}
              >
                <HStack>
                  <Icon as={FiCheckCircle} color={accentColor} boxSize={5} mr={2} />
                  <Heading size="md">Goals</Heading>
                </HStack>
              </CardHeader>
              <CardBody p={6}>
                <VStack spacing={4} align="stretch">
                  {goals.length > 0 ? (
                    goals.map((goal) => (
                      <Box
                        key={goal.id}
                        p={4}
                        bg={sectionBg}
                        borderRadius="md"
                        borderLeft="3px solid"
                        borderColor={goal.status === 'on_track' ? 'green.500' : 'orange.500'}
                        _hover={{
                          transform: 'translateY(-2px)',
                          boxShadow: 'sm',
                          bg: hoverBg
                        }}
                        transition="all 0.2s"
                        cursor="pointer"
                      >
                        <HStack mb={2}>
                          <Icon
                            as={FiCheckCircle}
                            color={goal.status === 'on_track' ? 'green.500' : 'orange.500'}
                          />
                          <Text fontWeight="medium">{goal.title}</Text>
                          <Badge ml="auto" colorScheme={goal.status === 'on_track' ? 'green' : 'orange'}>
                            {goal.status?.replace('_', ' ')}
                          </Badge>
                        </HStack>

                        {/* Progress bar */}
                        <Box bg="gray.200" h="4px" w="100%" borderRadius="full" mt={2}>
                          <Box
                            bg={goal.status === 'on_track' ? 'green.500' : 'orange.500'}
                            h="100%"
                            w={goal.status === 'on_track' ? "75%" : "45%"}
                            borderRadius="full"
                          />
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Text color="gray.500">No goals found</Text>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Links Section - Improved Design */}
        <Card
          mt={8}
          bg={cardBg}
          borderColor={borderColor}
          borderWidth="1px"
          borderRadius="xl"
          overflow="hidden"
          boxShadow="sm"
          transition="all 0.2s"
          _hover={{ boxShadow: "md" }}
        >
          <CardHeader
            pb={2}
            borderBottom="1px"
            borderColor={borderColor}
            bg={sectionBg}
          >
            <HStack>
              <Icon as={FiLink} color={accentColor} boxSize={5} mr={2} />
              <Heading size="md">Important Links</Heading>
            </HStack>
          </CardHeader>
          <CardBody p={6}>
            <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={4}>
              {[
                { name: "Research Database", icon: FiFileText, color: "blue.500" },
                { name: "Team Wiki", icon: FiLink, color: "purple.500" },
                { name: "Project Timeline", icon: FiClock, color: "green.500" },
                { name: "Analytics Dashboard", icon: FiBarChart2, color: "orange.500" }
              ].map((link, i) => (
                <Box
                  key={i}
                  p={4}
                  bg={sectionBg}
                  borderRadius="md"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'md',
                    bg: hoverBg
                  }}
                  transition="all 0.2s"
                  cursor="pointer"
                >
                  <VStack>
                    <Icon as={link.icon} boxSize={6} color={link.color} />
                    <Text fontWeight="medium" textAlign="center">{link.name}</Text>
                  </VStack>
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
