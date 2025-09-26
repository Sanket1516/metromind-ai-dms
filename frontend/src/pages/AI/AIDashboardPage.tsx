import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, CircularProgress, Grid, Card, CardContent, Paper } from '@mui/material';
import { AIDashboard } from '../../components/AI';
import AIService from '../../services/ai-service';

const AIDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentRelationships, setDocumentRelationships] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both document relationships and insights in parallel
        // In production, these would be real API calls
        // const relationshipsPromise = AIService.getDocumentRelationships();
        // const insightsPromise = AIService.getInsights();
        // const [relationships, insights] = await Promise.all([relationshipsPromise, insightsPromise]);
        // setDocumentRelationships(relationships);
        // setInsights(insights);
        
        // For now, simulate API call with mock data
        setTimeout(() => {
          setDocumentRelationships({
            nodes: [
              { id: 'doc1', name: 'Invoice #1234', type: 'invoice', size: 10 },
              { id: 'doc2', name: 'Contract A', type: 'contract', size: 15 },
              { id: 'doc3', name: 'Email Thread', type: 'email', size: 8 },
              { id: 'doc4', name: 'Report Q2', type: 'report', size: 12 },
              { id: 'doc5', name: 'Invoice #5678', type: 'invoice', size: 10 },
              { id: 'doc6', name: 'Contract B', type: 'contract', size: 14 },
              { id: 'doc7', name: 'Meeting Notes', type: 'notes', size: 7 }
            ],
            connections: [
              { source: 'doc1', target: 'doc2', strength: 0.8 },
              { source: 'doc1', target: 'doc5', strength: 0.5 },
              { source: 'doc2', target: 'doc4', strength: 0.7 },
              { source: 'doc3', target: 'doc4', strength: 0.6 },
              { source: 'doc2', target: 'doc6', strength: 0.9 },
              { source: 'doc4', target: 'doc7', strength: 0.4 },
              { source: 'doc6', target: 'doc7', strength: 0.5 }
            ]
          });
          
          setInsights({
            categories: [
              { name: "Invoice", count: 58, color: "#FF6384" },
              { name: "Contract", count: 42, color: "#36A2EB" },
              { name: "Report", count: 27, color: "#FFCE56" },
              { name: "Email", count: 73, color: "#4BC0C0" }
            ],
            sentiments: {
              positive: 45,
              neutral: 120,
              negative: 35
            },
            entities: {
              PERSON: 156,
              ORG: 92,
              DATE: 183,
              MONEY: 67
            }
          });
          
          setLoading(false);
        }, 1500);
      } catch (err) {
        setError('Failed to load AI document data');
        console.error(err);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography color="error" variant="h5">
            {error}
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>
          AI Document Dashboard
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {/* Stats Cards */}
              {insights && (
                <>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: "#FF6384", color: "white" }}>
                      <CardContent>
                        <Typography variant="overline">Documents Processed</Typography>
                        <Typography variant="h3">{insights.categories.reduce((sum: number, cat: any) => sum + cat.count, 0)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: "#36A2EB", color: "white" }}>
                      <CardContent>
                        <Typography variant="overline">Entities Detected</Typography>
                        <Typography variant="h3">{Object.values(insights.entities as Record<string, number>).reduce((a, b) => a + b, 0)}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: "#4BC0C0", color: "white" }}>
                      <CardContent>
                        <Typography variant="overline">Connections Found</Typography>
                        <Typography variant="h3">{documentRelationships?.connections?.length || 0}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Card sx={{ bgcolor: "#FFCE56", color: "white" }}>
                      <CardContent>
                        <Typography variant="overline">Positive Sentiment</Typography>
                        <Typography variant="h3">{Math.round(insights.sentiments.positive / (insights.sentiments.positive + insights.sentiments.neutral + insights.sentiments.negative) * 100)}%</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </>
              )}

              {/* Main Dashboard */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, height: "500px" }}>
                  <AIDashboard loading={false} />
                </Paper>
              </Grid>

              {/* Document Types */}
              {insights && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Document Types</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      {insights.categories.map((category: any) => (
                        <Box key={category.name} sx={{ textAlign: 'center', px: 2 }}>
                          <Box 
                            sx={{ 
                              width: 100, 
                              height: 100, 
                              borderRadius: '50%', 
                              bgcolor: category.color, 
                              display: 'flex', 
                              alignItems: 'center',
                              justifyContent: 'center',
                              mx: 'auto',
                              mb: 1,
                              color: 'white'
                            }}
                          >
                            <Typography variant="h4">{category.count}</Typography>
                          </Box>
                          <Typography variant="body1">{category.name}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </Box>
    </Container>
  );
};

export default AIDashboardPage;
