import { useState, useCallback, useEffect } from 'react';
import { useApiClient } from './useApiClient';
import { 
  Integration, 
  IntegrationCreate, 
  IntegrationUpdate, 
  IntegrationType, 
  IntegrationStatus,
  IntegrationRunOptions
} from '../types/integration';

/**
 * Hook for managing integrations
 */
export const useIntegrations = () => {
  const apiClient = useApiClient();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationTypes, setIntegrationTypes] = useState<IntegrationType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch all integrations for the current tenant
   */
  const fetchIntegrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Integration[]>('/integrations');
      setIntegrations(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch integrations'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  /**
   * Fetch available integration types
   */
  const fetchIntegrationTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<IntegrationType[]>('/integrations/types');
      setIntegrationTypes(response);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch integration types'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  /**
   * Get detailed status for an integration
   */
  const getIntegrationStatus = useCallback(async (integrationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<IntegrationStatus>(`/integrations/${integrationId}/status`);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch integration status'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  /**
   * Create a new integration
   */
  const createIntegration = useCallback(async (integrationData: IntegrationCreate) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<Integration>('/integrations', integrationData);
      setIntegrations(prev => [...prev, response]);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create integration'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, setIntegrations]);

  /**
   * Update an existing integration
   */
  const updateIntegration = useCallback(async (integrationId: string, updateData: IntegrationUpdate) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.patch<Integration>(`/integrations/${integrationId}`, updateData);
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === integrationId ? response : integration
        )
      );
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update integration'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, setIntegrations]);

  /**
   * Delete an integration
   */
  const deleteIntegration = useCallback(async (integrationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.delete(`/integrations/${integrationId}`);
      setIntegrations(prev => prev.filter(integration => integration.id !== integrationId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete integration'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, setIntegrations]);

  /**
   * Run an integration manually
   */
  const runIntegration = useCallback(async (integrationId: string, options?: IntegrationRunOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ status: string, run_id: string }>(
        `/integrations/${integrationId}/run`,
        options || {}
      );
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to run integration'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  /**
   * Toggle integration enabled status
   */
  const toggleIntegrationStatus = useCallback(async (integrationId: string, isEnabled: boolean) => {
    return updateIntegration(integrationId, { is_enabled: isEnabled });
  }, [updateIntegration]);

  /**
   * Get schema for a specific integration type
   */
  const getIntegrationTypeSchema = useCallback((type: string) => {
    return integrationTypes.find(t => t.id === type);
  }, [integrationTypes]);

  // Load integrations on mount
  useEffect(() => {
    fetchIntegrations();
    fetchIntegrationTypes();
  }, [fetchIntegrations, fetchIntegrationTypes]);

  return {
    integrations,
    integrationTypes,
    isLoading,
    error,
    fetchIntegrations,
    fetchIntegrationTypes,
    getIntegrationStatus,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    runIntegration,
    toggleIntegrationStatus,
    getIntegrationTypeSchema
  };
};

export default useIntegrations;