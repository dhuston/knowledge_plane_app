import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Heading, Text, VStack, HStack, Grid, GridItem, Card, CardHeader, CardBody,
  Avatar, Badge, Icon, Button, Spinner, Center, useColorModeValue
} from "@chakra-ui/react";
import { FiUsers, FiFileText, FiClock, FiLink, FiCheckCircle, FiMap, FiBarChart2 } from 'react-icons/fi';
import { useApiClient } from '../hooks/useApiClient';
import { TeamRead } from '../types/team';
import { UserReadBasic } from '../types/user';
import { ProjectRead } from '../types/project';
import { GoalReadMinimal, GoalTypeEnum } from '../types/goal';
import ErrorBoundary from '../components/error/ErrorBoundary';
import TeamMembersList from '../components/team/TeamMembersList';
import TeamProjectsList from '../components/team/TeamProjectsList';
import TeamResearchHighlights from '../components/team/TeamResearchHighlights';

/**
 * Team profile page showing team information, members, projects and goals
 */
const TeamPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const apiClient = useApiClient();

  // State
  const [team, setTeam] = useState<TeamRead | null>(null);
  const [teamLead, setTeamLead] = useState<UserReadBasic | null>(null);
  const [members, setMembers] = useState<UserReadBasic[]>([]);
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [goals, setGoals] = useState<GoalReadMinimal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme colors
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
    if (!teamId) return;

    const fetchTeamData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Mock data for development
        setTeam({
          id: teamId || "mock-id",
          name: "PDAC Basal Working Group 1",
          description: "Research team focused on pancreatic ductal adenocarcinoma basal subtype. This team is working on identifying biomarkers and developing novel therapeutic approaches for pancreatic cancer.",
          tenant_id: "tenant-1",
          lead_id: "1",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        setTeamLead({
          id: "1",
          name: "Jane Smith",
          title: "Research Lead",
          email: "jane@example.com"
        });
        
        setMembers([
          { id: "1", name: "Jane Smith", title: "Research Lead", email: "jane@example.com" },
          { id: "2", name: "John Doe", title: "Senior Researcher", email: "john@example.com" },
          { id: "3", name: "Alice Johnson", title: "Data Scientist", email: "alice@example.com" },
          { id: "4", name: "Bob Brown", title: "Clinical Specialist", email: "bob@example.com" },
          { id: "5", name: "Carol White", title: "Research Assistant", email: "carol@example.com" },
        ]);

        setProjects([
          { id: "1", title: "PDAC Biomarker Analysis", status: "active", description: "Analyzing biomarkers for early detection of pancreatic cancer in high-risk populations." },
          { id: "2", title: "Clinical Trial Support", status: "planning", description: "Supporting phase 2 clinical trials for novel therapeutic approaches." },
          { id: "3", title: "Genomic Data Analysis", status: "at_risk", description: "Comprehensive analysis of genomic data from patient samples." },
        ]);
        
        setGoals([
          { id: "1", title: "Complete biomarker validation", status: "on_track", type: GoalTypeEnum.TEAM },
          { id: "2", title: "Publish research findings", status: "at_risk", type: GoalTypeEnum.TEAM },
          { id: "3", title: "Recruit clinical trial participants", status: "on_track", type: GoalTypeEnum.TEAM },
          { id: "4", title: "Develop analysis pipeline", status: "on_track", type: GoalTypeEnum.TEAM },
        ]);
      } catch (err) {
        setError("Failed to load team data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId, apiClient]);

  if (isLoading) {
    return (
      <Center h="100%" minH="200px">
        <Spinner size="xl" color="primary.500" />
      </Center>
    );
  }

  if (error) {
    return (
      <Box p={5} textAlign="center">
        <Text color="red.500">{error}</Text>
        <Button mt={4} onClick={() => navigate(-1)}>Go Back</Button>
      </Box>
    );
  }

  return (
    <ErrorBoundary>
      {/* Hero Header */}
      <Box bg={heroBg} py={8} mb={8} borderBottom="1px" borderColor={borderColor} boxShadow="sm">
        <Box maxW="1200px" mx="auto" px={6}>
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

          <Grid templateColumns={{ base: "1fr", md: "auto 1fr auto" }} gap={6} alignItems="center">
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

            <VStack align="flex-start" spacing={2}>
              <Heading as="h1" size="xl" color={headingColor} fontWeight="bold">
                {team?.name || "Team"}
              </Heading>
              <Text fontSize="lg" color={textColor} maxW="700px">
                {team?.description || "No description available"}
              </Text>

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
        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
          {/* Left Column */}
          <GridItem>
            {/* Overview */}
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
              <CardHeader pb={2} borderBottom="1px" borderColor={borderColor} bg={sectionBg}>
                <HStack>
                  <Icon as={FiBarChart2} color={accentColor} boxSize={5} mr={2} />
                  <Heading size="md">Team Overview</Heading>
                </HStack>
              </CardHeader>
              <CardBody p={6}>
                <TeamResearchHighlights />
              </CardBody>
            </Card>
          </GridItem>

          {/* Right Column */}
          <GridItem>
            {/* Core Team */}
            <Card
              mb={8}
              bg={cardBg}
              borderColor={borderColor}
              borderWidth="1px"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="sm"
            >
              <CardHeader pb={2} borderBottom="1px" borderColor={borderColor} bg={sectionBg}>
                <HStack>
                  <Icon as={FiUsers} color={accentColor} boxSize={5} mr={2} />
                  <Heading size="md">Core Team</Heading>
                </HStack>
              </CardHeader>
              <CardBody p={6}>
                <TeamMembersList members={members} teamLead={teamLead} />
              </CardBody>
            </Card>

            {/* Projects */}
            <Card
              mb={8}
              bg={cardBg}
              borderColor={borderColor}
              borderWidth="1px"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="sm"
            >
              <CardHeader pb={2} borderBottom="1px" borderColor={borderColor} bg={sectionBg}>
                <HStack>
                  <Icon as={FiFileText} color={accentColor} boxSize={5} mr={2} />
                  <Heading size="md">Projects</Heading>
                </HStack>
              </CardHeader>
              <CardBody p={6}>
                <TeamProjectsList projects={projects} />
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Links Section */}
        <Card
          mt={8}
          bg={cardBg}
          borderColor={borderColor}
          borderWidth="1px"
          borderRadius="xl"
          overflow="hidden"
          boxShadow="sm"
        >
          <CardHeader pb={2} borderBottom="1px" borderColor={borderColor} bg={sectionBg}>
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
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'md', bg: hoverBg }}
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
