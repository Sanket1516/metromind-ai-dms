import React from 'react';
import { Container, Typography, Box, Grid, TextField, Button, Switch, FormControlLabel, MenuItem, Select, FormControl, InputLabel, Divider } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { UserSettings } from '../../types/auth';
import ChangePasswordForm from '../../components/ChangePasswordForm';

const SettingsPage: React.FC = () => {
  const { user, updateUserSettings } = useAuth();
  const [settings, setSettings] = React.useState<Partial<UserSettings>>({
    notifications: {
      email: true,
      push: true,
      desktop: true
    },
    theme: 'light',
    language: 'en',
    timezone: 'UTC'
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    
    if (name === 'theme') {
      setSettings(prev => ({
        ...prev,
        theme: value as 'light' | 'dark' | 'system'
      }));
    } else if (name === 'language') {
      setSettings(prev => ({
        ...prev,
        language: value
      }));
    } else if (name === 'timezone') {
      setSettings(prev => ({
        ...prev,
        timezone: value
      }));
    } else if (name.startsWith('notifications.')) {
      const notificationType = name.split('.')[1] as keyof UserSettings['notifications'];
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications!,
          [notificationType]: checked
        }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateUserSettings(settings);
      setSuccess('Settings updated successfully');
    } catch (err) {
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container>
        <Typography variant="h6" color="error">
          Please login to access settings
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="notifications.email"
                    checked={settings.notifications?.email || false}
                    onChange={handleChange}
                  />
                }
                label="Email Notifications"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="notifications.push"
                    checked={settings.notifications?.push || false}
                    onChange={handleChange}
                  />
                }
                label="Push Notifications"
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    name="notifications.desktop"
                    checked={settings.notifications?.desktop || false}
                    onChange={handleChange}
                  />
                }
                label="Desktop Notifications"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Theme"
                name="theme"
                value={settings.theme}
                onChange={handleChange}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Language"
                name="language"
                value={settings.language}
                onChange={handleChange}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Timezone"
                name="timezone"
                value={settings.timezone}
                onChange={handleChange}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="UTC">UTC</option>
                <option value="EST">EST</option>
                <option value="PST">PST</option>
              </TextField>
            </Grid>
          </Grid>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          {success && (
            <Typography color="success" sx={{ mt: 2 }}>
              {success}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
        
        {/* Change Password Form */}
        <ChangePasswordForm />
      </Box>
    </Container>
  );
};

export default SettingsPage;
