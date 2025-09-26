import { SERVICE_URLS, apiClient } from './api';

/**
 * AI Service for interacting with the AI/ML endpoints via API Gateway
 */
const AIService = {
  /**
   * Process a document with AI
   * @param file - The document file to process
   * @param model - The AI model to use
   * @param query - Optional search query to focus AI processing
   */
  processDocument: async (file: File, model: string, query?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', model);
    if (query) {
      formData.append('query', query);
    }

    const response = await apiClient.post(`${SERVICE_URLS.AI_SERVICE}/process`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  /**
   * Get AI insights for documents
   */
  getInsights: async () => {
    const response = await apiClient.get(`${SERVICE_URLS.AI_SERVICE}/insights`);
    return response.data;
  },

  /**
   * Get document relationships for visualization
   */
  getDocumentRelationships: async () => {
    const response = await apiClient.get(`${SERVICE_URLS.AI_SERVICE}/relationships`);
    return response.data;
  },

  /**
   * Get AI models available for document processing
   */
  getAvailableModels: async () => {
    const response = await apiClient.get(`${SERVICE_URLS.AI_SERVICE}/models`);
    return response.data;
  },
  
  /**
   * Generate a summary for a document
   * @param documentId - The ID of the document to summarize
   */
  generateSummary: async (documentId: string) => {
    const response = await apiClient.post(`${SERVICE_URLS.AI_SERVICE}/summarize/${documentId}`);
    return response.data;
  },

  /**
   * Query the AI with a natural language question
   * @param query - The natural language query
   */
  queryAI: async (query: string) => {
    const response = await apiClient.post(`${SERVICE_URLS.AI_SERVICE}/query`, { query });
    return response.data;
  }
};

export default AIService;
