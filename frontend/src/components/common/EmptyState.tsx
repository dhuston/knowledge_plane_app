import React from 'react';
import { Box, Center, Icon, Text, Stack, BoxProps } from '@chakra-ui/react';
import { IconType } from 'react-icons';

interface EmptyStateProps extends BoxProps {
  title: string;
  description?: string;
  icon?: IconType;
  iconSize?: number;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  iconSize = 8,
  ...boxProps
}) => {
  return (
    <Box textAlign="center" py={10} px={6} {...boxProps}>
      <Center mb={6}>
        {icon && (
          <Icon as={icon} boxSize={iconSize} color="gray.400" />
        )}
      </Center>
      <Stack spacing={2}>
        <Text fontWeight="bold" fontSize="lg">
          {title}
        </Text>
        {description && (
          <Text color="gray.500">{description}</Text>
        )}
      </Stack>
    </Box>
  );
};

export default EmptyState;