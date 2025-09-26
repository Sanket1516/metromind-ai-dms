import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Avatar,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tab,
  Tabs,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Edit,
  Security,
  Notifications,
  History,
  VpnKey,
  Devices,
  Delete,
  PhotoCamera,
  Save,
  Cancel,
  Shield,
  Computer,
  Smartphone
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  department?: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
  is_2fa_enabled: boolean;
  profile_completion: number;
}

interface UserSession {
  id: string;
  device_info: string;
  ip_address: string;
  last_activity: string;
  is_current: boolean;
  location?: string;
  browser?: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  ip_address?: string;
  status: 'success' | 'warning' | 'error';
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: ''
  });

  const [notifications, setNotifications] = useState({
    email_notifications: true,
    push_notifications: true,
    document_updates: true,
    task_reminders: true,
    security_alerts: true,
    weekly_digest: false
  });

  useEffect(() => {
    loadProfile();
    loadSessions();
    loadActivities();
  }, []);

  const loadProfile = async () => {
    try {
      const mockProfile: UserProfile = {
        id: String(user?.id) || '1',
        username: user?.username || 'user',
        email: user?.email || 'user@metromind.com',
        full_name: user?.full_name || 'John Doe',
        phone: '+91 9876543210',
        department: 'IT Department',
        role: user?.role || 'employee',
        created_at: '2024-01-15T10:30:00Z',
        last_login: '2024-12-16T14:20:00Z',
        is_2fa_enabled: true,
        profile_completion: 85
      };
      
      setProfile(mockProfile);
      setFormData({
        full_name: mockProfile.full_name,
        email: mockProfile.email,
        phone: mockProfile.phone || '',
        department: mockProfile.department || ''
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const mockSessions: UserSession[] = [
        {
          id: '1',
          device_info: 'Chrome 120.0',
          ip_address: '192.168.1.100',
          last_activity: '2024-12-16T14:20:00Z',
          is_current: true,
          location: 'Mumbai, India',
          browser: 'Chrome'
        },
        {
          id: '2',
          device_info: 'Safari 17.1',
          ip_address: '192.168.1.101',
          last_activity: '2024-12-15T18:30:00Z',
          is_current: false,
          location: 'Delhi, India',
          browser: 'Safari'
        }
      ];
      setSessions(mockSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const mockActivities: ActivityLog[] = [
        {
          id: '1',
          action: 'Login',
          description: 'Successful login from Chrome browser',
          timestamp: '2024-12-16T14:20:00Z',
          ip_address: '192.168.1.100',
          status: 'success'
        },
        {
          id: '2',
          action: 'Document Upload',
          description: 'Uploaded "Financial Report Q4.pdf"',
          timestamp: '2024-12-16T13:45:00Z',
          status: 'success'
        },
        {
          id: '3',
          action: 'Password Change',
          description: 'Password changed successfully',
          timestamp: '2024-12-15T16:30:00Z',
          status: 'success'
        }
      ];
      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const handleSave = async () => {
    setUpdateLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setIsEditing(false);
      
      if (profile) {
        setProfile({
          ...profile,
          ...formData,
          profile_completion: calculateProfileCompletion(formData)
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setUpdateLoading(false);
    }
  };

  const calculateProfileCompletion = (data: typeof formData) => {
    const fields = Object.values(data);
    const filledFields = fields.filter(field => field.trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (setting: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [setting]: value }));
  };

  const terminateSession = async (sessionId: string) => {
    try {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setMessage({ type: 'success', text: 'Session terminated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to terminate session' });
    }
  };

  const getDeviceIcon = (deviceInfo: string) => {
    if (deviceInfo.toLowerCase().includes('mobile') || deviceInfo.toLowerCase().includes('iphone') || deviceInfo.toLowerCase().includes('android')) {
      return <Smartphone />;
    }
    return <Computer />;
  };

  const getActivityIcon = (action: string, status: string) => {
    const color = status === 'success' ? 'success' : status === 'warning' ? 'warning' : 'error';
    switch (action.toLowerCase()) {
      case 'login':
        return <VpnKey color={color} />;
      case 'document upload':
        return <History color={color} />;
      case 'password change':
        return <Security color={color} />;
      default:
        return <History color={color} />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Box textAlign="center">
            <LinearProgress sx={{ width: 200, mb: 2 }} />
            <Typography>Loading profile...</Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          <Person sx={{ mr: 2, verticalAlign: 'middle' }} />
          My Profile
        </Typography>

        {message && (
          <Alert 
            severity={message.type} 
            sx={{ mb: 3 }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column - Profile Card */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2, textAlign: 'center', mb: 3 }}>
              <Box position="relative" display="inline-block" mb={3}>
                <Avatar
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    mx: 'auto',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontSize: '3rem'
                  }}
                >
                  {profile?.full_name?.charAt(0) || 'U'}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                  size="small"
                >
                  <PhotoCamera fontSize="small" />
                </IconButton>
              </Box>
              
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {profile?.full_name}
              </Typography>
              
              <Chip 
                label={profile?.role.toUpperCase().replace('_', ' ')} 
                color="primary" 
                size="small"
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                @{profile?.username}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Member since {new Date(profile?.created_at || '').toLocaleDateString()}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Profile Completion */}
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle2">Profile Completion</Typography>
                  <Typography variant="subtitle2">{profile?.profile_completion}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={profile?.profile_completion || 0}
                  sx={{ borderRadius: 1, height: 8 }}
                />
              </Box>

              {/* Security Status */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  <Security sx={{ mr: 1, verticalAlign: 'middle', fontSize: 16 }} />
                  Security Status
                </Typography>
                <Chip
                  label={profile?.is_2fa_enabled ? '2FA Enabled' : '2FA Disabled'}
                  color={profile?.is_2fa_enabled ? 'success' : 'warning'}
                  size="small"
                  icon={<Shield />}
                />
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Tabs Content */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
              >
                <Tab label="Personal Info" />
                <Tab label="Security" />
                <Tab label="Notifications" />
                <Tab label="Activity" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {/* Personal Information Tab */}
                {activeTab === 0 && (
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Personal Information
                      </Typography>
                      <Button
                        startIcon={isEditing ? <Cancel /> : <Edit />}
                        onClick={() => setIsEditing(!isEditing)}
                        variant={isEditing ? "outlined" : "contained"}
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          disabled={!isEditing}
                          InputProps={{
                            startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          disabled={!isEditing}
                          InputProps={{
                            startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={!isEditing}
                          InputProps={{
                            startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Department"
                          value={formData.department}
                          onChange={(e) => handleInputChange('department', e.target.value)}
                          disabled={!isEditing}
                          InputProps={{
                            startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      </Grid>
                    </Grid>

                    {isEditing && (
                      <Box mt={3} display="flex" gap={2}>
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleSave}
                          disabled={updateLoading}
                          sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                            }
                          }}
                        >
                          {updateLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Security Tab */}
                {activeTab === 1 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                      Security Settings
                    </Typography>
                    <List>
                      {sessions.map((session) => (
                        <ListItem
                          key={session.id}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            mb: 1
                          }}
                        >
                          <ListItemIcon>
                            {getDeviceIcon(session.device_info)}
                          </ListItemIcon>
                          <ListItemText
                            primary={session.device_info}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  {session.location} • {session.ip_address}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Last active: {new Date(session.last_activity).toLocaleString()}
                                </Typography>
                                {session.is_current && (
                                  <Chip label="Current Session" color="success" size="small" sx={{ ml: 1 }} />
                                )}
                              </Box>
                            }
                          />
                          {!session.is_current && (
                            <IconButton
                              edge="end"
                              onClick={() => terminateSession(session.id)}
                              size="small"
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          )}
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Notifications Tab */}
                {activeTab === 2 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                      <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Notification Preferences
                    </Typography>
                    <Grid container spacing={2}>
                      {Object.entries(notifications).map(([key, value]) => (
                        <Grid item xs={12} sm={6} key={key}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={value}
                                onChange={(e) => handleNotificationChange(key, e.target.checked)}
                              />
                            }
                            label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Activity Tab */}
                {activeTab === 3 && (
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                      Recent Activity
                    </Typography>
                    <List>
                      {activities.map((activity) => (
                        <ListItem
                          key={activity.id}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            mb: 1
                          }}
                        >
                          <ListItemIcon>
                            {getActivityIcon(activity.action, activity.status)}
                          </ListItemIcon>
                          <ListItemText
                            primary={activity.action}
                            secondary={
                              <Box>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  {activity.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(activity.timestamp).toLocaleString()}
                                  {activity.ip_address && ` • ${activity.ip_address}`}
                                </Typography>
                              </Box>
                            }
                          />
                          <Chip
                            label={activity.status}
                            color={activity.status === 'success' ? 'success' : activity.status === 'warning' ? 'warning' : 'error'}
                            size="small"
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default ProfilePage;
