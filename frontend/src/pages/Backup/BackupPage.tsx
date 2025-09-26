import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Backup as BackupIcon,
  CloudDownload,
  Schedule,
  Storage,
  PlayArrow,
  Pause,
  Delete,
  Download,
  Restore,
  Settings,
  CheckCircle,
  Error,
  Warning,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';

interface BackupItem {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  size: string;
  createdAt: string;
  status: 'completed' | 'in_progress' | 'failed' | 'scheduled';
  description: string;
  downloadUrl?: string;
}

interface BackupSettings {
  automaticBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  includeUserData: boolean;
  includeSystemLogs: boolean;
  includeDatabase: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
}

const BackupPage: React.FC = () => {
  const { user } = useAuth();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [settings, setSettings] = useState<BackupSettings>({
    automaticBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    includeUserData: true,
    includeSystemLogs: true,
    includeDatabase: true,
    compressionLevel: 'medium',
  });
  const [loading, setLoading] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);

  // Mock backup data
  const mockBackups: BackupItem[] = [
    {
      id: '1',
      name: 'Full System Backup - 2024-01-15',
      type: 'full',
      size: '2.3 GB',
      createdAt: '2024-01-15 02:00:00',
      status: 'completed',
      description: 'Complete system backup including database, user files, and logs',
      downloadUrl: '/api/backups/1/download',
    },
    {
      id: '2',
      name: 'Incremental Backup - 2024-01-14',
      type: 'incremental',
      size: '156 MB',
      createdAt: '2024-01-14 02:00:00',
      status: 'completed',
      description: 'Incremental backup of changes since last full backup',
      downloadUrl: '/api/backups/2/download',
    },
    {
      id: '3',
      name: 'Manual Backup - 2024-01-13',
      type: 'full',
      size: '2.1 GB',
      createdAt: '2024-01-13 14:30:00',
      status: 'completed',
      description: 'Manual backup before system update',
      downloadUrl: '/api/backups/3/download',
    },
    {
      id: '4',
      name: 'Scheduled Backup - 2024-01-16',
      type: 'incremental',
      size: '0 MB',
      createdAt: '2024-01-16 02:00:00',
      status: 'scheduled',
      description: 'Upcoming scheduled incremental backup',
    },
  ];

  useEffect(() => {
    loadBackups();
    loadSettings();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would call the backend API
      // const response = await apiClient.get('/backup/list');
      // setBackups(response.data);
      
      // For now, use mock data
      setTimeout(() => {
        setBackups(mockBackups);
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to load backups:', err);
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      // In a real implementation, this would call the backend API
      // const response = await apiClient.get('/backup/settings');
      // setSettings(response.data);
    } catch (err: any) {
      console.error('Failed to load backup settings:', err);
    }
  };

  const createBackup = async (type: 'full' | 'incremental') => {
    try {
      setBackupInProgress(true);
      
      // In a real implementation, this would call the backend API
      // await apiClient.post('/backup/create', { type });
      
      // Mock implementation
      setTimeout(() => {
        const newBackup: BackupItem = {
          id: Date.now().toString(),
          name: `${type === 'full' ? 'Full' : 'Incremental'} Backup - ${new Date().toISOString().split('T')[0]}`,
          type,
          size: type === 'full' ? '2.5 GB' : '180 MB',
          createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
          status: 'completed',
          description: `Manual ${type} backup created by ${user?.email}`,
          downloadUrl: `/api/backups/${Date.now()}/download`,
        };
        
        setBackups(prev => [newBackup, ...prev]);
        setBackupInProgress(false);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to create backup:', err);
      setBackupInProgress(false);
    }
  };

  const downloadBackup = (backup: BackupItem) => {
    // In a real implementation, this would download the backup file
    const link = document.createElement('a');
    link.href = backup.downloadUrl || '#';
    link.download = `${backup.name}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteBackup = async (backupId: string) => {
    try {
      // In a real implementation, this would call the backend API
      // await apiClient.delete(`/backup/${backupId}`);
      
      setBackups(prev => prev.filter(b => b.id !== backupId));
    } catch (err: any) {
      console.error('Failed to delete backup:', err);
    }
  };

  const restoreFromBackup = async (backup: BackupItem) => {
    try {
      // In a real implementation, this would call the backend API
      // await apiClient.post(`/backup/${backup.id}/restore`);
      
      console.log('Restoring from backup:', backup.name);
      setRestoreDialogOpen(false);
    } catch (err: any) {
      console.error('Failed to restore backup:', err);
    }
  };

  const saveSettings = async () => {
    try {
      // In a real implementation, this would call the backend API
      // await apiClient.put('/backup/settings', settings);
      
      setSettingsDialogOpen(false);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'in_progress': return <CircularProgress size={20} />;
      case 'failed': return <Error sx={{ color: 'error.main' }} />;
      case 'scheduled': return <Schedule sx={{ color: 'info.main' }} />;
      default: return <Info sx={{ color: 'grey.500' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'failed': return 'error';
      case 'scheduled': return 'info';
      default: return 'default';
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <Alert severity="error">
        You don't have permission to access backup management.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BackupIcon color="primary" />
          Backup & Recovery
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage system backups and data recovery
        </Typography>
      </Box>

      {/* Action Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <BackupIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Create Full Backup
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Complete system backup including all data
              </Typography>
              <Button
                variant="contained"
                onClick={() => createBackup('full')}
                disabled={backupInProgress}
                fullWidth
              >
                {backupInProgress ? 'Creating...' : 'Create Full Backup'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CloudDownload sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Incremental Backup
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Backup only changes since last backup
              </Typography>
              <Button
                variant="outlined"
                onClick={() => createBackup('incremental')}
                disabled={backupInProgress}
                fullWidth
              >
                {backupInProgress ? 'Creating...' : 'Create Incremental'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Settings sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Backup Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure automatic backup policies
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setSettingsDialogOpen(true)}
                fullWidth
              >
                Configure Settings
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Backup Progress */}
      {backupInProgress && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="body2">
              Backup in progress... This may take several minutes.
            </Typography>
          </Box>
          <LinearProgress />
        </Alert>
      )}

      {/* Backup List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Backup History
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {backups.map((backup) => (
                <ListItem key={backup.id} divider>
                  <ListItemIcon>
                    {getStatusIcon(backup.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">
                          {backup.name}
                        </Typography>
                        <Chip
                          label={backup.type.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={backup.status.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={getStatusColor(backup.status) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {backup.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Created: {backup.createdAt} • Size: {backup.size}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {backup.status === 'completed' && (
                        <>
                          <Tooltip title="Download Backup">
                            <IconButton
                              edge="end"
                              onClick={() => downloadBackup(backup)}
                            >
                              <Download />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Restore from Backup">
                            <IconButton
                              edge="end"
                              onClick={() => {
                                setSelectedBackup(backup);
                                setRestoreDialogOpen(true);
                              }}
                            >
                              <Restore />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete Backup">
                        <IconButton
                          edge="end"
                          onClick={() => deleteBackup(backup.id)}
                          disabled={backup.status === 'in_progress'}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Backup Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Backup Frequency</InputLabel>
              <Select
                value={settings.backupFrequency}
                onChange={(e) => setSettings(prev => ({ ...prev, backupFrequency: e.target.value as any }))}
                label="Backup Frequency"
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Retention Days"
              type="number"
              value={settings.retentionDays}
              onChange={(e) => setSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) }))}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Compression Level</InputLabel>
              <Select
                value={settings.compressionLevel}
                onChange={(e) => setSettings(prev => ({ ...prev, compressionLevel: e.target.value as any }))}
                label="Compression Level"
              >
                <MenuItem value="low">Low (Faster)</MenuItem>
                <MenuItem value="medium">Medium (Balanced)</MenuItem>
                <MenuItem value="high">High (Smaller files)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Cancel</Button>
          <Button onClick={saveSettings} variant="contained">Save Settings</Button>
        </DialogActions>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Restore from Backup</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will restore the system to the state when this backup was created. Current data may be lost.
          </Alert>
          {selectedBackup && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Backup: {selectedBackup.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created: {selectedBackup.createdAt}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Size: {selectedBackup.size}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => selectedBackup && restoreFromBackup(selectedBackup)}
            variant="contained"
            color="warning"
          >
            Restore System
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BackupPage;