import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Tabs,
  Tab,
  Typography,
  Button,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface DocumentViewerProps {
  open: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    content?: string;
    ocrText?: string;
    summary?: string;
    keyEntities?: Record<string, any>;
    sentiment?: number;
    language?: string;
    // Add other document properties as needed
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const PreviewContainer = styled(Box)(({ theme }) => ({
  height: '60vh',
  backgroundColor: theme.palette.grey[100],
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
}));

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`document-tabpanel-${index}`}
      aria-labelledby={`document-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  open,
  onClose,
  document,
}) => {
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const renderEntityCard = (label: string, value: any) => (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        mb: 1,
      }}
    >
      <Typography variant="caption" color="textSecondary">
        {label}
      </Typography>
      <Typography variant="body2">
        {typeof value === 'object' ? JSON.stringify(value) : value}
      </Typography>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{document.title}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="document viewer tabs"
          >
            <Tab label="Preview" />
            <Tab label="OCR Text" />
            <Tab label="AI Analysis" />
            <Tab label="Metadata" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <PreviewContainer>
            {/* Add document preview component here */}
            <Typography>Document Preview</Typography>
          </PreviewContainer>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button variant="contained">Download</Button>
            <Button variant="outlined">Share</Button>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {document.ocrText || 'No OCR text available'}
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {renderEntityCard('Summary', document.summary || 'No summary available')}
            {renderEntityCard('Key Entities', document.keyEntities || {})}
            {renderEntityCard('Sentiment Score', document.sentiment || 'N/A')}
            {renderEntityCard('Detected Language', document.language || 'Unknown')}
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {Object.entries(document).map(([key, value]) => (
              key !== 'content' && renderEntityCard(key, value)
            ))}
          </Box>
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;
