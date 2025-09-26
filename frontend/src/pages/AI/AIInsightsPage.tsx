import React, { useState } from 'react';
import { Container, Box, Typography, Paper, Tabs, Tab, Grid, Card, CardContent, CardMedia, Chip } from '@mui/material';
import { DocumentNetworkVisualization } from '../../components/AI';

// Sample data for document insights
const sampleInsights = [
  { category: 'Invoice', count: 58, color: '#FF6384' },
  { category: 'Contract', count: 42, color: '#36A2EB' },
  { category: 'Report', count: 27, color: '#FFCE56' },
  { category: 'Email', count: 73, color: '#4BC0C0' },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `ai-tab-${index}`,
    'aria-controls': `ai-tabpanel-${index}`,
  };
}

const AIInsightsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI Document Insights
        </Typography>
        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="Overview" {...a11yProps(0)} />
            <Tab label="Document Visualization" {...a11yProps(1)} />
            <Tab label="Analytics" {...a11yProps(2)} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {sampleInsights.map((insight, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card>
                    <CardMedia
                      component="div"
                      sx={{
                        height: 140,
                        backgroundColor: insight.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h3" sx={{ color: 'white' }}>
                        {insight.count}
                      </Typography>
                    </CardMedia>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {insight.category}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Documents processed with AI
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              <Grid item xs={12}>
                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent AI Activities
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                      <Chip label="OCR Processing (25)" color="primary" />
                      <Chip label="Text Analysis (18)" color="secondary" />
                      <Chip label="Document Classification (42)" color="success" />
                      <Chip label="Entity Extraction (37)" color="info" />
                      <Chip label="Sentiment Analysis (15)" color="warning" />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ height: '70vh' }}>
              <DocumentNetworkVisualization />
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              AI Processing Analytics
            </Typography>
            <Typography paragraph>
              Detailed analytics about document processing, AI model performance, and insights will be displayed here.
              This would include charts, metrics, and trend analysis of AI operations across your document collection.
            </Typography>
            <Box sx={{ height: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Analytics visualizations will appear here
              </Typography>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default AIInsightsPage;
