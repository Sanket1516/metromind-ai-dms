export interface Integration {
  id: string;
  name: string;
  description: string;
  type: IntegrationType;
  enabled: boolean;
  config: IntegrationConfig;
  status: IntegrationStatus;
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

export type IntegrationType = 'storage' | 'crm' | 'erp' | 'email' | 'custom';
export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'syncing';

export interface IntegrationConfig {
  apiKey?: string;
  endpoint?: string;
  username?: string;
  password?: string;
  settings: Record<string, any>;
}

export interface IntegrationSyncResult {
  integrationId: string;
  status: 'success' | 'error';
  message?: string;
  syncedItems?: number;
  errors?: string[];
  timestamp: string;
}

export interface IntegrationError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}
