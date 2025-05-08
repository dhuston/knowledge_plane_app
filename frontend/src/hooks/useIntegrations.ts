import { useState, useCallback, useEffect } from 'react';
import { useApiClient } from './useApiClient';
import { 
  Integration, 
  IntegrationCreate, 
  IntegrationUpdate, 
  IntegrationStatus,
  IntegrationRunOptions
} from '../types/integration';

/**
 * Hook for managing integrations with the streamlined API
 */
export const useIntegrations = () => {
  const apiClient = useApiClient();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationTypes, setIntegrationTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // API path for integration endpoints
  const API_PATH = '/integrations';

  /**
   * Fetch all integrations for the current tenant
   */
  const fetchIntegrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Integration[]>(`${API_PATH}`);
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
      const response = await apiClient.get<string[]>(`${API_PATH}/integration-types`);
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
      const response = await apiClient.get<IntegrationStatus>(`${API_PATH}/${integrationId}/status`);
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
      // The new API returns the UUID as a string, not a full Integration object
      const integrationId = await apiClient.post<string>(`${API_PATH}`, integrationData);
      
      // Fetch the newly created integration to get full details
      const newIntegration = await apiClient.get<Integration>(`${API_PATH}/${integrationId}`);
      
      setIntegrations(prev => [...prev, newIntegration]);
      return newIntegration;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create integration'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  /**
   * Update an existing integration
   */
  const updateIntegration = useCallback(async (integrationId: string, updateData: IntegrationUpdate) => {
    setIsLoading(true);
    setError(null);

    try {
      // The new API returns a boolean success indicator
      await apiClient.put<boolean>(`${API_PATH}/${integrationId}`, updateData);
      
      // Fetch the updated integration to get new details
      const updatedIntegration = await apiClient.get<Integration>(`${API_PATH}/${integrationId}`);
      
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === integrationId ? updatedIntegration : integration
        )
      );
      return updatedIntegration;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update integration'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  /**
   * Delete an integration
   */
  const deleteIntegration = useCallback(async (integrationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.delete(`${API_PATH}/${integrationId}`);
      setIntegrations(prev => prev.filter(integration => integration.id !== integrationId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete integration'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiClient]);

  /**
   * Run an integration manually
   */
  const runIntegration = useCallback(async (integrationId: string, options?: IntegrationRunOptions) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{ status: string, entity_count: number, error_count: number, run_id: string }>(
        `${API_PATH}/${integrationId}/run`,
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
    toggleIntegrationStatus
  };
};

export default useIntegrations;