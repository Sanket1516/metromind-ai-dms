import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Switch,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Fab
} from '@mui/material';
import {
  CloudSync as CloudIcon,
  Email as EmailIcon,
  Assessment as AnalyticsIcon,
  Payment as PaymentIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Code as ApiIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  CheckCircle as ConnectedIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Launch as LaunchIcon,
  Description as DocsIcon,
  Business as BusinessIcon,
  Psychology as AIIcon,
  Phone as CommunicationIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'cloud' | 'email' | 'analytics' | 'payment' | 'storage' | 'security' | 'ai' | 'communication' | 'business';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  enabled: boolean;
  icon: string;
  lastSync?: string;
  documentsProcessed?: number;
  apiKey?: string;
  authRequired: boolean;
}

const IntegrationsPage: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [openSetup, setOpenSetup] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  // Sample integrations data - will be replaced with API data
  const integrations: Integration[] = [
    {
      id: '1',
      name: 'Google Drive',
      description: 'Sync and process documents from Google Drive',
      category: 'cloud',
      status: 'connected',
      enabled: true,
      icon: '🗂️',
      lastSync: '2 minutes ago',
      documentsProcessed: 1247,
      authRequired: true
    },
    {
      id: '2',
      name: 'Dropbox',
      description: 'Access and process files from Dropbox',
      category: 'cloud',
      status: 'disconnected',
      enabled: false,
      icon: '📦',
      authRequired: true
    },
    {
      id: '3',
      name: 'Microsoft OneDrive',
      description: 'Integrate with Microsoft OneDrive storage',
      category: 'cloud',
      status: 'connected',
      enabled: true,
      icon: '☁️',
      lastSync: '1 hour ago',
      documentsProcessed: 892,
      authRequired: true
    },
    {
      id: '4',
      name: 'Gmail',
      description: 'Process email attachments and content',
      category: 'email',
      status: 'connected',
      enabled: true,
      icon: '📧',
      lastSync: '5 minutes ago',
      documentsProcessed: 234,
      authRequired: true
    },
    {
      id: '5',
      name: 'Outlook',
      description: 'Microsoft Outlook email integration',
      category: 'email',
      status: 'pending',
      enabled: false,
      icon: '📮',
      authRequired: true
    },
    {
      id: '6',
      name: 'Salesforce',
      description: 'CRM integration for document management',
      category: 'business',
      status: 'connected',
      enabled: true,
      icon: '🏢',
      lastSync: '30 minutes ago',
      documentsProcessed: 567,
      authRequired: true
    },
    {
      id: '7',
      name: 'Slack',
      description: 'Team communication and file sharing',
      category: 'communication',
      status: 'connected',
      enabled: true,
      icon: '💬',
      lastSync: '15 minutes ago',
      documentsProcessed: 123,
      authRequired: true
    },
    {
      id: '8',
      name: 'AWS S3',
      description: 'Amazon S3 bucket integration',
      category: 'storage',
      status: 'error',
      enabled: false,
      icon: '🪣',
      authRequired: true
    },
    {
      id: '9',
      name: 'OpenAI GPT',
      description: 'AI-powered document analysis',
      category: 'ai',
      status: 'connected',
      enabled: true,
      icon: '🤖',
      lastSync: 'Just now',
      documentsProcessed: 2341,
      apiKey: 'sk-...',
      authRequired: true
    },
    {
      id: '10',
      name: 'Google Analytics',
      description: 'Website analytics and insights',
      category: 'analytics',
      status: 'connected',
      enabled: true,
      icon: '📊',
      lastSync: '1 hour ago',
      authRequired: true
    }
  ];

  const categories = [
    { key: 'all', label: 'All Integrations', icon: <ApiIcon /> },
    { key: 'cloud', label: 'Cloud Storage', icon: <CloudIcon /> },
    { key: 'email', label: 'Email', icon: <EmailIcon /> },
    { key: 'business', label: 'Business', icon: <BusinessIcon /> },
    { key: 'ai', label: 'AI & ML', icon: <AIIcon /> },
    { key: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
    { key: 'communication', label: 'Communication', icon: <CommunicationIcon /> },
    { key: 'storage', label: 'Storage', icon: <StorageIcon /> },
    { key: 'security', label: 'Security', icon: <SecurityIcon /> }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return theme.palette.success.main;
      case 'error': return theme.palette.error.main;
      case 'pending': return theme.palette.warning.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <ConnectedIcon sx={{ color: theme.palette.success.main }} />;
      case 'error': return <ErrorIcon sx={{ color: theme.palette.error.main }} />;
      case 'pending': return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
      default: return <ErrorIcon sx={{ color: theme.palette.grey[500] }} />;
    }
  };

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === 0 || categories[activeTab].key === integration.category;
    return matchesSearch && matchesCategory;
  });

  const IntegrationCard: React.FC<{ integration: Integration }> = ({ integration }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          height: '100%',
          border: `2px solid ${integration.status === 'connected' ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.grey[300], 0.3)}`,
          '&:hover': {
            boxShadow: theme.shadows[8],
            bgcolor: alpha(theme.palette.primary.main, 0.02)
          }
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h3" sx={{ fontSize: '2rem' }}>
                {integration.icon}
              </Typography>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {integration.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {integration.description}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon(integration.status)}
              <Switch
                checked={integration.enabled}
                size="small"
                color="primary"
              />
            </Box>
          </Box>

          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            <Chip
              label={integration.status}
              size="small"
              sx={{
                bgcolor: alpha(getStatusColor(integration.status), 0.1),
                color: getStatusColor(integration.status),
                textTransform: 'capitalize',
                fontWeight: 600
              }}
            />
            <Chip
              label={integration.category}
              size="small"
              variant="outlined"
              sx={{ textTransform: 'capitalize' }}
            />
          </Box>

          {integration.status === 'connected' && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Last sync: {integration.lastSync}
              </Typography>
              {integration.documentsProcessed && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Documents processed: {integration.documentsProcessed.toLocaleString()}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>

        <Box sx={{ p: 2, pt: 0 }}>
          <Box display="flex" gap={1}>
            <Button
              variant={integration.status === 'connected' ? 'outlined' : 'contained'}
              size="small"
              startIcon={integration.status === 'connected' ? <SettingsIcon /> : <CloudIcon />}
              onClick={() => {
                setSelectedIntegration(integration);
                setOpenSetup(true);
              }}
              sx={{ flex: 1 }}
            >
              {integration.status === 'connected' ? 'Configure' : 'Connect'}
            </Button>
            {integration.status === 'connected' && (
              <Tooltip title="Test Connection">
                <IconButton size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Card>
    </motion.div>
  );

  const StatsSection = () => {
    const connectedCount = integrations.filter(i => i.status === 'connected').length;
    const totalDocuments = integrations.reduce((sum, i) => sum + (i.documentsProcessed || 0), 0);

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              {connectedCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connected Integrations
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.info.main, 0.1)})`
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
              {totalDocuments.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Documents Processed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 3,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.error.main, 0.1)})`
            }}
          >
            <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.info.main }}>
              {integrations.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Available Integrations
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Integrations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Connect and manage your external services and data sources
          </Typography>
        </Box>
        
        <Fab
          color="primary"
          onClick={() => setOpenSetup(true)}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
          }}
        >
          <AddIcon />
        </Fab>
      </Box>

      {/* Stats */}
      <StatsSection />

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            {categories.map((category, index) => (
              <Tab
                key={category.key}
                icon={category.icon}
                iconPosition="start"
                label={category.label}
                value={index}
              />
            ))}
          </Tabs>

          <TextField
            size="small"
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250 }}
          />
        </Box>
      </Paper>

      {/* Integrations Grid */}
      <Grid container spacing={3}>
        {filteredIntegrations.map((integration, index) => (
          <Grid item xs={12} md={6} lg={4} key={integration.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <IntegrationCard integration={integration} />
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {filteredIntegrations.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: alpha(theme.palette.background.paper, 0.5) }}>
          <ApiIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No integrations found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or category filter
          </Typography>
        </Paper>
      )}

      {/* Setup Dialog */}
      <Dialog
        open={openSetup}
        onClose={() => setOpenSetup(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedIntegration ? 
            `Configure ${selectedIntegration.name}` : 
            'Add New Integration'
          }
        </DialogTitle>
        <DialogContent>
          {selectedIntegration ? (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Integration Name"
                    defaultValue={selectedIntegration.name}
                    variant="outlined"
                  />
                </Grid>
                {selectedIntegration.authRequired && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="API Key / Auth Token"
                      type="password"
                      defaultValue={selectedIntegration.apiKey || ''}
                      variant="outlined"
                      helperText="Enter your authentication credentials"
                    />
                  </Grid>
                )}
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Sync Frequency</InputLabel>
                    <Select label="Sync Frequency" defaultValue="hourly">
                      <MenuItem value="realtime">Real-time</MenuItem>
                      <MenuItem value="hourly">Every Hour</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Data Retention</InputLabel>
                    <Select label="Data Retention" defaultValue="1year">
                      <MenuItem value="30days">30 Days</MenuItem>
                      <MenuItem value="90days">90 Days</MenuItem>
                      <MenuItem value="1year">1 Year</MenuItem>
                      <MenuItem value="forever">Forever</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Select an integration from the list above to configure it
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSetup(false)}>Cancel</Button>
          {selectedIntegration && (
            <Button
              variant="contained"
              onClick={() => setOpenSetup(false)}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              }}
            >
              Save Configuration
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntegrationsPage;