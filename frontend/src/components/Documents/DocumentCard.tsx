import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  RemoveRedEye as ViewIcon,
  GetApp as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

export interface Document {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  thumbnailUrl?: string;
}

interface DocumentCardProps {
  document: Document;
  onView?: (doc: Document) => void;
  onDownload?: (doc: Document) => void;
  onShare?: (doc: Document) => void;
  onEdit?: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
}

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '12px',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const DocumentPreview = styled(Box)(({ theme }) => ({
  height: '140px',
  backgroundColor: theme.palette.grey[100],
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  borderRadius: '8px',
  position: 'relative',
}));

const PreviewOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0,
  transition: 'opacity 0.2s ease',
  borderRadius: '8px',
  '&:hover': {
    opacity: 1,
  },
}));

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'processing':
      return 'warning';
    case 'completed':
      return 'success';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'default';
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDownload,
  onShare,
  onEdit,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <StyledCard variant="outlined">
      <CardContent>
        <DocumentPreview
          sx={{
            backgroundImage: `url(${document.thumbnailUrl || '/document-placeholder.png'})`,
            mb: 2,
          }}
        >
          <PreviewOverlay>
            <IconButton
              onClick={() => onView?.(document)}
              sx={{ color: 'white', mr: 1 }}
            >
              <ViewIcon />
            </IconButton>
            <IconButton
              onClick={() => onDownload?.(document)}
              sx={{ color: 'white' }}
            >
              <DownloadIcon />
            </IconButton>
          </PreviewOverlay>
        </DocumentPreview>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
            {document.title}
          </Typography>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
          {new Date(document.createdAt).toLocaleDateString()}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip
            label={document.status}
            size="small"
            color={getStatusColor(document.status)}
          />
          <Chip
            label={document.priority}
            size="small"
            color={getPriorityColor(document.priority)}
          />
          <Chip
            label={document.category}
            size="small"
            variant="outlined"
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="textSecondary">
            {document.fileType.toUpperCase()} • {formatFileSize(document.fileSize)}
          </Typography>
        </Box>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {onEdit && (
          <MenuItem onClick={() => { handleMenuClose(); onEdit(document); }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        {onShare && (
          <MenuItem onClick={() => { handleMenuClose(); onShare(document); }}>
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem onClick={() => { handleMenuClose(); onDelete(document); }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </StyledCard>
  );
};

export default DocumentCard;
