import React, { useState } from 'react';
import { Container, Typography, Box, TextField, Button } from '@mui/material';
import { useSearchService } from '../../services/search';
import { Document } from '../../types/documents';
import DocumentTable from '../../components/Documents/DocumentTable';

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    documentType: '',
    department: ''
  });

  const searchService = useSearchService();

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const searchResult = await searchService.searchDocuments({
        query: searchQuery,
        dateFrom: filters.startDate,
        dateTo: filters.endDate,
        documentType: filters.documentType
      });
      setResults(searchResult.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Document Search
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Search documents"
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ mb: 2 }}
          />

          <Box display="flex" gap={2} mb={2}>
            <TextField
              label="Start Date"
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Document Type"
              name="documentType"
              value={filters.documentType}
              onChange={handleFilterChange}
            />
            <Button variant="contained" onClick={handleSearch} disabled={loading}>
              Search
            </Button>
          </Box>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {loading ? (
          <Typography>Searching...</Typography>
        ) : (
          results.length > 0 && (
            <DocumentTable
              documents={results}
              onView={(doc) => console.log('View:', doc)}
              onEdit={(doc) => console.log('Edit:', doc)}
              onDelete={(doc) => console.log('Delete:', doc)}
            />
          )
        )}
      </Box>
    </Container>
  );
};

export default SearchPage;
