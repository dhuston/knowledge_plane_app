import React from 'react';
import {
  VStack,
  HStack,
  Avatar,
  Text,
  Box,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { UserReadBasic } from '../../types/user';

interface TeamMembersListProps {
  members: UserReadBasic[];
  teamLead?: UserReadBasic | null;
}

const TeamMembersList: React.FC<TeamMembersListProps> = ({ members, teamLead }) => {
  const bgHover = useColorModeValue('gray.100', 'gray.700');
  
  return (
    <VStack spacing={3} align="stretch">
      {members.length > 0 ? (
        members.map((member) => (
          <HStack 
            key={member.id} 
            p={3} 
            bg="gray.50" 
            borderRadius="md"
            _hover={{ bg: bgHover, transform: 'translateY(-2px)' }}
            transition="all 0.2s"
            cursor="pointer"
            onClick={() => window.location.href = `/profile/${member.id}`}
          >
            <Avatar size="sm" name={member.name} src={member.avatar_url} />
            <VStack spacing={0} align="flex-start">
              <HStack>
                <Text fontWeight="medium">{member.name}</Text>
                {teamLead && teamLead.id === member.id && (
                  <Badge colorScheme="green" fontSize="xs">Lead</Badge>
                )}
              </HStack>
              <Text fontSize="xs" color="gray.500">{member.title || "Team Member"}</Text>
            </VStack>
          </HStack>
        ))
      ) : (
        <Box p={4} textAlign="center">
          <Text color="gray.500">No team members found</Text>
        </Box>
      )}
    </VStack>
  );
};

export default TeamMembersList;
