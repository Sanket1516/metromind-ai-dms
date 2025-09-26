export interface DocumentType {
  id: string;
  name: string;
  description: string;
  allowedFileTypes: string[];
  workflow?: string;
  metadata?: Record<string, any>;
}

export interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error: string | null;
}

export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: DocumentType;
  uploadedBy: {
    id: string;
    username: string;
    department?: string;
  };
  status: DocumentStatus;
  metadata?: Record<string, any>;
  ocrStatus?: OcrStatus;
  ocrResults?: OcrResult;
  aiAnalysis?: AiAnalysisResult;
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'error'
  | 'archived';

export type OcrStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface OcrResult {
  text: string;
  confidence: number;
  pages: OcrPage[];
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
  type: 'text' | 'table' | 'image' | 'form';
}

export interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface AiAnalysisResult {
  summary: string;
  keywords: string[];
  entities: Entity[];
  classification: Classification[];
  sentiment: Sentiment;
}

export interface Entity {
  text: string;
  type: string;
  confidence: number;
}

export interface Classification {
  label: string;
  confidence: number;
}

export interface Sentiment {
  label: 'positive' | 'negative' | 'neutral';
  score: number;
}
