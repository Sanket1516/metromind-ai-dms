import React, { useEffect, useState } from 'react';
import { Box, Container, Grid, Card, CardContent, Typography, CircularProgress, Alert, List, ListItem, ListItemText, Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControlLabel, Switch, IconButton, Tooltip } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { api } from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import DeleteIcon from '@mui/icons-material/Delete';

interface SharedItem {
  id: string;
  document_id: string;
  document_title: string;
  document_filename: string;
  shared_by: string;
  shared_by_name: string;
  shared_with_user?: string | null;
  shared_with_user_name?: string | null;
  shared_with_department?: string | null;
  can_edit: boolean;
  created_at: string;
  expires_at?: string | null;
}

interface SharedDocumentsList {
  shared_by_me: SharedItem[];
  shared_with_me: SharedItem[];
}

const SharedDocumentsPage: React.FC = () => {
  const [data, setData] = useState<SharedDocumentsList | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();

  // Share dialog state
  const [shareOpen, setShareOpen] = useState(false);
  const [docIdToShare, setDocIdToShare] = useState('');
  const [shareDepartment, setShareDepartment] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [expiry, setExpiry] = useState('');
  const [docOptions, setDocOptions] = useState<{ id: string; label: string }[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const loadShared = async () => {
    try {
      setLoading(true);
      const resp = await api.get<SharedDocumentsList>('/documents/shared', {
        validateStatus: (status) => status === 200 || status === 404,
        headers: { 'X-Suppress-Error': 'true' },
      });
      if (resp.status === 200) {
        setData(resp.data);
      } else {
        // 404 -> no shared data
        setData({ shared_by_me: [], shared_with_me: [] });
      }
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load shared documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShared();
  }, []);

  // If navigated with ?shareDocId, prefill and open dialog
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('shareDocId') || params.get('docId');
    if (id) {
      setDocIdToShare(id);
      setShareOpen(true);
    }
  }, [location.search]);

  // Load documents for picker when share dialog opens
  useEffect(() => {
    const loadDocs = async () => {
      try {
        setDocsLoading(true);
        const resp = await api.get<any[]>('/documents/documents', {
          headers: { 'X-Suppress-Error': 'true' },
        });
        const options = Array.isArray(resp.data)
          ? resp.data.map((d: any) => ({ id: d.id, label: d.title || d.original_filename || d.filename || d.id }))
          : [];
        setDocOptions(options);
      } catch {
        setDocOptions([]);
      } finally {
        setDocsLoading(false);
      }
    };
    if (shareOpen && docOptions.length === 0) {
      loadDocs();
    }
  }, [shareOpen, docOptions.length]);

  const handleShareSubmit = async () => {
    try {
      setShareError(null);
      setShareSubmitting(true);
      const docId = docIdToShare.trim();
      if (!docId) return;
      const dept = (shareDepartment || user?.department || '').trim();
      if (!dept) {
        toast.showWarning('Please provide a department to share with');
        return;
      }
      const payload: any = { shared_with_department: dept, can_edit: !!canEdit };
      if (expiry) {
        const d = new Date(expiry);
        if (!isNaN(d.getTime())) payload.expires_at = d.toISOString();
      }
      try {
        await api.post(`/documents/${docId}/share`, payload);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          // Retry preserving segment
          try {
            await api.post(`/documents/documents/${docId}/share`, payload);
          } catch (err2: any) {
            // Final fallback: call document service directly
            await api.post(`http://localhost:8012/documents/${docId}/share`, payload);
          }
        } else {
          throw err;
        }
      }
      toast.showSuccess('Document shared');
      setShareOpen(false);
      setDocIdToShare('');
      setShareDepartment('');
      setCanEdit(false);
      setExpiry('');
      await loadShared();
    } catch (e: any) {
      const msg = e?.response?.data?.detail || 'Failed to share document';
      setShareError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      toast.showError('Failed to share');
    }
    finally {
      setShareSubmitting(false);
    }
  };

  const handleUnshare = async (item: SharedItem) => {
    try {
      try {
        await api.delete(`/documents/${item.document_id}/share/${item.id}`);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          try {
            await api.delete(`/documents/documents/${item.document_id}/share/${item.id}`);
          } catch (err2: any) {
            await api.delete(`http://localhost:8012/documents/${item.document_id}/share/${item.id}`);
          }
        } else {
          throw err;
        }
      }
      toast.showSuccess('Access revoked');
      await loadShared();
    } catch (e: any) {
      toast.showError(e?.response?.data?.detail || 'Failed to unshare');
    }
  };

  const renderList = (items: SharedItem[], owned: boolean) => {
    if (!items || items.length === 0) {
      return <Typography variant="body2" color="text.secondary">No items</Typography>;
    }
    return (
      <List dense>
        {items.map((item) => (
          <React.Fragment key={item.id}>
            <ListItem
              secondaryAction={
                <Box>
                  <Button size="small" variant="outlined" onClick={() => navigate(`/documents?open=${item.document_id}`)} sx={{ mr: 1 }}>
                    Open
                  </Button>
                  {/* Allow unshare only for items I shared */}
                  {owned && (
                    <Tooltip title="Unshare">
                      <IconButton size="small" color="error" onClick={() => handleUnshare(item)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              }
            >
              <ListItemText
                primary={item.document_title || item.document_filename}
                secondary={
                  <>
                    <span>Shared by: {item.shared_by_name}</span>
                    {item.shared_with_user_name ? (
                      <>
                        {' · '}<span>For: {item.shared_with_user_name}</span>
                      </>
                    ) : null}
                    {item.shared_with_department ? (
                      <>
                        {' · '}<span>Dept: {item.shared_with_department}</span>
                      </>
                    ) : null}
                    {item.expires_at ? (
                      <>
                        {' · '}<span>Expires: {new Date(item.expires_at).toLocaleString()}</span>
                      </>
                    ) : null}
                    {' · '}<span>{item.can_edit ? 'Can edit' : 'View only'}</span>
                  </>
                }
              />
            </ListItem>
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Shared Documents
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button variant="contained" onClick={() => setShareOpen(true)}>
            Share Document
          </Button>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {!loading && !error && data && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Shared By Me
                  </Typography>
                  {renderList(data.shared_by_me, true)}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Shared With Me
                  </Typography>
                  {renderList(data.shared_with_me, false)}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Share Dialog */}
      <Dialog open={shareOpen} onClose={() => setShareOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share a Document</DialogTitle>
        <DialogContent>
          {shareError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {shareError}
            </Alert>
          )}
          <Autocomplete
            options={docOptions}
            loading={docsLoading}
            getOptionLabel={(o) => o.label}
            onChange={(_, val) => setDocIdToShare(val?.id || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Document"
                placeholder="Type to search documents"
                sx={{ mt: 1, mb: 1 }}
              />
            )}
          />
          <TextField
            label="Or paste Document ID"
            fullWidth
            value={docIdToShare}
            onChange={(e) => setDocIdToShare(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Department"
            fullWidth
            value={shareDepartment}
            onChange={(e) => setShareDepartment(e.target.value)}
            placeholder={user?.department || 'e.g., Finance, HR'}
            helperText="Defaults to your department if left blank"
            sx={{ mb: 2 }}
          />
          <FormControlLabel control={<Switch checked={canEdit} onChange={(e) => setCanEdit(e.target.checked)} />} label="Allow edit" />
          <TextField
            label="Expiry (optional)"
            type="datetime-local"
            fullWidth
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleShareSubmit} disabled={!docIdToShare || shareSubmitting}>
            {shareSubmitting ? 'Sharing...' : 'Share'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SharedDocumentsPage;
