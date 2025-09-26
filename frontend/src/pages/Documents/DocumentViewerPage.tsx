import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Breadcrumbs,
  Link,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { getDocumentById } from '../../services/documents';
import DocumentPreview from '../../components/Documents/DocumentPreview';
import ProcessingStatus from '../../components/Documents/ProcessingStatus';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { format } from 'date-fns';

const DocumentViewerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: document, isLoading } = useQuery(
    ['document', id],
    () => getDocumentById(id!),
    {
      enabled: !!id,
    }
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!document) {
    return (
      <Box p={3}>
        <Typography>Document not found</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box flexGrow={1}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link
              color="inherit"
              href="#"
              onClick={() => navigate('/documents')}
            >
              Documents
            </Link>
            <Typography color="textPrimary">{document.title}</Typography>
          </Breadcrumbs>
          <Typography variant="h5" sx={{ mt: 1 }}>
            {document.title}
          </Typography>
        </Box>
        <IconButton>
          <DownloadIcon />
        </IconButton>
        <IconButton>
          <ShareIcon />
        </IconButton>
      </Box>

      <Box mb={3}>
        <Paper sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="body2" color="textSecondary">
                File: {document.fileName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Size:{' '}
                {(document.fileSize / (1024 * 1024)).toFixed(2)} MB
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Uploaded:{' '}
                {format(new Date(document.createdAt), 'MMM d, yyyy HH:mm')}
              </Typography>
            </Box>
            <Box textAlign="right">
              <Chip
                label={document.documentType.name}
                variant="outlined"
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" color="textSecondary">
                By: {document.uploadedBy.username}
                {document.uploadedBy.department &&
                  ` (${document.uploadedBy.department})`}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {document.status !== 'completed' && (
        <Box mb={3}>
          <ProcessingStatus documentId={document.id} />
        </Box>
      )}

      <DocumentPreview document={document} />
    </Box>
  );
};

export default DocumentViewerPage;
