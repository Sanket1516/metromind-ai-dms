import { apiClient } from './api';
import { SERVICE_URLS } from './api';
import { Document } from '../types/documents';

export interface SearchFilters {
  query?: string;
  documentType?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface SearchResult {
  documents: Document[];
  total: number;
  query: string;
  filters: SearchFilters;
}

export const useSearchService = () => {
  const searchDocuments = async (filters: SearchFilters): Promise<SearchResult> => {
    const params = new URLSearchParams();

    if (filters.query) params.append('q', filters.query);
    if (filters.documentType) params.append('type', filters.documentType);
    if (filters.dateFrom) params.append('date_from', filters.dateFrom);
    if (filters.dateTo) params.append('date_to', filters.dateTo);
    if (filters.tags?.length) params.append('tags', filters.tags.join(','));

    const response = await apiClient.get<SearchResult>(
      `${SERVICE_URLS.SEARCH}?${params.toString()}`
    );
    return response.data;
  };

  const getSearchSuggestions = async (query: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(
      `${SERVICE_URLS.SEARCH}/suggestions?q=${encodeURIComponent(query)}`
    );
    return response.data;
  };

  const getRecentSearches = async (): Promise<string[]> => {
    const response = await apiClient.get<string[]>(`${SERVICE_URLS.SEARCH}/recent`);
    return response.data;
  };

  return {
    searchDocuments,
    getSearchSuggestions,
    getRecentSearches,
  };
};
