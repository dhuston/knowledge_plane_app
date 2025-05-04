import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Box,
  Divider,
  Heading,
  List,
  ListItem,
  ListIcon,
  useColorModeValue,
  Textarea,
  FormControl,
  FormLabel,
  IconButton,
  Flex,
  Tooltip,
  Tag,
  TagLabel,
  TagLeftIcon
} from '@chakra-ui/react';
import { 
  FiInfo, 
  FiLink, 
  FiCheck, 
  FiUser, 
  FiFolder, 
  FiTarget,
  FiBookmark,
  FiMessageSquare,
  FiCalendar,
  FiClock,
  FiHash,
  FiEdit,
  FiShare2,
  FiSave,
  FiThumbsUp,
  FiThumbsDown,
  FiPaperclip
} from 'react-icons/fi';
import { Insight, InsightAction, RelatedEntity } from '../../types/insight';
import { useInsights } from '../../context/InsightsContext';

interface InsightDetailModalProps {
  insight: Insight | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal component for displaying detailed information about an insight
 */
const InsightDetailModal: React.FC<InsightDetailModalProps> = ({
  insight,
  isOpen,
  onClose
}) => {
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [showFeedbackForm, setShowFeedbackForm] = useState<boolean>(false);
  const { dismissInsight, saveInsight, provideFeedback } = useInsights();
  
  if (!insight) return null;
  
  // Format date for better readability
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };
  
