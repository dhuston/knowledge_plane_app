/**
 * SearchInput.tsx
 * Input component for hierarchy search
 */
import React, { useRef, useEffect } from 'react';
import {
  InputGroup,
  InputLeftElement,
  Input,
  Icon,
} from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';

// Props interface
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Search input component with auto-focus
 */
export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search organization...',
  autoFocus = true,
}) => {
  // Input ref for auto-focus
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);
  
  return (
    <InputGroup size="md">
      <InputLeftElement pointerEvents="none">
        <Icon as={FiSearch} color="gray.400" />
      </InputLeftElement>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        borderRadius="md"
      />
    </InputGroup>
  );
};