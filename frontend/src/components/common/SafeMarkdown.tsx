/**
 * SafeMarkdown.tsx
 * A component for safely rendering markdown content with sanitization to prevent XSS attacks
 * Enhanced with code highlighting and better image handling
 */
import React, { useState } from 'react';
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
  Tooltip
} from '@chakra-ui/react';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow, solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiMaximize, FiExternalLink, FiInfo } from 'react-icons/fi';

// URL validation regex - improved to handle more URL formats
const URL_PATTERN = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]*)?$/;

interface SafeMarkdownProps extends BoxProps {
  content: string;
  allowLinks?: boolean;
  allowImages?: boolean;
  allowCodeHighlighting?: boolean;
  maxImageHeight?: string | number;
}

const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ 
  content, 
  allowLinks = true, 
  allowImages = true,
  allowCodeHighlighting = true,
  maxImageHeight = "300px",
  ...boxProps 
}) => {
  // Image modal state
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string }>({ src: '', alt: '' });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Theme-aware styling
  const codeBg = useColorModeValue('gray.50', 'gray.700');
  const codeColor = useColorModeValue('gray.800', 'gray.100');
  const linkColor = useColorModeValue('blue.600', 'blue.300');
  const syntaxTheme = useColorModeValue(solarizedlight, tomorrow);
  
  // Sanitize the content with DOMPurify
  const sanitizedContent = DOMPurify.sanitize(content);
  
  // Handle image modal open
  const handleImageClick = (src: string, alt: string) => {
    setSelectedImage({ src, alt });
    setImageLoaded(false);
    onOpen();
  };
  
  // Custom renderers for different elements
  const components = {
    // Custom heading renderer
    h1: ({ children }: any) => (
      <Heading as="h1" size="lg" mb={3} mt={4}>{children}</Heading>
    ),
    h2: ({ children }: any) => (
      <Heading as="h2" size="md" mb={2} mt={3}>{children}</Heading>
    ),
    h3: ({ children }: any) => (
      <Heading as="h3" size="sm" mb={2} mt={3}>{children}</Heading>
    ),
    h4: ({ children }: any) => (
      <Heading as="h4" size="xs" mb={2} mt={2}>{children}</Heading>
    ),
    
    // Custom link renderer with validation
    a: ({ node, href, children, ...props }: any) => {
      if (!allowLinks || !href) {
        return <Text as="span">{children}</Text>;
      }
      
      // Validate URL before rendering link
      if (URL_PATTERN.test(href)) {
        return (
          <Link 
            href={href} 
            color={linkColor}
            isExternal
            rel="noopener noreferrer"
            display="inline-flex"
            alignItems="center"
            _hover={{ textDecoration: 'underline' }}
            {...props}
          >
            {children}
            <Icon as={FiExternalLink} ml={1} boxSize={3} />
          </Link>
        );
      }
      
      // If URL is invalid, render as plain text
      return <Text as="span">{children}</Text>;
    },
    
    // Custom image renderer with validation and modal support
    img: ({ node, src, alt, ...props }: any) => {
      if (!allowImages || !src) {
        return null;
      }
      
      // Validate image URL
      if (URL_PATTERN.test(src)) {
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
    
    // Custom code block renderer with syntax highlighting
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (!inline && language && allowCodeHighlighting) {
        return (
          <Box my={3} borderRadius="md" overflow="hidden">
            <SyntaxHighlighter
              style={syntaxTheme}
              language={language}
              wrapLongLines={true}
              customStyle={{ 
                margin: 0, 
                borderRadius: '4px',
                fontSize: '0.9em'
              }}
            >
              {String(children).replace(/\n$/, '')}
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
          py={1} 
          borderRadius="md"
          fontSize="0.9em"
          {...props}
        >
          {children}
        </Code>
      );
    },
    
    // Custom blockquote renderer
    blockquote: ({ children }: any) => (
      <Box
        borderLeftWidth="4px"
        borderLeftColor="gray.400"
        pl={4}
        py={1}
        my={3}
        fontStyle="italic"
        color="gray.600"
        _dark={{ color: 'gray.300', borderLeftColor: 'gray.500' }}
      >
        {children}
      </Box>
    ),
  };

  return (
    <>
      <Box className="safe-markdown-content" {...boxProps}>
        <ReactMarkdown components={components}>
          {sanitizedContent}
        </ReactMarkdown>
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
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SafeMarkdown;