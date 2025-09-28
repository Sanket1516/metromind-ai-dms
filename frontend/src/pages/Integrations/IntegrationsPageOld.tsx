import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Button, 
  CircularProgress, 
  Alert,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Settings as SettingsIcon, CloudSync as CloudIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../../config';

interface Integration {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: string;
  status: string;
}

interface IntegrationSetupDialog {
  open: boolean;
  type: 'email' | 'google_drive' | null;
}

const IntegrationsPage: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupDialog, setSetupDialog] = useState<IntegrationSetupDialog>({ open: false, type: null });
  const [setupLoading, setSetupLoading] = useState(false);
  const [googleDriveAuthUrl, setGoogleDriveAuthUrl] = useState<string | null>(null);
  const [authCode, setAuthCode] = useState('');

  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/integrations/`);
        
        if (response.ok) {
          const data = await response.json();
          setIntegrations(Array.isArray(data) ? data : []);
        } else {
          console.error('Failed to load integrations');
          setIntegrations([]);
          setError('Failed to load integrations');
        }
      } catch (err) {
        console.error('Integration loading error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load integrations');
        setIntegrations([]);
      } finally {
        setLoading(false);
      }
    };

    loadIntegrations();
  }, []);

  const handleToggle = async (integrationId: string, enabled: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/${integrationId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      
      if (response.ok) {
        setIntegrations(prev =>
          prev.map(integration =>
            integration.id === integrationId
              ? { ...integration, enabled }
              : integration
          )
        );
      } else {
        setError('Failed to update integration status');
      }
    } catch (err) {
      console.error('Failed to toggle integration:', err);
      setError('Failed to update integration status');
    }
  };

  const handleSetupIntegration = (type: 'email' | 'google_drive') => {
    setSetupDialog({ open: true, type });
    if (type === 'google_drive') {
      getGoogleDriveAuthUrl();
    }
  };

  const getGoogleDriveAuthUrl = async () => {
    try {
      setSetupLoading(true);
      const response = await fetch(`${API_BASE_URL}/integrations/google-drive/auth-url`);
      const data = await response.json();
      setGoogleDriveAuthUrl(data.auth_url);
    } catch (err) {
      console.error('Failed to get Google Drive auth URL:', err);
      setError('Failed to generate Google Drive authorization URL');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleGoogleDriveAuth = async () => {
    if (!authCode) return;
    
    try {
      setSetupLoading(true);
      const response = await fetch(`${API_BASE_URL}/integrations/google-drive/exchange-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode })
      });
      
      if (response.ok) {
        setSetupDialog({ open: false, type: null });
        setAuthCode('');
        setGoogleDriveAuthUrl(null);
        window.location.reload();
      } else {
        const error = await response.json();
        setError(error.detail || 'Failed to authorize Google Drive');
      }
    } catch (err) {
      console.error('Failed to exchange Google Drive code:', err);
      setError('Failed to complete Google Drive authorization');
    } finally {
      setSetupLoading(false);
    }
  };

  const closeSetupDialog = () => {
    setSetupDialog({ open: false, type: null });
    setAuthCode('');
    setGoogleDriveAuthUrl(null);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            External Integrations
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setSetupDialog({ open: true, type: null })}
          >
            Add Integration
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CloudIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Email Integration</Typography>
                </Box>
                <Typography color="textSecondary" paragraph>
                  Automatically process incoming emails and attachments to create tasks and documents.
                </Typography>
                <Chip label="Real-time Processing" size="small" color="primary" />
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => handleSetupIntegration('email')}
                  variant="outlined"
                >
                  Setup Email
                </Button>
              </CardActions>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CloudIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">Google Drive</Typography>
                </Box>
                <Typography color="textSecondary" paragraph>
                  Monitor specific folders and automatically process new documents with AI analysis.
                </Typography>
                <Chip label="File Sync" size="small" color="success" />
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => handleSetupIntegration('google_drive')}
                  variant="outlined"
                >
                  Setup Drive
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h5" gutterBottom>
          Active Integrations
        </Typography>
        
        <Grid container spacing={3}>
          {integrations.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                No integrations configured yet. Use the setup cards above to get started!
              </Alert>
            </Grid>
          ) : (
            integrations.map(integration => (
              <Grid item xs={12} sm={6} md={4} key={integration.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant="h6">
                        {integration.name}
                      </Typography>
                      <IconButton size="small">
                        <SettingsIcon />
                      </IconButton>
                    </Box>
                    <Typography color="textSecondary" paragraph>
                      {integration.description}
                    </Typography>
                    <Chip 
                      label={integration.enabled ? 'Active' : 'Disabled'} 
                      color={integration.enabled ? 'success' : 'default'}
                      size="small"
                    />
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color={integration.enabled ? 'error' : 'primary'}
                      onClick={() => handleToggle(integration.id, !integration.enabled)}
                    >
                      {integration.enabled ? 'Disable' : 'Enable'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      <Dialog 
        open={setupDialog.open} 
        onClose={closeSetupDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {setupDialog.type === 'google_drive' ? 'Setup Google Drive Integration' :
           setupDialog.type === 'email' ? 'Setup Email Integration' :
           'Choose Integration Type'}
        </DialogTitle>
        <DialogContent>
          {setupDialog.type === 'google_drive' && (
            <Box>
              <Typography paragraph>
                To integrate with Google Drive, you need to authorize access to your Google account.
              </Typography>
              {googleDriveAuthUrl ? (
                <Box>
                  <Typography variant="body2" gutterBottom>
                    1. Click the link below to authorize access:
                  </Typography>
                  <Button
                    variant="outlined"
                    href={googleDriveAuthUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ mb: 2 }}
                  >
                    Authorize Google Drive Access
                  </Button>
                  <Typography variant="body2" gutterBottom>
                    2. Copy the authorization code and paste it below:
                  </Typography>
                  <TextField
                    fullWidth
                    label="Authorization Code"
                    value={authCode}
                    onChange={(e) => setAuthCode(e.target.value)}
                    placeholder="Paste authorization code here"
                  />
                </Box>
              ) : (
                <CircularProgress />
              )}
            </Box>
          )}
          
          {setupDialog.type === 'email' && (
            <Alert severity="info">
              Email integration is configured through environment variables. 
              Please contact your administrator to set up EMAIL_USERNAME, EMAIL_PASSWORD, 
              and SMTP settings.
            </Alert>
          )}
          
          {setupDialog.type === null && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setSetupDialog({ open: true, type: 'email' })}
                >
                  Email Integration
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setSetupDialog({ open: true, type: 'google_drive' })}
                >
                  Google Drive
                </Button>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSetupDialog}>
            Cancel
          </Button>
          {setupDialog.type === 'google_drive' && authCode && (
            <Button 
              onClick={handleGoogleDriveAuth}
              variant="contained"
              disabled={setupLoading}
            >
              {setupLoading ? <CircularProgress size={20} /> : 'Complete Setup'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default IntegrationsPage;
