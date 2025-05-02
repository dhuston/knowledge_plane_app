/**
 * Integration types for the integration framework
 */

/**
 * Integration run information
 */
export interface IntegrationRun {
  id: string;
  integration_id: string;
  status: 'success' | 'failed' | 'partial_success' | 'running';
  start_time: string;
  end_time?: string;
  entity_count?: number;
  relationship_count?: number;
  error_count?: number;
  details?: Record<string, any>;
}

/**
 * Integration credential information
 */
export interface IntegrationCredential {
  integration_id: string;
  credential_type: string;
  expires_at?: string;
  // Actual credentials are not exposed to frontend
}

/**
 * Integration configuration schema
 */
export interface IntegrationConfigSchema {
  properties: Record<string, {
    type: string;
    title: string;
    description?: string;
    default?: any;
    enum?: string[];
    format?: string;
    minimum?: number;
    maximum?: number;
    required?: boolean;
  }>;
  required?: string[];
}

/**
 * Integration information
 */
export interface Integration {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  integration_type: string;
  is_enabled: boolean;
  config: Record<string, any>;
  schedule?: string;
  created_at: string;
  updated_at: string;
  last_run?: IntegrationRun;
  success_rate?: number; // 0-100
}

/**
 * Integration type information
 */
export interface IntegrationType {
  id: string;
  name: string;
  description: string;
  icon?: string;
  supported_entity_types: string[];
  config_schema: IntegrationConfigSchema;
  credential_schema: IntegrationConfigSchema;
}

/**
 * Integration status information
 */
export interface IntegrationStatus {
  integration_id: string;
  name: string;
  integration_type: string;
  is_enabled: boolean;
  schedule?: string;
  last_run?: {
    id: string;
    status: 'success' | 'failed' | 'partial_success' | 'running';
    start_time: string;
    end_time?: string;
    entity_count?: number;
    error_count?: number;
  };
  success_rate: number;
  recent_runs: Array<{
    id: string;
    status: 'success' | 'failed' | 'partial_success' | 'running';
    start_time: string;
    end_time?: string;
  }>;
}

/**
 * Integration creation payload
 */
export interface IntegrationCreate {
  name: string;
  description?: string;
  integration_type: string;
  is_enabled?: boolean;
  config: Record<string, any>;
  credentials?: Record<string, any>;
  schedule?: string;
}

/**
 * Integration update payload
 */
export interface IntegrationUpdate {
  name?: string;
  description?: string;
  is_enabled?: boolean;
  config?: Record<string, any>;
  credentials?: Record<string, any>;
  schedule?: string;
}

/**
 * Integration run options
 */
export interface IntegrationRunOptions {
  entity_types?: string[];
  incremental?: boolean;
}