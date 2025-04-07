import React from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  Button, 
  VStack, 
  Avatar, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel, 
  Icon, 
  Container,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  HStack,
  Progress,
  Tag,
  IconButton,
  Badge,
  Grid,
  GridItem,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  AvatarGroup,
  SimpleGrid,
  List,
  ListItem,
  ListIcon,
  Link,
} from "@chakra-ui/react"; 
import { 
  CheckIcon, 
  LinkIcon, 
  ViewIcon, 
  StarIcon, 
  AddIcon, 
  CalendarIcon, 
  ChatIcon, 
  SettingsIcon, 
  ChevronDownIcon,
  TimeIcon,
  AttachmentIcon,
  EditIcon,
  WarningIcon,
} from '@chakra-ui/icons';
import { TbRobot, TbBulb } from 'react-icons/tb';

export default function HubPage() {
  const { hubId } = useParams<{ hubId: string }>(); 
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const aiCardBg = useColorModeValue('purple.50', 'purple.900');
  const aiCardBorder = useColorModeValue('purple.100', 'purple.700');

  const demoHubsData: { [key: string]: { 
    name: string; 
    description: string;
    status: string;
    dueDate: string;
    progress: number;
    priority: 'High' | 'Medium' | 'Low';
    owningTeam?: string;
    alignedGoal?: string;
    goalId?: string;
  } } = {
    'phoenix': { 
      name: 'Project Phoenix', 
      description: 'Next-gen platform development focused on scalability and performance.',
      status: 'In Progress',
      dueDate: '2024-06-30',
      progress: 65,
      priority: 'High',
      owningTeam: 'R&D Platform Team',
      alignedGoal: 'Launch Platform V2',
      goalId: 'team-platform'
    },
    'q3-strategy': { 
      name: 'Q3 Strategy Hub', 
      description: 'Planning and discussion for Q3 initiatives with focus on market expansion.',
      status: 'Needs Review',
      dueDate: '2024-04-15',
      progress: 40,
      priority: 'Medium',
      owningTeam: 'Leadership Team',
      alignedGoal: 'Finalize Q3 OKRs',
      goalId: 'dept-sales'
    }
  };

  const hubData = demoHubsData[hubId || ''] || { 
    name: 'Unknown Hub', 
    description: 'Hub details not found.',
    status: 'Unknown',
    dueDate: '-',
    progress: 0,
    priority: 'Low' as const
  };

  const overviewContent = `This project aims to revolutionize ${hubData.name === 'Project Phoenix' ? 'internal platform development' : 'strategic planning'} by leveraging AI insights and improving cross-functional collaboration. 

Key Objectives:
• Improve system performance by 50%
• Reduce deployment time by 75%
• Implement automated testing coverage
• Launch beta program with key customers

Success Metrics:
• Performance benchmarks
• Deployment pipeline metrics
• Customer satisfaction scores
• Team velocity metrics
  `;

  const notesContent = [
    { 
      user: "Alice", 
      date: "Apr 4", 
      text: "Initial thoughts on budget - need input from Finance.", 
      icon: StarIcon,
      attachments: 2,
      comments: 3
    },
    { 
      user: "Bob", 
      date: "Apr 5", 
      text: "Draft roadmap attached for review.", 
      icon: LinkIcon,
      attachments: 1,
      comments: 5
    },
    { 
      user: "Demo User", 
      date: "Apr 5", 
      text: "Reviewed roadmap, looks good overall, minor suggestions added.", 
      icon: CheckIcon,
      attachments: 0,
      comments: 2
    }
  ];

  const membersContent = [
    { name: "Alice", role: "Lead", avatar: "", team: "R&D Platform" },
    { name: "Bob", role: "Engineer", avatar: "", team: "R&D Platform" },
    { name: "Charlie", role: "Design", avatar: "", team: "Product Design" },
    { name: "Demo User", role: "Stakeholder", avatar: "", team: "Leadership" }
  ];

  const docsContent = [
    { 
      name: "Project Charter.docx", 
      source: "Drive", 
      icon: ViewIcon,
      lastModified: "2 days ago",
      size: "2.4 MB"
    },
    { 
      name: "Initial Roadmap.pdf", 
      source: "SharePoint", 
      icon: ViewIcon,
      lastModified: "1 day ago",
      size: "1.8 MB"
    },
    { 
      name: "Competitive Analysis Q1.xlsx", 
      source: "Drive", 
      icon: ViewIcon,
      lastModified: "5 hours ago",
      size: "3.1 MB"
    }
  ];

  // New AI insights data
  const aiInsights = {
    summary: "Based on recent activity and team discussions, here are key insights and recommendations:",
    keyPoints: [
      "Team velocity has increased by 25% this sprint",
      "3 critical tasks need attention in the next 48 hours",
      "Consider scheduling a sync with the Design team on UI updates"
    ],
    risks: [
      "Testing coverage has dropped below target threshold",
      "Potential resource conflict with Project Omega next week"
    ]
  };

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        {/* Header Section */}
        <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
    <Box>
            <HStack mb={2}>
              <Heading size="lg">{hubData.name}</Heading>
              <Badge colorScheme={hubData.priority === 'High' ? 'red' : hubData.priority === 'Medium' ? 'orange' : 'green'}>
                {hubData.priority}
              </Badge>
            </HStack>
            <Text color={textColor}>{hubData.description}</Text>
          </Box>
          <HStack spacing={2}>
            <IconButton
              aria-label="Chat about project"
              icon={<ChatIcon />}
              variant="ghost"
              colorScheme="brand"
            />
            <IconButton
              aria-label="Project settings"
              icon={<SettingsIcon />}
              variant="ghost"
              colorScheme="brand"
            />
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} colorScheme="brand">
                Actions
              </MenuButton>
              <MenuList>
                <MenuItem icon={<AddIcon />}>Add Member</MenuItem>
                <MenuItem icon={<CalendarIcon />}>Schedule Meeting</MenuItem>
                <MenuItem icon={<EditIcon />}>Edit Details</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>

        {/* Display Connections Below Header */}
        <HStack spacing={4} fontSize="sm">
          {hubData.owningTeam && (
            <Flex alignItems="center">
              <Text as="span" fontWeight="bold" mr={2}>Team:</Text> 
              <Tag size="sm" colorScheme="blue">{hubData.owningTeam}</Tag>
            </Flex>
          )}
          {hubData.alignedGoal && hubData.goalId && (
             <Flex alignItems="center">
              <Text as="span" fontWeight="bold" mr={2}>Goal:</Text> 
              <Link as={RouterLink} to={`/goals#${hubData.goalId}`} _hover={{textDecoration: 'none'}} title={`Link to goal: ${hubData.alignedGoal}`}>
                <Tag size="sm" colorScheme="green" _hover={{opacity: 0.8}} cursor="pointer">{hubData.alignedGoal}</Tag>
              </Link>
            </Flex>
          )}
        </HStack>

        {/* AI Assistant Section */}
        <Card bg={aiCardBg} borderColor={aiCardBorder} borderWidth={1}>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <VStack align="stretch" spacing={4}>
                  <HStack>
                    <Icon as={TbRobot} boxSize={6} color="purple.500" />
                    <Heading size="md">AI Project Assistant</Heading>
                  </HStack>
                  <Text>{aiInsights.summary}</Text>
                  <List spacing={2}>
                    {aiInsights.keyPoints.map((point, idx) => (
                      <ListItem key={idx}>
                        <HStack>
                          <ListIcon as={TbBulb} color="purple.500" />
                          <Text>{point}</Text>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="stretch" spacing={4}>
                  <Heading size="sm" color="red.500">Attention Needed</Heading>
                  <List spacing={2}>
                    {aiInsights.risks.map((risk, idx) => (
                      <ListItem key={idx}>
                        <HStack>
                          <ListIcon as={WarningIcon} color="red.500" />
                          <Text>{risk}</Text>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                </VStack>
              </GridItem>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Project Status Card */}
        <Card variant="outline" bg={bgColor} borderColor={borderColor}>
          <CardBody>
            <Grid templateColumns={{ base: 'repeat(1, 1fr)', md: 'repeat(4, 1fr)' }} gap={4}>
              <GridItem>
                <VStack align="start">
                  <Text fontSize="sm" color={textColor}>Status</Text>
                  <Tag size="lg" colorScheme={hubData.status === 'In Progress' ? 'blue' : 'orange'}>
                    {hubData.status}
                  </Tag>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start">
                  <Text fontSize="sm" color={textColor}>Due Date</Text>
                  <HStack>
                    <TimeIcon />
                    <Text>{new Date(hubData.dueDate).toLocaleDateString()}</Text>
                  </HStack>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start">
                  <Text fontSize="sm" color={textColor}>Team</Text>
                  <HStack>
                    <AvatarGroup size="sm" max={3}>
                      {membersContent.map((member, idx) => (
                        <Avatar 
                          key={idx} 
                          name={member.name} 
                          src={member.avatar}
                        />
                      ))}
                    </AvatarGroup>
                    <Text>{membersContent.length} members</Text>
                  </HStack>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start">
                  <Text fontSize="sm" color={textColor}>Progress</Text>
                  <Box w="100%">
                    <Text mb={1}>{hubData.progress}%</Text>
                    <Progress 
                      value={hubData.progress} 
                size="sm" 
                      colorScheme={hubData.progress > 66 ? 'green' : hubData.progress > 33 ? 'orange' : 'red'} 
                      borderRadius="full"
                    />
                  </Box>
                </VStack>
              </GridItem>
            </Grid>
          </CardBody>
        </Card>

        {/* Main Content Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Overview & Recent Activity */}
          <VStack spacing={6} align="stretch">
            {/* Overview Card */}
            <Card variant="outline">
              <CardHeader>
                <Heading size="md">Overview</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <Text whiteSpace="pre-wrap">{overviewContent}</Text>
              </CardBody>
            </Card>

            {/* Recent Activity Card */}
            <Card variant="outline">
              <CardHeader>
                <Heading size="md">Recent Activity</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={4} align="stretch">
                  {notesContent.map((note, idx) => (
                    <Box key={idx} p={4} borderWidth="1px" borderRadius="md">
                      <HStack justify="space-between" mb={2}>
                        <HStack>
                          <Avatar size="sm" name={note.user} />
                          <Text fontWeight="medium">{note.user}</Text>
                        </HStack>
                        <Text fontSize="sm" color={textColor}>{note.date}</Text>
                      </HStack>
                      <Text mb={2}>{note.text}</Text>
                      <HStack spacing={4}>
                        {note.attachments > 0 && (
                          <HStack color={textColor} fontSize="sm">
                            <AttachmentIcon />
                            <Text>{note.attachments}</Text>
                          </HStack>
                        )}
                        {note.comments > 0 && (
                          <HStack color={textColor} fontSize="sm">
                            <ChatIcon />
                            <Text>{note.comments}</Text>
                          </HStack>
                        )}
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </VStack>

          {/* Team & Documents */}
          <VStack spacing={6} align="stretch">
            {/* Team Members Card */}
            <Card variant="outline">
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Team Members</Heading>
                  <Button leftIcon={<AddIcon />} size="sm" colorScheme="brand">
                    Add Member
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={4} align="stretch">
                  {membersContent.map((member, idx) => (
                    <Flex key={idx} justify="space-between" align="center">
                      <HStack>
                        <Avatar size="sm" name={member.name} src={member.avatar} />
                        <Box>
                          <Link as={RouterLink} to={`/profile/${member.name.toLowerCase().replace(' ', '-')}`} fontWeight="bold" color="brand.700" fontSize="sm">
                            {member.name}
                          </Link>
                          <Text fontSize="xs" color={textColor}>{member.role} - {member.team}</Text>
                        </Box>
                      </HStack>
                </Flex>
              ))}
            </VStack>
              </CardBody>
            </Card>

            {/* Documents Card */}
            <Card variant="outline">
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Documents</Heading>
                  <Button leftIcon={<AddIcon />} size="sm" colorScheme="brand">
                    Add Document
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={4} align="stretch">
                  {docsContent.map((doc, idx) => (
                    <Flex key={idx} justify="space-between" align="center" p={2} _hover={{ bg: 'gray.50', _dark: { bg: 'gray.700' } }} borderRadius="md">
                      <HStack>
                        <Icon as={ViewIcon} color={textColor} />
                  <Box>
                          <Text fontWeight="medium">{doc.name}</Text>
                          <Text fontSize="sm" color={textColor}>
                            {doc.source} • {doc.lastModified}
                          </Text>
                  </Box>
                      </HStack>
                      <Text fontSize="sm" color={textColor}>{doc.size}</Text>
                    </Flex>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </SimpleGrid>

        {/* Tabs for Additional Details */}
        <Tabs variant="enclosed" colorScheme="brand">
          <TabList>
            <Tab>Discussion</Tab>
            <Tab>Tasks</Tab>
            <Tab>Timeline</Tab>
            <Tab>Resources</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Text>Detailed discussion threads will go here...</Text>
            </TabPanel>
            <TabPanel>
              <Text>Task management interface will go here...</Text>
            </TabPanel>
            <TabPanel>
              <Text>Project timeline and milestones will go here...</Text>
          </TabPanel>
          <TabPanel>
              <Text>Additional resources and links will go here...</Text>
          </TabPanel>
        </TabPanels>
      </Tabs>
      </VStack>
    </Container>
  );
} 