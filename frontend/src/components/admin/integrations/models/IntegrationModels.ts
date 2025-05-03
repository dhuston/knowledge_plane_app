/**
 * Integration Configuration UI Data Models
 * These models define the TypeScript interfaces used throughout the Integration UI components
 */

/**
 * Integration Types Enum
 */
export enum IntegrationType {
  CALENDAR = 'calendar',
  EMAIL = 'email',
  DOCUMENT = 'document',
  CHAT = 'chat',
  PROJECT = 'project',
  RESEARCH = 'research',
  OTHER = 'other'
}

/**
 * Integration Status Enum
 */
export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  CONFIGURING = 'configuring'
}

/**
 * Authentication Types
 */
export type AuthType = 'oauth2' | 'api_key' | 'basic_auth';

/**
 * Base type for credential configuration
 */
export interface BaseCredentialConfig {
  type: string;
}

/**
 * OAuth 2.0 credential configuration
 */
export interface OAuth2CredentialConfig extends BaseCredentialConfig {
  type: 'oauth2';
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
  grantType: 'authorization_code' | 'client_credentials';
  state?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

/**
 * API Key credential configuration
 */
export interface ApiKeyCredentialConfig extends BaseCredentialConfig {
  type: 'api_key';
  apiKey: string;
  apiKeyHeader?: string;
  apiKeyQuery?: string;
}

/**
 * Basic authentication credential configuration
 */
export interface BasicAuthCredentialConfig extends BaseCredentialConfig {
  type: 'basic_auth';
  username: string;
  password: string;
}

/**
 * Union type for all credential configurations
 */
export type CredentialConfig = OAuth2CredentialConfig | ApiKeyCredentialConfig | BasicAuthCredentialConfig;

/**
 * Authentication configuration
 */
export interface AuthConfig {
  type: AuthType;
  configuration: CredentialConfig;
}

/**
 * Integration configuration schema property
 */
export interface ConfigSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  title: string;
  description?: string;
  default?: any;
  enum?: string[] | number[];
  format?: string;
  minimum?: number;
  maximum?: number;
  required?: boolean;
  items?: ConfigSchemaProperty;
  properties?: Record<string, ConfigSchemaProperty>;
}

/**
 * Integration configuration schema
 */
export interface ConfigSchema {
  properties: Record<string, ConfigSchemaProperty>;
  required?: string[];
}

/**
 * Integration type information
 */
export interface IntegrationTypeInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  supportedEntityTypes: string[];
  configSchema: ConfigSchema;
  credentialSchema: ConfigSchema;
  authTypes: AuthType[];
}

/**
 * Integration instance metrics
 */
export interface IntegrationMetrics {
  eventsProcessed: number;
  successRate: number;
  avgProcessTime: number;
  lastSyncTime?: string;
}

/**
 * Integration run status
 */
export type IntegrationRunStatus = 'success' | 'failed' | 'partial_success' | 'running';

/**
 * Integration run details
 */
export interface IntegrationRun {
  id: string;
  status: IntegrationRunStatus;
  startTime: string;
  endTime?: string;
  entityCount: number;
  relationshipCount: number;
  errorCount: number;
  details?: Record<string, any>;
}

/**
 * Log entry for integration activities
 */
export interface IntegrationLogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  context?: Record<string, any>;
}

/**
 * Integration instance
 */
export interface Integration {
  id: string;
  name: string;
  description?: string;
  type: IntegrationType | string;
  status: IntegrationStatus;
  config?: Record<string, any>;
  authTypes?: AuthType[];
  authConfig?: AuthConfig;
  lastSync?: string;
  logoUrl?: string;
  version?: string;
  
  // Sync settings
  syncEnabled?: boolean;
  syncFrequency?: number;
  
  // Advanced settings
  customEndpoint?: string;
  timeout?: number;
  maxRetries?: number;
  debugMode?: boolean;
  
  // Metrics and history
  metrics?: IntegrationMetrics;
  createdAt: string;
  updatedAt?: string;
  lastRun?: IntegrationRun;
}

/**
 * Connection test result
 */
export interface ConnectionTestResult {
  status: 'success' | 'error';
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Data preview for an integration
 */
export interface DataPreview {
  entityType: string;
  count: number;
  sample: any[];
  fieldMapping?: Record<string, string>;
}

/**
 * Integration event filters
 */
export interface IntegrationEventFilters {
  entityTypes?: string[];
  startDate?: string;
  endDate?: string;
  includeHistorical?: boolean;
}

/**
 * Integration category with its available types
 */
export interface IntegrationCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  types: IntegrationTypeInfo[];
}