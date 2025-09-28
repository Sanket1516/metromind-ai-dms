import axios, { AxiosInstance, AxiosProgressEvent, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8010';

// Service URLs (through API Gateway on 8010)
export const SERVICE_URLS = {
  // Note: Gateway proxies to services; keep root paths consistent with backend
  AUTH: `${API_BASE_URL}/auth`,
  DOCUMENTS: `${API_BASE_URL}/documents`,
  OCR: `${API_BASE_URL}/ocr`,
  AI_ML: `${API_BASE_URL}/ai`,
  AI_SERVICE: `${API_BASE_URL}/ai`,
  SEARCH: `${API_BASE_URL}/search`,
  NOTIFICATIONS: `${API_BASE_URL}/notifications`,
  INTEGRATIONS: `${API_BASE_URL}/integrations`,
  ANALYTICS: `${API_BASE_URL}/analytics`,
  MODELS: `${API_BASE_URL}/models`,
  TASKS: `${API_BASE_URL}/tasks`,
  INTEGRATION_MANAGEMENT: `${API_BASE_URL}/integration-management`,
};

// WebSocket URLs through API Gateway (8010)
export const WEBSOCKET_URLS = {
  NOTIFICATIONS: `ws://localhost:8010/ws/notifications`,
};

// Error message handler - can be overridden by toast context
let errorHandler: ((message: string, type?: 'error' | 'warning' | 'info' | 'success') => void) | null = null;

export const setErrorHandler = (handler: typeof errorHandler) => {
  errorHandler = handler;
};

// Safely convert various error shapes into a user-facing string
export const toErrorMessage = (err: any): string => {
  try {
    if (!err) return 'An unexpected error occurred.';
    // Axios error
    const resp = err.response;
    if (resp) {
      const d = resp.data;
      if (!d) return resp.statusText || 'Request failed';
      if (typeof d === 'string') return d;
      if (d.detail) {
        // FastAPI detail can be string or array of validation errors
        if (typeof d.detail === 'string') return d.detail;
        if (Array.isArray(d.detail)) {
          const first = d.detail[0];
          if (first) {
            if (typeof first === 'string') return first;
            // Pydantic validation error object {type, loc, msg, ...}
            if (first.msg) return first.msg;
          }
        }
      }
      if (d.message) return d.message;
      // Fallback to JSON string
      return JSON.stringify(d);
    }
    if (err.message) return err.message;
    return String(err);
  } catch {
    return 'An unexpected error occurred.';
  }
};

const showError = (message: string) => {
  if (errorHandler) {
    errorHandler(message, 'error');
  } else {
    console.error('API Error:', message);
    // Fallback to alert if no error handler is set
    alert(`Error: ${message}`);
  }
};

const showSuccess = (message: string) => {
  if (errorHandler) {
    errorHandler(message, 'success');
  }
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      showError('Session expired. Please log in again.');
    } else if (response?.status === 403) {
      showError('Access denied. You do not have permission to perform this action.');
    } else if (response?.status >= 500) {
      showError('Server error. Please try again later.');
    } else if (response?.status === 404) {
      showError('Resource not found.');
    } else if (response?.status === 400) {
      showError(toErrorMessage(error));
    } else if (response?.data?.detail) {
      showError(toErrorMessage(error));
    } else if (error.code === 'ECONNABORTED') {
      showError('Request timeout. Please try again.');
    } else if (error.message === 'Network Error') {
      showError('Network error. Please check your connection.');
    } else if (error.message) {
      showError(error.message);
    } else {
      showError('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// Generic API methods
export const apiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.get(url, config),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.post(url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.put(url, data, config),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.delete(url, config),
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
    api.patch(url, data, config),
};

// File upload helper
export const uploadFile = (
  url: string,
  file: File,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void
) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
};

// Download helper
export const downloadFile = async (url: string, filename?: string) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });
    
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    showError('Failed to download file');
    throw error;
  }
};

