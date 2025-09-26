import { Integration, IntegrationConfig, IntegrationSyncResult } from '../types/integration';
import { apiClient } from './api';
import { SERVICE_URLS } from './api';

export const useIntegrationService = () => {
  const listIntegrations = async () => {
    const response = await apiClient.get<{integrations: Integration[], total: number}>(SERVICE_URLS.INTEGRATIONS);
    if (!response.data || !response.data.integrations) {
      console.error('Invalid integration response format:', response.data);
      return []; // Return empty array as fallback
    }
    return response.data.integrations;
  };

  const getIntegration = async (id: string) => {
    const response = await apiClient.get<Integration>(`${SERVICE_URLS.INTEGRATIONS}/${id}`);
    return response.data;
  };

  const addIntegration = async (data: Omit<Integration, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await apiClient.post<Integration>(SERVICE_URLS.INTEGRATIONS, data);
    return response.data;
  };

  const updateIntegration = async (id: string, data: Partial<Integration>) => {
    const response = await apiClient.put<Integration>(`${SERVICE_URLS.INTEGRATIONS}/${id}`, data);
    return response.data;
  };

  const deleteIntegration = async (id: string) => {
    await apiClient.delete(`${SERVICE_URLS.INTEGRATIONS}/${id}`);
  };

  const updateConfig = async (id: string, config: IntegrationConfig) => {
    const response = await apiClient.patch<Integration>(
      `${SERVICE_URLS.INTEGRATIONS}/${id}/config`,
      config
    );
    return response.data;
  };

  const toggleIntegration = async (id: string, enabled: boolean) => {
    const response = await apiClient.patch<Integration>(
      `${SERVICE_URLS.INTEGRATIONS}/${id}/toggle`,
      { enabled }
    );
    return response.data;
  };

  const syncIntegration = async (id: string) => {
    const response = await apiClient.post<IntegrationSyncResult>(
      `${SERVICE_URLS.INTEGRATIONS}/${id}/sync`
    );
    return response.data;
  };

  return {
    listIntegrations,
    getIntegration,
    addIntegration,
    updateIntegration,
    deleteIntegration,
    updateConfig,
    toggleIntegration,
    syncIntegration,
  };
};

export default useIntegrationService;
