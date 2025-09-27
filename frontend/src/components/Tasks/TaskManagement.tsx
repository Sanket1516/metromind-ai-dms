import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Menu,
  Tabs,
  Tab,
  CircularProgress,
  Autocomplete,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Paper,
  Badge,
  Stack,
  MenuList
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  Comment as CommentIcon,
  CalendarToday as CalendarIcon,
  PriorityHigh as PriorityIcon,
  Schedule as ScheduleIcon,
  Pause as PauseIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../contexts/AuthContext';
import { api, taskAPI } from '../../services/api';

// TypeScript Interfaces
interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  name?: string;
}

interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string;
  assigned_to_name?: string;
  created_by: string;
  created_by_name?: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  comments: TaskComment[];
  progress: number;
  estimated_hours?: number;
  actual_hours?: number;
}

interface TaskFormData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string;
  due_date: Date | null;
  tags: string[];
  estimated_hours?: number;
}

interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  overdue: number;
}

// Utility Functions
const getPriorityColor = (priority: Task['priority']): 'error' | 'warning' | 'info' | 'success' | 'default' => {
  switch (priority) {
    case 'urgent': return 'error';
    case 'high': return 'warning';
    case 'medium': return 'info';
    case 'low': return 'success';
    default: return 'default';
  }
};

const getStatusColor = (status: Task['status']): 'success' | 'info' | 'warning' | 'error' | 'default' => {
  switch (status) {
    case 'completed': return 'success';
    case 'in_progress': return 'info';
    case 'pending': return 'warning';
    case 'cancelled': return 'error';
    default: return 'default';
  }
};

