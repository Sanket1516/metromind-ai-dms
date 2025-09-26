import React from 'react';
import { Box, Grid } from '@mui/material';
import DocumentCard, { Document } from './DocumentCard';

interface DocumentGridProps {
  documents: Document[];
  onView?: (doc: Document) => void;
  onDownload?: (doc: Document) => void;
  onShare?: (doc: Document) => void;
  onEdit?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
}

const DocumentGrid: React.FC<DocumentGridProps> = ({
  documents,
  onView,
  onDownload,
  onShare,
  onEdit,
  onDelete,
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={3}>
        {documents.map((doc) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
            <DocumentCard
              document={doc}
              onView={onView}
              onDownload={onDownload}
              onShare={onShare}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DocumentGrid;
