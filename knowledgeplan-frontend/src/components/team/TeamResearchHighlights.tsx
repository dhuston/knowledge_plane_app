import React from 'react';
import {
  Grid,
  Card,
  HStack,
  Text,
  Icon,
  Box,
  VStack,
  Badge,
  Flex,
  Image,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiFileText, FiLink, FiClock, FiBarChart2, FiExternalLink } from 'react-icons/fi';

// Define types for research highlights
interface ResearchHighlight {
  id: string;
  title: string;
  type: 'publication' | 'document' | 'clinical' | 'data';
  content?: string;
  date?: string;
  author?: string;
  imageUrl?: string;
  tags?: string[];
}

interface TeamResearchHighlightsProps {
  highlights?: ResearchHighlight[];
}

const TeamResearchHighlights: React.FC<TeamResearchHighlightsProps> = ({ highlights = [] }) => {
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const cardHoverBg = useColorModeValue('gray.100', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const accentColor = useColorModeValue('primary.600', 'primary.300');

  // If no highlights provided, use enhanced placeholders
  const displayHighlights = highlights.length > 0 ? highlights : [
    {
      id: '1',
      title: 'Recent Publication on Biomarkers',
      type: 'publication',
      content: 'Novel biomarkers for early detection of pancreatic cancer in high-risk populations.',
      date: '2023-08-15',
      author: 'Dr. Jane Smith',
      tags: ['Research', 'Publication', 'Biomarkers']
    },
    {
      id: '2',
      title: 'Clinical Trial Protocol',
      type: 'document',
      content: 'Phase II clinical trial protocol for testing new therapeutic approach.',
      date: '2023-07-22',
      author: 'Clinical Team',
      tags: ['Protocol', 'Clinical', 'Phase II']
    },
    {
      id: '3',
      title: 'Patient Response Data',
      type: 'clinical',
      content: 'Analysis of patient response rates to combination therapy approach.',
      date: '2023-09-01',
      author: 'Data Science Team',
      tags: ['Data', 'Analysis', 'Response']
    },
  ];

  // Helper function to get icon based on type
  const getIconForType = (type: string) => {
    switch (type) {
      case 'publication':
        return FiFileText;
      case 'document':
        return FiLink;
      case 'clinical':
        return FiClock;
      case 'data':
        return FiBarChart2;
      default:
        return FiFileText;
    }
  };

  // Helper function to get color based on type
  const getColorForType = (type: string): string => {
    switch (type) {
      case 'publication':
        return 'blue';
      case 'document':
        return 'purple';
      case 'clinical':
        return 'green';
      case 'data':
        return 'orange';
      default:
        return 'blue';
    }
  };

  return (
    <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
      {displayHighlights.map((highlight) => (
        <Card
          key={highlight.id}
          bg={cardBg}
          borderRadius="lg"
          overflow="hidden"
          _hover={{
            transform: 'translateY(-4px)',
            boxShadow: 'md'
          }}
          transition="all 0.3s"
          cursor="pointer"
          borderWidth="1px"
          borderColor="gray.200"
          h="100%"
        >
          {/* Card Header with Icon */}
          <Box
            bg={`${getColorForType(highlight.type)}.500`}
            color="white"
            p={3}
          >
            <Flex justify="space-between" align="center">
              <HStack>
                <Icon as={getIconForType(highlight.type)} boxSize={5} />
                <Text fontWeight="bold">{highlight.title}</Text>
              </HStack>
              <Icon as={FiExternalLink} boxSize={4} />
            </Flex>
          </Box>

          {/* Card Content */}
          <Box p={4}>
            {highlight.imageUrl ? (
              <Image
                src={highlight.imageUrl}
                alt={highlight.title}
                borderRadius="md"
                mb={3}
                h="120px"
                w="100%"
                objectFit="cover"
              />
            ) : (
              <Box
                h="120px"
                bg={`${getColorForType(highlight.type)}.50`}
                borderRadius="md"
                mb={3}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon
                  as={getIconForType(highlight.type)}
                  boxSize={10}
                  color={`${getColorForType(highlight.type)}.200`}
                />
              </Box>
            )}

            <VStack align="start" spacing={3}>
              {highlight.content && (
                <Text fontSize="sm" color={textColor}>
                  {highlight.content}
                </Text>
              )}

              {/* Metadata */}
              <HStack fontSize="xs" color={textColor} spacing={4} mt={2}>
                {highlight.date && (
                  <HStack>
                    <Icon as={FiClock} />
                    <Text>{highlight.date}</Text>
                  </HStack>
                )}
                {highlight.author && (
                  <Text fontStyle="italic">By: {highlight.author}</Text>
                )}
              </HStack>

              {/* Tags */}
              {highlight.tags && highlight.tags.length > 0 && (
                <Flex wrap="wrap" gap={2} mt={1}>
                  {highlight.tags.map((tag, idx) => (
                    <Badge
                      key={idx}
                      colorScheme={getColorForType(highlight.type)}
                      fontSize="xs"
                      borderRadius="full"
                      px={2}
                      py={0.5}
                    >
                      {tag}
                    </Badge>
                  ))}
                </Flex>
              )}
            </VStack>
          </Box>
        </Card>
      ))}
    </Grid>
  );
};

export default TeamResearchHighlights;
