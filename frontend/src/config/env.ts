/**
 * Environment configuration for the application
 * Provides typesafe access to environment variables
 */

interface EnvConfig {
  OPENAI_API_KEY: string | undefined;
  NODE_ENV: 'development' | 'production' | 'test';
  API_BASE_URL: string;
}

// Get environment variables with proper typing
const env: EnvConfig = {
  // Import.meta.env is used for Vite environment variables
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY as string | undefined,
  NODE_ENV: import.meta.env.MODE as 'development' | 'production' | 'test',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string || '/api',
};

export default env;