import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  CloudUpload,
  MoreVert,
  Download,
  Share,
  Delete,
  Edit,
  Visibility,
  PictureAsPdf,
  Description,
  Image,
  VideoFile,
  Add,
  SortByAlpha,
  CalendarToday,
  Person,
  Refresh,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { apiClient } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
  uploadedBy: string;
  status: string;
  category: string;
  tags: string[];
}

const DocumentsPage: React.FC = () => {
  const theme = useTheme();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuDocument, setMenuDocument] = useState<Document | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Load documents from backend
  useEffect(() => {
    loadDocuments();
    
    // Set up periodic refresh to catch new uploads
    const refreshInterval = setInterval(() => {
      loadDocuments();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/documents/documents');
      // Transform backend response to frontend format
      const transformedDocuments: Document[] = response.data.map((doc: any) => ({
        id: doc.id,
        name: doc.original_filename || doc.filename,
        type: doc.mime_type?.split('/')[1] || 'file',
        size: `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`,
        uploadDate: new Date(doc.created_at).toISOString().split('T')[0],
        uploadedBy: doc.uploaded_by,
        status: doc.status,
        category: doc.category,
        tags: doc.tags || []
      }));
      setDocuments(transformedDocuments);
    } catch (error) {
      console.error('Failed to load documents:', error);
      // Keep mock data as fallback
      setDocuments([
        {
          id: '1',
          name: 'Annual Report 2024.pdf',
          type: 'pdf',
          size: '2.4 MB',
          uploadDate: '2024-01-15',
          uploadedBy: 'John Doe',
          status: 'approved',
          category: 'Finance',
          tags: ['Annual', 'Report', 'Finance'],
        },
        {
          id: '2',
          name: 'Project Proposal.docx',
          type: 'doc',
          size: '1.2 MB',
          uploadDate: '2024-01-14',
          uploadedBy: 'Sarah Wilson',
          status: 'pending',
          category: 'Projects',
          tags: ['Proposal', 'Project'],
        },
        {
          id: '3',
          name: 'Team Photo.jpg',
          type: 'image',
          size: '3.8 MB',
          uploadDate: '2024-01-13',
          uploadedBy: 'Mike Johnson',
          status: 'approved',
          category: 'HR',
          tags: ['Team', 'Photo', 'HR'],
        },
        {
          id: '4',
          name: 'Training Video.mp4',
          type: 'video',
          size: '45.2 MB',
          uploadDate: '2024-01-12',
          uploadedBy: 'Lisa Chen',
          status: 'processing',
          category: 'Training',
          tags: ['Training', 'Video', 'Education'],
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <PictureAsPdf sx={{ fontSize: 40, color: '#d32f2f' }} />;
      case 'doc': return <Description sx={{ fontSize: 40, color: '#1976d2' }} />;
      case 'image': return <Image sx={{ fontSize: 40, color: '#388e3c' }} />;
      case 'video': return <VideoFile sx={{ fontSize: 40, color: '#f57c00' }} />;
      default: return <Description sx={{ fontSize: 40, color: theme.palette.grey[500] }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return theme.palette.success.main;
      case 'rejected': return theme.palette.error.main;
      case 'processing': return theme.palette.warning.main;
      case 'pending': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(acceptedFiles);
    setUploadDialogOpen(true);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc', '.docx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'video/*': ['.mp4', '.avi', '.mov'],
    },
  });

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Document action handlers
  const handleViewDocument = (doc: Document) => {
    // In a real implementation, this would open the document in a viewer or new tab
    window.open(`/api/documents/${doc.id}/view`, '_blank');
  };

  const handleDownloadDocument = (doc: Document) => {
    // In a real implementation, this would download the actual file
    const link = document.createElement('a');
    link.href = `/api/documents/${doc.id}/download`;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShareDialogOpen(true);
  };

  const handleEditDocument = (doc: Document) => {
    // In a real implementation, this would open an edit dialog or navigate to edit page
    console.log('Editing document:', doc.name);
    // Could open edit dialog or navigate to edit page
  };

  const handleDeleteDocument = (doc: Document) => {
    // In a real implementation, this would delete the document after confirmation
    if (window.confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      console.log('Deleting document:', doc.name);
      // Call API to delete document
    }
  };

  const handleUploadFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('description', `Uploaded from documents page`);
        formData.append('category', 'general');
        formData.append('priority', 'medium');

        await apiClient.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setUploadDialogOpen(false);
      setSelectedFiles([]);
      
      // Refresh documents list immediately to show new uploads
      await loadDocuments();
      
      // Show success message
      toast.showSuccess(`${selectedFiles.length} file(s) uploaded successfully! Processing tasks have been created for each document.`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.showError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSendShare = async () => {
    try {
      if (!selectedDocument || !shareEmail) return;

      // In a real implementation, this would send share email via backend
      console.log('Sharing document:', selectedDocument.name, 'with:', shareEmail);
      
      // Mock API call
      // await apiClient.post('/documents/share', {
      //   documentId: selectedDocument.id,
      //   email: shareEmail,
      //   message: shareMessage
      // });

      setShareDialogOpen(false);
      setShareEmail('');
      setShareMessage('');
      setSelectedDocument(null);
      
      toast.showSuccess('Document shared successfully!');
    } catch (error) {
      console.error('Share failed:', error);
      toast.showError('Failed to share document. Please try again.');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, doc: Document) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuDocument(doc);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuDocument(null);
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Document Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload, organize, and manage your documents with AI-powered features.
        </Typography>
      </Box>

      {/* Action Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filterCategory}
                  label="Category"
                  onChange={(e) => setFilterCategory(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Projects">Projects</MenuItem>
                  <MenuItem value="HR">HR</MenuItem>
                  <MenuItem value="Training">Training</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="date">Upload Date</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="size">File Size</MenuItem>
                  <MenuItem value="type">File Type</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Tooltip title="Filter">
                  <IconButton>
                    <FilterList />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh Documents">
                  <IconButton 
                    onClick={loadDocuments}
                    disabled={loading}
                    sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => setUploadDialogOpen(true)}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                    },
                  }}
                >
                  Upload
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Document Grid */}
      <Grid container spacing={3}>
        {filteredDocuments.map((document) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={document.id}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* File Icon and Menu */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.grey[500], 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getFileIcon(document.type)}
                  </Box>
                  <IconButton size="small" onClick={(e) => handleMenuOpen(e, document)}>
                    <MoreVert />
                  </IconButton>
                </Box>

                {/* Document Info */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {document.name}
                </Typography>

                <Box display="flex" alignItems="center" mb={1}>
                  <Chip
                    label={document.status}
                    size="small"
                    sx={{
                      backgroundColor: alpha(getStatusColor(document.status), 0.1),
                      color: getStatusColor(document.status),
                      fontWeight: 600,
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {document.size}
                  </Typography>
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  {document.category} • {document.uploadDate}
                </Typography>

                {/* Tags */}
                <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                  {document.tags.slice(0, 2).map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                  {document.tags.length > 2 && (
                    <Chip
                      label={`+${document.tags.length - 2}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  )}
                </Box>

                {/* Uploaded By */}
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                    {document.uploadedBy.charAt(0)}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    {document.uploadedBy}
                  </Typography>
                </Box>

                {/* Actions */}
                <Box display="flex" gap={1}>
                  <Tooltip title="View">
                    <IconButton size="small" color="primary" onClick={() => handleViewDocument(document)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton size="small" color="primary" onClick={() => handleDownloadDocument(document)}>
                      <Download />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Share">
                    <IconButton size="small" color="primary" onClick={() => handleShareDocument(document)}>
                      <Share />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" color="primary" onClick={() => handleEditDocument(document)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <Card sx={{ mt: 4 }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Description sx={{ fontSize: 80, color: theme.palette.grey[400], mb: 2 }} />
            <Typography variant="h6" color="text.secondary" mb={1}>
              No documents found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Try adjusting your search criteria or upload your first document.
            </Typography>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              Upload Document
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upload FAB */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
          },
        }}
        onClick={() => setUploadDialogOpen(true)}
      >
        <Add />
      </Fab>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Documents</DialogTitle>
        <DialogContent>
          <Box
            {...getRootProps()}
            sx={{
              border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[300]}`,
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              backgroundColor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              mb: 3,
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
            <Typography variant="h6" mb={1}>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              or click to browse files
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Supports PDF, DOC, DOCX, Images, and Videos
            </Typography>
          </Box>

          {selectedFiles.length > 0 && (
            <Box>
              <Typography variant="h6" mb={2}>
                Selected Files ({selectedFiles.length})
              </Typography>
              {selectedFiles.map((file, index) => (
                <Box
                  key={index}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  p={2}
                  border={`1px solid ${theme.palette.divider}`}
                  borderRadius={2}
                  mb={1}
                >
                  <Box display="flex" alignItems="center">
                    <Description sx={{ mr: 2, color: theme.palette.grey[500] }} />
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={selectedFiles.length === 0 || uploading}
            onClick={handleUploadFiles}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {uploading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Uploading...
              </>
            ) : (
              `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Document</DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Sharing: {selectedDocument.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedDocument.category} • {selectedDocument.size}
              </Typography>
            </Box>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Message (Optional)"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={shareMessage}
            onChange={(e) => setShareMessage(e.target.value)}
            placeholder="Add a message to the recipient..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendShare}
            disabled={!shareEmail}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Share
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {menuDocument && [
          <MenuItem
            key="view"
            onClick={() => {
              handleViewDocument(menuDocument);
              handleMenuClose();
            }}
          >
            <Visibility sx={{ mr: 2 }} />
            View
          </MenuItem>,
          <MenuItem
            key="download"
            onClick={() => {
              handleDownloadDocument(menuDocument);
              handleMenuClose();
            }}
          >
            <Download sx={{ mr: 2 }} />
            Download
          </MenuItem>,
          <MenuItem
            key="share"
            onClick={() => {
              handleShareDocument(menuDocument);
              handleMenuClose();
            }}
          >
            <Share sx={{ mr: 2 }} />
            Share
          </MenuItem>,
          <MenuItem
            key="edit"
            onClick={() => {
              handleEditDocument(menuDocument);
              handleMenuClose();
            }}
          >
            <Edit sx={{ mr: 2 }} />
            Edit
          </MenuItem>,
          <MenuItem
            key="delete"
            onClick={() => {
              handleDeleteDocument(menuDocument);
              handleMenuClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Delete sx={{ mr: 2 }} />
            Delete
          </MenuItem>,
        ]}
      </Menu>
    </Box>
  );
};

export default DocumentsPage;