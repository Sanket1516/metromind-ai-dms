import React from 'react';
import { Card, CardContent, Typography, Box, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { FileUpload as UploadIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  maxSize?: number;
  acceptedTypes?: string[];
  maxFiles?: number;
  title?: string;
  description?: string;
  error?: string;
}

const UploadZone = styled(Card)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  backgroundColor: theme.palette.background.default,
  borderRadius: '12px',
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.dark,
    backgroundColor: theme.palette.action.hover,
  },
}));

const StyledIcon = styled(UploadIcon)(({ theme }) => ({
  fontSize: '48px',
  color: theme.palette.primary.main,
  marginBottom: theme.spacing(2),
}));

const defaultMaxSize = 50 * 1024 * 1024; // 50MB
const defaultAcceptedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  maxSize = defaultMaxSize,
  acceptedTypes = defaultAcceptedTypes,
  maxFiles = 10,
  title = 'Upload Documents',
  description = 'Drag and drop your files here, or click to select files',
  error
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onFilesSelected,
    maxSize,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
  });

  return (
    <Box>
      <UploadZone
        {...getRootProps()}
        sx={{
          backgroundColor: isDragActive ? 'action.hover' : 'background.default',
          borderColor: error ? 'error.main' : isDragActive ? 'primary.dark' : 'primary.main',
        }}
      >
        <CardContent>
          <input {...getInputProps()} />
          <IconButton disableRipple sx={{ p: 0, mb: 2 }}>
            <StyledIcon />
          </IconButton>
          <Typography variant="h6" color="primary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {description}
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
            Max size: {(maxSize / (1024 * 1024)).toFixed(0)}MB
          </Typography>
        </CardContent>
      </UploadZone>
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default FileUpload;
