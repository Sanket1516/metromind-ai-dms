import axios from 'axios';
import { API_BASE_URL } from '../config';
import { SERVICE_URLS } from './api';
import { OcrResult, AiAnalysisResult } from '../types/documents';

export interface ProcessingProgress {
  ocrProgress: number;
  aiProgress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
}

export const checkProcessingStatus = async (
  documentId: string
): Promise<ProcessingProgress> => {
  const response = await axios.get(
    `${SERVICE_URLS.DOCUMENTS}/${documentId}/processing-status`
  );
  return response.data;
};

export const getOcrResults = async (documentId: string): Promise<OcrResult> => {
  const response = await axios.get(
    `${SERVICE_URLS.OCR}/document/${documentId}`
  );
  return response.data;
};

export const getAiAnalysis = async (
  documentId: string
): Promise<AiAnalysisResult> => {
  const response = await axios.get(
    `${SERVICE_URLS.AI_ML}/analyze-document/${documentId}`
  );
  return response.data;
};

export const reprocessDocument = async (documentId: string): Promise<void> => {
  await axios.post(`${SERVICE_URLS.DOCUMENTS}/${documentId}/reprocess`);
};
