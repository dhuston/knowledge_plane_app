/**
 * SafeMarkdown.tsx
 * A component for safely rendering markdown content with sanitization to prevent XSS attacks
 * Enhanced with code highlighting, better image handling, and rich content features
 */
import React, { useState, useMemo } from 'react';
import { 
  Box, 
  BoxProps, 
  Text, 
  Link, 
  Image, 
  Code, 
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Heading,
  Spinner,
  Flex,
  Icon,
  Tooltip,
  Button,
  UnorderedList,
  OrderedList,
  ListItem,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useClipboard,
  IconButton,
  Alert,
  AlertIcon,
  Center
} from '@chakra-ui/react';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiMaximize, FiExternalLink, FiInfo, FiCopy, FiCheckCircle, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// URL validation regex - improved to handle more URL formats
const URL_PATTERN = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]*)?$/;

interface SafeMarkdownProps extends BoxProps {
  content: string;
  allowLinks?: boolean;
  allowImages?: boolean;
  allowCodeHighlighting?: boolean;
  allowHtml?: boolean;
  allowTables?: boolean;
  maxImageHeight?: string | number;
  fontSize?: string;
  maxWidth?: string | number;
  truncate?: number;   // Number of characters before truncating
  expandable?: boolean;  // Whether content can be expanded if truncated
  showCopyButton?: boolean;  // Whether to show copy button for code blocks
}

