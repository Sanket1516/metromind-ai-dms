import React from 'react';
import {
  TextField,
  TextFieldProps,
  FormControl,
  FormHelperText,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface AppInputProps extends Omit<TextFieldProps, 'variant' | 'error'> {
  label: string;
  error?: string | boolean;
  helper?: string;
  isPassword?: boolean;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: theme.palette.background.paper,
    '& fieldset': {
      borderColor: theme.palette.grey[300],
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-error fieldset': {
      borderColor: theme.palette.error.main,
    },
  },
  '& .MuiInputLabel-root': {
    color: theme.palette.text.secondary,
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
}));

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  helper,
  isPassword,
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  return (
    <FormControl fullWidth error={!!error}>
      <Typography
        variant="caption"
        color="textSecondary"
        sx={{ mb: 0.5, fontWeight: 500 }}
      >
        {label}
      </Typography>
      <StyledTextField
        {...props}
        type={isPassword ? (showPassword ? 'text' : 'password') : props.type}
        error={!!error}
        InputProps={{
          ...props.InputProps,
          ...(isPassword && {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClickShowPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }),
        }}
      />
      <FormHelperText>
        {error || helper}
      </FormHelperText>
    </FormControl>
  );
};

export default AppInput;
