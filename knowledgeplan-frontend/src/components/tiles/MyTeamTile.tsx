import React from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  Icon,
  HStack,
  VStack,
  Button,
  useColorModeValue,
  Avatar,
  AvatarGroup,
  Flex,
  Badge,
  Grid,
  GridItem,
  Divider,
} from '@chakra-ui/react';
import { FiUsers, FiArrowRight, FiFileText, FiBarChart2, FiTarget } from 'react-icons/fi';

interface MyTeamTileProps {
  teamName?: string;
  teamId?: string;
  memberCount?: number;
  onClick: () => void;
}

const MyTeamTile: React.FC<MyTeamTileProps> = ({
  teamName = "Your Team",
  teamId,
  memberCount = 0,
  onClick
}) => {
  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('primary.600', 'primary.300');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  const sectionBg = useColorModeValue('gray.50', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  // Mock data for team stats
  const teamStats = [
    { label: 'Projects', value: '3', icon: FiFileText, color: 'blue.500' },
    { label: 'Research', value: '5', icon: FiBarChart2, color: 'purple.500' },
    { label: 'Goals', value: '2', icon: FiTarget, color: 'green.500' },
  ];

  return (
    <Card
      shadow="md"
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      h="100%"
      borderRadius="lg"
      transition="all 0.2s"
      _hover={{ boxShadow: "lg" }}
      cursor="pointer"
      overflow="hidden"
    >
      <CardBody p={0}>
        <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} h="100%">
          {/* Team Info Section */}
          <GridItem p={{ base: 6, md: 8 }} borderRightWidth={{ md: "1px" }} borderColor={borderColor}>
            <VStack align="start" spacing={4}>
              <HStack spacing={3} width="full">
                <Box
                  bg={accentColor}
                  color="white"
                  p={3}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FiUsers} boxSize={6} />
                </Box>
                <VStack align="start" spacing={0} flex={1}>
                  <Heading size="md">{teamName}</Heading>
                  <Text fontSize="sm" color={textColor}>
                    {memberCount > 0 ? `${memberCount} team members` : "View your team"}
                  </Text>
                </VStack>
              </HStack>

              <Divider />

              {/* Team Members */}
              <Box width="full">
                <Text fontWeight="medium" mb={2}>Team Members</Text>
                <AvatarGroup size="md" max={5} mb={3}>
                  <Avatar name="Jane Smith" />
                  <Avatar name="John Doe" />
                  <Avatar name="Alice Johnson" />
                  <Avatar name="Bob Brown" />
                  <Avatar name="Carol White" />
                  <Avatar name="Dave Green" />
                </AvatarGroup>
              </Box>

              <Button
                rightIcon={<FiArrowRight />}
                colorScheme="primary"
                size="md"
                width="full"
                onClick={onClick}
              >
                View Team Page
              </Button>
            </VStack>
          </GridItem>

          {/* Team Activity Section */}
          <GridItem p={{ base: 6, md: 8 }}>
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Team Activity</Heading>

              {/* Team Stats */}
              <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                {teamStats.map((stat, index) => (
                  <GridItem key={index}>
                    <Box
                      p={4}
                      bg={sectionBg}
                      borderRadius="md"
                      textAlign="center"
                      _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                      transition="all 0.2s"
                    >
                      <Icon as={stat.icon} color={stat.color} boxSize={6} mb={2} />
                      <Text fontWeight="bold" fontSize="xl">{stat.value}</Text>
                      <Text fontSize="sm" color={textColor}>{stat.label}</Text>
                    </Box>
                  </GridItem>
                ))}
              </Grid>

              {/* Recent Activity */}
              <Box>
                <Text fontWeight="medium" mb={2}>Recent Updates</Text>
                <VStack align="stretch" spacing={2}>
                  <HStack p={2} bg={sectionBg} borderRadius="md">
                    <Badge colorScheme="green">New</Badge>
                    <Text fontSize="sm">Biomarker research project started</Text>
                  </HStack>
                  <HStack p={2} bg={sectionBg} borderRadius="md">
                    <Badge colorScheme="blue">Update</Badge>
                    <Text fontSize="sm">Clinical trial data analysis completed</Text>
                  </HStack>
                  <HStack p={2} bg={sectionBg} borderRadius="md">
                    <Badge colorScheme="purple">Research</Badge>
                    <Text fontSize="sm">New publication submitted for review</Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  );
};

export default MyTeamTile;
