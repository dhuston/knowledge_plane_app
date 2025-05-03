/**
 * SimpleMarkdown.tsx
 * A component for rendering markdown-like content without external dependencies
 * Enhanced with support for more markdown features and better content rendering
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
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Heading,
  Flex,
  Icon,
  Tooltip,
  VStack,
  UnorderedList,
  OrderedList,
  ListItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Button,
  Divider,
  chakra,
} from '@chakra-ui/react';
import { 
  FiMaximize, 
  FiExternalLink, 
  FiDownload, 
  FiShare2,
  FiCopy,
  FiImage
} from 'react-icons/fi';

// URL validation regex
const URL_PATTERN = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

interface SimpleMarkdownProps extends BoxProps {
  content: string;
  allowLinks?: boolean;
  allowImages?: boolean;
  allowTables?: boolean;
  maxImageHeight?: string | number;
  fontSize?: string;
  color?: string;
  codeHighlighting?: boolean;
}

/**
 * An enhanced markdown parser that doesn't require external dependencies
 * Supports markdown features: headings, links, images, lists, tables, code blocks with syntax highlighting,
 * block quotes, horizontal rules, and more inline formatting
 */
const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ 
  content, 
  allowLinks = true,
  allowImages = true,
  allowTables = true,
  maxImageHeight = "300px",
  fontSize = "sm",
  color,
  codeHighlighting = true,
  ...boxProps 
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [imageCaption, setImageCaption] = useState<string>('');
  const [codeLanguage, setCodeLanguage] = useState<string>('');
  
  // Theme colors
  const linkColor = useColorModeValue('blue.600', 'blue.300');
  const codeBg = useColorModeValue('gray.50', 'gray.700');
  const codeColor = useColorModeValue('purple.700', 'purple.200');
  const blockquoteBg = useColorModeValue('gray.50', 'gray.700');
  const blockquoteBorder = useColorModeValue('blue.200', 'blue.700');
  const tableHeaderBg = useColorModeValue('gray.100', 'gray.700');
  const tableBorderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = color || useColorModeValue('gray.800', 'gray.200');
  
  // Handle image click for modal
  const handleImageClick = (src: string, caption: string = '') => {
    if (allowImages) {
      setSelectedImage(src);
      setImageCaption(caption);
      onOpen();
    }
  };
  
  // Handle copy to clipboard functionality
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied to clipboard",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      },
      (err) => {
        toast({
          title: "Failed to copy",
          description: err.toString(),
          status: "error",
          duration: 2000,
        });
      }
    );
  };

  // Creates a toast notification
  const toast = useToast();

  // Process code blocks with syntax highlighting
  const renderCodeBlock = (code: string, language: string = '') => {
    // Apply basic syntax highlighting based on language
    let formattedCode = code;
    
    if (codeHighlighting) {
      // Very simple syntax highlighting for a few languages
      switch (language.toLowerCase()) {
        case 'javascript':
        case 'js':
        case 'typescript':
        case 'ts':
          // Highlight keywords, strings, numbers, comments
          formattedCode = formattedCode
            .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await)\b/g, 
              '<span style="color: #569CD6;">$1</span>')
            .replace(/"([^"]*)"/g, '<span style="color: #CE9178;">\"$1\"</span>')
            .replace(/'([^']*)'/g, '<span style="color: #CE9178;">\'$1\'</span>')
            .replace(/\b(\d+)\b/g, '<span style="color: #B5CEA8;">$1</span>')
            .replace(/\/\/(.*)/g, '<span style="color: #6A9955;">\/\/$1</span>');
          break;
        case 'python':
        case 'py':
          formattedCode = formattedCode
            .replace(/\b(def|class|import|from|return|if|elif|else|for|while|try|except|with|as|raise|None|True|False)\b/g, 
              '<span style="color: #569CD6;">$1</span>')
            .replace(/"([^"]*)"/g, '<span style="color: #CE9178;">\"$1\"</span>')
            .replace(/'([^']*)'/g, '<span style="color: #CE9178;">\'$1\'</span>')
            .replace(/\b(\d+)\b/g, '<span style="color: #B5CEA8;">$1</span>')
            .replace(/#(.*)/g, '<span style="color: #6A9955;">#$1</span>');
          break;
        case 'html':
          formattedCode = formattedCode
            .replace(/(&lt;[^&]*&gt;)/g, '<span style="color: #569CD6;">$1</span>')
            .replace(/"([^"]*)"/g, '<span style="color: #CE9178;">\"$1\"</span>');
          break;
        case 'json':
          formattedCode = formattedCode
            .replace(/"([^"]*)"\s*:/g, '<span style="color: #9CDCFE;">\"$1\"</span>:')
            .replace(/: "([^"]*)"/g, ': <span style="color: #CE9178;">\"$1\"</span>')
            .replace(/: (\d+)/g, ': <span style="color: #B5CEA8;">$1</span>');
          break;
      }
    }
    
    return (
      <Box position="relative" my={3}>
        <Box 
          as="pre"
          p={3}
          borderRadius="md"
          bg={codeBg}
          overflow="auto"
          whiteSpace="pre"
          fontFamily="monospace"
          fontSize="sm"
          position="relative"
        >
          {language && (
            <Box 
              position="absolute" 
              top={0} 
              right={0}
              px={2}
              py={0.5}
              fontSize="xs"
              color="gray.500"
              bg={codeBg}
              borderLeft="1px"
              borderBottom="1px"
              borderColor={borderColor}
              borderBottomLeftRadius="md"
            >
              {language}
            </Box>
          )}
          <Box
            position="absolute"
            top={2}
            right={language ? 16 : 2}
            opacity={0.7}
            _hover={{ opacity: 1 }}
            cursor="pointer"
            onClick={() => copyToClipboard(code)}
          >
            <Tooltip label="Copy to clipboard" placement="top" hasArrow>
              <Icon as={FiCopy} boxSize={4} />
            </Tooltip>
          </Box>
          {codeHighlighting ? (
            <Box 
              as="code"
              dangerouslySetInnerHTML={{ __html: formattedCode }}
            />
          ) : (
            <Box as="code">{code}</Box>
          )}
        </Box>
      </Box>
    );
  };

  // Render table from markdown
  const renderTable = (rows: string[][]) => {
    if (!rows || rows.length === 0 || !allowTables) return null;
    
    const hasHeader = rows.length > 0 && rows[0].some(cell => cell.trim().startsWith('**') && cell.trim().endsWith('**'));
    
    return (
      <Box overflowX="auto" my={4}>
        <Table variant="simple" size="sm" borderWidth="1px" borderColor={tableBorderColor}>
          {hasHeader && (
            <Thead bg={tableHeaderBg}>
              <Tr>
                {rows[0].map((cell, i) => (
                  <Th key={i}>
                    {processInlineElements(cell.replace(/^\*\*|\*\*$/g, ''))}
                  </Th>
                ))}
              </Tr>
            </Thead>
          )}
          <Tbody>
            {rows.slice(hasHeader ? 1 : 0).map((row, i) => (
              <Tr key={i} _hover={{ bg: hoverBg }}>
                {row.map((cell, j) => (
                  <Td key={j}>
                    {processInlineElements(cell)}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    );
  };
  
  // Process content with enhanced markdown parsing
  const renderContent = () => {
    if (!content) return null;
    
    // Process lines
    const lines = content.split('\n');
    const result: JSX.Element[] = [];
    let inList = false;
    let listItems: JSX.Element[] = [];
    let listType: 'ordered' | 'unordered' = 'unordered';
    
    // Table parsing variables
    let inTable = false;
    let tableRows: string[][] = [];
    let currentRow: string[] = [];
    
    // Code block parsing variables
    let inCodeBlock = false;
    let codeBlockContent = '';
    let currentCodeLanguage = '';
    
    // Process each line
    lines.forEach((line, index) => {
      // Handle code block with ```
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          result.push(renderCodeBlock(codeBlockContent, currentCodeLanguage));
          inCodeBlock = false;
          codeBlockContent = '';
          currentCodeLanguage = '';
          return;
        } else {
          // Start of code block
          inCodeBlock = true;
          // Extract language if specified
          currentCodeLanguage = line.substring(3).trim();
          return;
        }
      }
      
      // Inside code block - accumulate content
      if (inCodeBlock) {
        codeBlockContent += line + '\n';
        return;
      }
      
      // Handle table rows
      if (line.includes('|') && (line.trim().startsWith('|') || line.trim().endsWith('|'))) {
        // Skip separator rows like |---|---|---| that are only dashes within cells
        if (!line.replace(/\|/g, '').trim().replace(/-/g, '').replace(/:/g, '').trim()) {
          return;
        }
        
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        
        // Split line into cells
        const rawCells = line.split('|');
        // Filter out empty cells from start/end
        const cells = rawCells.slice(
          rawCells[0].trim() === '' ? 1 : 0, 
          rawCells[rawCells.length - 1].trim() === '' ? -1 : undefined
        ).map(cell => cell.trim());
        
        tableRows.push(cells);
        return;
      } else if (inTable) {
        // End of table
        result.push(renderTable(tableRows));
        inTable = false;
        tableRows = [];
      }
      
      // Horizontal rule
      if (line.match(/^-{3,}$/) || line.match(/^\*{3,}$/) || line.match(/^_{3,}$/)) {
        result.push(<Divider key={`hr-${index}`} my={4} borderColor={blockquoteBorder} />);
        return;
      }
      
      // Heading processing
      if (line.startsWith('# ')) {
        result.push(
          <Heading key={`h1-${index}`} as="h1" size="lg" mt={4} mb={2}>
            {processInlineElements(line.substring(2))}
          </Heading>
        );
        return;
      }
      
      if (line.startsWith('## ')) {
        result.push(
          <Heading key={`h2-${index}`} as="h2" size="md" mt={3} mb={2}>
            {processInlineElements(line.substring(3))}
          </Heading>
        );
        return;
      }
      
      if (line.startsWith('### ')) {
        result.push(
          <Heading key={`h3-${index}`} as="h3" size="sm" mt={3} mb={2}>
            {processInlineElements(line.substring(4))}
          </Heading>
        );
        return;
      }
      
      if (line.startsWith('#### ')) {
        result.push(
          <Heading key={`h4-${index}`} as="h4" size="xs" mt={2} mb={1} fontWeight="semibold">
            {processInlineElements(line.substring(5))}
          </Heading>
        );
        return;
      }
      
      // List processing
      if (line.match(/^\s*[\*\-]\s+/)) {
        // Unordered list item
        if (!inList || listType !== 'unordered') {
          // If we were in a different type of list, close it
          if (inList) {
            if (listType === 'ordered') {
              result.push(<OrderedList key={`ol-${index}`} mb={3}>{listItems}</OrderedList>);
            }
            listItems = [];
          }
          inList = true;
          listType = 'unordered';
        }
        
        const itemContent = line.replace(/^\s*[\*\-]\s+/, '');
        listItems.push(
          <ListItem key={`li-${index}`} pb={1}>
            {processInlineElements(itemContent)}
          </ListItem>
        );
        return;
      }
      
      if (line.match(/^\s*\d+\.\s+/)) {
        // Ordered list item
        if (!inList || listType !== 'ordered') {
          // If we were in a different type of list, close it
          if (inList) {
            if (listType === 'unordered') {
              result.push(<UnorderedList key={`ul-${index}`} mb={3}>{listItems}</UnorderedList>);
            }
            listItems = [];
          }
          inList = true;
          listType = 'ordered';
        }
        
        const itemContent = line.replace(/^\s*\d+\.\s+/, '');
        listItems.push(
          <ListItem key={`li-${index}`} pb={1}>
            {processInlineElements(itemContent)}
          </ListItem>
        );
        return;
      }
      
      // If we reach a non-list line but were building a list, close it
      if (inList && line.trim() !== '') {
        if (listType === 'unordered') {
          result.push(<UnorderedList key={`ul-${index}`} mb={3} spacing={1}>{listItems}</UnorderedList>);
        } else {
          result.push(<OrderedList key={`ol-${index}`} mb={3} spacing={1}>{listItems}</OrderedList>);
        }
        listItems = [];
        inList = false;
      }
      
      // Blockquote
      if (line.startsWith('> ')) {
        result.push(
          <Box
            key={`quote-${index}`}
            borderLeftWidth="4px"
            borderLeftColor={blockquoteBorder}
            bg={blockquoteBg}
            pl={4}
            py={1}
            my={2}
            fontSize={fontSize}
            color={textColor}
            fontStyle="italic"
          >
            {processInlineElements(line.substring(2))}
          </Box>
        );
        return;
      }
      
      // Indented code block
      if (line.startsWith('    ') || line.startsWith('\t')) {
        result.push(
          <Code
            key={`code-${index}`}
            display="block"
            whiteSpace="pre"
            p={2}
            my={2}
            bg={codeBg}
            color={codeColor}
            borderRadius="md"
            fontSize="sm"
          >
            {line.substring(line.startsWith('    ') ? 4 : 1)}
          </Code>
        );
        return;
      }
      
      // Regular paragraph (skip empty lines)
      if (line.trim() !== '') {
        result.push(
          <Text key={`p-${index}`} mb={2} fontSize={fontSize} color={textColor}>
            {processInlineElements(line)}
          </Text>
        );
      } else if (index > 0 && lines[index - 1].trim() !== '') {
        // Add spacing between paragraphs
        result.push(<Box key={`space-${index}`} mb={2} />);
      }
    });
    
    // Close any open list at the end
    if (inList) {
      if (listType === 'unordered') {
        result.push(<UnorderedList key="ul-final" mb={3}>{listItems}</UnorderedList>);
      } else {
        result.push(<OrderedList key="ol-final" mb={3}>{listItems}</OrderedList>);
      }
    }
    
    return result;
  };
  
  // Helper function to process inline markdown elements
  const processInlineElements = (text: string) => {
    if (!text) return null;
    
    // Split by potential markdown elements
    const parts = [];
    let currentText = '';
    let index = 0;
    
    while (index < text.length) {
      // Bold text with **
      if (text.slice(index, index + 2) === '**' && text.indexOf('**', index + 2) !== -1) {
        const endBold = text.indexOf('**', index + 2);
        if (currentText) {
          parts.push(<span key={parts.length}>{currentText}</span>);
          currentText = '';
        }
        parts.push(
          <Text key={parts.length} as="span" fontWeight="bold">
            {text.slice(index + 2, endBold)}
          </Text>
        );
        index = endBold + 2;
        continue;
      }
      
      // Italic text with *
      if (text[index] === '*' && text.indexOf('*', index + 1) !== -1 &&
          // Make sure this isn't part of a ** for bold
          !(index + 1 < text.length && text[index + 1] === '*')) {
        const endItalic = text.indexOf('*', index + 1);
        if (currentText) {
          parts.push(<span key={parts.length}>{currentText}</span>);
          currentText = '';
        }
        parts.push(
          <Text key={parts.length} as="span" fontStyle="italic">
            {text.slice(index + 1, endItalic)}
          </Text>
        );
        index = endItalic + 1;
        continue;
      }
      
      // Strikethrough with ~~
      if (text.slice(index, index + 2) === '~~' && text.indexOf('~~', index + 2) !== -1) {
        const endStrike = text.indexOf('~~', index + 2);
        if (currentText) {
          parts.push(<span key={parts.length}>{currentText}</span>);
          currentText = '';
        }
        parts.push(
          <Text key={parts.length} as="span" textDecoration="line-through">
            {text.slice(index + 2, endStrike)}
          </Text>
        );
        index = endStrike + 2;
        continue;
      }
      
      // Inline code with `
      if (text[index] === '`' && text.indexOf('`', index + 1) !== -1) {
        const endCode = text.indexOf('`', index + 1);
        if (currentText) {
          parts.push(<span key={parts.length}>{currentText}</span>);
          currentText = '';
        }
        parts.push(
          <Code key={parts.length} px={1} bg={codeBg} color={codeColor} fontSize="0.9em">
            {text.slice(index + 1, endCode)}
          </Code>
        );
        index = endCode + 1;
        continue;
      }
      
      // Highlighted text with ==
      if (text.slice(index, index + 2) === '==' && text.indexOf('==', index + 2) !== -1) {
        const endHighlight = text.indexOf('==', index + 2);
        if (currentText) {
          parts.push(<span key={parts.length}>{currentText}</span>);
          currentText = '';
        }
        parts.push(
          <Text 
            key={parts.length} 
            as="span" 
            bg="yellow.100" 
            color="black" 
            px={1} 
            rounded="sm"
            _dark={{ bg: "yellow.800", color: "yellow.100" }}
          >
            {text.slice(index + 2, endHighlight)}
          </Text>
        );
        index = endHighlight + 2;
        continue;
      }
      
      // Superscript with ^
      if (text[index] === '^' && text.indexOf('^', index + 1) !== -1) {
        const endSup = text.indexOf('^', index + 1);
        if (currentText) {
          parts.push(<span key={parts.length}>{currentText}</span>);
          currentText = '';
        }
        parts.push(
          <Text key={parts.length} as="sup" fontSize="xs" fontWeight="medium">
            {text.slice(index + 1, endSup)}
          </Text>
        );
        index = endSup + 1;
        continue;
      }
      
      // Subscript with ~
      if (text[index] === '~' && text.indexOf('~', index + 1) !== -1 &&
          // Make sure this isn't part of a ~~ for strikethrough
          !(index + 1 < text.length && text[index + 1] === '~')) {
        const endSub = text.indexOf('~', index + 1);
        if (currentText) {
          parts.push(<span key={parts.length}>{currentText}</span>);
          currentText = '';
        }
        parts.push(
          <Text key={parts.length} as="sub" fontSize="xs" fontWeight="medium">
            {text.slice(index + 1, endSub)}
          </Text>
        );
        index = endSub + 1;
        continue;
      }
      
      // Links with [text](url)
      if (text[index] === '[') {
        const closingBracket = text.indexOf(']', index);
        const openingParen = closingBracket !== -1 ? text.indexOf('(', closingBracket) : -1;
        const closingParen = openingParen !== -1 ? text.indexOf(')', openingParen) : -1;
        
        if (closingBracket !== -1 && openingParen === closingBracket + 1 && closingParen !== -1) {
          const linkText = text.slice(index + 1, closingBracket);
          const href = text.slice(openingParen + 1, closingParen);
          
          if (currentText) {
            parts.push(<span key={parts.length}>{currentText}</span>);
            currentText = '';
          }
          
          if (allowLinks && URL_PATTERN.test(href)) {
            parts.push(
              <Link 
                key={parts.length} 
                href={href} 
                color={linkColor} 
                isExternal
                display="inline-flex"
                alignItems="center"
                _hover={{ textDecoration: 'underline' }}
              >
                {linkText}
                <Icon as={FiExternalLink} ml={1} boxSize={3} />
              </Link>
            );
          } else {
            parts.push(<span key={parts.length}>{linkText}</span>);
          }
          
          index = closingParen + 1;
          continue;
        }
      }
      
      // Images with ![alt](url)
      if (text.slice(index, index + 2) === '![') {
        const closingBracket = text.indexOf(']', index);
        const openingParen = closingBracket !== -1 ? text.indexOf('(', closingBracket) : -1;
        const closingParen = openingParen !== -1 ? text.indexOf(')', openingParen) : -1;
        
        if (closingBracket !== -1 && openingParen === closingBracket + 1 && closingParen !== -1) {
          const altText = text.slice(index + 2, closingBracket);
          const src = text.slice(openingParen + 1, closingParen);
          
          if (currentText) {
            parts.push(<span key={parts.length}>{currentText}</span>);
            currentText = '';
          }
          
          if (allowImages && URL_PATTERN.test(src)) {
            parts.push(
              <Box key={parts.length} my={3} position="relative" display="block">
                <Image 
                  src={src} 
                  alt={altText} 
                  maxH={maxImageHeight}
                  borderRadius="md"
                  cursor="pointer"
                  onClick={() => handleImageClick(src, altText)}
                />
                <HStack 
                  position="absolute" 
                  top={2} 
                  right={2} 
                  spacing={1}
                >
                  <Tooltip label="View full size" placement="top" hasArrow>
                    <Box 
                      bg="rgba(0,0,0,0.6)" 
                      color="white" 
                      p={1} 
                      borderRadius="md"
                      cursor="pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(src, altText);
                      }}
                    >
                      <Icon as={FiMaximize} />
                    </Box>
                  </Tooltip>
                  <Tooltip label="Download image" placement="top" hasArrow>
                    <Box 
                      bg="rgba(0,0,0,0.6)" 
                      color="white" 
                      p={1} 
                      borderRadius="md"
                      cursor="pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Create a temporary link to download the image
                        const link = document.createElement('a');
                        link.href = src;
                        link.download = altText || 'image';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <Icon as={FiDownload} />
                    </Box>
                  </Tooltip>
                </HStack>
                {altText && (
                  <Text 
                    mt={1} 
                    fontSize="xs" 
                    textAlign="center" 
                    color="gray.500"
                    fontStyle="italic"
                  >
                    {altText}
                  </Text>
                )}
              </Box>
            );
          } else if (!allowImages) {
            parts.push(
              <Box 
                key={parts.length} 
                display="inline-flex" 
                alignItems="center" 
                color={linkColor}
                fontSize="sm"
              >
                <Icon as={FiImage} mr={1} />
                <Text>{altText || 'Image'}</Text>
              </Box>
            );
          }
          
          index = closingParen + 1;
          continue;
        }
      }
      
      currentText += text[index];
      index += 1;
    }
    
    if (currentText) {
      parts.push(<span key={parts.length}>{currentText}</span>);
    }
    
    return parts;
  };
  
  // Handle closing any open code blocks or tables at the end
  useEffect(() => {
    if (inCodeBlock) {
      result.push(renderCodeBlock(codeBlockContent, currentCodeLanguage));
    }
    
    if (inTable && tableRows.length > 0) {
      result.push(renderTable(tableRows));
    }
  }, []);
  
  return (
    <>
      <Box {...boxProps}>
        <VStack align="stretch" spacing={0}>
          {renderContent()}
        </VStack>
      </Box>
      
      {/* Enhanced image modal with caption and controls */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent bg="transparent" boxShadow="none" maxW="90vw">
          <ModalCloseButton color="white" />
          <ModalBody p={0} display="flex" flexDirection="column" alignItems="center">
            {/* Image container */}
            <Box position="relative" width="100%" display="flex" justifyContent="center">
              <Image 
                src={selectedImage} 
                maxW="100%" 
                maxH="80vh"
                objectFit="contain"
                borderRadius="md"
              />
              
              {/* Image controls */}
              <HStack 
                position="absolute"
                bottom={4}
                right={4}
                bg="rgba(0,0,0,0.7)"
                borderRadius="md"
                p={2}
                spacing={2}
              >
                {/* Download button */}
                <Tooltip label="Download image" placement="top" hasArrow>
                  <IconButton
                    aria-label="Download image"
                    icon={<FiDownload />}
                    size="sm"
                    variant="ghost"
                    color="white"
                    onClick={() => {
                      // Create temporary link for download
                      const link = document.createElement('a');
                      link.href = selectedImage;
                      link.download = imageCaption || 'image';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  />
                </Tooltip>
                
                {/* Share button */}
                <Tooltip label="Share image" placement="top" hasArrow>
                  <IconButton
                    aria-label="Share image"
                    icon={<FiShare2 />}
                    size="sm"
                    variant="ghost"
                    color="white"
                    onClick={() => {
                      // Use Web Share API if available
                      if (navigator.share) {
                        navigator.share({
                          title: imageCaption || 'Shared image',
                          url: selectedImage
                        }).catch((error) => console.log('Error sharing', error));
                      } else {
                        // Fallback: Copy image URL to clipboard
                        navigator.clipboard.writeText(selectedImage).then(
                          () => {
                            toast({
                              title: "Link copied to clipboard",
                              status: "success",
                              duration: 2000,
                              isClosable: true,
                            });
                          },
                          (err) => console.error('Failed to copy: ', err)
                        );
                      }
                    }}
                  />
                </Tooltip>
              </HStack>
            </Box>
            
            {/* Optional image caption */}
            {imageCaption && (
              <Box 
                mt={4} 
                px={4} 
                py={2} 
                bg="rgba(0,0,0,0.7)" 
                color="white"
                borderRadius="md"
                maxW="80%"
                textAlign="center"
              >
                <Text fontSize="sm">{imageCaption}</Text>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default SimpleMarkdown;