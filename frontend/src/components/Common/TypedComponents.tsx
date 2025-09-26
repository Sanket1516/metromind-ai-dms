import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';

// This fixes the "complex union type" errors by providing a type-safe Box wrapper
export const TypedBox: React.FC<{
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  component?: React.ElementType;
  [key: string]: any;
}> = ({ children, sx, ...rest }) => {
  return (
    <Box sx={sx} {...rest}>
      {children}
    </Box>
  );
};
