/**
 * Tests for validation.ts
 */

import {
  ValidationError,
  validateRequired,
  validateMaxLength,
  validateRange,
  validateUrl,
  validateEmail,
  sanitizeString,
  validateArrayNotEmpty,
  validateRequiredProps,
  validateString,
} from '../validation';

describe('ValidationError', () => {
  test('creates error with field and type information', () => {
    const error = new ValidationError('Test error', 'testField', 'testType');
    
    expect(error.message).toBe('Test error');
    expect(error.field).toBe('testField');
    expect(error.type).toBe('testType');
    expect(error.name).toBe('ValidationError');
  });
});

describe('validateRequired', () => {
  test('returns value when not empty', () => {
    expect(validateRequired('test', { fieldName: 'Test Field' })).toBe('test');
  });
  
  test('throws ValidationError when empty', () => {
    expect(() => validateRequired('', { fieldName: 'Test Field' }))
      .toThrow(ValidationError);
    expect(() => validateRequired('', { fieldName: 'Test Field' }))
      .toThrow('Test Field is required');
  });
  
  test('handles null and undefined', () => {
    expect(() => validateRequired(null, { fieldName: 'Test Field' }))
      .toThrow(ValidationError);
    expect(() => validateRequired(undefined, { fieldName: 'Test Field' }))
      .toThrow(ValidationError);
  });
  
  test('uses custom error message when provided', () => {
    expect(() => validateRequired('', { 
      fieldName: 'Test Field', 
      customMessage: 'Custom error' 
    })).toThrow('Custom error');
  });
});

describe('validateMaxLength', () => {
  test('returns value when within max length', () => {
    expect(validateMaxLength('test', { 
      fieldName: 'Test Field',
      maxLength: 10
    })).toBe('test');
  });
  
  test('throws ValidationError when exceeding max length', () => {
    expect(() => validateMaxLength('test string too long', { 
      fieldName: 'Test Field',
      maxLength: 10
    })).toThrow(ValidationError);
    
    expect(() => validateMaxLength('test string too long', { 
      fieldName: 'Test Field',
      maxLength: 10
    })).toThrow('Test Field exceeds maximum length of 10 characters');
  });
});

describe('validateRange', () => {
  test('returns value when within range', () => {
    expect(validateRange(5, { 
      fieldName: 'Test Number',
      min: 1,
      max: 10
    })).toBe(5);
  });
  
  test('throws ValidationError when below minimum', () => {
    expect(() => validateRange(0, { 
      fieldName: 'Test Number',
      min: 1,
      max: 10
    })).toThrow(ValidationError);
    
    expect(() => validateRange(0, { 
      fieldName: 'Test Number',
      min: 1,
      max: 10
    })).toThrow('Test Number must be between 1 and 10');
  });
  
  test('throws ValidationError when above maximum', () => {
    expect(() => validateRange(15, { 
      fieldName: 'Test Number',
      min: 1,
      max: 10
    })).toThrow('Test Number must be between 1 and 10');
  });
  
  test('handles min-only validation', () => {
    expect(validateRange(5, { 
      fieldName: 'Test Number',
      min: 1
    })).toBe(5);
    
    expect(() => validateRange(0, { 
      fieldName: 'Test Number',
      min: 1
    })).toThrow('Test Number must be at least 1');
  });
  
  test('handles max-only validation', () => {
    expect(validateRange(5, { 
      fieldName: 'Test Number',
      max: 10
    })).toBe(5);
    
    expect(() => validateRange(15, { 
      fieldName: 'Test Number',
      max: 10
    })).toThrow('Test Number must be at most 10');
  });
});

describe('validateUrl', () => {
  test('returns valid URL', () => {
    expect(validateUrl('https://example.com', { 
      fieldName: 'Website'
    })).toBe('https://example.com');
  });
  
  test('throws ValidationError for invalid URLs', () => {
    expect(() => validateUrl('not-a-url', { 
      fieldName: 'Website'
    })).toThrow(ValidationError);
    
    expect(() => validateUrl('not-a-url', { 
      fieldName: 'Website'
    })).toThrow('Website is not a valid URL');
  });
  
  test('returns undefined for empty values when allowEmpty is true', () => {
    expect(validateUrl('', { 
      fieldName: 'Website',
      allowEmpty: true
    })).toBeUndefined();
    
    expect(validateUrl(null, { 
      fieldName: 'Website',
      allowEmpty: true
    })).toBeUndefined();
  });
  
  test('throws ValidationError for empty values when allowEmpty is false', () => {
    expect(() => validateUrl('', { 
      fieldName: 'Website',
      allowEmpty: false
    })).toThrow('Website is required');
  });
  
  test('accepts URL validation options', () => {
    expect(validateUrl('/relative-path', { 
      fieldName: 'Path',
      urlOptions: { allowRelative: true }
    })).toBe('/relative-path');
    
    expect(() => validateUrl('/relative-path', { 
      fieldName: 'Path',
      urlOptions: { allowRelative: false }
    })).toThrow(ValidationError);
  });
});

