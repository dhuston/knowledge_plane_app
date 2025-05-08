import React from 'react';
import { Box, BoxProps } from '@chakra-ui/react';
import ReactMarkdown from 'react-markdown';

interface SimpleMarkdownProps extends BoxProps {
  source: string;
  className?: string;
  allowHtml?: boolean;
}

const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ 
  source, 
  className, 
  allowHtml = false, 
  ...restProps 
}) => {
  // If source is empty or not a string, return null
  if (!source || typeof source !== 'string') {
    return null;
  }
  
  return (
    <Box className={`markdown-body ${className || ''}`} {...restProps}>
      <ReactMarkdown
        children={source}
      />
    </Box>
  );
};

export default SimpleMarkdown;