import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Divider,
  useColorModeValue,
  Icon,
  Button,
  Flex,
  Link,
  Image,
  Tag,
  TagLabel,
  Tooltip,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  AspectRatio,
  SimpleGrid,
  Progress,
  LinkBox,
  LinkOverlay
} from '@chakra-ui/react';
import { 
  FiFileText, 
  FiExternalLink, 
  FiDownload, 
  FiBookmark, 
  FiEye, 
  FiTag, 
  FiClock, 
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiThumbsUp,
  FiMessageSquare,
  FiShare2,
  FiBook
} from 'react-icons/fi';
import { MapNode } from '../../../types/map';
import SafeMarkdown from '../../common/SafeMarkdown';

// Asset types with corresponding icons and colors
const ASSET_TYPES = {
  DOCUMENT: { icon: FiFileText, color: 'blue' },
  RESEARCH_PAPER: { icon: FiBook, color: 'purple' },
  PRESENTATION: { icon: FiFileText, color: 'orange' },
  VIDEO: { icon: FiFileText, color: 'red' },
  WEBSITE: { icon: FiExternalLink, color: 'green' },
  OTHER: { icon: FiFileText, color: 'gray' }
};

interface KnowledgeAssetPanelProps {
  data: any; // KnowledgeAssetEntity - we'll use any for now until we define the proper type
  selectedNode: MapNode;
}

