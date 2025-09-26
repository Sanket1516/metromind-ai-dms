import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      textAlign="center"
      px={3}
    >
      <Typography variant="h1" component="h1" gutterBottom>
        401 - Unauthorized
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom color="text.secondary">
        You don't have permission to access this page.
      </Typography>
      {user && (
        <Typography variant="body1" color="text.secondary" mb={4}>
          Your current role ({user.role}) does not have sufficient privileges.
        </Typography>
      )}
      <Box display="flex" gap={2}>
        <Button variant="contained" color="primary" onClick={handleGoBack}>
          Go Back
        </Button>
        <Button variant="outlined" color="primary" onClick={handleGoHome}>
          Go to Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default UnauthorizedPage;
