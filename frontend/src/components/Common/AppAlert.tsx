import React from 'react';
import { Alert, AlertProps, Snackbar, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

interface AppAlertProps extends Omit<AlertProps, 'variant'> {
  open: boolean;
  message: string;
  onClose: () => void;
  autoHideDuration?: number;
  type?: 'success' | 'error' | 'warning' | 'info';
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

const StyledAlert = styled(Alert)(({ theme }) => ({
  borderRadius: '8px',
  '& .MuiAlert-message': {
    padding: '8px 0',
  },
  '& .MuiAlert-icon': {
    fontSize: '24px',
  },
}));

export const AppAlert: React.FC<AppAlertProps> = ({
  open,
  message,
  onClose,
  autoHideDuration = 4000,
  type = 'info',
  position = { vertical: 'top', horizontal: 'right' },
  ...props
}) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={position}
    >
      <StyledAlert
        onClose={onClose}
        severity={type}
        variant="filled"
        {...props}
      >
        {message}
      </StyledAlert>
    </Snackbar>
  );
};

export default AppAlert;
