import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  VStack,
  Text,
  Flex,
  Spinner,
  Badge,
  Avatar,
  Progress,
  useColorModeValue,
  Card,
  CardBody,
  List,
  ListItem,
  Divider
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { processQuery } from '../../../services/nlqService';

interface QueryResult {
  type: 'text' | 'team' | 'project' | 'user' | 'error';
  data: any;
  message: string;
}

export function NaturalLanguageInterface() {
  const [query, setQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState<{ query: string; result: QueryResult | null }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const inputBg = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  
  const handleQuerySubmit = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    // Add the query to history immediately
    setQueryHistory(prev => [...prev, { query, result: null }]);
    
    try {
      const result = await processQuery(query);
      
      // Update the query with its result
      setQueryHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1].result = result;
        return updated;
      });
    } catch (error) {
      // Handle error
      setQueryHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1].result = {
          type: 'error',
          data: null,
          message: 'Sorry, there was an error processing your query. Please try again.'
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuerySubmit();
    }
  };
  
  useEffect(() => {
    // Focus the input initially
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Render different result types
  const renderResult = (result: QueryResult) => {
    switch (result.type) {
      case 'team':
        return (
          <Card bg={cardBg} width="100%" mt={2}>
            <CardBody>
              <Text fontWeight="medium" mb={3}>{result.message}</Text>
              <List spacing={3}>
                {result.data.members.map((member: any) => (
                  <ListItem key={member.id}>
                    <Flex align="center">
                      <Avatar size="sm" name={member.name} mr={3} />
                      <Box>
                        <Text fontWeight="medium">{member.name}</Text>
                        <Text fontSize="sm" color="gray.500">{member.role}</Text>
                      </Box>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            </CardBody>
          </Card>
        );
        
      case 'project':
        return (
          <Card bg={cardBg} width="100%" mt={2}>
            <CardBody>
              <Text fontWeight="medium" mb={3}>{result.message}</Text>
              <Flex justify="space-between" align="center" mb={2}>
                <Text>{result.data.projectName}</Text>
                <Badge colorScheme={result.data.status === 'Completed' ? 'green' : 'blue'}>
                  {result.data.status}
                </Badge>
              </Flex>
              <Progress 
                value={result.data.progress} 
                size="sm" 
                colorScheme="blue" 
                borderRadius="full" 
                mb={2}
              />
              <Flex justify="space-between">
                <Text fontSize="sm">{result.data.progress}%</Text>
                <Text fontSize="sm" color="gray.500">Due: {result.data.dueDate}</Text>
              </Flex>
            </CardBody>
          </Card>
        );
        
      case 'error':
        return (
          <Box 
            p={3} 
            bg="red.50" 
            color="red.500"
            borderRadius="md" 
            width="100%" 
            mt={2}
          >
            <Text>{result.message}</Text>
          </Box>
        );
        
      case 'text':
      default:
        return (
          <Box 
            p={3} 
            bg={cardBg}
            borderRadius="md" 
            width="100%" 
            mt={2}
          >
            <Text>{result.message}</Text>
          </Box>
        );
    }
  };
  
  return (
    <Box>
      <VStack spacing={4} align="stretch">
        {/* Query history */}
        {queryHistory.length > 0 && (
          <VStack spacing={4} align="stretch" maxH="300px" overflowY="auto" p={2}>
            {queryHistory.map((item, index) => (
              <Box key={index}>
                <Flex align="center" mb={2}>
                  <Badge colorScheme="blue" mr={2}>Query</Badge>
                  <Text fontWeight="medium">{item.query}</Text>
                </Flex>
                
                {item.result ? (
                  renderResult(item.result)
                ) : (
                  <Flex justify="center" py={4} data-testid="query-loading">
                    <Spinner size="sm" mr={2} />
                    <Text fontSize="sm">Processing your query...</Text>
                  </Flex>
                )}
                
                {index < queryHistory.length - 1 && <Divider my={3} />}
              </Box>
            ))}
          </VStack>
        )}
        
        {/* Input field */}
        <InputGroup size="lg">
          <Input
            ref={inputRef}
            placeholder="Ask anything about your organization..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            bg={inputBg}
            borderRadius="full"
            _focus={{
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
              borderColor: 'blue.500',
            }}
            disabled={isLoading}
          />
          <InputRightElement>
            <IconButton
              aria-label="Search"
              icon={isLoading ? <Spinner size="sm" /> : <SearchIcon />}
              variant="ghost"
              onClick={handleQuerySubmit}
              isLoading={isLoading}
              disabled={!query.trim() || isLoading}
            />
          </InputRightElement>
        </InputGroup>
        
        {queryHistory.length === 0 && (
          <Text fontSize="sm" color="gray.500" textAlign="center" mt={2}>
            Try asking about team members, project status, or upcoming events
          </Text>
        )}
      </VStack>
    </Box>
  );
}