const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ 
  content, 
  allowLinks = true, 
  allowImages = true,
  allowCodeHighlighting = true,
  allowHtml = false,
  allowTables = true,
  maxImageHeight = "300px",
  fontSize = "md",
  maxWidth = "100%",
  truncate,
  expandable = true,
  showCopyButton = true,
  ...boxProps 
}) => {
  // State
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string }>({ src: '', alt: '' });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [showFullContent, setShowFullContent] = useState<boolean>(false);

  // Theme-aware styling
  const codeBg = useColorModeValue('gray.50', 'gray.700');
  const codeColor = useColorModeValue('gray.800', 'gray.100');
  const linkColor = useColorModeValue('blue.600', 'blue.300');
  const syntaxTheme = useColorModeValue(solarizedlight, tomorrow);
  const tableBorderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Process and sanitize content
  const processedContent = useMemo(() => {
    if (!content) return '';
    
    // Sanitize with DOMPurify
    let processed = DOMPurify.sanitize(content);
    
    // Handle truncation if needed
    if (truncate && !showFullContent && processed.length > truncate) {
      // Try to find a good breaking point near the truncation limit
      const breakPoint = processed.substring(0, truncate).lastIndexOf('\n');
      if (breakPoint > truncate * 0.7) {
        // If a good paragraph break exists, use it
        processed = processed.substring(0, breakPoint) + '\n\n...';
      } else {
        // Otherwise just truncate at character limit
        processed = processed.substring(0, truncate) + '...';
      }
    }
    
    return processed;
  }, [content, truncate, showFullContent]);
  
  // Determine if the content is truncated
  const isTruncated = truncate && content && content.length > truncate && !showFullContent;
  
  // Toggle between truncated and full content
  const toggleFullContent = () => {
    setShowFullContent(!showFullContent);
  };
  
  // Handle image modal open
  const handleImageClick = (src: string, alt: string) => {
    setSelectedImage({ src, alt });
    setImageLoaded(false);
    onOpen();
  };
  
  // Enhanced component renderers for different markdown elements
  const components = {
    // Headings with better spacing and hierarchy
    h1: ({ children }: any) => (
      <Heading as="h1" size="lg" mb={3} mt={4} fontWeight="bold" lineHeight="1.3">
        {children}
      </Heading>
    ),
    h2: ({ children }: any) => (
      <Heading as="h2" size="md" mb={2} mt={3} fontWeight="semibold" lineHeight="1.4">
        {children}
      </Heading>
    ),
    h3: ({ children }: any) => (
      <Heading as="h3" size="sm" mb={2} mt={3} fontWeight="medium" lineHeight="1.4">
        {children}
      </Heading>
    ),
    h4: ({ children }: any) => (
      <Heading as="h4" size="xs" mb={2} mt={2} fontWeight="medium" lineHeight="1.5">
        {children}
      </Heading>
    ),
    h5: ({ children }: any) => (
      <Heading as="h5" size="xs" mb={1} mt={2} fontWeight="normal" color="gray.600" _dark={{ color: 'gray.300' }}>
        {children}
      </Heading>
    ),
    
    // Paragraphs with better spacing and font size control
    p: ({ children }: any) => (
      <Text mb={3} fontSize={fontSize} lineHeight="tall">
        {children}
      </Text>
    ),
    
    // Enhanced link renderer with validation and external indication
    a: ({ node, href, children, ...props }: any) => {
      if (!allowLinks || !href) {
        return <Text as="span">{children}</Text>;
      }
      
      // Determine if this is an external link
      const isExternal = href.startsWith('http') || href.startsWith('https');
      
      // Validate URL before rendering link
      if (URL_PATTERN.test(href) || href.startsWith('/') || href.startsWith('#')) {
        return (
          <Link 
            href={href} 
            color={linkColor}
            isExternal={isExternal}
            rel="noopener noreferrer"
            display="inline-flex"
            alignItems="center"
            textDecoration="underline"
            textDecorationColor={`${linkColor}40`}
            _hover={{ 
              textDecoration: 'underline',
              textDecorationColor: linkColor
            }}
            {...props}
          >
            {children}
            {isExternal && <Icon as={FiExternalLink} ml={1} boxSize="0.85em" />}
          </Link>
        );
      }
      
      // If URL is invalid, render as plain text
      return <Text as="span">{children}</Text>;
    },
    
    // Enhanced image renderer with better validation and modal support
    img: ({ node, src, alt, ...props }: any) => {
      if (!allowImages || !src) {
        return null;
      }
      
      // Validate image URL (handles both absolute and relative URLs)
      if (URL_PATTERN.test(src) || src.startsWith('/')) {
        return (
          <Box position="relative" my={3} display="inline-block" maxW="100%">
            <Image 
              src={src} 
              alt={alt || ''} 
              maxH={maxImageHeight}
              maxW="100%" 
              borderRadius="md"
              objectFit="contain"
              cursor="pointer"
              onClick={() => handleImageClick(src, alt || '')}
              fallbackSrc="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
              {...props}
            />
            <Tooltip label="Click to expand">
              <Box 
                position="absolute" 
                top={2} 
                right={2} 
                bg="rgba(0,0,0,0.6)" 
                color="white" 
                p={1} 
                borderRadius="md"
                cursor="pointer"
                onClick={() => handleImageClick(src, alt || '')}
              >
                <Icon as={FiMaximize} />
              </Box>
            </Tooltip>
          </Box>
        );
      }
      
      return null;
    },
    
    // Enhanced code block renderer with improved syntax highlighting and copy button
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeContent = String(children).replace(/\n$/, '');
      
      if (!inline && allowCodeHighlighting) {
        // For code blocks, add copy button and syntax highlighting
        const { hasCopied, onCopy } = useClipboard(codeContent);
        
        return (
          <Box my={3} borderRadius="md" overflow="hidden" position="relative">
            {showCopyButton && (
              <Tooltip label={hasCopied ? "Copied!" : "Copy code"} placement="top">
                <IconButton
                  aria-label="Copy code"
                  icon={hasCopied ? <FiCheckCircle /> : <FiCopy />}
                  size="xs"
                  position="absolute"
                  top={2}
                  right={2}
                  onClick={onCopy}
                  zIndex={1}
                  colorScheme={hasCopied ? "green" : "gray"}
                />
              </Tooltip>
            )}
            
            <SyntaxHighlighter
              style={syntaxTheme}
              language={language || 'text'}
              wrapLongLines={true}
              customStyle={{ 
                margin: 0, 
                borderRadius: '4px',
                fontSize: '0.9em',
                padding: '1rem'
              }}
            >
              {codeContent}
            </SyntaxHighlighter>
          </Box>
        );
      }
      
      // Inline code
      return (
        <Code 
          bg={codeBg} 
          color={codeColor} 
          px={2} 
          py={0.5} 
          borderRadius="md"
          fontSize="0.9em"
          fontFamily="monospace"
          {...props}
        >
          {children}
        </Code>
      );
    },
    
    // Enhanced blockquote renderer
    blockquote: ({ children }: any) => (
      <Alert
        status="info"
        variant="left-accent"
        my={3}
        py={2}
        borderRadius="md"
      >
        <AlertIcon />
        <Box fontSize={fontSize}>{children}</Box>
      </Alert>
    ),
    
    // Lists
    ul: ({ children }: any) => (
      <UnorderedList pl={4} my={3} spacing={1}>
        {children}
      </UnorderedList>
    ),
    ol: ({ children }: any) => (
      <OrderedList pl={4} my={3} spacing={1}>
        {children}
      </OrderedList>
    ),
    li: ({ children }: any) => (
      <ListItem fontSize={fontSize}>{children}</ListItem>
    ),
    
    // Horizontal rule
    hr: () => <Divider my={4} />,
    
    // Tables
    table: ({ children }: any) => allowTables ? (
      <Box overflowX="auto" my={3}>
        <Table variant="simple" size="sm" borderWidth="1px" borderColor={tableBorderColor}>
          {children}
        </Table>
      </Box>
    ) : null,
    thead: ({ children }: any) => <Thead>{children}</Thead>,
    tbody: ({ children }: any) => <Tbody>{children}</Tbody>,
    tr: ({ children }: any) => <Tr>{children}</Tr>,
    th: ({ children }: any) => <Th fontSize={fontSize} py={2}>{children}</Th>,
    td: ({ children }: any) => <Td fontSize={fontSize}>{children}</Td>,
  };

  return (
    <>
      <Box className="safe-markdown-content" maxW={maxWidth} {...boxProps}>
        {/* Main markdown content */}
        <ReactMarkdown 
          components={components} 
          remarkPlugins={[remarkGfm]} 
          rehypePlugins={allowHtml ? [rehypeRaw] : []}
        >
          {processedContent}
        </ReactMarkdown>
        
        {/* Show more/less button if content is truncated */}
        {truncate && expandable && content && content.length > truncate && (
          <Flex justify="center" mt={2}>
            <Button
              size="sm"
              variant="ghost"
              rightIcon={showFullContent ? <FiChevronUp /> : <FiChevronDown />}
              onClick={toggleFullContent}
              aria-label={showFullContent ? "Show less" : "Show more"}
            >
              {showFullContent ? 'Show Less' : 'Show More'}
            </Button>
          </Flex>
        )}
      </Box>
      
      {/* Image modal for expanded view */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent bg="transparent" boxShadow="none" maxW="90vw" maxH="90vh">
          <ModalCloseButton color="white" zIndex={2} />
          <ModalBody p={0} display="flex" justifyContent="center" alignItems="center">
            {!imageLoaded && (
              <Flex 
                position="absolute" 
                top="50%" 
                left="50%" 
                transform="translate(-50%, -50%)"
                direction="column"
                align="center"
                justify="center"
              >
                <Spinner size="xl" color="white" />
              </Flex>
            )}
            <Image
              src={selectedImage.src}
              alt={selectedImage.alt}
              maxW="100%"
              maxH="90vh"
              objectFit="contain"
              onLoad={() => setImageLoaded(true)}
              style={{ opacity: imageLoaded ? 1 : 0 }}
              transition="opacity 0.3s"
              borderRadius="md"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SafeMarkdown;