/**
 * Environment configuration for the application
 * Provides typesafe access to environment variables
 */

interface EnvConfig {
  OPENAI_API_KEY: string | undefined;
  OPENAI_IS_AZURE: string | undefined;
  AZURE_OPENAI_ENDPOINT: string | undefined;
  AZURE_OPENAI_DEPLOYMENT: string | undefined; 
  OPENAI_MODEL: string | undefined;
  NODE_ENV: 'development' | 'production' | 'test';
  API_BASE_URL: string;
  DEBUG: boolean;
  AUTH_TYPE: 'legacy' | 'simple';
}

// Get environment variables with proper typing
const env: EnvConfig = {
  // Import.meta.env is used for Vite environment variables
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY as string | undefined,
  OPENAI_IS_AZURE: import.meta.env.VITE_OPENAI_IS_AZURE as string | undefined,
  AZURE_OPENAI_ENDPOINT: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT as string | undefined,
  AZURE_OPENAI_DEPLOYMENT: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT as string | undefined,
  OPENAI_MODEL: import.meta.env.VITE_OPENAI_MODEL as string | undefined,
  NODE_ENV: import.meta.env.MODE as 'development' | 'production' | 'test',
  // API_BASE_URL should be just /api when inside Docker with Vite proxy
  // or a full URL like http://localhost:8001 when running outside Docker
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string || '',
  // Debug mode
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  // Auth type: 'legacy' or 'simple'
  AUTH_TYPE: (import.meta.env.VITE_AUTH_TYPE as 'legacy' | 'simple') || 'legacy',
};

// Export individual config values for easier imports
export const API_BASE_URL = env.API_BASE_URL;
export const IS_DEVELOPMENT = env.NODE_ENV === 'development';
export const IS_DEBUG = env.DEBUG;
export const AUTH_TYPE = env.AUTH_TYPE;

export default env;