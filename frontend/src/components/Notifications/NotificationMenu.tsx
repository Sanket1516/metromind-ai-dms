import React from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNotifications, Notification } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'info':
      return <InfoIcon color="info" />;
    case 'success':
      return <CheckIcon color="success" />;
    case 'warning':
      return <WarningIcon color="warning" />;
    case 'error':
      return <ErrorIcon color="error" />;
    default:
      return <InfoIcon />;
  }
};

const NotificationItem: React.FC<{
  notification: Notification;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  const { markAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = () => {
    markAsRead(notification.id);
    onClose();
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <MenuItem
      onClick={handleClick}
      sx={{
        py: 1,
        px: 2,
        opacity: notification.read ? 0.7 : 1,
        backgroundColor: notification.read ? 'transparent' : 'action.hover',
      }}
    >
      <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
      <ListItemText
        primary={notification.title}
        secondary={
          <>
            {notification.message}
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {formatDistanceToNow(new Date(notification.timestamp), {
                addSuffix: true,
              })}
            </Typography>
          </>
        }
      />
    </MenuItem>
  );
};

const NotificationMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { notifications, unreadCount, markAllAsRead, clearAll } =
    useNotifications();

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6">Notifications</Typography>
          <Box>
            <Button size="small" onClick={markAllAsRead}>
              Mark all read
            </Button>
            <IconButton size="small" onClick={clearAll}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        <Divider />
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="textSecondary">No notifications</Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <NotificationItem
                notification={notification}
                onClose={handleClose}
              />
              <Divider />
            </React.Fragment>
          ))
        )}
      </Menu>
    </>
  );
};

export default NotificationMenu;
