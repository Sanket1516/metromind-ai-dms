import { SERVICE_URLS, apiClient } from './api';
import { Document, DocumentType } from '../types/documents';

export const fetchDocumentTypes = async (): Promise<DocumentType[]> => {
  const response = await apiClient.get(`${SERVICE_URLS.DOCUMENTS}/types`);
  return response.data;
};

export const uploadDocument = async ({
  file,
  documentType,
  metadata = {},
  onProgress,
}: {
  file: File;
  documentType: string;
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
}): Promise<Document> => {
  // Backend expects form fields: file, title, description, category, priority (1..4), tags (JSON string)
  const formData = new FormData();
  formData.append('file', file);

  // Derive fields from metadata and/or documentType for backward compatibility
  const title: string = (metadata.title as string) || file.name;
  const description: string = (metadata.description as string) || '';
  const categoryFromMeta = (metadata.category as string) || '';
  // Use provided category, else fallback to documentType (normalized to lowercase)
  const category: string = (categoryFromMeta || documentType || '').toString().toLowerCase();

  // Map string priorities to backend enum (1..4). Default to MEDIUM (2)
  const priorityMap: Record<string, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  let priorityValue: number | undefined;
  if (metadata.priority !== undefined && metadata.priority !== null) {
    const pStr = String(metadata.priority).toLowerCase();
    priorityValue = priorityMap[pStr] ?? (Number.isFinite(Number(metadata.priority)) ? Number(metadata.priority) : undefined);
  }
  if (!priorityValue || priorityValue < 1 || priorityValue > 4) {
    priorityValue = 2; // MEDIUM
  }

  // Optional tags: accept array or comma-separated string; send as JSON string
  let tagsJson: string | undefined;
  if (Array.isArray(metadata.tags)) {
    tagsJson = JSON.stringify(metadata.tags);
  } else if (typeof metadata.tags === 'string' && metadata.tags.trim().length > 0) {
    try {
      // If already JSON string
      const parsed = JSON.parse(metadata.tags);
      tagsJson = JSON.stringify(parsed);
    } catch {
      // Treat as comma-separated values
      const arr = metadata.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      tagsJson = JSON.stringify(arr);
    }
  }

  // Append fields only if applicable
  if (title) formData.append('title', title);
  if (description) formData.append('description', description);
  if (category) formData.append('category', category);
  formData.append('priority', String(priorityValue));
  if (tagsJson) formData.append('tags', tagsJson);

  console.log('Uploading document to:', `${SERVICE_URLS.DOCUMENTS}/upload`);
  console.log('Category:', category);
  console.log('Priority (numeric):', priorityValue);
  console.log('File size:', file.size);
  
  const response = await apiClient.post(
    `${SERVICE_URLS.DOCUMENTS}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    }
  );

  return response.data;
};

export const fetchDocuments = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
}): Promise<{ documents: Document[]; total: number }> => {
  const response = await apiClient.get(`${SERVICE_URLS.DOCUMENTS}`, {
    params,
  });
  return response.data;
};

export const getDocumentById = async (id: string): Promise<Document> => {
  const response = await apiClient.get(`${SERVICE_URLS.DOCUMENTS}/${id}`);
  return response.data;
};

export const updateDocumentMetadata = async (
  id: string,
  metadata: Record<string, any>
): Promise<Document> => {
  const response = await apiClient.patch(`${SERVICE_URLS.DOCUMENTS}/${id}`, {
    metadata,
  });
  return response.data;
};

export const archiveDocument = async (id: string): Promise<Document> => {
  const response = await apiClient.post(`${SERVICE_URLS.DOCUMENTS}/${id}/archive`);
  return response.data;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await apiClient.delete(`${SERVICE_URLS.DOCUMENTS}/${id}`);
};
