/**
 * MapLoadingOverlay.tsx
 * Loading indicator overlay for the LivingMap
 */
import React, { memo } from 'react';
import { Box, Spinner } from '@chakra-ui/react';

interface MapLoadingOverlayProps {
  isLoading: boolean;
}

const MapLoadingOverlay: React.FC<MapLoadingOverlayProps> = ({ isLoading }) => {
  if (!isLoading) return null;
  
  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(241, 242, 234, 0.7)"
      display="flex"
      justifyContent="center"
      alignItems="center"
      zIndex={10}
      _dark={{
        bg: "rgba(38, 38, 38, 0.7)"
      }}
    >
      <Spinner size="xl" color="#262626" _dark={{ color: "secondary.400" }} />
    </Box>
  );
};

// Use React.memo to prevent unnecessary re-renders when props don't change
export default memo(MapLoadingOverlay);