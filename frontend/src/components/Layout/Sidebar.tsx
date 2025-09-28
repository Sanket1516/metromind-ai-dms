import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Description as DocumentsIcon,
  Search as SearchIcon,
  IntegrationInstructions as IntegrationsIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  TaskAlt as TaskAltIcon,
  Assessment as ReportsIcon,
  Security as SecurityIcon,
  Backup as BackupIcon,
  History as AuditIcon,
  BusinessCenter,
  FolderShared as SharedIcon,
  CloudSync as AutoCollectedIcon,
  Insights as InsightsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarItem {
  title: string;
  icon: React.ReactElement;
  path: string;
  badge?: string | number;
  roles?: string[];
  color?: string;
}

const Sidebar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const mainMenuItems: SidebarItem[] = [
    {
      title: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      color: theme.palette.primary.main,
    },
    {
      title: 'Documents',
      icon: <DocumentsIcon />,
      path: '/documents',
      badge: '12',
      color: theme.palette.info.main,
    },
    {
      title: 'Auto-Collected',
      icon: <AutoCollectedIcon />,
      path: '/documents/auto-collected',
      color: theme.palette.secondary.main,
    },
    {
      title: 'Shared',
      icon: <SharedIcon />,
      path: '/documents/shared',
      color: theme.palette.success.main,
    },
    {
      title: 'Search',
      icon: <SearchIcon />,
      path: '/search',
      color: theme.palette.text.secondary,
    },
    {
      title: 'Tasks',
      icon: <TaskAltIcon />,
      path: '/tasks',
      badge: '5',
      color: theme.palette.warning.main,
    },
    {
      title: 'Analytics',
      icon: <InsightsIcon />,
      path: '/analytics',
      color: theme.palette.success.main,
    },
  ];

  const managementMenuItems: SidebarItem[] = [
    {
      title: 'Integrations',
      icon: <IntegrationsIcon />,
      path: '/integrations',
      badge: 'NEW',
    },
    {
      title: 'Users',
      icon: <UsersIcon />,
      path: '/users',
      roles: ['admin', 'manager'],
    },
    {
      title: 'Security',
      icon: <SecurityIcon />,
      path: '/security',
      roles: ['admin'],
    },
    {
      title: 'Backup',
      icon: <BackupIcon />,
      path: '/backup',
      roles: ['admin'],
    },
    {
      title: 'Audit Logs',
      icon: <AuditIcon />,
      path: '/audit',
      roles: ['admin', 'auditor'],
    },
    {
      title: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
    },
  ];

  const isItemVisible = (item: SidebarItem) => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || '');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderMenuItem = (item: SidebarItem) => {
    if (!isItemVisible(item)) return null;

    const active = isActive(item.path);

    return (
      <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
        <Tooltip title={item.title} placement="right">
        <ListItemButton
          onClick={() => navigate(item.path)}
          sx={{
            borderRadius: 2,
            mx: 1,
            backgroundColor: active
              ? alpha(theme.palette.primary.main, 0.1)
              : 'transparent',
            color: active
              ? theme.palette.primary.main
              : theme.palette.text.primary,
            '&:hover': {
              backgroundColor: active
                ? alpha(theme.palette.primary.main, 0.15)
                : alpha(theme.palette.primary.main, 0.05),
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <ListItemIcon
            sx={{
              color: active
                ? (item.color || theme.palette.primary.main)
                : (item.color || theme.palette.text.secondary),
              minWidth: 40,
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.title}
            sx={{
              '& .MuiListItemText-primary': {
                fontWeight: active ? 600 : 500,
                fontSize: '0.875rem',
              },
            }}
          />
          {item.badge && (
            <Chip
              label={item.badge}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: typeof item.badge === 'string'
                  ? theme.palette.success.main
                  : theme.palette.warning.main,
                color: 'white',
              }}
            />
          )}
        </ListItemButton>
        </Tooltip>
      </ListItem>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2,
          }}
        >
          <BusinessCenter sx={{ color: 'white', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            MetroMind
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Document Management
          </Typography>
        </Box>
      </Box>

      {/* Main Navigation */}
      <Box sx={{ flex: 1, py: 2 }}>
        <Box sx={{ px: 2, mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Main
          </Typography>
        </Box>
        <List disablePadding>
          {mainMenuItems.map(renderMenuItem)}
        </List>

        <Divider sx={{ my: 2, mx: 2 }} />

        <Box sx={{ px: 2, mb: 2 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: theme.palette.text.secondary,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Management
          </Typography>
        </Box>
        <List disablePadding>
          {managementMenuItems.map(renderMenuItem)}
        </List>
      </Box>

      {/* User Info Section */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: alpha(theme.palette.primary.main, 0.03),
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 2,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: 'white', fontWeight: 600 }}
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.full_name || user?.username || 'User'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {user?.email || 'user@example.com'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;