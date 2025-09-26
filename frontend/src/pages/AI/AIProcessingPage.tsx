import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Grid, Card, CardContent, Button, TextField, MenuItem, InputAdornment, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { DocumentNetworkVisualization } from '../../components/AI';

const modelOptions = [
  {
    value: 'text-analysis',
    label: 'Text Analysis Model'
  },
  {
    value: 'document-classification',
    label: 'Document Classification Model'
  },
  {
    value: 'entity-extraction',
    label: 'Entity Extraction Model'
  },
  {
    value: 'sentiment-analysis',
    label: 'Sentiment Analysis Model'
  },
];

const AIProcessingPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('text-analysis');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedModel(event.target.value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleProcessing = () => {
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
    }, 3000);
  };

  // In a real implementation, you would send API requests to the AI service
  // const processDocument = async () => {
  //   try {
  //     setIsProcessing(true);
  //     const formData = new FormData();
  //     if (file) formData.append('file', file);
  //     formData.append('model', selectedModel);
  //     formData.append('query', searchQuery);
  //     
  //     const response = await fetch('http://localhost:8010/api/ai/process', {
  //       method: 'POST',
  //       body: formData,
  //     });
  //     
  //     const result = await response.json();
  //     // Handle result
  //   } catch (error) {
  //     console.error('Error processing document:', error);
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI Document Processing
        </Typography>

        <Grid container spacing={3}>
          {/* Left side - Processing controls */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Select Processing Options
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    select
                    label="AI Model"
                    value={selectedModel}
                    onChange={handleModelChange}
                    sx={{ mb: 2 }}
                  >
                    {modelOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  
                  <TextField
                    fullWidth
                    label="Search Query"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Upload Document
                    <input
                      type="file"
                      hidden
                      onChange={handleFileChange}
                    />
                  </Button>
                  
                  {file && (
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Selected file: {file.name}
                    </Typography>
                  )}
                  
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleProcessing}
                    disabled={isProcessing || !file}
                  >
                    {isProcessing ? <CircularProgress size={24} /> : 'Process Document'}
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Processing Information
                </Typography>
                <Typography variant="body2" paragraph>
                  The AI processing service analyzes documents using selected models. 
                  Different models are optimized for specific tasks such as text analysis, 
                  classification, entity extraction, and sentiment analysis.
                </Typography>
                <Typography variant="body2">
                  Documents are processed through the API gateway on port 8010, which routes 
                  requests to the appropriate AI microservice.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Right side - Visualization */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '70vh' }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Document Relationship Visualization
                </Typography>
                <Box sx={{ height: 'calc(100% - 40px)' }}>
                  <DocumentNetworkVisualization />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AIProcessingPage;
