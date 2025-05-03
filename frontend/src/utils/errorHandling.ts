/**
 * Error handling utilities for consistent error handling across components
 */

import { AxiosError } from 'axios';

export interface ErrorWithMessage {
  message: string;
}

export interface ErrorWithCode {
  code: string;
  message: string;
}

export type ApiErrorResponse = {
  detail?: string;
  message?: string;
  error?: string;
  code?: string;
};

/**
 * Checks if an error object has a message property
 */
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

/**
 * Checks if an error object has both code and message properties
 */
export function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return (
    isErrorWithMessage(error) &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}

/**
 * Extracts the most useful error message from various error types
 * @param error - The error object from a try/catch block
 * @param fallbackMessage - Fallback message if no useful message can be extracted
 * @returns A user-friendly error message
 */
export function extractErrorMessage(error: unknown, fallbackMessage = 'An unexpected error occurred'): string {
  // Check if it's an Axios error with a response
  if (error instanceof Error && 'isAxiosError' in error && (error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const responseData = axiosError.response.data as ApiErrorResponse;
      const statusText = axiosError.response.statusText;
      
      // Try to get a detailed message from the response data
      if (responseData) {
        const apiMessage = responseData.detail || 
                          responseData.message || 
                          responseData.error;
        
        if (apiMessage) {
          return `API Error: ${apiMessage}`;
        }
      }
      
      // Fall back to status text if available
      if (statusText) {
        return `HTTP Error: ${statusText} (${axiosError.response.status})`;
      }
      
      // Just report the status code if we have nothing else
      return `HTTP Error ${axiosError.response.status}`;
    }
    
    // Network errors or request canceled
    if (axiosError.request && !axiosError.response) {
      return 'Network error: Could not connect to the server';
    }
    
    // Other Axios errors
    return axiosError.message || fallbackMessage;
  }

  // Regular error object with message
  if (isErrorWithCode(error)) {
    return `Error [${error.code}]: ${error.message}`;
  }
  
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  
  // Convert other types to string if possible
  if (error !== null && error !== undefined) {
    const errorString = String(error);
    if (errorString && errorString !== '[object Object]') {
      return errorString;
    }
  }
  
  // Fallback
  return fallbackMessage;
}

/**
 * Log errors consistently across the application
 * @param error - The error object
 * @param context - Additional context information (component name, operation, etc.)
 */
export function logError(error: unknown, context?: string): void {
  const errorMessage = extractErrorMessage(error);
  const contextPrefix = context ? `[${context}] ` : '';
  
  console.error(`${contextPrefix}${errorMessage}`, error);
  
  // TODO: Add integration with error tracking services like Sentry when available
}

/**
 * Categorize errors for appropriate UI responses
 * @param error - The error object
 * @returns The error category
 */
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown'
}

export function categorizeError(error: unknown): ErrorCategory {
  if (error instanceof Error && 'isAxiosError' in error && (error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError;
    if (!axiosError.response && axiosError.request) {
      return ErrorCategory.NETWORK;
    }
    
    if (axiosError.response) {
      const status = axiosError.response.status;
      
      if (status === 401) {
        return ErrorCategory.AUTHENTICATION;
      }
      
      if (status === 403) {
        return ErrorCategory.AUTHORIZATION;
      }
      
      if (status === 404) {
        return ErrorCategory.NOT_FOUND;
      }
      
      if (status >= 400 && status < 500) {
        return ErrorCategory.VALIDATION;
      }
      
      if (status >= 500) {
        return ErrorCategory.SERVER;
      }
    }
  }
  
  // Check for specific error codes or messages
  if (isErrorWithCode(error)) {
    const codeStr = error.code.toLowerCase();
    if (codeStr.includes('auth') || codeStr.includes('login') || codeStr.includes('token')) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (codeStr.includes('permission') || codeStr.includes('access')) {
      return ErrorCategory.AUTHORIZATION;
    }
    if (codeStr.includes('network') || codeStr.includes('timeout') || codeStr.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
  }
  
  if (isErrorWithMessage(error)) {
    const msgStr = error.message.toLowerCase();
    if (msgStr.includes('not found') || msgStr.includes('404')) {
      return ErrorCategory.NOT_FOUND;
    }
    if (msgStr.includes('network') || msgStr.includes('connection') || 
        msgStr.includes('offline') || msgStr.includes('timeout')) {
      return ErrorCategory.NETWORK;
    }
    if (msgStr.includes('unauthorized') || msgStr.includes('unauthenticated') ||
        msgStr.includes('login') || msgStr.includes('token')) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (msgStr.includes('permission') || msgStr.includes('forbidden') || 
        msgStr.includes('not allowed')) {
      return ErrorCategory.AUTHORIZATION;
    }
  }
  
  return ErrorCategory.UNKNOWN;
}

/**
 * A custom error class that includes a category for better error handling
 */
export class AppError extends Error {
  category: ErrorCategory;
  originalError?: unknown;

  constructor(
    message: string, 
    category: ErrorCategory = ErrorCategory.UNKNOWN, 
    originalError?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.category = category;
    this.originalError = originalError;
    
    // Ensures proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  static fromError(error: unknown, defaultMessage = 'An unexpected error occurred'): AppError {
    const message = extractErrorMessage(error, defaultMessage);
    const category = categorizeError(error);
    return new AppError(message, category, error);
  }
}

/**
 * Create a standardized error object from API errors
 * @param error - The error from an API call
 * @param operation - The operation being performed (e.g., 'fetching user data')
 * @returns A formatted AppError
 */
export function createApiError(error: unknown, operation?: string): AppError {
  const operationText = operation ? ` while ${operation}` : '';
  const message = extractErrorMessage(error, `An error occurred${operationText}`);
  const category = categorizeError(error);
  
  return new AppError(message, category, error);
}