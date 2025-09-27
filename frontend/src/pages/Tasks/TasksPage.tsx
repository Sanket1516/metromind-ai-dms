import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  ListItemIcon,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  LinearProgress,
  Badge,
  Tooltip,
  useTheme,
  alpha,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Dashboard as BoardIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Flag as FlagIcon,
  AttachFile as AttachFileIcon,
  Comment as CommentIcon,
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { apiClient } from '../../services/api';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: {
    name: string;
    avatar: string;
  };
  dueDate: string;
  tags: string[];
  comments: number;
  attachments: number;
  progress: number;
}

const TasksPage: React.FC = () => {
  const theme = useTheme();
  const [view, setView] = useState<'board' | 'list' | 'calendar'>('board');
  const [openNewTask, setOpenNewTask] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Tasks loaded from backend
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Column definitions
  const columns: Record<Task['status'], { title: string; color: string }> = {
    'todo': { title: 'To Do', color: theme.palette.grey[500] },
    'in-progress': { title: 'In Progress', color: theme.palette.warning.main },
    'review': { title: 'Review', color: theme.palette.info.main },
    'done': { title: 'Done', color: theme.palette.success.main }
  };

  const priorityColors = {
    low: theme.palette.success.main,
    medium: theme.palette.warning.main,
    high: theme.palette.error.main,
    urgent: theme.palette.error.dark
  };

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return <FlagIcon sx={{ color: priorityColors.urgent }} />;
      case 'high': return <FlagIcon sx={{ color: priorityColors.high }} />;
      case 'medium': return <FlagIcon sx={{ color: priorityColors.medium }} />;
      default: return <FlagIcon sx={{ color: priorityColors.low }} />;
    }
  };

  // Load tasks on mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/tasks');
        const data = res.data || [];

        const mapStatus = (s: string): Task['status'] => {
          const key = String(s || '').toUpperCase();
          switch (key) {
            case 'PENDING': return 'todo';
            case 'IN_PROGRESS': return 'in-progress';
            case 'REVIEW_REQUIRED': return 'review';
            case 'COMPLETED': return 'done';
            case 'APPROVED': return 'done';
            case 'REJECTED': return 'review';
            case 'CANCELLED': return 'done';
            default: return 'todo';
          }
        };

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

        const mapped: Task[] = data.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          status: mapStatus(t.status),
          priority: priorityNumToStr[t.priority] || 'medium',
          assignee: {
            name: t.assigned_to_name || 'Unassigned',
            avatar: ''
          },
          dueDate: t.due_date || new Date().toISOString(),
          tags: Array.isArray(t.tags) ? t.tags : [],
          comments: Array.isArray(t.comments) ? t.comments.length : 0,
          attachments: Array.isArray(t.attachments) ? t.attachments.length : 0,
          progress: typeof t.progress_percentage === 'number' ? t.progress_percentage : 0,
        }));

        setTasks(mapped);
      } catch (e) {
        console.error('Failed to load tasks', e);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Apply search filter
  const filteredTasks = useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    if (!term) return tasks;
    return tasks.filter((t) => {
      const title = (t.title || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      const tagHit = (t.tags || []).some(tag => String(tag).toLowerCase().includes(term));
      return title.includes(term) || desc.includes(term) || tagHit;
    });
  }, [tasks, searchTerm]);

  interface TaskCardProps {
    task: Task;
    onChangeStatus: (id: string, status: Task['status']) => void;
    onDelete: (id: string) => void;
  }

  const TaskCard: React.FC<TaskCardProps> = ({ task, onChangeStatus, onDelete }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const moveTo = (status: Task['status']) => {
      onChangeStatus(task.id, status);
      handleMenuClose();
    };

    const remove = () => {
      onDelete(task.id);
      handleMenuClose();
    };

    const handleDragStart = (e: React.DragEvent) => {
      setDraggingId(task.id);
      e.dataTransfer.setData('text/plain', task.id);
      e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => setDraggingId(null);

    return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
      <Card
        sx={{
          mb: 2,
          borderLeft: `4px solid ${priorityColors[task.priority]}`,
          '&:hover': {
            boxShadow: theme.shadows[8],
            bgcolor: alpha(theme.palette.primary.main, 0.02)
          }
        }}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <CardContent sx={{ pb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
              {task.title}
            </Typography>
            <IconButton size="small" onClick={handleMenuOpen} aria-haspopup="true" aria-controls={open ? `task-menu-${task.id}` : undefined} aria-expanded={open ? 'true' : undefined}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu id={`task-menu-${task.id}`} anchorEl={anchorEl} open={open} onClose={handleMenuClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
              <MenuItem onClick={() => moveTo('in-progress')}>
                <ListItemIcon><PlayIcon fontSize="small" /></ListItemIcon>
                Move to In Progress
              </MenuItem>
              <MenuItem onClick={() => moveTo('review')}>
                <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
                Move to Review
              </MenuItem>
              <MenuItem onClick={() => moveTo('done')}>
                <ListItemIcon><CheckIcon fontSize="small" /></ListItemIcon>
                Mark as Done
              </MenuItem>
              <MenuItem onClick={remove}>
                <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
                Delete Task
              </MenuItem>
            </Menu>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {task.description}
          </Typography>

          {task.tags?.length > 0 && (
            <Box display="flex" gap={0.5} mb={2} flexWrap="wrap">
              {task.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    fontSize: '0.7rem',
                    height: 24,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main
                  }}
                />
              ))}
            </Box>
          )}

          {task.progress > 0 && task.status !== 'done' && (
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {task.progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={task.progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.1)
                }}
              />
            </Box>
          )}

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Avatar src={task.assignee.avatar} sx={{ width: 28, height: 28 }}>
                {task.assignee.name.charAt(0)}
              </Avatar>
              <Typography variant="caption" color="text.secondary">
                {task.assignee.name}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              {task.comments > 0 && (
                <Tooltip title="Comments">
                  <Badge badgeContent={task.comments} color="primary">
                    <CommentIcon fontSize="small" color="action" />
                  </Badge>
                </Tooltip>
              )}
              {task.attachments > 0 && (
                <Tooltip title="Attachments">
                  <Badge badgeContent={task.attachments} color="primary">
                    <AttachFileIcon fontSize="small" color="action" />
                  </Badge>
                </Tooltip>
              )}
              {getPriorityIcon(task.priority)}
              <Typography variant="caption" color="text.secondary">
                {new Date(task.dueDate).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
    );
  };

  const mapUiToBackendStatus = (s: Task['status']): string => {
    switch (s) {
      case 'todo': return 'PENDING';
      case 'in-progress': return 'IN_PROGRESS';
      case 'review': return 'REVIEW_REQUIRED';
      case 'done': return 'COMPLETED';
      default: return 'PENDING';
    }
  };

  const handleChangeStatus = async (taskId: string, status: Task['status']) => {
    try {
      await apiClient.put(`/tasks/${taskId}`, { status: mapUiToBackendStatus(status) });
      setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status } : t)));
    } catch (e) {
      console.error('Failed to change status', e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiClient.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      console.error('Failed to delete task', e);
    }
  };

  const KanbanBoard = () => (
    <Grid container spacing={2}>
      {Object.entries(columns).map(([status, column]) => (
        <Grid item xs={12} md={3} key={status}>
          <Paper
            sx={{
              p: 2,
              bgcolor: alpha(column.color, 0.05),
              border: `2px solid ${alpha(column.color, 0.2)}`,
              minHeight: '70vh',
              transition: 'background-color 0.15s ease',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain');
              if (!id) return;
              const newStatus = status as Task['status'];
              const task = tasks.find(t => t.id === id);
              if (task && task.status !== newStatus) {
                handleChangeStatus(id, newStatus);
              }
              setDraggingId(null);
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: column.color }}>
                {column.title}
              </Typography>
              <Chip
                label={filteredTasks.filter(task => task.status === status).length}
                size="small"
                sx={{ bgcolor: column.color, color: 'white' }}
              />
            </Box>
  
            <Box>
              {filteredTasks
                .filter(task => task.status === status)
                .map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onChangeStatus={handleChangeStatus}
                    onDelete={handleDeleteTask}
                  />
                ))}
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  const ListView = () => (
    <Paper sx={{ p: 2 }}>
      <List>
        {filteredTasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ListItem
              sx={{
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                borderRadius: 2,
                mb: 1,
                bgcolor: alpha(theme.palette.background.paper, 0.5)
              }}
            >
              <ListItemAvatar>
                <Avatar src={task.assignee.avatar}>
                  {task.assignee.name.charAt(0)}
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {task.title}
                    </Typography>
                    <Chip
                      label={task.status.replace('-', ' ')}
                      size="small"
                      sx={{
                        bgcolor: columns[task.status].color,
                        color: 'white',
                        textTransform: 'capitalize'
                      }}
                    />
                    {getPriorityIcon(task.priority)}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {task.description}
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {task.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                }
              />

              <ListItemSecondaryAction>
                <Typography variant="caption" color="text.secondary">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </Typography>
              </ListItemSecondaryAction>
            </ListItem>
          </motion.div>
        ))}
      </List>
    </Paper>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Task Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Organize and track your team's work efficiently
          </Typography>
        </Box>

        <Fab
          color="primary"
          onClick={() => setOpenNewTask(true)}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
          }}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Tabs value={view} onChange={(_, newValue) => setView(newValue)}>
            <Tab icon={<BoardIcon />} iconPosition="start" label="Board" value="board" />
            <Tab icon={<AssignmentIcon />} iconPosition="start" label="List" value="list" />
            <Tab icon={<CalendarIcon />} iconPosition="start" label="Calendar" value="calendar" />
          </Tabs>

          <Box display="flex" gap={2} alignItems="center">
            <TextField
              size="small"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ minWidth: 220 }}
            />
            <IconButton>
              <FilterIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Content */}
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {view === 'board' && <KanbanBoard />}
        {view === 'list' && <ListView />}
        {view === 'calendar' && (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
            <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Calendar View Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Full calendar integration with task scheduling
            </Typography>
          </Paper>
        )}
      </motion.div>

      {/* New Task Dialog (UI only) */}
      <Dialog open={openNewTask} onClose={() => setOpenNewTask(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Task Title" variant="outlined" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={3} variant="outlined" />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select label="Priority" defaultValue="medium">
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Due Date" type="date" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Assignee</InputLabel>
                <Select label="Assignee" defaultValue="">
                  <MenuItem value="john">John Doe</MenuItem>
                  <MenuItem value="jane">Jane Smith</MenuItem>
                  <MenuItem value="mike">Mike Johnson</MenuItem>
                  <MenuItem value="sarah">Sarah Wilson</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Tags" placeholder="e.g., Frontend, API, Testing" helperText="Separate with commas" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewTask(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => setOpenNewTask(false)}
            sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` }}
          >
            Create Task
          </Button>
        </DialogActions>
      </Dialog>

      {loading && (
        <Box mt={2} textAlign="center">
          <Typography variant="body2" color="text.secondary">Loading tasks...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default TasksPage;