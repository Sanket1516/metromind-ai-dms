import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Grid,
} from '@mui/material';
import { useQuery } from 'react-query';
import { getOcrResults, getAiAnalysis } from '../../services/processing';
import { Document } from '../../types/documents';
import LoadingSpinner from '../Common/LoadingSpinner';

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
      id={`document-preview-tabpanel-${index}`}
      aria-labelledby={`document-preview-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface DocumentPreviewProps {
  document: Document;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document }) => {
  const [tabValue, setTabValue] = useState(0);

  const { data: ocrResults, isLoading: ocrLoading } = useQuery(
    ['ocr', document.id],
    () => getOcrResults(document.id),
    {
      enabled: document.ocrStatus === 'completed',
    }
  );

  const { data: aiAnalysis, isLoading: aiLoading } = useQuery(
    ['analysis', document.id],
    () => getAiAnalysis(document.id),
    {
      enabled: document.status === 'completed',
    }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Document" />
          <Tab label="OCR Results" />
          <Tab label="AI Analysis" />
        </Tabs>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <TabPanel value={tabValue} index={0}>
          <iframe
            src={`${process.env.REACT_APP_API_BASE_URL}/api/documents/${document.id}/view`}
            style={{
              width: '100%',
              height: 'calc(100vh - 200px)',
              border: 'none',
            }}
            title={document.title}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {ocrLoading ? (
            <LoadingSpinner />
          ) : (
            ocrResults && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  OCR Results
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Confidence: {(ocrResults.confidence * 100).toFixed(1)}%
                </Typography>
                <Divider sx={{ my: 2 }} />
                {ocrResults.pages.map((page, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Page {page.pageNumber}
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{ p: 2, backgroundColor: 'background.default' }}
                    >
                      <Typography variant="body2">{page.text}</Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>
            )
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {aiLoading ? (
            <LoadingSpinner />
          ) : (
            aiAnalysis && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Summary
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2">{aiAnalysis.summary}</Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Keywords
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {aiAnalysis.keywords.map((keyword, index) => (
                      <Chip key={index} label={keyword} size="small" />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Classifications
                  </Typography>
                  <List dense>
                    {aiAnalysis.classification.map((cls, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={cls.label}
                          secondary={`Confidence: ${(cls.confidence * 100).toFixed(
                            1
                          )}%`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Sentiment Analysis
                  </Typography>
                  <Chip
                    label={`${aiAnalysis.sentiment.label} (${(
                      aiAnalysis.sentiment.score * 100
                    ).toFixed(1)}%)`}
                    color={
                      aiAnalysis.sentiment.label === 'positive'
                        ? 'success'
                        : aiAnalysis.sentiment.label === 'negative'
                        ? 'error'
                        : 'default'
                    }
                  />
                </Grid>
              </Grid>
            )
          )}
        </TabPanel>
      </Box>
    </Paper>
  );
};

export default DocumentPreview;
