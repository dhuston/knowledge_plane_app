/**
 * SafeMarkdown.tsx
 * A component for safely rendering markdown content using DOMPurify to prevent XSS attacks
 */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import { Box, BoxProps } from '@chakra-ui/react';

// URL validation regex
const URL_PATTERN = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

interface SafeMarkdownProps extends BoxProps {
  content: string;
  allowLinks?: boolean;
}

const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content, allowLinks = true, ...boxProps }) => {
  // Sanitize the content with DOMPurify
  const sanitizedContent = DOMPurify.sanitize(content);
  
  // Custom renderer for links to validate URLs
  const renderers = allowLinks ? {
    // For react-markdown v6+
    a: ({ node, href, children, ...props }: any) => {
      // Validate URL before rendering link
      if (href && URL_PATTERN.test(href)) {
        // Ensure links open in new tab and have security attributes
        return (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            {...props}
          >
            {children}
          </a>
        );
      } else {
        // If URL is invalid, render as plain text
        return <span>{children}</span>;
      }
    }
  } : {};

  return (
    <Box {...boxProps}>
      <ReactMarkdown components={renderers}>
        {sanitizedContent}
      </ReactMarkdown>
    </Box>
  );
};

export default SafeMarkdown;