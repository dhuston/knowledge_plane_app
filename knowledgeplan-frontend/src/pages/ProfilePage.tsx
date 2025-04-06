import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  Avatar, 
  VStack, 
  Container,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  HStack,
  Tag,
  Icon,
  useColorModeValue,
  Badge,
  Progress,
  IconButton
} from "@chakra-ui/react"; 
import { 
  EditIcon, 
  EmailIcon, 
  CalendarIcon, 
  TimeIcon,
  CheckIcon,
  StarIcon,
  SettingsIcon
} from '@chakra-ui/icons';
import { TbMicroscope } from 'react-icons/tb';

export default function ProfilePage() {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const statBg = useColorModeValue('gray.50', 'gray.700');

  // --- Static Demo Profile Data ---
  const profileData = {
    name: "Demo User",
    email: "demo.user@example.com",
    title: "Research Scientist",
    avatarUrl: "", // Leave empty for default avatar
    manager: "Jane Doe",
    team: "Core Platform Team",
    department: "Research & Development",
    location: "Boston, MA",
    joinDate: "March 2023",
    expertise: ["Cell Biology", "Immunology", "Data Analysis"],
    currentProjects: [
      { name: "CAR-T Cell Assay", role: "Lead Researcher", progress: 65 },
      { name: "Protein Expression Analysis", role: "Contributor", progress: 40 }
    ],
    recentActivity: [
      { type: "experiment", text: "Started new CAR-T viability experiment", date: "2 hours ago" },
      { type: "publication", text: "Published paper on resistance mechanisms", date: "3 days ago" },
      { type: "data", text: "Updated protein expression dataset", date: "1 week ago" }
    ],
    stats: {
      experimentsRun: 48,
      publicationsContributed: 12,
      projectsCompleted: 8,
      teamSize: 5
    },
    availability: {
      status: "Available",
      calendar: "Open for collaboration",
      nextMeeting: "Team Research Review at 10:00 AM tomorrow"
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={8}>
        {/* Left Column - Main Profile Info */}
        <Card variant="outline" gridColumn={{ lg: "span 3" }}>
          <CardBody>
            {/* Header Section */}
            <Flex direction={{ base: 'column', md: 'row' }} gap={6} mb={8}>
              <Box position="relative">
                <Avatar 
                  size="2xl" 
                  name={profileData.name} 
                  src={profileData.avatarUrl}
                />
                <Badge
                  position="absolute"
                  bottom={0}
                  right={0}
                  colorScheme="green"
                  borderRadius="full"
                  px={2}
                  py={1}
                >
                  {profileData.availability.status}
                </Badge>
              </Box>
              
              <Box flex="1">
                <Flex justify="space-between" align="flex-start" mb={4}>
                  <Box>
                    <Heading size="lg" mb={2}>{profileData.name}</Heading>
                    <HStack spacing={4} mb={2}>
                      <Text color={textColor} fontSize="lg">{profileData.title}</Text>
                      <Tag colorScheme="purple" size="md">{profileData.department}</Tag>
                    </HStack>
                    <HStack spacing={4} color={textColor} fontSize="sm">
                      <HStack>
                        <EmailIcon />
                        <Text>{profileData.email}</Text>
                      </HStack>
                      <HStack>
                        <Icon as={TbMicroscope} />
                        <Text>{profileData.team}</Text>
                      </HStack>
                      <HStack>
                        <CalendarIcon />
                        <Text>Joined {profileData.joinDate}</Text>
                      </HStack>
                    </HStack>
                  </Box>
                  <HStack>
                    <IconButton
                      aria-label="Edit Profile"
                      icon={<EditIcon />}
                      variant="ghost"
                      size="sm"
                    />
                    <IconButton
                      aria-label="Profile Settings"
                      icon={<SettingsIcon />}
                      variant="ghost"
                      size="sm"
                    />
                  </HStack>
                </Flex>

                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={4}>
                  <Box bg={statBg} p={4} borderRadius="md" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold">{profileData.stats.experimentsRun}</Text>
                    <Text fontSize="sm" color={textColor}>Experiments</Text>
                  </Box>
                  <Box bg={statBg} p={4} borderRadius="md" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold">{profileData.stats.publicationsContributed}</Text>
                    <Text fontSize="sm" color={textColor}>Publications</Text>
                  </Box>
                  <Box bg={statBg} p={4} borderRadius="md" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold">{profileData.stats.projectsCompleted}</Text>
                    <Text fontSize="sm" color={textColor}>Projects</Text>
                  </Box>
                  <Box bg={statBg} p={4} borderRadius="md" textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold">{profileData.stats.teamSize}</Text>
                    <Text fontSize="sm" color={textColor}>Team Size</Text>
                  </Box>
                </SimpleGrid>

                <HStack spacing={2} wrap="wrap">
                  {profileData.expertise.map((skill, index) => (
                    <Tag key={index} size="md" colorScheme="blue" variant="subtle">
                      {skill}
                    </Tag>
                  ))}
                </HStack>
              </Box>
            </Flex>

            {/* Current Projects Section */}
            <Box mb={8}>
              <Heading size="md" mb={4}>Current Projects</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {profileData.currentProjects.map((project, index) => (
                  <Card key={index} variant="outline" size="sm">
                    <CardBody>
                      <VStack align="stretch" spacing={3}>
                        <Flex justify="space-between">
                          <Heading size="sm">{project.name}</Heading>
                          <Tag size="sm" colorScheme="purple">{project.role}</Tag>
                        </Flex>
                        <Box>
                          <Flex justify="space-between" mb={2}>
                            <Text fontSize="sm" color={textColor}>Progress</Text>
                            <Text fontSize="sm" fontWeight="medium">{project.progress}%</Text>
                          </Flex>
                          <Progress 
                            value={project.progress} 
                            size="sm" 
                            colorScheme={project.progress > 66 ? 'green' : project.progress > 33 ? 'orange' : 'red'} 
                            borderRadius="full"
                          />
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>

            {/* Recent Activity Section */}
            <Box>
              <Heading size="md" mb={4}>Recent Activity</Heading>
              <VStack spacing={4} align="stretch">
                {profileData.recentActivity.map((activity, index) => (
                  <Flex 
                    key={index} 
                    p={4} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    borderColor={borderColor}
                    align="center"
                    justify="space-between"
                  >
                    <HStack spacing={4}>
                      <Icon 
                        as={activity.type === 'experiment' ? TbMicroscope : activity.type === 'publication' ? StarIcon : CheckIcon} 
                        boxSize={5}
                        color={activity.type === 'experiment' ? 'purple.500' : activity.type === 'publication' ? 'yellow.500' : 'green.500'}
                      />
                      <Text>{activity.text}</Text>
                    </HStack>
                    <HStack>
                      <TimeIcon />
                      <Text fontSize="sm" color={textColor}>{activity.date}</Text>
                    </HStack>
                  </Flex>
                ))}
              </VStack>
            </Box>
          </CardBody>
        </Card>

        {/* Right Column - Additional Info */}
        <VStack spacing={4} align="stretch">
          {/* Availability Card */}
          <Card variant="outline">
            <CardHeader>
              <Heading size="sm">Availability</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={3} align="stretch">
                <HStack color="green.500">
                  <CheckIcon />
                  <Text>{profileData.availability.calendar}</Text>
                </HStack>
                <HStack color={textColor} fontSize="sm">
                  <CalendarIcon />
                  <Text>{profileData.availability.nextMeeting}</Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Team Info Card */}
          <Card variant="outline">
            <CardHeader>
              <Heading size="sm">Team Information</Heading>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={3} align="stretch">
                <Flex justify="space-between">
                  <Text fontWeight="medium">Manager</Text>
                  <Text color={textColor}>{profileData.manager}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">Team</Text>
                  <Text color={textColor}>{profileData.team}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="medium">Location</Text>
                  <Text color={textColor}>{profileData.location}</Text>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </SimpleGrid>
    </Container>
  );
} 