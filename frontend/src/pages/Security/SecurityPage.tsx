import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Shield,
  Lock,
  Key,
  Warning,
  Block,
  CheckCircle,
  Error,
  Visibility,
  VisibilityOff,
  Delete,
  Add,
  Refresh,
  Download,
  VpnKey,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';

interface SecuritySetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'authentication' | 'authorization' | 'encryption' | 'monitoring';
}

interface SecurityAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

interface LoginAttempt {
  id: string;
  email: string;
  ip: string;
  userAgent: string;
  success: boolean;
  timestamp: string;
  location?: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: string;
  lastUsed?: string;
  active: boolean;
}

const SecurityPage: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SecuritySetting[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newApiKeyDialogOpen, setNewApiKeyDialogOpen] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyPermissions, setNewApiKeyPermissions] = useState<string[]>([]);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});

  // Mock data
  const mockSettings: SecuritySetting[] = [
    {
      id: '1',
      name: 'Two-Factor Authentication',
      description: 'Require 2FA for all admin accounts',
      enabled: true,
      category: 'authentication',
    },
    {
      id: '2',
      name: 'Session Timeout',
      description: 'Auto-logout users after 30 minutes of inactivity',
      enabled: true,
      category: 'authentication',
    },
    {
      id: '3',
      name: 'IP Whitelist',
      description: 'Restrict access to specific IP addresses',
      enabled: false,
      category: 'authorization',
    },
    {
      id: '4',
      name: 'Data Encryption at Rest',
      description: 'Encrypt all stored data using AES-256',
      enabled: true,
      category: 'encryption',
    },
    {
      id: '5',
      name: 'Failed Login Monitoring',
      description: 'Monitor and alert on failed login attempts',
      enabled: true,
      category: 'monitoring',
    },
    {
      id: '6',
      name: 'API Rate Limiting',
      description: 'Limit API requests per user per minute',
      enabled: true,
      category: 'authorization',
    },
  ];

  const mockAlerts: SecurityAlert[] = [
    {
      id: '1',
      type: 'high',
      title: 'Multiple Failed Login Attempts',
      description: '5 failed login attempts from IP 192.168.1.100 in the last 10 minutes',
      timestamp: '2024-01-15 14:30:00',
      resolved: false,
    },
    {
      id: '2',
      type: 'medium',
      title: 'New Admin User Created',
      description: 'Admin user "new.admin@kmrl.gov.in" was created by admin@kmrl.gov.in',
      timestamp: '2024-01-15 12:15:00',
      resolved: true,
    },
    {
      id: '3',
      type: 'low',
      title: 'API Key Usage Spike',
      description: 'API key "Document Processing" usage increased by 200% in the last hour',
      timestamp: '2024-01-15 11:45:00',
      resolved: false,
    },
  ];

  const mockLoginAttempts: LoginAttempt[] = [
    {
      id: '1',
      email: 'admin@kmrl.gov.in',
      ip: '192.168.1.50',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      success: true,
      timestamp: '2024-01-15 15:30:00',
      location: 'Kochi, India',
    },
    {
      id: '2',
      email: 'unknown@hacker.com',
      ip: '192.168.1.100',
      userAgent: 'curl/7.68.0',
      success: false,
      timestamp: '2024-01-15 14:30:00',
      location: 'Unknown',
    },
    {
      id: '3',
      email: 'finance@kmrl.gov.in',
      ip: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      success: true,
      timestamp: '2024-01-15 13:15:00',
      location: 'Kochi, India',
    },
  ];

  const mockApiKeys: ApiKey[] = [
    {
      id: '1',
      name: 'Document Processing API',
      key: 'mk_live_51H...3xY9',
      permissions: ['documents:read', 'documents:write', 'ocr:process'],
      createdAt: '2024-01-10 10:00:00',
      lastUsed: '2024-01-15 14:20:00',
      active: true,
    },
    {
      id: '2',
      name: 'Analytics Dashboard',
      key: 'mk_live_42K...8pL2',
      permissions: ['analytics:read', 'reports:generate'],
      createdAt: '2024-01-08 09:30:00',
      lastUsed: '2024-01-15 12:45:00',
      active: true,
    },
    {
      id: '3',
      name: 'Mobile App Integration',
      key: 'mk_live_33M...5qR7',
      permissions: ['documents:read', 'auth:validate'],
      createdAt: '2024-01-05 14:15:00',
      active: false,
    },
  ];

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, these would call the backend APIs
      // const [settingsRes, alertsRes, attemptsRes, keysRes] = await Promise.all([
      //   apiClient.get('/security/settings'),
      //   apiClient.get('/security/alerts'),
      //   apiClient.get('/security/login-attempts'),
      //   apiClient.get('/security/api-keys'),
      // ]);
      
      // For now, use mock data
      setTimeout(() => {
        setSettings(mockSettings);
        setAlerts(mockAlerts);
        setLoginAttempts(mockLoginAttempts);
        setApiKeys(mockApiKeys);
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      console.error('Failed to load security data:', err);
      setLoading(false);
    }
  };

  const toggleSetting = async (settingId: string) => {
    try {
      const updatedSettings = settings.map(setting =>
        setting.id === settingId
          ? { ...setting, enabled: !setting.enabled }
          : setting
      );
      setSettings(updatedSettings);
      
      // In a real implementation, this would call the backend API
      // await apiClient.put(`/security/settings/${settingId}`, {
      //   enabled: !settings.find(s => s.id === settingId)?.enabled
      // });
    } catch (err: any) {
      console.error('Failed to update setting:', err);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const updatedAlerts = alerts.map(alert =>
        alert.id === alertId
          ? { ...alert, resolved: true }
          : alert
      );
      setAlerts(updatedAlerts);
      
      // In a real implementation, this would call the backend API
      // await apiClient.put(`/security/alerts/${alertId}/resolve`);
    } catch (err: any) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const createApiKey = async () => {
    try {
      const newKey: ApiKey = {
        id: Date.now().toString(),
        name: newApiKeyName,
        key: `mk_live_${Math.random().toString(36).substring(2, 15)}...${Math.random().toString(36).substring(2, 8)}`,
        permissions: newApiKeyPermissions,
        createdAt: new Date().toISOString().replace('T', ' ').split('.')[0],
        active: true,
      };
      
      setApiKeys(prev => [newKey, ...prev]);
      setNewApiKeyDialogOpen(false);
      setNewApiKeyName('');
      setNewApiKeyPermissions([]);
      
      // In a real implementation, this would call the backend API
      // await apiClient.post('/security/api-keys', {
      //   name: newApiKeyName,
      //   permissions: newApiKeyPermissions
      // });
    } catch (err: any) {
      console.error('Failed to create API key:', err);
    }
  };

  const toggleApiKey = async (keyId: string) => {
    try {
      const updatedKeys = apiKeys.map(key =>
        key.id === keyId
          ? { ...key, active: !key.active }
          : key
      );
      setApiKeys(updatedKeys);
      
      // In a real implementation, this would call the backend API
      // await apiClient.put(`/security/api-keys/${keyId}`, {
      //   active: !apiKeys.find(k => k.id === keyId)?.active
      // });
    } catch (err: any) {
      console.error('Failed to toggle API key:', err);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      
      // In a real implementation, this would call the backend API
      // await apiClient.delete(`/security/api-keys/${keyId}`);
    } catch (err: any) {
      console.error('Failed to delete API key:', err);
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <Error sx={{ color: 'error.main' }} />;
      case 'high': return <Warning sx={{ color: 'warning.main' }} />;
      case 'medium': return <Warning sx={{ color: 'info.main' }} />;
      case 'low': return <CheckCircle sx={{ color: 'success.main' }} />;
      default: return <Warning sx={{ color: 'grey.500' }} />;
    }
  };

  const toggleApiKeyVisibility = (keyId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const maskApiKey = (key: string, show: boolean) => {
    if (show) return key;
    const parts = key.split('...');
    return `${parts[0]}${'*'.repeat(20)}...${parts[1] || '****'}`;
  };

  if (!user || user.role !== 'admin') {
    return (
      <Alert severity="error">
        You don't have permission to access security settings.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SecurityIcon color="primary" />
          Security Center
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and configure system security settings
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Security Overview Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Shield sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6" color="success.main">Secure</Typography>
                  <Typography variant="body2" color="text.secondary">
                    System Status
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main" gutterBottom>
                    {alerts.filter(a => !a.resolved).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Alerts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary.main" gutterBottom>
                    {loginAttempts.filter(a => a.success).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successful Logins (24h)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main" gutterBottom>
                    {apiKeys.filter(k => k.active).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active API Keys
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Security Alerts */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                Security Alerts
              </Typography>
              <List>
                {alerts.map((alert) => (
                  <ListItem key={alert.id} divider>
                    <ListItemIcon>
                      {getAlertIcon(alert.type)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {alert.title}
                          </Typography>
                          <Chip
                            label={alert.type.toUpperCase()}
                            size="small"
                            color={getAlertColor(alert.type) as any}
                          />
                          {alert.resolved && (
                            <Chip label="RESOLVED" size="small" color="success" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {alert.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {alert.timestamp}
                          </Typography>
                        </Box>
                      }
                    />
                    {!alert.resolved && (
                      <ListItemSecondaryAction>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lock color="primary" />
                Security Settings
              </Typography>
              <Grid container spacing={2}>
                {settings.map((setting) => (
                  <Grid item xs={12} md={6} key={setting.id}>
                    <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={setting.enabled}
                            onChange={() => toggleSetting(setting.id)}
                          />
                        }
                        label={setting.name}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {setting.description}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* API Keys Management */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VpnKey color="primary" />
                  API Keys
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setNewApiKeyDialogOpen(true)}
                >
                  Create API Key
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Key</TableCell>
                      <TableCell>Permissions</TableCell>
                      <TableCell>Last Used</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {apiKeys.map((apiKey) => (
                      <TableRow key={apiKey.id}>
                        <TableCell>{apiKey.name}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {maskApiKey(apiKey.key, showApiKeys[apiKey.id])}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => toggleApiKeyVisibility(apiKey.id)}
                            >
                              {showApiKeys[apiKey.id] ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {apiKey.permissions.map((perm) => (
                              <Chip key={perm} label={perm} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {apiKey.lastUsed || 'Never'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={apiKey.active ? 'Active' : 'Inactive'}
                            color={apiKey.active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title={apiKey.active ? 'Deactivate' : 'Activate'}>
                              <IconButton
                                size="small"
                                onClick={() => toggleApiKey(apiKey.id)}
                              >
                                {apiKey.active ? <Block /> : <CheckCircle />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => deleteApiKey(apiKey.id)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Recent Login Attempts */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminPanelSettings color="primary" />
                Recent Login Attempts
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Timestamp</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loginAttempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>{attempt.email}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{attempt.ip}</TableCell>
                        <TableCell>{attempt.location}</TableCell>
                        <TableCell>
                          <Chip
                            label={attempt.success ? 'Success' : 'Failed'}
                            color={attempt.success ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{attempt.timestamp}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create API Key Dialog */}
      <Dialog open={newApiKeyDialogOpen} onClose={() => setNewApiKeyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              label="API Key Name"
              value={newApiKeyName}
              onChange={(e) => setNewApiKeyName(e.target.value)}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Permissions</InputLabel>
              <Select
                multiple
                value={newApiKeyPermissions}
                onChange={(e) => setNewApiKeyPermissions(e.target.value as string[])}
                label="Permissions"
              >
                <MenuItem value="documents:read">Documents Read</MenuItem>
                <MenuItem value="documents:write">Documents Write</MenuItem>
                <MenuItem value="ocr:process">OCR Processing</MenuItem>
                <MenuItem value="analytics:read">Analytics Read</MenuItem>
                <MenuItem value="reports:generate">Generate Reports</MenuItem>
                <MenuItem value="auth:validate">Validate Authentication</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewApiKeyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={createApiKey}
            variant="contained"
            disabled={!newApiKeyName || newApiKeyPermissions.length === 0}
          >
            Create API Key
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityPage;