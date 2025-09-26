import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Button,
  TextField,
  CircularProgress,
  useTheme,
  alpha,
  SxProps,
  Theme
} from '@mui/material';
import { 
  Search as SearchIcon, 
  InsertDriveFile as FileIcon,
  Category as CategoryIcon,
  Lightbulb as LightbulbIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import DocumentNetworkVisualization from './DocumentNetworkVisualization';
import AIService from '../../services/ai-service';

// Sample document type - replace with your actual document type
interface Document {
  id: string;
  title: string;
  category: string;
  content: string;
  confidence: number;
  dateProcessed: string;
}

// Sample AI insights type
interface AIInsight {
  id: string;
  title: string;
  description: string;
  score: number;
  type: 'suggestion' | 'insight' | 'warning';
}

const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Safety Protocol 2025',
    category: 'safety',
    content: 'This document outlines the safety protocols for KMRL operations in 2025.',
    confidence: 0.94,
    dateProcessed: '2025-09-10T15:30:00'
  },
  {
    id: '2',
    title: 'Annual Financial Report',
    category: 'finance',
    content: 'Financial performance metrics and analysis for the fiscal year 2024-2025.',
    confidence: 0.89,
    dateProcessed: '2025-09-08T11:20:00'
  },
  {
    id: '3',
    title: 'Maintenance Schedule Q4',
    category: 'maintenance',
    content: 'Detailed maintenance tasks and schedules for the fourth quarter of 2025.',
    confidence: 0.92,
    dateProcessed: '2025-09-05T09:15:00'
  },
];

const mockInsights: AIInsight[] = [
  {
    id: '1',
    title: 'Safety compliance gap detected',
    description: 'Some maintenance documents are missing required safety certifications.',
    score: 0.85,
    type: 'warning'
  },
  {
    id: '2',
    title: 'Process optimization opportunity',
    description: 'Analysis shows potential 15% efficiency gain in document approval workflow.',
    score: 0.78,
    type: 'suggestion'
  },
  {
    id: '3',
    title: 'Related document cluster',
    description: 'Financial reports from Q2 show strong correlation with maintenance requests.',
    score: 0.92,
    type: 'insight'
  }
];

interface AIDashboardProps {
  documents?: Document[];
  insights?: AIInsight[];
  loading?: boolean;
}

// API response types for integration
interface ApiDocumentNode {
  id: string;
  name: string;
  type: string;
  size: number;
}

interface ApiConnection {
  source: string;
  target: string;
  strength: number;
}

interface ApiDocumentRelationships {
  nodes: ApiDocumentNode[];
  connections: ApiConnection[];
}

