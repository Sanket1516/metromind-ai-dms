import React, { useState } from 'react';
import {
  Box,
  TextField,
  Grid,
  Paper,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Typography,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useQuery } from 'react-query';
import { fetchDocuments, fetchDocumentTypes } from '../../services/documents';
import { Document } from '../../types/documents';
import DocumentList from './DocumentList';
import { useDebounce } from '../../hooks/useDebounce';

const DocumentSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: documentTypes } = useQuery('documentTypes', fetchDocumentTypes);
  const { data: searchResults, isLoading } = useQuery(
    ['documents', debouncedSearchTerm, selectedType, selectedStatus, startDate, endDate],
    () =>
      fetchDocuments({
        search: debouncedSearchTerm,
        type: selectedType,
        status: selectedStatus,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
      }),
    {
      enabled: Boolean(
        debouncedSearchTerm ||
          selectedType ||
          selectedStatus ||
          startDate ||
          endDate
      ),
    }
  );

  const handleFilterChange = (
    filterType: string,
    value: string | Date | null
  ) => {
    switch (filterType) {
      case 'type':
        setSelectedType(value as string);
        if (value) {
          setActiveFilters((prev) =>
            [...prev, `Type: ${value}`].filter((v, i, a) => a.indexOf(v) === i)
          );
        }
        break;
      case 'status':
        setSelectedStatus(value as string);
        if (value) {
          setActiveFilters((prev) =>
            [...prev, `Status: ${value}`].filter((v, i, a) => a.indexOf(v) === i)
          );
        }
        break;
      case 'startDate':
      case 'endDate':
        const dateValue = value as Date;
        if (filterType === 'startDate') {
          setStartDate(dateValue);
        } else {
          setEndDate(dateValue);
        }
        if (dateValue) {
          setActiveFilters((prev) =>
            [
              ...prev,
              `${
                filterType === 'startDate' ? 'From' : 'To'
              }: ${dateValue.toLocaleDateString()}`,
            ].filter((v, i, a) => a.indexOf(v) === i)
          );
        }
        break;
    }
  };

  const handleRemoveFilter = (filter: string) => {
    setActiveFilters((prev) => prev.filter((f) => f !== filter));
    if (filter.startsWith('Type:')) {
      setSelectedType('');
    } else if (filter.startsWith('Status:')) {
      setSelectedStatus('');
    } else if (filter.startsWith('From:')) {
      setStartDate(null);
    } else if (filter.startsWith('To:')) {
      setEndDate(null);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedStatus('');
    setStartDate(null);
    setEndDate(null);
    setActiveFilters([]);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents by title, content, or metadata..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                label="Document Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {documentTypes?.map((type) => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => handleFilterChange('startDate', date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => handleFilterChange('endDate', date)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
        </Grid>

        {activeFilters.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FilterListIcon sx={{ mr: 1 }} />
              <Typography variant="body2">Active Filters:</Typography>
              <Button
                size="small"
                sx={{ ml: 'auto' }}
                onClick={clearAllFilters}
              >
                Clear All
              </Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {activeFilters.map((filter) => (
                <Chip
                  key={filter}
                  label={filter}
                  onDelete={() => handleRemoveFilter(filter)}
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Results */}
      {searchResults && <DocumentList />}
    </Box>
  );
};

export default DocumentSearch;
