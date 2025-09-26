import React from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import { useQuery } from 'react-query';
import { fetchDocumentTypes } from '../../services/documents';

interface DocumentTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  const theme = useTheme();
  const { data: documentTypes, isLoading, error } = useQuery(
    'documentTypes',
    fetchDocumentTypes,
    {
      retry: 3,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  if (error) {
    return (
      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
        <CardContent>
          <Alert severity="error">
            Failed to load document types. Please refresh and try again.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        height: 'fit-content'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CategoryIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            Document Type
          </Typography>
        </Box>
        
        {isLoading ? (
          <Box>
            <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose the appropriate category for your document
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel 
                id="document-type-label"
                sx={{ 
                  '&.Mui-focused': {
                    color: theme.palette.primary.main
                  }
                }}
              >
                Select Document Type
              </InputLabel>
              <Select
                labelId="document-type-label"
                id="document-type"
                value={value}
                label="Select Document Type"
                onChange={handleChange}
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2,
                  },
                }}
              >
                {documentTypes?.map((type) => (
                  <MenuItem 
                    key={type.id} 
                    value={type.id}
                    sx={{
                      borderRadius: 1,
                      mx: 1,
                      my: 0.5,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.16),
                        },
                      },
                    }}
                  >
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {type.name}
                      </Typography>
                      {type.description && (
                        <Typography variant="caption" color="text.secondary">
                          {type.description}
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {value && documentTypes && (
              <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.04), borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Selected: <strong>{documentTypes.find(t => t.id === value)?.name}</strong>
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentTypeSelector;