const AIDashboard: React.FC<AIDashboardProps> = ({
  documents = mockDocuments,
  insights = mockInsights,
  loading = false
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [aiResponse, setAIResponse] = useState<string>('');
  const [processingQuery, setProcessingQuery] = useState(false);
  const [documentRelationships, setDocumentRelationships] = useState<ApiDocumentRelationships | null>(null);
  const [visualizationLoading, setVisualizationLoading] = useState(true);

  // Fetch document relationships data for visualization
  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        setVisualizationLoading(true);
        
        // Call the real API service which will use our mock data
        const data = await AIService.getDocumentRelationships();
        setDocumentRelationships(data);
        setVisualizationLoading(false);
      } catch (error) {
        console.error('Error fetching document relationships:', error);
        setVisualizationLoading(false);
      }
    };
    
    fetchRelationships();
  }, []);

  // Format documents for visualization (use local documents or API data if available)
  const visualizationDocuments = documents.map(doc => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    relevanceScore: doc.confidence
  }));

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setProcessingQuery(true);
    
    try {
      // Call the AI service to process the query
      const response = await AIService.queryAI(searchQuery);
      setAIResponse(response.answer);
    } catch (error) {
      console.error('Error querying AI:', error);
      setAIResponse('Sorry, there was an error processing your query. Please try again later.');
    } finally {
      setProcessingQuery(false);
    }
  };

  const getChipColor = (type: string) => {
    switch (type) {
      case 'warning':
        return { bg: '#ffebee', color: '#c62828' };
      case 'suggestion':
        return { bg: '#e3f2fd', color: '#1565c0' };
      case 'insight':
        return { bg: '#e8f5e9', color: '#2e7d32' };
      default:
        return { bg: '#f3e5f5', color: '#6a1b9a' };
    }
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety':
        return '#f44336';
      case 'finance':
        return '#4caf50';
      case 'operations':
        return '#ff9800';
      case 'maintenance':
        return '#2196f3';
      default:
        return '#9c27b0';
    }
  };

  // Define styles outside of the JSX
  const containerStyles: SxProps<Theme> = {
    p: 0
  };
  
  return (
    <Box sx={containerStyles}>
      <Typography variant="h4" gutterBottom>
        AI Document Intelligence
      </Typography>
      
      {/* Document Network Visualization */}
      <DocumentNetworkVisualization 
        loading={visualizationLoading || loading} 
        title="AI Document Relationship Map"
      />
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ display: 'block', textAlign: 'center', mt: 1, mb: 2 }}
      >
        {documentRelationships 
          ? `Showing relationships between ${documentRelationships.nodes.length} documents with ${documentRelationships.connections.length} connections` 
          : 'Loading document relationships...'}
      </Typography>
      
      <Grid container spacing={3}>
        {/* AI Assistant */}
        <Grid item xs={12}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(to right, #1a237e, #283593)' 
                : 'linear-gradient(to right, #bbdefb, #90caf9)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PsychologyIcon sx={{ fontSize: 32, mr: 1, color: theme.palette.mode === 'dark' ? '#fff' : '#0d47a1' }} />
              <Typography variant="h5">
                AI Assistant
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 2,
              gap: 1
            }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask something about your documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                sx={{
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  borderRadius: 1
                }}
              />
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSearch}
                disabled={processingQuery}
                startIcon={processingQuery ? <CircularProgress size={20} /> : <SearchIcon />}
                sx={{ height: '56px', px: 3 }}
              >
                {processingQuery ? 'Processing...' : 'Ask'}
              </Button>
            </Box>
            
            {aiResponse && (
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  borderRadius: 1
                }}
              >
                <Typography variant="body1">{aiResponse}</Typography>
              </Paper>
            )}
          </Paper>
        </Grid>
        
        {/* AI Insights */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LightbulbIcon sx={{ fontSize: 24, mr: 1, color: '#ffc107' }} />
              <Typography variant="h6">
                AI Insights
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {insights.map((insight) => {
              const chipColor = getChipColor(insight.type);
              
              return (
                <Card 
                  key={insight.id} 
                  variant="outlined" 
                  sx={{ mb: 2, border: `1px solid ${alpha(chipColor.color, 0.3)}` }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {insight.title}
                      </Typography>
                      <Chip 
                        label={insight.type} 
                        size="small" 
                        sx={{ 
                          backgroundColor: chipColor.bg, 
                          color: chipColor.color,
                          fontWeight: 'bold',
                          textTransform: 'capitalize'
                        }} 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {insight.description}
                    </Typography>
                    <Typography variant="caption" sx={{ color: chipColor.color }}>
                      Confidence: {(insight.score * 100).toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Paper>
        </Grid>
        
        {/* Recent AI Processed Documents */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CategoryIcon sx={{ fontSize: 24, mr: 1, color: '#7e57c2' }} />
              <Typography variant="h6">
                Recently Processed Documents
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {documents.map((doc) => (
              <Card key={doc.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FileIcon sx={{ color: getCategoryColor(doc.category) }} />
                    <Typography variant="subtitle1">
                      {doc.title}
                    </Typography>
                    <Chip 
                      label={doc.category} 
                      size="small" 
                      sx={{ 
                        ml: 'auto',
                        backgroundColor: alpha(getCategoryColor(doc.category), 0.2), 
                        color: getCategoryColor(doc.category),
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                      }} 
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} noWrap>
                    {doc.content}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Processed: {new Date(doc.dateProcessed).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: getCategoryColor(doc.category) }}>
                      Confidence: {(doc.confidence * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIDashboard;
