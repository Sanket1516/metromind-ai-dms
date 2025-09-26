import React from 'react';
import { Document } from '../../types/documents';
import DataTable, { Column } from '../Common/DataTable';
import {
  Chip,
  Box,
  Avatar,
  Typography,
  Tooltip,
} from '@mui/material';
import { format } from 'date-fns';

interface DocumentTableProps {
  documents: Document[];
  loading?: boolean;
  error?: string;
  total?: number;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (newRowsPerPage: number) => void;
  onView?: (doc: Document) => void;
  onEdit?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'processing':
      return 'warning';
    case 'completed':
      return 'success';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  loading = false,
  error,
  total = 0,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onEdit,
  onDelete,
}) => {
  const columns: Column[] = [
    {
      id: 'title',
      label: 'Document',
      minWidth: 250,
      format: (value: string, row: Document) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            variant="rounded"
            sx={{ width: 40, height: 40, bgcolor: 'grey.200' }}
          >
            📄
          </Avatar>
          <Box>
            <Tooltip title={value}>
              <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                {value}
              </Typography>
            </Tooltip>
            <Typography variant="caption" color="textSecondary">
              {row.fileType.toUpperCase()} • {formatFileSize(row.fileSize)}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'documentType',
      label: 'Document Type',
      minWidth: 120,
      format: (value: any, row: Document) => (
        <Chip
          label={row.documentType.name}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      format: (value: string) => (
        <Chip
          label={value}
          size="small"
          color={getStatusColor(value)}
        />
      ),
    },
    {
      id: 'uploadedBy',
      label: 'Uploaded By',
      minWidth: 120,
      format: (value: any, row: Document) => (
        <Typography variant="body2">
          {row.uploadedBy.username}
        </Typography>
      ),
    },
    {
      id: 'createdAt',
      label: 'Created',
      minWidth: 120,
      format: (value: string) => format(new Date(value), 'MMM d, yyyy'),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={documents}
      loading={loading}
      error={error}
      total={total}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
};

export default DocumentTable;
