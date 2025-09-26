import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

type CustomVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning';

interface StyledButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: CustomVariant;
  size?: 'small' | 'medium' | 'large';
}

const variantMap: Record<CustomVariant, { main: string; hover: string }> = {
  primary: {
    main: '#1976d2',
    hover: '#1565c0',
  },
  secondary: {
    main: '#9c27b0',
    hover: '#7b1fa2',
  },
  success: {
    main: '#2e7d32',
    hover: '#1b5e20',
  },
  error: {
    main: '#d32f2f',
    hover: '#c62828',
  },
  warning: {
    main: '#ed6c02',
    hover: '#e65100',
  },
};

const CustomButton = styled(Button)<StyledButtonProps>(({ variant = 'primary', size = 'medium' }) => ({
  borderRadius: '8px',
  textTransform: 'none',
  color: '#fff',
  padding: size === 'small' ? '6px 16px' : size === 'large' ? '12px 32px' : '8px 24px',
  fontSize: size === 'small' ? '0.875rem' : size === 'large' ? '1.125rem' : '1rem',
  fontWeight: 600,
  backgroundColor: variantMap[variant as CustomVariant].main,
  '&:hover': {
    backgroundColor: variantMap[variant as CustomVariant].hover,
  },
}));

export const AppButton: React.FC<StyledButtonProps> = ({
  children,
  variant = 'primary',
  ...props
}) => {
  return (
    <CustomButton
      {...props}
      sx={{
        ...props.sx,
        backgroundColor: variantMap[variant].main,
        '&:hover': {
          backgroundColor: variantMap[variant].hover,
        },
      }}
    >
      {children}
    </CustomButton>
  );
};

export default AppButton;