// Task Management API
export const taskAPI = {
  // Task CRUD operations
  getTasks: (params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return api.get(`${SERVICE_URLS.TASKS}?${searchParams.toString()}`);
  },
  
  getTask: (taskId: string) => 
    api.get(`${SERVICE_URLS.TASKS}/${taskId}`),
  
  createTask: (taskData: any) => 
    api.post(SERVICE_URLS.TASKS, taskData),
  
  updateTask: (taskId: string, taskData: any) => 
    api.put(`${SERVICE_URLS.TASKS}/${taskId}`, taskData),
  
  deleteTask: (taskId: string) => 
    api.delete(`${SERVICE_URLS.TASKS}/${taskId}`),
  
  // Task actions
  addComment: (taskId: string, comment: string, attachments?: string[]) =>
    api.post(`${SERVICE_URLS.TASKS}/${taskId}/comments`, { comment, attachments }),
  
  // Task statistics and queries
  getTaskStats: (userId?: string) => {
    const params = userId ? `?user_id=${userId}` : '';
    return api.get(`${SERVICE_URLS.TASKS}/stats${params}`);
  },
  
  getMyTasks: (status?: string[], limit?: number) => {
    const params = new URLSearchParams();
    if (status) {
      status.forEach(s => params.append('status', s));
    }
    if (limit) {
      params.append('limit', limit.toString());
    }
    return api.get(`${SERVICE_URLS.TASKS}/my-tasks?${params.toString()}`);
  },
  
  getTaskCategories: () => 
    api.get(`${SERVICE_URLS.TASKS}/categories`),
};

// Integration Management API
export const integrationAPI = {
  // Templates
  getTemplates: (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    return api.get(`${SERVICE_URLS.INTEGRATION_MANAGEMENT}/templates?${params.toString()}`);
  },
  
  getTemplate: (integrationType: string) =>
    api.get(`${SERVICE_URLS.INTEGRATION_MANAGEMENT}/templates/${integrationType}`),
  
  // Integration CRUD
  getIntegrations: (params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return api.get(`${SERVICE_URLS.INTEGRATION_MANAGEMENT}/integrations?${searchParams.toString()}`);
  },
  
  getIntegration: (integrationId: string) =>
    api.get(`${SERVICE_URLS.INTEGRATION_MANAGEMENT}/integrations/${integrationId}`),
  
  createIntegration: (integrationData: any) =>
    api.post(`${SERVICE_URLS.INTEGRATION_MANAGEMENT}/integrations`, integrationData),
  
  updateIntegration: (integrationId: string, integrationData: any) =>
    api.put(`${SERVICE_URLS.INTEGRATION_MANAGEMENT}/integrations/${integrationId}`, integrationData),
  
  deleteIntegration: (integrationId: string) =>
    api.delete(`${SERVICE_URLS.INTEGRATION_MANAGEMENT}/integrations/${integrationId}`),
  
  // Integration actions
  testIntegration: (integrationId: string) =>
    api.post(`${SERVICE_URLS.INTEGRATION_MANAGEMENT}/integrations/${integrationId}/test`),
  
  syncIntegration: (integrationId: string, syncType: string = 'manual') =>
    api.post(`${SERVICE_URLS.INTEGRATION_MANAGEMENT}/integrations/${integrationId}/sync?sync_type=${syncType}`),
  
  getSyncLogs: (integrationId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    return api.get(`${SERVICE_URLS.INTEGRATION_MANAGEMENT}/integrations/${integrationId}/sync-logs${params}`);
  },
  
  // Categories
  getCategories: () =>
    api.get(`${SERVICE_URLS.INTEGRATION_MANAGEMENT}/categories`),
};

// Enhanced document API with integration support
export const documentAPI = {
  upload: (file: File, metadata?: any, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void) =>
    uploadFile(`${SERVICE_URLS.DOCUMENTS}/upload`, file, onUploadProgress),
  
  get: (documentId: string) =>
    api.get(`${SERVICE_URLS.DOCUMENTS}/${documentId}`),
  
  list: (params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    return api.get(`${SERVICE_URLS.DOCUMENTS}?${searchParams.toString()}`);
  },
  
  delete: (documentId: string) =>
    api.delete(`${SERVICE_URLS.DOCUMENTS}/${documentId}`),
  
  share: (documentId: string, shareData: any) =>
    api.post(`${SERVICE_URLS.DOCUMENTS}/${documentId}/share`, shareData),
  
  getShared: () =>
    api.get(`${SERVICE_URLS.DOCUMENTS}/shared`),
};

export { api };
export default api;
