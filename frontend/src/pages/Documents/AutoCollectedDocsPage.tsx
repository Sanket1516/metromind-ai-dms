import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const AutoCollectedDocsPage: React.FC = () => {
  // TODO: Fetch auto-collected documents from backend API
  // Example placeholder data
  const documents = [
    { id: '1', name: 'Invoice_2025_09.pdf', source: 'Google Drive', collectedAt: '2025-09-17 10:30', status: 'Processed' },
    { id: '2', name: 'Report_Q3.docx', source: 'Dropbox', collectedAt: '2025-09-16 14:12', status: 'Pending' },
    { id: '3', name: 'Email_Attachment_1234.pdf', source: 'Gmail', collectedAt: '2025-09-15 09:45', status: 'Processed' },
  ];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Auto-Collected Documents
      </Typography>
      <Paper elevation={2} sx={{ p: 2 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Source</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Collected At</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {documents.map(doc => (
              <tr key={doc.id}>
                <td style={{ padding: 8 }}>{doc.name}</td>
                <td style={{ padding: 8 }}>{doc.source}</td>
                <td style={{ padding: 8 }}>{doc.collectedAt}</td>
                <td style={{ padding: 8 }}>{doc.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Paper>
    </Box>
  );
};

export default AutoCollectedDocsPage;
