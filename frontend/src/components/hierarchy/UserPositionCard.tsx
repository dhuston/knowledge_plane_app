/**
 * UserPositionCard.tsx
 * Component for displaying user's position in the hierarchy
 */
import React from 'react';
import {
  Box,
  Avatar,
  Badge,
  useColorModeValue,
  IconButton,
  VStack,
  Flex,
  Icon
} from '@chakra-ui/react';
import { FiUser, FiUsers, FiTarget } from 'react-icons/fi';
import { StyledTooltip } from '../common/StyledTooltip';
import { useAuth } from '../../context/AuthContext';
import { useHierarchy } from './state/HierarchyContext';

export const UserPositionCard: React.FC = () => {
  // Get current user from auth context
  const { user } = useAuth();
  
  // Get hierarchy context
  const { units, selectUnit } = useHierarchy();
  
  // Theme colors
  const bgColor = useColorModeValue('primary.50', 'primary.900');
  const avatarBorderColor = useColorModeValue('primary.300', 'primary.500');
  const statusColor = useColorModeValue('green.500', 'green.300');
  const roleIconColor = useColorModeValue('primary.600', 'primary.300');
  
  // Handle click on user's position
  const handleUserClick = () => {
    if (user?.id) {
      selectUnit(user.id);
    }
  };
  
  // Get user's team ID, if any
  const userTeamId = user?.team_id;
  
  // Handle click on user's team
  const handleTeamClick = () => {
    if (userTeamId) {
      selectUnit(userTeamId);
    }
  };
  
  return (
    <Box 
      width="44px"
      position="relative"
      mb={4}
    >
      <VStack spacing={1}>
        <StyledTooltip
          label={`Your current position: ${user?.name || 'You'}`}
          placement="right"
        >
          <Box
            position="relative"
            cursor="pointer"
            onClick={handleUserClick}
            borderRadius="8px"
            bg={bgColor}
            p={1}
            width="44px"
            height="44px"
            display="flex"
            justifyContent="center"
            alignItems="center"
            transition="all 0.2s"
            _hover={{ transform: 'scale(1.05)' }}
          >
            {user?.avatar_url ? (
              <Avatar 
                src={user.avatar_url} 
                size="sm" 
                name={user.name}
                border="2px solid"
                borderColor={avatarBorderColor}
                opacity="0.9"
              />
            ) : (
              <Avatar 
                icon={<FiUser size="1.2rem" />} 
                size="sm" 
                bg={useColorModeValue('primary.100', 'primary.800')}
                color={roleIconColor}
                border="2px solid"
                borderColor={avatarBorderColor}
                opacity="0.9"
              />
            )}
            
            {/* Location indicator badge - shows this is your position */}
            <Badge 
              position="absolute"
              bottom="-1px"
              right="-1px"
              borderRadius="full"
              bg={statusColor}
              boxSize="16px"
              border="1px solid"
              borderColor={useColorModeValue('white', 'gray.800')}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={FiTarget} fontSize="8px" color="white" />
            </Badge>
          </Box>
        </StyledTooltip>
        
        {/* Show team icon if user has a team */}
        {userTeamId && (
          <StyledTooltip
            label={units[userTeamId]?.name || 'Your team'}
            placement="right"
          >
            <IconButton
              icon={<FiUsers size="1rem" />}
              size="sm" 
              variant="ghost"
              aria-label="Your team"
              borderRadius="md"
              onClick={handleTeamClick}
              color={roleIconColor}
            />
          </StyledTooltip>
        )}
      </VStack>
    </Box>
  );
};