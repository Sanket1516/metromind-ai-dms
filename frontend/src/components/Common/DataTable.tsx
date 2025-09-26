import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  RemoveRedEye as ViewIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row?: any) => JSX.Element | string;
}

export interface DataTableProps {
  columns: Column[];
  rows: any[];
  loading?: boolean;
  error?: string;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
  total?: number;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (newRowsPerPage: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  loading = false,
  error,
  onEdit,
  onDelete,
  onView,
  total = 0,
  page = 0,
  rowsPerPage = 10,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const theme = useTheme();

  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange?.(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange?.(parseInt(event.target.value, 10));
  };

  const renderContent = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length + 1} align="center">
            <Box sx={{ py: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress size={40} />
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length + 1} align="center">
            <Box sx={{ py: 3 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    if (!rows.length) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length + 1} align="center">
            <Box sx={{ py: 3 }}>
              <Typography color="textSecondary">No data available</Typography>
            </Box>
          </TableCell>
        </TableRow>
      );
    }

    return rows.map((row, index) => (
      <TableRow hover key={index}>
        {columns.map((column) => (
          <TableCell
            key={column.id}
            align={column.align}
            style={{ minWidth: column.minWidth }}
          >
            {column.format ? column.format(row[column.id]) : row[column.id]}
          </TableCell>
        ))}
        <TableCell align="right">
          {onView && (
            <IconButton onClick={() => onView(row)} size="small" sx={{ mr: 1 }}>
              <ViewIcon fontSize="small" />
            </IconButton>
          )}
          {onEdit && (
            <IconButton onClick={() => onEdit(row)} size="small" sx={{ mr: 1 }}>
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton onClick={() => onDelete(row)} size="small" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <Paper elevation={0} variant="outlined">
      <TableContainer sx={{ maxHeight: '70vh' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sx={{
                    backgroundColor: theme.palette.background.default,
                    fontWeight: 600,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
              <TableCell
                align="right"
                sx={{
                  backgroundColor: theme.palette.background.default,
                  fontWeight: 600,
                }}
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderContent()}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default DataTable;