const getDaysUntilDue = (dueDate: string): number | null => {
  if (!dueDate) return null;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Task Card Component
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onAddComment: (taskId: string, comment: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  onAddComment 
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    onStatusChange(task.id, newStatus);
    handleMenuClose();
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      onAddComment(task.id, commentText);
      setCommentText('');
    }
  };

  const daysUntilDue = getDaysUntilDue(task.due_date);
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;

  return (
    <Card 
      sx={{ 
        mb: 2,
        border: isOverdue ? '2px solid #f44336' : isDueSoon ? '2px solid #ff9800' : 'none',
        '&:hover': { boxShadow: 3 }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              {task.title}
              {isOverdue && (
                <Chip 
                  label="Overdue" 
                  color="error" 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              )}
              {isDueSoon && (
                <Chip 
                  label="Due Soon" 
                  color="warning" 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            
            {task.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {task.description}
              </Typography>
            )}
            
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip 
                label={task.status.replace('_', ' ')} 
                color={getStatusColor(task.status)} 
                size="small" 
              />
              <Chip 
                label={task.priority.toUpperCase()} 
                color={getPriorityColor(task.priority)} 
                size="small" 
                icon={<FlagIcon />}
              />
              {task.tags.map((tag, index) => (
                <Chip key={index} label={tag} size="small" variant="outlined" />
              ))}
            </Stack>

            <Box display="flex" alignItems="center" gap={2} mb={2}>
              {task.assigned_to_name && (
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon fontSize="small" />
                  <Typography variant="body2">
                    {task.assigned_to_name}
                  </Typography>
                </Box>
              )}
              
              {task.due_date && (
                <Box display="flex" alignItems="center" gap={1}>
                  <CalendarIcon fontSize="small" />
                  <Typography variant="body2">
                    {new Date(task.due_date).toLocaleDateString()}
                  </Typography>
                </Box>
              )}

              {task.comments.length > 0 && (
                <Box display="flex" alignItems="center" gap={1}>
                  <CommentIcon fontSize="small" />
                  <Typography variant="body2">
                    {task.comments.length}
                  </Typography>
                </Box>
              )}
            </Box>

            {task.progress > 0 && (
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Progress</Typography>
                  <Typography variant="body2">{task.progress}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={task.progress} 
                  sx={{ mb: 2 }}
                />
              </Box>
            )}
          </Box>

          <IconButton onClick={handleMenuClick}>
            <MoreVertIcon />
          </IconButton>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuList>
              <MenuItem onClick={() => { onEdit(task); handleMenuClose(); }}>
                <ListItemIcon><EditIcon /></ListItemIcon>
                <ListItemText>Edit</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => setShowComments(!showComments)}>
                <ListItemIcon><CommentIcon /></ListItemIcon>
                <ListItemText>Comments</ListItemText>
              </MenuItem>
              <Divider />
              {task.status !== 'in_progress' && (
                <MenuItem onClick={() => handleStatusChange('in_progress')}>
                  <ListItemIcon><PlayIcon /></ListItemIcon>
                  <ListItemText>Start</ListItemText>
                </MenuItem>
              )}
              {task.status !== 'completed' && (
                <MenuItem onClick={() => handleStatusChange('completed')}>
                  <ListItemIcon><CheckCircleIcon /></ListItemIcon>
                  <ListItemText>Complete</ListItemText>
                </MenuItem>
              )}
              <Divider />
              <MenuItem onClick={() => { onDelete(task.id); handleMenuClose(); }}>
                <ListItemIcon><DeleteIcon color="error" /></ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>

        {/* Comments Section */}
        {showComments && (
          <Box mt={2}>
            <Typography variant="h6" gutterBottom>
              Comments ({task.comments.length})
            </Typography>
            
            <List>
              {task.comments.map((comment) => (
                <ListItem key={comment.id} alignItems="flex-start">
                  <ListItemIcon>
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {comment.user_name.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={comment.user_name}
                    secondary={
                      <>
                        <Typography variant="body2" component="span">
                          {comment.content}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(comment.created_at).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Box display="flex" gap={1} mt={2}>
              <TextField
                size="small"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Button 
                size="small" 
                onClick={handleAddComment} 
                disabled={!commentText.trim()}
                variant="contained"
              >
                Add
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Task Form Dialog Component
interface TaskFormDialogProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  users: User[];
  onSave: (taskData: TaskFormData) => void;
}

const TaskFormDialog: React.FC<TaskFormDialogProps> = ({
  open,
  onClose,
  task,
  users,
  onSave
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
    due_date: null,
    tags: [],
    estimated_hours: undefined
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigned_to: task.assigned_to,
        due_date: task.due_date ? new Date(task.due_date) : null,
        tags: task.tags,
        estimated_hours: task.estimated_hours
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        due_date: null,
        tags: [],
        estimated_hours: undefined
      });
    }
  }, [task, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {task ? 'Edit Task' : 'Create New Task'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  value={formData.assigned_to}
                  label="Assigned To"
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  required
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name || `${user.first_name} ${user.last_name}`} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Due Date"
                value={formData.due_date}
                onChange={(date) => setFormData({ ...formData, due_date: date })}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Hours"
                type="number"
                value={formData.estimated_hours || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  estimated_hours: e.target.value ? Number(e.target.value) : undefined 
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[]}
                value={formData.tags}
                onChange={(_, newValue) => setFormData({ ...formData, tags: newValue })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Tags"
                    placeholder="Add tags..."
                  />
                )}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={saving || !formData.title || !formData.assigned_to}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {task ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Task Statistics Component
interface TaskStatisticsProps {
  stats: TaskStats;
}

const TaskStatistics: React.FC<TaskStatisticsProps> = ({ stats }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Tasks
            </Typography>
            <Typography variant="h4">
              {stats.total}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              In Progress
            </Typography>
            <Typography variant="h4" color="info.main">
              {stats.in_progress}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Completed
            </Typography>
            <Typography variant="h4" color="success.main">
              {stats.completed}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Overdue
            </Typography>
            <Typography variant="h4" color="error.main">
              {stats.overdue}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// Main Task Management Component
const TaskManagement: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    in_progress: 0,
    pending: 0,
    overdue: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  
  // Dialog states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadTasks();
    loadUsers();
    loadStats();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/tasks');
  
      // Normalize backend payload to UI Task interface
      const priorityNumToStr: Record<number | string, Task['priority']> = {
        1: 'low',
        2: 'medium',
        3: 'high',
        4: 'urgent',
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'urgent',
      };
  
      const statusStrToUi = (s: string): Task['status'] => {
        const key = String(s || '').toUpperCase();
        switch (key) {
          case 'PENDING': return 'pending';
          case 'IN_PROGRESS': return 'in_progress';
          case 'COMPLETED': return 'completed';
          case 'CANCELLED': return 'cancelled';
          default: return 'pending';
        }
      };
  
      const mapped: Task[] = (response.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        status: statusStrToUi(t.status),
        priority: priorityNumToStr[t.priority] || 'medium',
        assigned_to: t.assigned_to,
        assigned_to_name: t.assigned_to_name,
        created_by: t.assigned_by,
        created_by_name: t.assigned_by_name,
        due_date: t.due_date || '',
        created_at: t.created_at,
        updated_at: t.updated_at,
        tags: Array.isArray(t.tags) ? t.tags : [],
        comments: Array.isArray(t.comments)
          ? t.comments.map((c: any) => ({
              id: c.id || '',
              task_id: t.id,
              user_id: c.user_id || '',
              user_name: c.user_name || 'Unknown User',
              content: c.comment || '',
              created_at: c.created_at || t.created_at,
            }))
          : [],
        progress: typeof t.progress_percentage === 'number' ? t.progress_percentage : 0,
        estimated_hours: t.estimated_hours,
        actual_hours: t.actual_hours,
      }));
  
      setTasks(mapped);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/tasks/stats');
      setStats(response.data);
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleCreateTask = async (taskData: TaskFormData) => {
    try {
      setLoading(true);
      // Map UI priority string -> backend numeric enum (1..4)
      const priorityMap: Record<string, number> = { low: 1, medium: 2, high: 3, urgent: 4 };
      const payload = {
        title: taskData.title,
        description: taskData.description || undefined,
        assigned_to: taskData.assigned_to,
        priority: priorityMap[String(taskData.priority || 'medium').toLowerCase()] ?? 2,
        status: 'PENDING',
        category: 'general',
        tags: taskData.tags || [],
        due_date: taskData.due_date?.toISOString(),
        estimated_hours: taskData.estimated_hours,
        task_type: 'TODO',
      };
      const response = await api.post('/tasks', payload);
  
      // Normalize the created task to UI shape and append
      const created = response.data;
      const priorityNumToStr: Record<number | string, Task['priority']> = {
        1: 'low', 2: 'medium', 3: 'high', 4: 'urgent',
        LOW: 'low', MEDIUM: 'medium', HIGH: 'high', CRITICAL: 'urgent'
      };
      const statusStrToUi = (s: string): Task['status'] => {
        const key = String(s || '').toUpperCase();
        switch (key) {
          case 'PENDING': return 'pending';
          case 'IN_PROGRESS': return 'in_progress';
          case 'COMPLETED': return 'completed';
          case 'CANCELLED': return 'cancelled';
          default: return 'pending';
        }
      };
      const createdMapped: Task = {
        id: created.id,
        title: created.title,
        description: created.description || '',
        status: statusStrToUi(created.status),
        priority: priorityNumToStr[created.priority] || 'medium',
        assigned_to: created.assigned_to,
        assigned_to_name: created.assigned_to_name,
        created_by: created.assigned_by,
        created_by_name: created.assigned_by_name,
        due_date: created.due_date || '',
        created_at: created.created_at,
        updated_at: created.updated_at,
        tags: Array.isArray(created.tags) ? created.tags : [],
        comments: Array.isArray(created.comments)
          ? created.comments.map((c: any) => ({
              id: c.id || '',
              task_id: created.id,
              user_id: c.user_id || '',
              user_name: c.user_name || 'Unknown User',
              content: c.comment || '',
              created_at: c.created_at || created.created_at,
            }))
          : [],
        progress: typeof created.progress_percentage === 'number' ? created.progress_percentage : 0,
        estimated_hours: created.estimated_hours,
        actual_hours: created.actual_hours,
      };
  
      setTasks(prev => [...prev, createdMapped]);
      loadStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskData: TaskFormData) => {
    if (!editingTask) return;
    
    try {
      setLoading(true);
      const payload = {
        ...taskData,
        due_date: taskData.due_date?.toISOString()
      };
      const response = await api.put(`/tasks/${editingTask.id}`, payload);
      setTasks(prev => prev.map(task => 
        task.id === editingTask.id ? response.data : task
      ));
      loadStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    try {
      setLoading(true);
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      loadStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const response = await api.patch(`/tasks/${taskId}/status`, { status });
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));
      loadStats();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update task status');
    }
  };

  const handleAddComment = async (taskId: string, comment: string) => {
    try {
      // Backend expects { comment, attachments }
      await taskAPI.addComment(taskId, comment);
      // Optimistic UI update
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              comments: [
                ...task.comments, 
                { 
                  id: (window.crypto?.randomUUID?.() || String(Date.now())), 
                  task_id: taskId, 
                  user_id: '', 
                  user_name: 'You', 
                  content: comment, 
                  created_at: new Date().toISOString() 
                }
              ] 
            }
          : task
      ));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add comment');
    }
  };

  const handleOpenTaskDialog = (task?: Task) => {
    setEditingTask(task || null);
    setTaskDialogOpen(true);
  };

  const handleCloseTaskDialog = () => {
    setTaskDialogOpen(false);
    setEditingTask(null);
    setError(null);
  };

  const handleSaveTask = async (taskData: TaskFormData) => {
    if (editingTask) {
      await handleUpdateTask(taskData);
    } else {
      await handleCreateTask(taskData);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const titleText = (task.title || '').toLowerCase();
    const descText = (task.description || '').toLowerCase();
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch = titleText.includes(term) || descText.includes(term);
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getTasksByStatus = (status: Task['status']) => 
    filteredTasks.filter(task => task.status === status);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Task Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenTaskDialog()}
          >
            Create Task
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TaskStatistics stats={stats} />

        {/* Search and Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Task Tabs */}
        <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
          <Tab label={`All Tasks (${filteredTasks.length})`} />
          <Tab label={`Pending (${getTasksByStatus('pending').length})`} />
          <Tab label={`In Progress (${getTasksByStatus('in_progress').length})`} />
          <Tab label={`Completed (${getTasksByStatus('completed').length})`} />
        </Tabs>

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}

        {/* Task List */}
        {!loading && (
          <Box>
            {selectedTab === 0 && filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleOpenTaskDialog}
                onDelete={handleDeleteTask}
                onStatusChange={handleUpdateTaskStatus}
                onAddComment={handleAddComment}
              />
            ))}
            {selectedTab === 1 && getTasksByStatus('pending').map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleOpenTaskDialog}
                onDelete={handleDeleteTask}
                onStatusChange={handleUpdateTaskStatus}
                onAddComment={handleAddComment}
              />
            ))}
            {selectedTab === 2 && getTasksByStatus('in_progress').map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleOpenTaskDialog}
                onDelete={handleDeleteTask}
                onStatusChange={handleUpdateTaskStatus}
                onAddComment={handleAddComment}
              />
            ))}
            {selectedTab === 3 && getTasksByStatus('completed').map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={handleOpenTaskDialog}
                onDelete={handleDeleteTask}
                onStatusChange={handleUpdateTaskStatus}
                onAddComment={handleAddComment}
              />
            ))}
          </Box>
        )}

        {/* Empty State */}
        {!loading && filteredTasks.length === 0 && (
          <Box display="flex" flexDirection="column" alignItems="center" py={8}>
            <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No tasks found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your first task to get started
            </Typography>
          </Box>
        )}

        {/* Task Dialog */}
        <TaskFormDialog
          open={taskDialogOpen}
          onClose={handleCloseTaskDialog}
          task={editingTask}
          users={users}
          onSave={handleSaveTask}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default TaskManagement;