describe('validateEmail', () => {
  test('returns valid email', () => {
    expect(validateEmail('test@example.com', { 
      fieldName: 'Email'
    })).toBe('test@example.com');
  });
  
  test('throws ValidationError for invalid emails', () => {
    expect(() => validateEmail('not-an-email', { 
      fieldName: 'Email'
    })).toThrow(ValidationError);
    
    expect(() => validateEmail('not-an-email', { 
      fieldName: 'Email'
    })).toThrow('Email is not a valid email address');
  });
  
  test('returns undefined for empty values when allowEmpty is true', () => {
    expect(validateEmail('', { 
      fieldName: 'Email',
      allowEmpty: true
    })).toBeUndefined();
  });
  
  test('throws ValidationError for empty values when required is true', () => {
    expect(() => validateEmail('', { 
      fieldName: 'Email',
      required: true
    })).toThrow('Email is required');
  });
});

describe('sanitizeString', () => {
  test('returns sanitized string', () => {
    // This is a simple test - the real sanitization is done by DOMPurify
    expect(sanitizeString('test')).toBe('test');
  });
  
  test('returns empty string for null/undefined', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
  });
});

describe('validateArrayNotEmpty', () => {
  test('returns array when not empty', () => {
    const arr = [1, 2, 3];
    expect(validateArrayNotEmpty(arr, { 
      fieldName: 'Items'
    })).toBe(arr);
  });
  
  test('throws ValidationError when array is empty', () => {
    expect(() => validateArrayNotEmpty([], { 
      fieldName: 'Items'
    })).toThrow('Items must have at least 1 item(s)');
  });
  
  test('validates against custom minLength', () => {
    const arr = [1, 2];
    expect(validateArrayNotEmpty(arr, { 
      fieldName: 'Items',
      minLength: 2
    })).toBe(arr);
    
    expect(() => validateArrayNotEmpty(arr, { 
      fieldName: 'Items',
      minLength: 3
    })).toThrow('Items must have at least 3 item(s)');
  });
  
  test('handles null/undefined arrays', () => {
    expect(() => validateArrayNotEmpty(null, { 
      fieldName: 'Items'
    })).toThrow(ValidationError);
    
    expect(() => validateArrayNotEmpty(undefined, { 
      fieldName: 'Items'
    })).toThrow(ValidationError);
  });
});

describe('validateRequiredProps', () => {
  test('returns object when all required props exist', () => {
    const obj = { name: 'Test', age: 25 };
    expect(validateRequiredProps(obj, { 
      fieldName: 'User',
      requiredProps: ['name', 'age']
    })).toBe(obj);
  });
  
  test('throws ValidationError when a required prop is missing', () => {
    const obj = { name: 'Test' };
    expect(() => validateRequiredProps(obj, { 
      fieldName: 'User',
      requiredProps: ['name', 'age']
    })).toThrow('User is missing required property: age');
  });
  
  test('throws ValidationError for null/undefined objects', () => {
    expect(() => validateRequiredProps(null, { 
      fieldName: 'User',
      requiredProps: ['name']
    })).toThrow('User is required');
  });
});

describe('validateString', () => {
  test('validates string against multiple criteria', () => {
    expect(validateString('test', { 
      fieldName: 'Name',
      maxLength: 10,
      pattern: /^[a-z]+$/
    })).toBe('test');
  });
  
  test('throws ValidationError when exceeding maxLength', () => {
    expect(() => validateString('test string too long', { 
      fieldName: 'Name',
      maxLength: 10
    })).toThrow('Name exceeds maximum length of 10 characters');
  });
  
  test('throws ValidationError when pattern doesn\'t match', () => {
    expect(() => validateString('test123', { 
      fieldName: 'Name',
      pattern: /^[a-z]+$/
    })).toThrow('Name has an invalid format');
  });
  
  test('trims string by default', () => {
    expect(validateString('  test  ', { 
      fieldName: 'Name'
    })).toBe('test');
  });
  
  test('doesn\'t trim when trim option is false', () => {
    expect(validateString('  test  ', { 
      fieldName: 'Name',
      trim: false
    })).toBe('  test  ');
  });
  
  test('returns undefined for empty values when allowEmpty is true', () => {
    expect(validateString('', { 
      fieldName: 'Name',
      allowEmpty: true
    })).toBeUndefined();
  });
  
  test('throws ValidationError for empty values when required is true', () => {
    expect(() => validateString('', { 
      fieldName: 'Name',
      required: true
    })).toThrow('Name is required');
  });
});