import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useToast } from '../../contexts/ToastContext';
import { useAccessibility } from '../../utils/accessibility';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Avatar,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  Description,
  People,
  CloudUpload,
  Analytics,
  Notifications,
  CheckCircle,
  Schedule,
  Warning,
  MoreVert,
  Add,
  FileUpload,
  Search,
  TaskAlt,
  Accessibility,
  Language,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, toErrorMessage } from '../../services/api';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactElement;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, color, trend }) => {
  const theme = useTheme();
  const { translate } = useAccessibility();
  
  return (
    <Card
      role="article"
      aria-labelledby={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`}
      aria-describedby={change ? `stat-change-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined}
      tabIndex={0}
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        '&:focus': {
          outline: `2px solid ${color}`,
          outlineOffset: '2px',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography 
              id={`stat-${title.replace(/\s+/g, '-').toLowerCase()}`}
              variant="body2" 
              color="text.secondary" 
              sx={{ mb: 1 }}
              component="h3"
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ fontWeight: 700, color: color }}
              aria-label={`${title}: ${value}`}
            >
              {value}
            </Typography>
            {change && (
              <Box 
                id={`stat-change-${title.replace(/\s+/g, '-').toLowerCase()}`}
                display="flex" 
                alignItems="center" 
                mt={1}
                aria-label={`Change: ${change}`}
              >
                <TrendingUp
                  aria-hidden="true"
                  sx={{
                    fontSize: 16,
                    color: trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
                    mr: 0.5,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
                    fontWeight: 600,
                  }}
                >
                  {change}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            role="img"
            aria-label={`${title} icon`}
            sx={{
              width: 60,
              height: 60,
              borderRadius: 3,
              backgroundColor: alpha(color, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon, { 
              'aria-hidden': 'true',
              sx: { fontSize: 28, color } 
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

interface RecentActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  avatar?: string;
  type: 'upload' | 'approval' | 'task' | 'integration';
}

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { announce, announceSuccess, announceError, registerShortcut, unregisterShortcut, translate } = useAccessibility();
  
  // Refs for accessibility
  const mainContentRef = useRef<HTMLElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const taskButtonRef = useRef<HTMLButtonElement>(null);
  
  // State for upload dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // State for create task dialog
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  
  const [recentActivity] = useState<RecentActivityItem[]>([
    {
      id: '1',
      user: 'John Doe',
      action: 'uploaded',
      target: 'Annual Report 2024.pdf',
      time: '2 minutes ago',
      type: 'upload',
    },
    {
      id: '2',
      user: 'Sarah Wilson',
      action: 'approved',
      target: 'Budget Proposal',
      time: '15 minutes ago',
      type: 'approval',
    },
    {
      id: '3',
      user: 'Mike Johnson',
      action: 'completed task',
      target: 'Document Review',
      time: '1 hour ago',
      type: 'task',
    },
    {
      id: '4',
      user: 'System',
      action: 'integrated',
      target: 'Google Drive sync',
      time: '2 hours ago',
      type: 'integration',
    },
  ]);

  // Initialize accessibility features
  useEffect(() => {
    // Announce page load
    announce(translate('dashboard') + ' page loaded');
    
    // Register keyboard shortcuts
    registerShortcut('Ctrl+U', handleUploadClick);
    registerShortcut('Ctrl+T', handleCreateTaskClick);
    registerShortcut('Ctrl+/', handleSearchClick);
    
    // Focus main content on load
    if (mainContentRef.current) {
      mainContentRef.current.focus();
    }
    
    // Cleanup shortcuts on unmount
    return () => {
      unregisterShortcut('Ctrl+U');
      unregisterShortcut('Ctrl+T');
      unregisterShortcut('Ctrl+/');
    };
  }, []);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'upload': return <CloudUpload sx={{ fontSize: 16 }} />;
      case 'approval': return <CheckCircle sx={{ fontSize: 16 }} />;
      case 'task': return <TaskAlt sx={{ fontSize: 16 }} />;
      case 'integration': return <Analytics sx={{ fontSize: 16 }} />;
      default: return <Description sx={{ fontSize: 16 }} />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'upload': return theme.palette.info.main;
      case 'approval': return theme.palette.success.main;
      case 'task': return theme.palette.warning.main;
      case 'integration': return theme.palette.secondary.main;
      default: return theme.palette.grey[500];
    }
  };

  // Handler functions with accessibility announcements
  const handleUploadClick = () => {
    announce('Opening upload dialog');
    setUploadDialogOpen(true);
  };

  const handleSearchClick = () => {
    announce('Navigating to search page');
    navigate('../Search/SearchPage.tsx');
  };

  const handleCreateTaskClick = () => {
    announce('Opening task creation dialog');
    setTaskDialogOpen(true);
  };

  const handleViewReportsClick = () => {
    announce('Navigating to reports page');
    navigate('../Analytics/AnalyticsPage.tsx');
  };

  // Legacy handler names for backward compatibility
  const handleUploadDocument = handleUploadClick;
  const handleSearchDocuments = handleSearchClick;
  const handleCreateTask = handleCreateTaskClick;
  const handleViewReports = handleViewReportsClick;

  // File upload handlers
  const onDrop = (acceptedFiles: File[]) => {
    setSelectedFiles(acceptedFiles);
  };

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

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) {
      announceError('Please select files to upload');
      return;
    }

    announce('Starting file upload');
    setUploading(true);
    
    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('description', `Uploaded from dashboard by ${user?.email}`);
        formData.append('category', 'general');
        formData.append('priority', 'medium');

        await apiClient.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setUploadDialogOpen(false);
      setSelectedFiles([]);
      
      const successMessage = `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} uploaded successfully! Processing tasks created.`;
      toast.showSuccess(successMessage);
      announceSuccess(successMessage);
      
      // Navigate to documents page to see uploaded files
      navigate('../Documents/DocumentsPage.tsx');
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = toErrorMessage(error) || 'Upload failed. Please try again.';
      toast.showError(errorMessage);
      announceError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleTaskCreate = async () => {
    if (!newTaskTitle.trim()) {
      announceError('Task title is required');
      return;
    }

    announce('Creating new task');
    
    try {
      await apiClient.post('/tasks/tasks', {
        title: newTaskTitle,
        description: newTaskDescription,
        assigned_to: user?.id || user?.email, // Assign to current user
        priority: newTaskPriority,
        status: 'PENDING',
        category: 'general',
        task_type: 'TODO'
      });

      setTaskDialogOpen(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('medium');
      
      const successMessage = 'Task created successfully!';
      toast.showSuccess(successMessage);
      announceSuccess(successMessage);
      
      // Navigate to tasks page to see the new task
      navigate('../Tasks/TasksPage.tsx');
    } catch (error) {
      console.error('Task creation failed:', error);
      const errorMessage = toErrorMessage(error) || 'Failed to create task. Please try again.';
      toast.showError(errorMessage);
      announceError(errorMessage);
    }
  };

  return (
    <Box component="main" ref={mainContentRef} tabIndex={-1} role="main" aria-label={translate('dashboard')}>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
          aria-label={`Welcome back, ${user?.full_name || user?.username || 'User'}`}
        >
          Welcome back, {user?.full_name || user?.username || 'User'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your documents and tasks today.
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 4 }} role="region" aria-label="Quick actions">
        <Grid item xs={12} sm={6} md={3}>
          <Button
            ref={uploadButtonRef}
            fullWidth
            variant="contained"
            startIcon={<FileUpload aria-hidden="true" />}
            onClick={handleUploadDocument}
            aria-label={`${translate('upload')} document (keyboard shortcut: Ctrl+U)`}
            aria-describedby="upload-help"
            sx={{
              py: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              },
            }}
          >
            {translate('upload')} Document
          </Button>
          <Typography id="upload-help" className="sr-only">
            Upload documents from your computer to the MetroMind system
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            ref={searchButtonRef}
            fullWidth
            variant="outlined"
            startIcon={<Search aria-hidden="true" />}
            onClick={handleSearchDocuments}
            aria-label={`${translate('search')} documents (keyboard shortcut: Ctrl+/)`}
            aria-describedby="search-help"
            sx={{ py: 2 }}
          >
            {translate('search')} Documents
          </Button>
          <Typography id="search-help" className="sr-only">
            Search and filter through uploaded documents
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            ref={taskButtonRef}
            fullWidth
            variant="outlined"
            startIcon={<Add aria-hidden="true" />}
            onClick={handleCreateTask}
            aria-label={`Create new task (keyboard shortcut: Ctrl+T)`}
            aria-describedby="task-help"
            sx={{ py: 2 }}
          >
            Create Task
          </Button>
          <Typography id="task-help" className="sr-only">
            Create a new task or assignment
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Analytics aria-hidden="true" />}
            onClick={handleViewReports}
            aria-label="View analytics reports and insights"
            aria-describedby="reports-help"
            sx={{ py: 2 }}
          >
            View Reports
          </Button>
          <Typography id="reports-help" className="sr-only">
            Access analytics, reports, and data insights
          </Typography>
        </Grid>
      </Grid>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }} role="region" aria-label="Statistics overview">
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Documents"
            value="1,247"
            change="+12% from last month"
            icon={<Description />}
            color={theme.palette.primary.main}
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Tasks"
            value="23"
            change="+5 this week"
            icon={<Schedule />}
            color={theme.palette.warning.main}
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Team Members"
            value="48"
            change="+3 new members"
            icon={<People />}
            color={theme.palette.success.main}
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Integrations"
            value="12"
            change="2 active syncs"
            icon={<CloudUpload />}
            color={theme.palette.secondary.main}
            trend="neutral"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Activity
                </Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              
              <Box>
                {recentActivity.map((activity, index) => (
                  <Box
                    key={activity.id}
                    display="flex"
                    alignItems="center"
                    py={2}
                    sx={{
                      borderBottom: index < recentActivity.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        backgroundColor: alpha(getActionColor(activity.type), 0.1),
                        color: getActionColor(activity.type),
                        mr: 2,
                      }}
                    >
                      {getActionIcon(activity.type)}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        <strong>{activity.user}</strong> {activity.action}{' '}
                        <strong>{activity.target}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.time}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Task Progress */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Task Progress
              </Typography>
              
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Document Review
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    75%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={75}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    },
                  }}
                />
              </Box>

              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Integration Setup
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    45%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={45}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      backgroundColor: theme.palette.warning.main,
                    },
                  }}
                />
              </Box>

              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    User Training
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    90%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={90}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      backgroundColor: theme.palette.success.main,
                    },
                  }}
                />
              </Box>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('../Tasks/TasksPage.tsx')}
                sx={{ mt: 3 }}
              >
                View All Tasks
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          announce('Upload dialog closed');
          setUploadDialogOpen(false);
        }}
        maxWidth="md"
        fullWidth
        aria-labelledby="upload-dialog-title"
        aria-describedby="upload-dialog-description"
      >
        <DialogTitle id="upload-dialog-title">
          {translate('upload')} Documents
        </DialogTitle>
        <DialogContent>
          <Typography id="upload-dialog-description" className="sr-only">
            Upload documents by dragging and dropping files or clicking to browse. Supports PDF, DOC, DOCX, Images, and Videos.
          </Typography>
          <Box
            {...getRootProps()}
            role="button"
            tabIndex={0}
            aria-label="File upload area. Click to browse files or drag and drop files here"
            aria-describedby="upload-formats"
            sx={{
              border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[300]}`,
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              backgroundColor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              mb: 3,
              '&:focus': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px',
              },
            }}
          >
            <input {...getInputProps()} aria-hidden="true" />
            <CloudUpload 
              aria-hidden="true"
              sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} 
            />
            <Typography variant="h6" mb={1}>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              or click to browse files
            </Typography>
            <Typography id="upload-formats" variant="caption" color="text.secondary">
              Supports PDF, DOC, DOCX, Images, and Videos
            </Typography>
          </Box>

          {selectedFiles.length > 0 && (
            <Box role="region" aria-labelledby="selected-files-heading">
              <Typography id="selected-files-heading" variant="h6" mb={2}>
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
                  role="listitem"
                  aria-label={`File: ${file.name}, size: ${(file.size / 1024 / 1024).toFixed(2)} MB`}
                >
                  <Box display="flex" alignItems="center">
                    <Description aria-hidden="true" sx={{ mr: 2, color: theme.palette.grey[500] }} />
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
                    aria-label={`Remove ${file.name} from upload list`}
                    onClick={() => {
                      announce(`${file.name} removed from upload list`);
                      setSelectedFiles(files => files.filter((_, i) => i !== index));
                    }}
                  >
                    <Warning aria-hidden="true" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              announce('Upload dialog cancelled');
              setUploadDialogOpen(false);
            }}
            aria-label="Cancel upload and close dialog"
          >
            {translate('cancel')}
          </Button>
          <Button
            variant="contained"
            aria-label={`Upload ${selectedFiles.length} selected file${selectedFiles.length !== 1 ? 's' : ''}`}
            disabled={selectedFiles.length === 0 || uploading}
            onClick={handleFileUpload}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog
        open={taskDialogOpen}
        onClose={() => {
          announce('Task creation dialog closed');
          setTaskDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
        aria-labelledby="task-dialog-title"
        aria-describedby="task-dialog-description"
      >
        <DialogTitle id="task-dialog-title">Create New Task</DialogTitle>
        <DialogContent>
          <Typography id="task-dialog-description" className="sr-only">
            Fill out the form below to create a new task. Task title is required.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              label="Task Title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              fullWidth
              required
              aria-describedby="task-title-help"
              aria-invalid={!newTaskTitle.trim() && newTaskTitle.length > 0}
              inputProps={{
                'aria-label': 'Task title, required field',
                maxLength: 200
              }}
            />
            <Typography id="task-title-help" className="sr-only">
              Enter a clear, descriptive title for your task. This field is required.
            </Typography>
            
            <TextField
              label="Description"
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
              aria-describedby="task-description-help"
              inputProps={{
                'aria-label': 'Task description, optional field',
                maxLength: 1000
              }}
            />
            <Typography id="task-description-help" className="sr-only">
              Provide additional details about the task. This field is optional.
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                label="Priority"
                aria-describedby="priority-help"
                inputProps={{
                  'aria-label': 'Task priority level'
                }}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
              <Typography id="priority-help" className="sr-only">
                Select the priority level for this task. Default is medium priority.
              </Typography>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              announce('Task creation cancelled');
              setTaskDialogOpen(false);
            }}
            aria-label="Cancel task creation and close dialog"
          >
            {translate('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleTaskCreate}
            disabled={!newTaskTitle.trim()}
            aria-label={`Create new task${newTaskTitle.trim() ? ': ' + newTaskTitle.trim() : ''}`}
            aria-describedby={!newTaskTitle.trim() ? 'create-task-error' : undefined}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Create Task
          </Button>
          {!newTaskTitle.trim() && (
            <Typography id="create-task-error" className="sr-only">
              Task title is required to create a task
            </Typography>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardPage;