export interface Document {
  id: string;
  title: string;
  description?: string;
  filename: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  status: DocumentStatus;
  metadata: DocumentMetadata;
  processingStatus: ProcessingStatus;
  ocrStatus?: OcrStatus;
  aiStatus?: AiStatus;
  tags?: string[];
  department?: string;
}

export type DocumentStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'archived';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AiStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface DocumentMetadata {
  contentType: string;
  pageCount?: number;
  createdAt?: string;
  modifiedAt?: string;
  author?: string;
  category?: string;
  customFields?: Record<string, unknown>;
}

export interface OcrResult {
  text: string;
  confidence: number;
  pages: OcrPage[];
  language?: string;
  processingTime?: number;
}

export interface OcrPage {
  pageNumber: number;
  text: string;
  blocks: OcrBlock[];
}

export interface OcrBlock {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  type: 'text' | 'table' | 'image' | 'other';
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AiAnalysisResult {
  summary: string;
  keywords: string[];
  entities: ExtractedEntity[];
  sentiment: SentimentAnalysis;
  classification: DocumentClassification[];
}

export interface ExtractedEntity {
  text: string;
  type: string;
  confidence: number;
}

export interface SentimentAnalysis {
  label: 'positive' | 'negative' | 'neutral';
  score: number;
}

export interface DocumentClassification {
  label: string;
  confidence: number;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DocumentFilter {
  status?: DocumentStatus;
  department?: string;
  fromDate?: string;
  toDate?: string;
  type?: string;
  searchQuery?: string;
}

export interface ProcessingProgress {
  documentId: string;
  stage: 'upload' | 'ocr' | 'ai' | 'complete';
  progress: number;
  status: ProcessingStatus;
  message?: string;
  error?: string;
}
