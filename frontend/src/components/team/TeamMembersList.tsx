import React from 'react';
import {
  VStack,
  HStack,
  Avatar,
  Text,
  Box,
  Badge,
  Flex,
  Wrap,
  WrapItem,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { FiMail, FiMessageSquare } from 'react-icons/fi';
import { UserReadBasic } from '../../types/user';

interface TeamMembersListProps {
  members: UserReadBasic[];
  teamLead?: UserReadBasic | null;
}

const TeamMembersList: React.FC<TeamMembersListProps> = ({ members, teamLead }) => {
  const bgHover = useColorModeValue('gray.100', 'gray.700');
  const accentColor = useColorModeValue('primary.600', 'primary.300');
  const sectionBg = useColorModeValue('gray.50', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <VStack spacing={4} align="stretch">
      {members.length > 0 ? (
        members.map((member) => (
          <Box
            key={member.id}
            p={4}
            bg={sectionBg}
            borderRadius="md"
            borderLeft={teamLead && teamLead.id === member.id ? "3px solid" : "none"}
            borderColor={accentColor}
            _hover={{
              bg: bgHover,
              transform: 'translateY(-2px)',
              boxShadow: 'sm'
            }}
            transition="all 0.2s"
            cursor="pointer"
            onClick={() => console.log(`Navigating to profile for ${member.name}`)}
          >
            <Flex direction={{ base: "column", sm: "row" }} align={{ base: "center", sm: "flex-start" }}>
              <Avatar
                size="md"
                name={member.name}
                mb={{ base: 2, sm: 0 }}
                mr={{ base: 0, sm: 4 }}
                border={teamLead && teamLead.id === member.id ? "2px solid" : "none"}
                borderColor={accentColor}
              />

              <Box flex="1">
                <Flex
                  justify="space-between"
                  align="center"
                  direction={{ base: "column", sm: "row" }}
                  mb={2}
                >
                  <VStack spacing={0} align={{ base: "center", sm: "flex-start" }}>
                    <HStack>
                      <Text fontWeight="bold" fontSize="md">{member.name}</Text>
                      {teamLead && teamLead.id === member.id && (
                        <Badge colorScheme="primary" fontSize="xs">Team Lead</Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" color={textColor}>{member.title || "Team Member"}</Text>
                  </VStack>

                  <HStack mt={{ base: 2, sm: 0 }} spacing={2}>
                    <Box
                      as="button"
                      p={2}
                      borderRadius="full"
                      bg="transparent"
                      _hover={{ bg: bgHover }}
                      title="Send email"
                    >
                      <Icon as={FiMail} color={accentColor} />
                    </Box>
                    <Box
                      as="button"
                      p={2}
                      borderRadius="full"
                      bg="transparent"
                      _hover={{ bg: bgHover }}
                      title="Send message"
                    >
                      <Icon as={FiMessageSquare} color={accentColor} />
                    </Box>
                  </HStack>
                </Flex>

                {/* Skills/Tags - Optional */}
                <Wrap spacing={2} mt={2}>
                  {['Research', 'Data Analysis', 'Clinical'].map((skill, i) => (
                    <WrapItem key={i}>
                      <Badge
                        px={2}
                        py={1}
                        borderRadius="full"
                        colorScheme={
                          i === 0 ? "blue" :
                          i === 1 ? "purple" :
                          "green"
                        }
                        fontSize="xs"
                      >
                        {skill}
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>
              </Box>
            </Flex>
          </Box>
        ))
      ) : (
        <Box p={4} textAlign="center" bg={sectionBg} borderRadius="md">
          <Text color={textColor}>No team members found</Text>
        </Box>
      )}
    </VStack>
  );
};

export default TeamMembersList;
