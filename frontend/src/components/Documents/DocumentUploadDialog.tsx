import React from 'react';
import AppDialog from '../Common/AppDialog';
import {
  Box,
  Stack,
  Typography,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent,
  TextareaAutosize,
} from '@mui/material';
import FileUpload from '../Common/FileUpload';
import AppButton from '../Common/AppButton';
import AppInput from '../Common/AppInput';

interface DocumentUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[], metadata: DocumentMetadata) => void;
  categories: { value: string; label: string }[];
  priorities: { value: string; label: string }[];
}

interface DocumentMetadata {
  title: string;
  category: string;
  priority: string;
  description: string;
}

const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  open,
  onClose,
  onUpload,
  categories,
  priorities,
}) => {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [metadata, setMetadata] = React.useState<DocumentMetadata>({
    title: '',
    category: '',
    priority: '',
    description: '',
  });
  const [error, setError] = React.useState<string>('');

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles(files);
    setError('');
  };

  const handleMetadataChange = (
    field: keyof DocumentMetadata,
    value: string
  ) => {
    setMetadata((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpload = () => {
    if (!selectedFiles.length) {
      setError('Please select files to upload');
      return;
    }

    if (!metadata.title || !metadata.category || !metadata.priority) {
      setError('Please fill in all required fields');
      return;
    }

    onUpload(selectedFiles, metadata);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setMetadata({
      title: '',
      category: '',
      priority: '',
      description: '',
    });
    setError('');
    onClose();
  };

  const renderActions = () => (
    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
      <AppButton
        variant="secondary"
        onClick={handleClose}
      >
        Cancel
      </AppButton>
      <AppButton
        variant="primary"
        onClick={handleUpload}
      >
        Upload
      </AppButton>
    </Box>
  );

  return (
    <AppDialog
      open={open}
      onClose={handleClose}
      title="Upload Documents"
      actions={renderActions()}
    >
      <Stack spacing={3}>
        <FileUpload
          onFilesSelected={handleFileSelect}
          error={error}
          title="Drop files here"
          description="Supported formats: PDF, DOCX, PNG, JPEG"
          maxSize={50 * 1024 * 1024} // 50MB
        />

        {selectedFiles.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Selected Files:
            </Typography>
            {selectedFiles.map((file, index) => (
              <Typography key={index} variant="body2" color="textSecondary">
                {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </Typography>
            ))}
          </Box>
        )}

        <AppInput
          label="Title"
          placeholder="Enter document title"
          value={metadata.title}
          onChange={(e) => handleMetadataChange('title', e.target.value)}
          fullWidth
          required
        />

        <FormControl fullWidth required>
          <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500 }}>
            Category
          </Typography>
          <Select
            value={metadata.category}
            onChange={(e: SelectChangeEvent) =>
              handleMetadataChange('category', e.target.value)
            }
            displayEmpty
          >
            <MenuItem value="" disabled>
              Select category
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.value} value={category.value}>
                {category.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth required>
          <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500 }}>
            Priority
          </Typography>
          <Select
            value={metadata.priority}
            onChange={(e: SelectChangeEvent) =>
              handleMetadataChange('priority', e.target.value)
            }
            displayEmpty
          >
            <MenuItem value="" disabled>
              Select priority
            </MenuItem>
            {priorities.map((priority) => (
              <MenuItem key={priority.value} value={priority.value}>
                {priority.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 500, display: 'block' }}>
            Description
          </Typography>
          <TextareaAutosize
            minRows={3}
            placeholder="Enter document description"
            value={metadata.description}
            onChange={(e) => handleMetadataChange('description', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </Box>
      </Stack>
    </AppDialog>
  );
};

export default DocumentUploadDialog;
