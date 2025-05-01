import React from 'react';
import { Box, Text } from '@chakra-ui/react';

interface NotificationBadgeProps {
  count: number;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count }) => {
  // If count is greater than 99, display 99+
  const displayCount = count > 99 ? '99+' : count.toString();
  
  // Adjust size based on character count
  const size = displayCount.length > 2 ? '18px' : '16px';
  
  return (
    <Box
      position="absolute"
      top="-2px"
      right="-2px"
      bg="red.500"
      color="white"
      borderRadius="full"
      width={size}
      height={size}
      display="flex"
      alignItems="center"
      justifyContent="center"
      fontSize="xs"
      fontWeight="bold"
    >
      <Text fontSize={displayCount.length > 2 ? '0.6rem' : '0.7rem'}>
        {displayCount}
      </Text>
    </Box>
  );
};

export default NotificationBadge;