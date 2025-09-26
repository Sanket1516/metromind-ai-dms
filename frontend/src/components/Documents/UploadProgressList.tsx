import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  IconButton,
  Box,
  Typography,
  Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { FileWithProgress } from '../../types/documents';

interface UploadProgressListProps {
  files: FileWithProgress[];
}

const UploadProgressList: React.FC<UploadProgressListProps> = ({ files }) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <Paper sx={{ mt: 2 }}>
      <List>
        {files.map((fileWrapper, index) => (
          <ListItem
            key={`${fileWrapper.file.name}-${index}`}
            sx={{
              borderBottom:
                index < files.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            <ListItemText
              primary={
                <Typography
                  variant="body1"
                  color={fileWrapper.status === 'error' ? 'error' : 'textPrimary'}
                >
                  {fileWrapper.file.name}
                </Typography>
              }
              secondary={
                fileWrapper.status === 'error' ? (
                  <Typography variant="caption" color="error">
                    {fileWrapper.error}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="textSecondary">
                    {(fileWrapper.file.size / (1024 * 1024)).toFixed(2)} MB
                  </Typography>
                )
              }
            />
            <Box sx={{ minWidth: 100, ml: 2 }}>
              {fileWrapper.status === 'pending' && fileWrapper.progress > 0 && (
                <LinearProgress
                  variant="determinate"
                  value={fileWrapper.progress}
                  sx={{ mt: 1 }}
                />
              )}
              {fileWrapper.status === 'completed' && (
                <IconButton color="success" size="small">
                  <CheckCircleIcon />
                </IconButton>
              )}
              {fileWrapper.status === 'error' && (
                <IconButton color="error" size="small">
                  <ErrorIcon />
                </IconButton>
              )}
            </Box>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default UploadProgressList;
