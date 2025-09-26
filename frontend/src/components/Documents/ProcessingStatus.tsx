import React from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useProcessingStatus } from '../../hooks/useProcessingStatus';

interface ProcessingStatusProps {
  documentId: string;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ documentId }) => {
  const { data: status, isLoading } = useProcessingStatus(documentId);

  if (isLoading || !status) {
    return <CircularProgress size={24} />;
  }

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Processing Status: {status.status}
      </Typography>
      {status.message && (
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {status.message}
        </Typography>
      )}
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2" color="textSecondary">
          OCR Progress
        </Typography>
        <LinearProgress
          variant="determinate"
          value={status.ocrProgress}
          sx={{ mb: 1 }}
        />
        <Typography variant="body2" color="textSecondary">
          AI Analysis Progress
        </Typography>
        <LinearProgress
          variant="determinate"
          value={status.aiProgress}
          sx={{ mb: 1 }}
        />
      </Box>
    </Paper>
  );
};

export default ProcessingStatus;
