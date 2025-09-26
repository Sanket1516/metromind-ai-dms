import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { fetchDocuments, archiveDocument, deleteDocument } from '../../services/documents';
import { Document, DocumentStatus } from '../../types/documents';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import LoadingSpinner from '../Common/LoadingSpinner';
import { toast } from 'react-toastify';

const getStatusColor = (status: DocumentStatus) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'processing':
      return 'info';
    case 'completed':
      return 'success';
    case 'error':
      return 'error';
    case 'archived':
      return 'default';
    default:
      return 'default';
  }
};

const DocumentList: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery(
    ['documents', page, rowsPerPage],
    () => fetchDocuments({ page, limit: rowsPerPage }),
    {
      keepPreviousData: true,
    }
  );

  const archiveMutation = useMutation(archiveDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries('documents');
      toast.success('Document archived successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to archive document: ${error.message}`);
    },
  });

  const deleteMutation = useMutation(deleteDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries('documents');
      toast.success('Document deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete document: ${error.message}`);
    },
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, document: Document) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDocument(null);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleArchive = () => {
    if (selectedDocument) {
      archiveMutation.mutate(selectedDocument.id);
      handleMenuClose();
    }
  };

  const handleDelete = () => {
    if (selectedDocument) {
      deleteMutation.mutate(selectedDocument.id);
      handleMenuClose();
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Uploaded By</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <Typography variant="body1">{document.title}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {document.fileName}
                  </Typography>
                </TableCell>
                <TableCell>{document.documentType.name}</TableCell>
                <TableCell>
                  <Chip
                    label={document.status}
                    color={getStatusColor(document.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{document.uploadedBy.username}</TableCell>
                <TableCell>
                  {format(new Date(document.createdAt), 'MMM d, yyyy')}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View">
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  {user?.role === 'admin' && (
                    <Tooltip title="Edit">
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <IconButton
                    size="small"
                    onClick={(event) => handleMenuOpen(event, document)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={data?.total || 0}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {user?.role === 'admin' && (
          <MenuItem onClick={handleArchive}>
            <ArchiveIcon fontSize="small" sx={{ mr: 1 }} />
            Archive
          </MenuItem>
        )}
        {user?.role === 'admin' && (
          <MenuItem onClick={handleDelete}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default DocumentList;
