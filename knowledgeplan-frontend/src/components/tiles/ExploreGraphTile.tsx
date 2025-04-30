import React from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  Icon,
  VStack,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';
import { FiMap, FiArrowRight } from 'react-icons/fi';

interface ExploreGraphTileProps {
  /**
   * Function to call when the tile is clicked
   */
  onClick: () => void;
}

/**
 * ExploreGraphTile
 *
 * A clickable tile that allows users to explore the graph visualization
 */
const ExploreGraphTile: React.FC<ExploreGraphTileProps> = ({
  onClick,
}) => {
  // Colors adapt based on color mode
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('primary.100', 'primary.800');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const accentColor = useColorModeValue('primary.500', 'primary.300');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const headingColor = useColorModeValue('gray.800', 'white');
  const iconBgColor = useColorModeValue('primary.50', 'primary.900');

  return (
    <Card
      bg={bgColor}
      borderColor={borderColor}
      borderWidth="1px"
      borderRadius="xl"
      overflow="hidden"
      transition="all 0.3s"
      _hover={{
        boxShadow: "lg",
        transform: "translateY(-4px)",
        cursor: "pointer",
        borderColor: accentColor,
      }}
      onClick={onClick}
      h="100%"
      position="relative"
    >
      <CardBody>
        <VStack spacing={6} align="center" justify="center" py={8}>
          <Flex
            w="80px"
            h="80px"
            borderRadius="full"
            bg={iconBgColor}
            align="center"
            justify="center"
            mb={2}
          >
            <Icon as={FiMap} boxSize={10} color={accentColor} />
          </Flex>

          <Box textAlign="center">
            <Heading size="md" mb={3} color={headingColor}>Explore Knowledge Graph</Heading>
            <Text color={textColor} fontSize="sm" lineHeight="tall">
              Visualize connections and relationships between people, projects, and knowledge
            </Text>
          </Box>

          <Flex
            align="center"
            color={accentColor}
            fontWeight="medium"
            fontSize="sm"
          >
            <Text mr={1}>Explore now</Text>
            <Icon as={FiArrowRight} />
          </Flex>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default ExploreGraphTile;