  // Get icon for related entity type
  const getEntityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'user': return FiUser;
      case 'project': return FiFolder;
      case 'goal': return FiTarget;
      case 'document': return FiPaperclip;
      case 'skill': return FiHash;
      default: return FiInfo;
    }
  };
  
  // Get icon for action type
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'schedule': return FiCalendar;
      case 'message': return FiMessageSquare;
      case 'task': return FiCheck;
      case 'view': return FiLink;
      default: return FiInfo;
    }
  };
  
  // Colors for different categories
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'collaboration': return 'blue';
      case 'productivity': return 'green';
      case 'knowledge': return 'purple';
      case 'project': return 'orange';
      case 'communication': return 'teal';
      default: return 'gray';
    }
  };
  
  // Handle submit feedback
  const handleSubmitFeedback = () => {
    if (insight) {
      provideFeedback(insight.id, insight.feedback?.isRelevant || false, feedbackComment);
      setShowFeedbackForm(false);
      setFeedbackComment('');
    }
  };
  
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  
  // Format relevance score
  const relevancePercentage = Math.round((insight.relevanceScore || 0) * 100);
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="lg" 
      scrollBehavior="inside"
      isCentered
    >
      <ModalOverlay 
        bg="blackAlpha.300" 
        backdropFilter="blur(5px)"
      />
      <ModalContent>
        <ModalHeader px={6} pt={6} pb={4}>
          <HStack spacing={2} mb={2}>
            <Badge 
              colorScheme={getCategoryColor(insight.category)}
              fontSize="sm"
              px={2}
              py={0.5}
              borderRadius="full"
            >
              {insight.category.charAt(0).toUpperCase() + insight.category.slice(1)}
            </Badge>
            
            <Badge 
              colorScheme={relevancePercentage > 80 ? "green" : 
                         relevancePercentage > 60 ? "orange" : "red"}
              variant="subtle"
              fontSize="sm"
            >
              {relevancePercentage}% relevant
            </Badge>
            
            {insight.feedback?.isRelevant === true && (
              <Badge colorScheme="green" variant="outline" fontSize="xs">
                Marked Relevant
              </Badge>
            )}
            
            {insight.feedback?.isRelevant === false && (
              <Badge colorScheme="red" variant="outline" fontSize="xs">
                Marked Irrelevant
              </Badge>
            )}
          </HStack>
          
          <Heading size="md" mb={1}>{insight.title}</Heading>
          <Text fontSize="sm" color={mutedColor}>
            Generated {formatDate(insight.createdAt)}
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody px={6}>
          <VStack align="stretch" spacing={6}>
            {/* Description */}
            <Text fontSize="md">{insight.description}</Text>
            
            {/* Feedback form */}
            {showFeedbackForm && (
              <Box 
                p={4} 
                bg={cardBg} 
                borderRadius="md" 
                borderWidth="1px" 
                borderColor={borderColor}
              >
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium">
                    Add Feedback
                  </FormLabel>
                  <Textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Share why this insight was helpful or not..."
                    size="sm"
                    resize="vertical"
                    mb={3}
                  />
                  <HStack justifyContent="flex-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowFeedbackForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      colorScheme="blue" 
                      onClick={handleSubmitFeedback}
                      isDisabled={!feedbackComment.trim()}
                    >
                      Submit
                    </Button>
                  </HStack>
                </FormControl>
              </Box>
            )}
            
            {/* Insight source */}
            <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
              <Heading size="xs" mb={3} textTransform="uppercase">
                Insight Details
              </Heading>
              
              {/* Relevance score */}
              <HStack justifyContent="space-between" mb={2}>
                <Text fontSize="sm">Relevance Score</Text>
                <Badge 
                  colorScheme={insight.relevanceScore > 0.8 ? "green" : 
                            insight.relevanceScore > 0.6 ? "orange" : "red"}
                >
                  {relevancePercentage}%
                </Badge>
              </HStack>
              
              {/* Generated date */}
              <HStack justifyContent="space-between" mb={2}>
                <Text fontSize="sm">Generated On</Text>
                <Text fontSize="sm" fontWeight="medium">
                  {formatDate(insight.createdAt)}
                </Text>
              </HStack>
              
              {/* Source type */}
              <HStack justifyContent="space-between">
                <Text fontSize="sm">Source Type</Text>
                <Text fontSize="sm" fontWeight="medium" textTransform="capitalize">
                  {insight.source.type}
                </Text>
              </HStack>
              
              {/* Source ID */}
              <HStack justifyContent="space-between" mt={2}>
                <Text fontSize="sm">Source ID</Text>
                <Text fontSize="sm" fontFamily="mono" color={mutedColor}>
                  {insight.source.id}
                </Text>
              </HStack>
            </Box>
            
            {/* Related entities section */}
            {insight.relatedEntities && insight.relatedEntities.length > 0 && (
              <Box>
                <Heading size="xs" mb={2} textTransform="uppercase">
                  Related Entities
                </Heading>
                <List spacing={2}>
                  {insight.relatedEntities.map((entity, index) => (
                    <ListItem key={index}>
                      <HStack>
                        <ListIcon 
                          as={getEntityIcon(entity.type)} 
                          color={`${getCategoryColor(entity.type)}.500`} 
                        />
                        <Text fontWeight="medium">{entity.name}</Text>
                        <Text color="gray.500" fontSize="sm">({entity.connection})</Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            <Divider />
            
            {/* Suggested actions */}
            {insight.suggestedActions && insight.suggestedActions.length > 0 && (
              <Box>
                <Heading size="xs" mb={3} textTransform="uppercase">
                  Suggested Actions
                </Heading>
                <HStack spacing={2} flexWrap="wrap">
                  {insight.suggestedActions.map((action, index) => (
                    <Tag 
                      key={index}
                      size="md"
                      variant="subtle"
                      colorScheme="blue"
                      borderRadius="full"
                      mb={2}
                    >
                      <TagLeftIcon boxSize="12px" as={getActionIcon(action.type)} />
                      <TagLabel>{action.label}</TagLabel>
                    </Tag>
                  ))}
                </HStack>
              </Box>
            )}
            
            {/* Comment from user feedback */}
            {insight.feedback?.comment && (
              <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                <Heading size="xs" mb={2} textTransform="uppercase">
                  Your Feedback
                </Heading>
                <Text fontSize="sm" fontStyle="italic">"{insight.feedback.comment}"</Text>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter 
          borderTop="1px solid"
          borderColor={borderColor}
          px={6}
          py={4}
        >
          <HStack spacing={2} justifyContent="space-between" width="100%">
            <HStack spacing={2}>
              <Tooltip label={insight.feedback?.isRelevant === true ? 'Marked as relevant' : 'Mark as relevant'}>
                <IconButton
                  aria-label="Mark as relevant"
                  icon={<FiThumbsUp />}
                  size="sm"
                  colorScheme={insight.feedback?.isRelevant === true ? "green" : "gray"}
                  variant={insight.feedback?.isRelevant === true ? "solid" : "ghost"}
                  onClick={() => provideFeedback(insight.id, true)}
                />
              </Tooltip>
              <Tooltip label={insight.feedback?.isRelevant === false ? 'Marked as not relevant' : 'Mark as not relevant'}>
                <IconButton
                  aria-label="Mark as not relevant"
                  icon={<FiThumbsDown />}
                  size="sm"
                  colorScheme={insight.feedback?.isRelevant === false ? "red" : "gray"}
                  variant={insight.feedback?.isRelevant === false ? "solid" : "ghost"}
                  onClick={() => provideFeedback(insight.id, false)}
                />
              </Tooltip>
              <Tooltip label="Add detailed feedback">
                <IconButton
                  aria-label="Add feedback"
                  icon={<FiEdit />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                />
              </Tooltip>
            </HStack>
            
            <HStack spacing={2}>
              <Button 
                leftIcon={<FiBookmark />}
                colorScheme={insight.saved ? "blue" : "gray"}
                variant={insight.saved ? "solid" : "outline"} 
                size="sm"
                onClick={() => saveInsight(insight.id)}
              >
                {insight.saved ? "Saved" : "Save"}
              </Button>
              <Button 
                leftIcon={<FiShare2 />}
                variant="outline" 
                size="sm"
              >
                Share
              </Button>
              <Button 
                variant="ghost" 
                colorScheme="red"
                size="sm"
                onClick={() => {
                  dismissInsight(insight.id);
                  onClose();
                }}
              >
                Dismiss
              </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InsightDetailModal;