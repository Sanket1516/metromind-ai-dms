import React, { useCallback, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Alert,
  IconButton,
  LinearProgress,
  Fade,
  Zoom,
  useTheme,
  alpha,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { APP_CONFIG } from '../../config';
import { useDocumentUpload } from '../../hooks/useDocumentUpload';
import UploadProgressList from './UploadProgressList';
import DocumentTypeSelector from './DocumentTypeSelector';
import { FileWithProgress } from '../../types/documents';

const DocumentUpload: React.FC = () => {
  const theme = useTheme();
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const { uploadDocument, isUploading } = useDocumentUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileWithProgress[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
      error: null,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: APP_CONFIG.fileUpload.allowedTypes.reduce((acc, type) => ({
      ...acc,
      [type]: []
    }), {}),
    maxSize: APP_CONFIG.fileUpload.maxSize,
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const handleUpload = async () => {
    if (!selectedType) {
      console.error('No document type selected');
      return;
    }

    for (const fileWrapper of files) {
      if (fileWrapper.status === 'pending') {
        try {
          setFiles(prev =>
            prev.map(f =>
              f.file === fileWrapper.file
                ? { ...f, status: 'uploading' as const }
                : f
            )
          );

          await uploadDocument({
            file: fileWrapper.file,
            documentType: selectedType,
            onProgress: (progress) => {
              setFiles(prev =>
                prev.map(f =>
                  f.file === fileWrapper.file
                    ? { ...f, progress }
                    : f
                )
              );
            }
          });

          setFiles(prev =>
            prev.map(f =>
              f.file === fileWrapper.file
                ? { ...f, status: 'completed', progress: 100 }
                : f
            )
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          setFiles(prev =>
            prev.map(f =>
              f.file === fileWrapper.file
                ? { ...f, status: 'error', error: errorMessage }
                : f
            )
          );
        }
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'uploading':
        return <FileUploadIcon color="primary" />;
      default:
        return <InsertDriveFileIcon color="action" />;
    }
  };

  const canUpload = files.some(f => f.status === 'pending') && selectedType && !isUploading;
  const pendingFiles = files.filter(f => f.status === 'pending').length;
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const errorFiles = files.filter(f => f.status === 'error').length;

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          fontWeight: 600,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          mb: 3
        }}
      >
        Document Upload Center
      </Typography>

      <Grid container spacing={4}>
        {/* Upload Area */}
        <Grid item xs={12} lg={8}>
          <Card 
            elevation={0}
            sx={{ 
              border: `2px solid ${theme.palette.divider}`,
              borderRadius: 3,
              overflow: 'visible'
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Paper
                {...getRootProps()}
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragActive 
                    ? alpha(theme.palette.primary.main, 0.1) 
                    : 'background.paper',
                  border: '3px dashed',
                  borderColor: isDragActive 
                    ? theme.palette.primary.main 
                    : theme.palette.divider,
                  borderRadius: 3,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isDragActive ? 'scale(1.02)' : 'scale(1)',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    transform: 'scale(1.01)',
                  }
                }}
              >
                <input {...getInputProps()} />
                <Zoom in={true}>
                  <CloudUploadIcon 
                    sx={{ 
                      fontSize: 80, 
                      color: isDragActive ? 'primary.main' : 'text.secondary',
                      mb: 2,
                      transition: 'all 0.3s ease'
                    }} 
                  />
                </Zoom>
                <Typography 
                  variant="h5" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 600,
                    color: isDragActive ? 'primary.main' : 'text.primary'
                  }}
                >
                  {isDragActive ? 'Drop your files here!' : 'Drag & drop files here'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  or click to browse and select files
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                  {['PDF', 'DOCX', 'JPG', 'PNG', 'TIFF'].map((format) => (
                    <Chip 
                      key={format}
                      label={format} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Stack>
                <Typography variant="caption" display="block" sx={{ mt: 2, opacity: 0.7 }}>
                  Maximum file size: {APP_CONFIG.fileUpload.maxSize / (1024 * 1024)}MB per file
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Document Type Selector */}
        <Grid item xs={12} lg={4}>
          <DocumentTypeSelector
            value={selectedType}
            onChange={(value) => setSelectedType(value)}
          />
        </Grid>

        {/* Upload Summary */}
        {files.length > 0 && (
          <Grid item xs={12}>
            <Fade in={true}>
              <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Upload Queue ({files.length} files)
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        onClick={clearAllFiles}
                        disabled={isUploading}
                        startIcon={<DeleteIcon />}
                      >
                        Clear All
                      </Button>
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    {pendingFiles > 0 && (
                      <Chip 
                        label={`${pendingFiles} pending`} 
                        color="default" 
                        size="small" 
                      />
                    )}
                    {completedFiles > 0 && (
                      <Chip 
                        label={`${completedFiles} completed`} 
                        color="success" 
                        size="small" 
                      />
                    )}
                    {errorFiles > 0 && (
                      <Chip 
                        label={`${errorFiles} failed`} 
                        color="error" 
                        size="small" 
                      />
                    )}
                  </Stack>

                  {/* File List */}
                  <Stack spacing={2}>
                    {files.map((fileWrapper, index) => (
                      <Card key={index} variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              {getStatusIcon(fileWrapper.status)}
                              <Box sx={{ ml: 2, flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {fileWrapper.file.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatFileSize(fileWrapper.file.size)}
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {fileWrapper.status === 'uploading' && (
                                <Box sx={{ minWidth: 100, mr: 2 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={fileWrapper.progress} 
                                    sx={{ height: 6, borderRadius: 3 }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {fileWrapper.progress}%
                                  </Typography>
                                </Box>
                              )}
                              
                              <IconButton
                                size="small"
                                onClick={() => removeFile(index)}
                                disabled={fileWrapper.status === 'uploading'}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                          
                          {fileWrapper.error && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              {fileWrapper.error}
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>

                  {/* Upload Button */}
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Button
                      variant="contained"
                      size="large"
                      disabled={!canUpload}
                      onClick={handleUpload}
                      startIcon={<FileUploadIcon />}
                      sx={{ 
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        background: canUpload 
                          ? `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
                          : undefined,
                        '&:hover': {
                          background: canUpload 
                            ? `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`
                            : undefined,
                        }
                      }}
                    >
                      Upload {pendingFiles} Document{pendingFiles !== 1 ? 's' : ''}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        )}

        {/* Help Text */}
        {files.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>Upload Tips:</strong> Select a document type before uploading. 
                You can upload multiple files at once. Supported formats include PDF, DOCX, images, and more.
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DocumentUpload;
