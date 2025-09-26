import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TablePagination,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  Download,
  Visibility,
  History,
  Person,
  Description,
  Security,
  Warning,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../services/api';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

const AuditPage: React.FC = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Mock data for demonstration
  const mockAuditLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: '2024-01-15 14:30:00',
      user: 'admin@kmrl.gov.in',
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: 'admin',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      details: { loginMethod: 'email', success: true },
      severity: 'info',
    },
    {
      id: '2',
      timestamp: '2024-01-15 14:25:00',
      user: 'finance@kmrl.gov.in',
      action: 'DOCUMENT_UPLOAD',
      entityType: 'document',
      entityId: 'doc-123',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      details: { filename: 'budget_report.pdf', size: '2.5MB' },
      severity: 'info',
    },
    {
      id: '3',
      timestamp: '2024-01-15 14:20:00',
      user: 'maintenance@kmrl.gov.in',
      action: 'FAILED_LOGIN',
      entityType: 'user',
      entityId: 'maintenance',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      details: { reason: 'invalid_password', attempts: 3 },
      severity: 'warning',
    },
    {
      id: '4',
      timestamp: '2024-01-15 14:15:00',
      user: 'admin@kmrl.gov.in',
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: 'new-user-456',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      details: { newUser: 'station@kmrl.gov.in', role: 'employee' },
      severity: 'info',
    },
    {
      id: '5',
      timestamp: '2024-01-15 14:10:00',
      user: 'system',
      action: 'BACKUP_COMPLETED',
      entityType: 'system',
      entityId: 'backup-789',
      ipAddress: '127.0.0.1',
      userAgent: 'MetroMind-System',
      details: { backupSize: '150MB', duration: '5 minutes' },
      severity: 'info',
    },
    {
      id: '6',
      timestamp: '2024-01-15 14:05:00',
      user: 'admin@kmrl.gov.in',
      action: 'SECURITY_SETTINGS_CHANGED',
      entityType: 'settings',
      entityId: 'security-config',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      details: { setting: 'password_policy', oldValue: 'medium', newValue: 'strong' },
      severity: 'warning',
    },
  ];

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would call the backend API
      // const response = await apiClient.get('/audit/logs');
      // setAuditLogs(response.data);
      
      // For now, use mock data
      setTimeout(() => {
        setAuditLogs(mockAuditLogs);
        setLoading(false);
      }, 1000);
    } catch (err: any) {
      setError('Failed to load audit logs');
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info': return <CheckCircle sx={{ color: 'primary.main', fontSize: 20 }} />;
      case 'warning': return <Warning sx={{ color: 'warning.main', fontSize: 20 }} />;
      case 'error': return <Error sx={{ color: 'error.main', fontSize: 20 }} />;
      case 'critical': return <Security sx={{ color: 'error.dark', fontSize: 20 }} />;
      default: return <CheckCircle sx={{ color: 'grey.500', fontSize: 20 }} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'primary';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.entityType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = !filterAction || log.action === filterAction;
    const matchesSeverity = !filterSeverity || log.severity === filterSeverity;
    return matchesSearch && matchesAction && matchesSeverity;
  });

  const handleExportLogs = () => {
    // Implementation for exporting audit logs
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Timestamp,User,Action,Entity Type,Entity ID,IP Address,Severity,Details\n" +
      filteredLogs.map(log => 
        `${log.timestamp},${log.user},${log.action},${log.entityType},${log.entityId},${log.ipAddress},${log.severity},"${JSON.stringify(log.details)}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user || !['admin', 'auditor'].includes(user.role)) {
    return (
      <Alert severity="error">
        You don't have permission to view audit logs.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <History color="primary" />
          Audit Logs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor system activities and security events
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
            
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Action</InputLabel>
              <Select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                label="Action"
              >
                <MenuItem value="">All Actions</MenuItem>
                <MenuItem value="USER_LOGIN">User Login</MenuItem>
                <MenuItem value="USER_LOGOUT">User Logout</MenuItem>
                <MenuItem value="DOCUMENT_UPLOAD">Document Upload</MenuItem>
                <MenuItem value="DOCUMENT_DELETE">Document Delete</MenuItem>
                <MenuItem value="USER_CREATED">User Created</MenuItem>
                <MenuItem value="SETTINGS_CHANGED">Settings Changed</MenuItem>
                <MenuItem value="BACKUP_COMPLETED">Backup Completed</MenuItem>
                <MenuItem value="FAILED_LOGIN">Failed Login</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Severity</InputLabel>
              <Select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                label="Severity"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportLogs}
              sx={{ ml: 'auto' }}
            >
              Export Logs
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Entity</TableCell>
                      <TableCell>IP Address</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell width={100}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLogs
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((log) => (
                        <TableRow key={log.id} hover>
                          <TableCell>
                            <Typography variant="body2">
                              {log.timestamp}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">
                                {log.user}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={log.action.replace(/_/g, ' ')}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {log.entityType}: {log.entityId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {log.ipAddress}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getSeverityIcon(log.severity)}
                              <Chip
                                label={log.severity.toUpperCase()}
                                size="small"
                                color={getSeverityColor(log.severity) as any}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {Object.keys(log.details).length > 0 
                                ? `${Object.keys(log.details).length} fields`
                                : 'No details'
                              }
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton size="small">
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                component="div"
                count={filteredLogs.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuditPage;