/**
 * SafeMarkdown.tsx
 * A component for safely rendering markdown content with sanitization to prevent XSS attacks
 */
import React from 'react';
import { Box, BoxProps, Text, Link, Image } from '@chakra-ui/react';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';

// URL validation regex
const URL_PATTERN = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

interface SafeMarkdownProps extends BoxProps {
  content: string;
  allowLinks?: boolean;
  allowImages?: boolean;
}

const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ 
  content, 
  allowLinks = true, 
  allowImages = true, 
  ...boxProps 
}) => {
  // Sanitize the content with DOMPurify
  const sanitizedContent = DOMPurify.sanitize(content);
  
  // Custom renderers for different elements
  const components = {
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
            color="blue.500"
            isExternal
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </Link>
        );
      }
      
      // If URL is invalid, render as plain text
      return <Text as="span">{children}</Text>;
    },
    
    // Custom image renderer with validation
    img: ({ node, src, alt, ...props }: any) => {
      if (!allowImages || !src) {
        return null;
      }
      
      // Validate image URL
      if (URL_PATTERN.test(src)) {
        return (
          <Image 
            src={src} 
            alt={alt || ''} 
            maxW="100%" 
            borderRadius="md"
            my={2}
            {...props}
          />
        );
      }
      
      return null;
    },
    
    // Other custom renderers can be added here as needed
    // For example, custom heading styles, code blocks, etc.
  };

  return (
    <Box {...boxProps}>
      <ReactMarkdown components={components}>
        {sanitizedContent}
      </ReactMarkdown>
    </Box>
  );
};

export default SafeMarkdown;