const KnowledgeAssetPanel: React.FC<KnowledgeAssetPanelProps> = ({ data, selectedNode }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Theme colors
  const headerBg = useColorModeValue('gray.50', 'gray.700');
  const sectionBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const gradientBg = useColorModeValue(
    'linear(to-t, white, transparent)',
    'linear(to-t, gray.800, transparent)'
  );
  const linkColor = useColorModeValue('blue.600', 'blue.300');
  
  // Determine asset type for icon and colors
  const assetType = data.asset_type || 'OTHER';
  const { icon: AssetIcon, color: assetColor } = ASSET_TYPES[assetType as keyof typeof ASSET_TYPES] || ASSET_TYPES.OTHER;
  
  // Format the description for display
  const description = data.description || '';
  const isLongDescription = description.length > 300;
  const displayDescription = isLongDescription && !showFullDescription
    ? `${description.substring(0, 300)}...`
    : description;
  
  // Check if document has a preview image
  const hasPreview = data.preview_url || data.thumbnail_url;
  
  // Extract asset metadata
  const metadata = {
    author: data.author || data.creator || 'Unknown',
    created: data.created_date ? new Date(data.created_date).toLocaleDateString() : 'Unknown date',
    format: data.format || data.asset_type || 'Document',
    size: data.file_size || null,
    views: data.view_count || 0,
    rating: data.rating || 0
  };

  // Format file size for display
  const formatFileSize = (sizeInBytes?: number) => {
    if (!sizeInBytes) return null;
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = sizeInBytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Asset Header */}
      <Box p={4} borderRadius="md" bg={headerBg} borderWidth="1px" borderColor={borderColor}>
        <HStack spacing={4} align="flex-start">
          <Flex 
            bgColor={`${assetColor}.100`} 
            color={`${assetColor}.500`}
            borderRadius="md"
            p={3}
            alignItems="center"
            justifyContent="center"
            _dark={{
              bgColor: `${assetColor}.900`,
              color: `${assetColor}.200`
            }}
          >
            <Icon as={AssetIcon} boxSize={6} />
          </Flex>
          
          <VStack align="flex-start" spacing={1} flex={1}>
            <HStack>
              <Badge colorScheme={assetColor} fontSize="xs">{data.asset_type}</Badge>
              {data.is_featured && <Badge colorScheme="yellow">Featured</Badge>}
            </HStack>
            <Heading size="md">{data.title || data.name || 'Knowledge Asset'}</Heading>
            <Text color="gray.500" fontSize="sm">By {metadata.author} • {metadata.created}</Text>
          </VStack>
        </HStack>
        
        {/* Action buttons */}
        <HStack mt={4} spacing={3}>
          {data.url && (
            <Button 
              size="sm" 
              leftIcon={<FiExternalLink />}
              as="a"
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              variant="solid"
              colorScheme={assetColor}
            >
              Open
            </Button>
          )}
          
          {data.download_url && (
            <Button 
              size="sm" 
              leftIcon={<FiDownload />}
              as="a"
              href={data.download_url}
              download
              variant="outline"
              colorScheme={assetColor}
            >
              Download {metadata.size && `(${formatFileSize(metadata.size)})`}
            </Button>
          )}
          
          <Button 
            size="sm"
            leftIcon={<FiBookmark />}
            variant="ghost"
          >
            Save
          </Button>
        </HStack>
      </Box>
      
      {/* Preview (if available) */}
      {hasPreview && (
        <Box 
          borderRadius="md" 
          borderWidth="1px" 
          borderColor={borderColor} 
          overflow="hidden"
          position="relative"
        >
          <AspectRatio ratio={16/9} maxH="220px">
            <Image 
              src={data.preview_url || data.thumbnail_url}
              alt={`Preview of ${data.title || data.name}`}
              objectFit="cover"
              fallback={<Box bg="gray.100" _dark={{ bg: "gray.700" }} />}
            />
          </AspectRatio>
          
          {data.preview_url && (
            <Box 
              position="absolute" 
              top="50%" 
              left="50%" 
              transform="translate(-50%, -50%)"
            >
              <IconButton
                aria-label="Preview document"
                icon={<FiEye />}
                size="lg"
                isRound
                colorScheme="blue"
                onClick={onOpen}
                bg="whiteAlpha.800"
                _dark={{ bg: "blackAlpha.700" }}
                _hover={{ transform: "scale(1.1)" }}
                transition="all 0.2s"
              />
            </Box>
          )}
        </Box>
      )}
      
      {/* Description */}
      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg} position="relative">
        <VStack align="stretch" spacing={3}>
          <Heading size="sm">Description</Heading>
          <Divider />
          
          <Box position="relative">
            <SafeMarkdown content={displayDescription} />
            
            {/* Gradient overlay for long descriptions */}
            {isLongDescription && !showFullDescription && (
              <Box 
                position="absolute" 
                bottom="0" 
                left="0" 
                right="0" 
                height="60px"
                bgGradient={gradientBg}
              />
            )}
          </Box>
          
          {/* Show more/less button for long descriptions */}
          {isLongDescription && (
            <Button 
              size="sm" 
              rightIcon={showFullDescription ? <FiChevronUp /> : <FiChevronDown />}
              variant="ghost"
              onClick={() => setShowFullDescription(!showFullDescription)}
              alignSelf="center"
            >
              {showFullDescription ? 'Show Less' : 'Read More'}
            </Button>
          )}
        </VStack>
      </Box>
      
      {/* Asset Details */}
      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
        <VStack align="stretch" spacing={3}>
          <Heading size="sm">Asset Information</Heading>
          <Divider />
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <AssetDetail 
              icon={FiCalendar} 
              iconColor={`${assetColor}.500`}
              label="Created"
              value={metadata.created}
            />
            
            {data.updated_date && (
              <AssetDetail 
                icon={FiClock} 
                iconColor="gray.500"
                label="Last Updated"
                value={new Date(data.updated_date).toLocaleDateString()}
              />
            )}
            
            <AssetDetail 
              icon={FiFileText} 
              iconColor={`${assetColor}.500`}
              label="Format"
              value={metadata.format}
            />
            
            {data.file_size && (
              <AssetDetail 
                icon={FiFileText} 
                iconColor="gray.500"
                label="Size"
                value={formatFileSize(data.file_size) || 'Unknown'}
              />
            )}
            
            {data.source && (
              <AssetDetail 
                icon={FiExternalLink} 
                iconColor="blue.500"
                label="Source"
                value={data.source}
                isLink={data.source_url !== undefined}
                link={data.source_url}
              />
            )}
            
            {metadata.views > 0 && (
              <AssetDetail 
                icon={FiEye} 
                iconColor="gray.500"
                label="Views"
                value={metadata.views.toString()}
              />
            )}
          </SimpleGrid>
        </VStack>
      </Box>
      
      {/* Tags Section */}
      {data.tags && data.tags.length > 0 && (
        <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
          <VStack align="stretch" spacing={3}>
            <HStack>
              <Icon as={FiTag} color="gray.500" />
              <Heading size="sm">Tags</Heading>
            </HStack>
            <Divider />
            
            <Flex flexWrap="wrap" gap={2}>
              {data.tags.map((tag: string, idx: number) => (
                <Tag 
                  key={idx}
                  size="md"
                  borderRadius="full"
                  variant="subtle"
                  colorScheme="blue"
                >
                  <TagLabel>{tag}</TagLabel>
                </Tag>
              ))}
            </Flex>
          </VStack>
        </Box>
      )}
      
      {/* Related Items (if available) */}
      {data.related_items && data.related_items.length > 0 && (
        <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
          <VStack align="stretch" spacing={3}>
            <Heading size="sm">Related Resources</Heading>
            <Divider />
            
            <VStack align="stretch" spacing={2}>
              {data.related_items.slice(0, 3).map((item: any, idx: number) => (
                <LinkBox 
                  key={idx} 
                  p={3} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  borderColor={borderColor}
                  _hover={{ bg: headerBg }}
                  transition="all 0.2s"
                >
                  <HStack>
                    <Icon 
                      as={ASSET_TYPES[item.type as keyof typeof ASSET_TYPES]?.icon || FiFileText} 
                      color={`${ASSET_TYPES[item.type as keyof typeof ASSET_TYPES]?.color || 'gray'}.500`}
                    />
                    <VStack align="flex-start" spacing={0} flex={1}>
                      <LinkOverlay href={item.url} isExternal>
                        <Text fontWeight="medium">{item.title}</Text>
                      </LinkOverlay>
                      <Text fontSize="xs" color="gray.500">{item.type}</Text>
                    </VStack>
                    <Icon as={FiExternalLink} color="gray.500" />
                  </HStack>
                </LinkBox>
              ))}
              
              {data.related_items.length > 3 && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  rightIcon={<FiChevronDown />}
                  alignSelf="center"
                >
                  Show {data.related_items.length - 3} More
                </Button>
              )}
            </VStack>
          </VStack>
        </Box>
      )}
      
      {/* Engagement Metrics */}
      {(data.view_count || data.download_count || data.rating) && (
        <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={sectionBg}>
          <VStack align="stretch" spacing={3}>
            <Heading size="sm">Engagement</Heading>
            <Divider />
            
            <HStack justify="space-around" spacing={6}>
              {data.view_count !== undefined && (
                <VStack>
                  <HStack>
                    <Icon as={FiEye} color="blue.500" />
                    <Text fontWeight="bold">{data.view_count}</Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.500">Views</Text>
                </VStack>
              )}
              
              {data.download_count !== undefined && (
                <VStack>
                  <HStack>
                    <Icon as={FiDownload} color="green.500" />
                    <Text fontWeight="bold">{data.download_count}</Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.500">Downloads</Text>
                </VStack>
              )}
              
              {data.comment_count !== undefined && (
                <VStack>
                  <HStack>
                    <Icon as={FiMessageSquare} color="orange.500" />
                    <Text fontWeight="bold">{data.comment_count}</Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.500">Comments</Text>
                </VStack>
              )}
              
              {data.share_count !== undefined && (
                <VStack>
                  <HStack>
                    <Icon as={FiShare2} color="purple.500" />
                    <Text fontWeight="bold">{data.share_count}</Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.500">Shares</Text>
                </VStack>
              )}
            </HStack>
            
            {/* Rating */}
            {data.rating !== undefined && (
              <Box mt={2}>
                <HStack mb={1}>
                  <Text fontSize="sm" fontWeight="medium">Rating</Text>
                  <Badge colorScheme={data.rating >= 4 ? "green" : data.rating >= 3 ? "yellow" : "red"}>
                    {data.rating.toFixed(1)}/5
                  </Badge>
                </HStack>
                <Progress 
                  value={data.rating * 20} 
                  colorScheme={data.rating >= 4 ? "green" : data.rating >= 3 ? "yellow" : "red"}
                  size="sm"
                  borderRadius="full"
                />
              </Box>
            )}
          </VStack>
        </Box>
      )}
      
      {/* Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{data.title || data.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {data.preview_url && (
              <AspectRatio ratio={4/3} maxH="600px">
                <Box 
                  as="iframe"
                  src={data.preview_url}
                  title={data.title || data.name}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={borderColor}
                  allowFullScreen
                />
              </AspectRatio>
            )}
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onClose}>
              Close
            </Button>
            {data.download_url && (
              <Button 
                as="a"
                href={data.download_url}
                download
                colorScheme="blue"
                leftIcon={<FiDownload />}
              >
                Download
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

// Helper component for asset details
const AssetDetail: React.FC<{
  icon: React.FC;
  iconColor: string;
  label: string;
  value: string;
  isLink?: boolean;
  link?: string;
}> = ({ icon: Icon, iconColor, label, value, isLink = false, link }) => {
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const linkColor = useColorModeValue('blue.600', 'blue.300');
  
  return (
    <HStack spacing={3} alignItems="center">
      <Box>
        <Icon color={iconColor} />
      </Box>
      <VStack align="flex-start" spacing={0}>
        <Text fontSize="xs" color="gray.500">{label}</Text>
        {isLink && link ? (
          <Link color={linkColor} href={link} isExternal>
            <Text fontSize="sm" fontWeight="medium" color={linkColor}>{value}</Text>
          </Link>
        ) : (
          <Text fontSize="sm" fontWeight="medium" color={textColor}>{value}</Text>
        )}
      </VStack>
    </HStack>
  );
};

export default KnowledgeAssetPanel;