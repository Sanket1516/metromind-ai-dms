import React, { useState, useEffect } from 'react';
import { apiClient, toErrorMessage, downloadFile } from '../../services/api';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Divider,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Slider,
  Rating,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Description as DocumentIcon,
  Person as PersonIcon,
  DateRange as DateIcon,
  Label as TagIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Favorite as FavoriteIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'document' | 'image' | 'user' | 'task';
  size?: string;
  date: string;
  author: string;
  tags: string[];
  score: number;
  url?: string;
  thumbnail?: string;
  description?: string;
}

interface SearchFilters {
  type: string[];
  dateRange: {
    start: string;
    end: string;
  };
  author: string[];
  tags: string[];
  size: {
    min: number;
    max: number;
  };
  score: number;
}

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({
    type: [],
    dateRange: { start: '', end: '' },
    author: [],
    tags: [],
    size: { min: 0, max: 100 },
    score: 0
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'Financial Report Q4 2024.pdf',
      content: 'Quarterly financial analysis and performance metrics for Q4 2024...',
      type: 'document',
      size: '2.4 MB',
      date: '2024-12-15',
      author: 'John Doe',
      tags: ['financial', 'quarterly', 'report'],
      score: 0.95,
      description: 'Comprehensive financial report covering revenue, expenses, and projections'
    },
    {
      id: '2',
      title: 'Project Proposal - MetroMind Enhancement',
      content: 'Detailed proposal for enhancing MetroMind system capabilities...',
      type: 'document',
      size: '1.8 MB',
      date: '2024-12-14',
      author: 'Jane Smith',
      tags: ['project', 'proposal', 'enhancement'],
      score: 0.89,
      description: 'Strategic proposal for system improvements and new features'
    },
    {
      id: '3',
      title: 'Team Meeting Notes - December 2024',
      content: 'Meeting notes from the monthly team sync on project progress...',
      type: 'document',
      size: '0.5 MB',
      date: '2024-12-13',
      author: 'Mike Johnson',
      tags: ['meeting', 'notes', 'team'],
      score: 0.82,
      description: 'Important decisions and action items from team meeting'
    },
    {
      id: '4',
      title: 'User Interface Mockups',
      content: 'Design mockups for the new dashboard interface...',
      type: 'image',
      size: '5.2 MB',
      date: '2024-12-12',
      author: 'Sarah Wilson',
      tags: ['design', 'ui', 'mockup'],
      score: 0.78,
      description: 'Visual designs for improved user interface'
    }
  ];

  useEffect(() => {
    if (query.length > 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [query, filters, sortBy]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params: any = { q: query, sort: sortBy, limit: 50 };
      if (filters.type?.length) params.type = filters.type;
      if (filters.dateRange?.start) params.date_from = filters.dateRange.start;
      if (filters.dateRange?.end) params.date_to = filters.dateRange.end;
      if (filters.author?.length) params.author = filters.author;
      if (filters.tags?.length) params.tags = filters.tags;
      if (filters.score > 0) params.min_score = filters.score / 100;
  
      // Call search via API Gateway
      const resp = await apiClient.get('/search', { params });
      const data = Array.isArray(resp.data) ? resp.data : (resp.data?.results || []);
  
      const mapped: SearchResult[] = data.map((r: any) => ({
        id: String(r.id ?? r.document_id ?? r.doc_id ?? ''),
        title: String(r.title ?? r.filename ?? r.name ?? 'Untitled'),
        content: String(r.snippet ?? r.excerpt ?? r.content ?? ''),
        type: (r.type ?? r.kind ?? 'document') as SearchResult['type'],
        size: r.file_size ? `${(Number(r.file_size) / 1024 / 1024).toFixed(1)} MB` : undefined,
        date: String(r.created_at ?? r.date ?? new Date().toISOString()),
        author: String(r.uploaded_by ?? r.author ?? 'Unknown'),
        tags: Array.isArray(r.tags) ? r.tags : [],
        score: typeof r.score === 'number' ? r.score : (typeof r.relevance === 'number' ? r.relevance : 0.5),
        url: r.url,
        thumbnail: r.thumbnail,
        description: r.description,
      }));
  
      setResults(mapped);
    } catch (error) {
      console.warn('API search failed, falling back to mock:', toErrorMessage(error));
  
      // Fallback to mock
      let filteredResults = mockResults.filter(result =>
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.content.toLowerCase().includes(query.toLowerCase()) ||
        result.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
      if (filters.type.length > 0) {
        filteredResults = filteredResults.filter(result => filters.type.includes(result.type));
      }
      if (filters.author.length > 0) {
        filteredResults = filteredResults.filter(result => filters.author.includes(result.author));
      }
      if (filters.tags.length > 0) {
        filteredResults = filteredResults.filter(result => filters.tags.some(tag => result.tags.includes(tag)));
      }
      if (filters.score > 0) {
        filteredResults = filteredResults.filter(result => result.score >= filters.score / 100);
      }
      switch (sortBy) {
        case 'date':
          filteredResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          break;
        case 'size':
          filteredResults.sort((a, b) => {
            const sizeA = parseFloat(a.size?.split(' ')[0] || '0');
            const sizeB = parseFloat(b.size?.split(' ')[0] || '0');
            return sizeB - sizeA;
          });
          break;
        case 'relevance':
        default:
          filteredResults.sort((a, b) => b.score - a.score);
      }
      setResults(filteredResults);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: [],
      dateRange: { start: '', end: '' },
      author: [],
      tags: [],
      size: { min: 0, max: 100 },
      score: 0
    });
  };

  // Action handlers for search results
  const handleViewResult = (result: SearchResult) => {
    if (result.url) {
      window.open(result.url, '_blank');
    } else {
      window.open(`/documents/${result.id}/view`, '_blank');
    }
  };

  const handleDownloadResult = async (result: SearchResult) => {
    try {
      await downloadFile(`/search/download/${result.id}`, result.title);
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  const handleShareResult = (result: SearchResult) => {
    if (navigator.share) {
      navigator.share({
        title: result.title,
        text: result.description || result.content,
        url: window.location.href + `?result=${result.id}`
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      const shareUrl = window.location.href + `?result=${result.id}`;
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <PdfIcon color="error" />;
      case 'image':
        return <ImageIcon color="primary" />;
      default:
        return <FileIcon />;
    }
  };

  const getResultsByType = (type: string) => {
    return results.filter(result => result.type === type);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          <SearchIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Search & Discovery
        </Typography>

        {/* Search Bar */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              placeholder="Search documents, images, users, and more..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: query && (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setQuery('')} size="small">
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ minWidth: 120 }}
            >
              Filters
            </Button>
            <FormControl sx={{ minWidth: 120 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                startAdornment={<SortIcon sx={{ mr: 1 }} />}
              >
                <MenuItem value="relevance">Relevance</MenuItem>
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="size">Size</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Divider sx={{ my: 3 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Content Type
                  </Typography>
                  {['document', 'image', 'user', 'task'].map((type) => (
                    <FormControlLabel
                      key={type}
                      control={
                        <Checkbox
                          checked={filters.type.includes(type)}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...filters.type, type]
                              : filters.type.filter(t => t !== type);
                            handleFilterChange('type', newTypes);
                          }}
                        />
                      }
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                    />
                  ))}
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Date Range
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    label="From"
                    value={filters.dateRange.start}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      start: e.target.value
                    })}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    type="date"
                    label="To"
                    value={filters.dateRange.end}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      end: e.target.value
                    })}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Minimum Relevance Score
                  </Typography>
                  <Slider
                    value={filters.score}
                    onChange={(_, value) => handleFilterChange('score', value)}
                    min={0}
                    max={100}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Grid>

                <Grid item xs={12} md={3}>
                  <Box display="flex" justifyContent="flex-end" alignItems="flex-end" height="100%">
                    <Button
                      variant="outlined"
                      onClick={clearFilters}
                      startIcon={<ClearIcon />}
                    >
                      Clear Filters
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </motion.div>
          )}
        </Paper>

        {/* Loading State */}
        {loading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Searching...
            </Typography>
          </Box>
        )}

        {/* Search Results */}
        {query && !loading && (
          <Box>
            {/* Results Summary */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                {results.length} results for "{query}"
              </Typography>
              
              {/* Tabs for result types */}
              <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab label={`All (${results.length})`} />
                <Tab label={`Documents (${getResultsByType('document').length})`} />
                <Tab label={`Images (${getResultsByType('image').length})`} />
                <Tab label={`Users (${getResultsByType('user').length})`} />
              </Tabs>
            </Box>

            {/* Results List */}
            <Grid container spacing={3}>
              {(activeTab === 0 ? results : getResultsByType(['document', 'image', 'user', 'task'][activeTab - 1] || 'document'))
                .map((result) => (
                  <Grid item xs={12} key={result.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card elevation={2} sx={{ borderRadius: 2, '&:hover': { elevation: 4 } }}>
                        <CardContent>
                          <Box display="flex" alignItems="flex-start" gap={2}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {getFileIcon(result.type)}
                            </Avatar>
                            
                            <Box flex={1}>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                <Typography variant="h6" component="a" href="#" sx={{ 
                                  textDecoration: 'none',
                                  color: 'primary.main',
                                  '&:hover': { textDecoration: 'underline' }
                                }}>
                                  {result.title}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Rating value={result.score * 5} readOnly size="small" />
                                  <Typography variant="caption" color="text.secondary">
                                    {Math.round(result.score * 100)}%
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {result.description || result.content}
                              </Typography>
                              
                              <Box display="flex" alignItems="center" gap={2} mb={2}>
                                <Chip
                                  icon={<PersonIcon />}
                                  label={result.author}
                                  size="small"
                                  variant="outlined"
                                />
                                <Chip
                                  icon={<DateIcon />}
                                  label={new Date(result.date).toLocaleDateString()}
                                  size="small"
                                  variant="outlined"
                                />
                                {result.size && (
                                  <Chip
                                    label={result.size}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                              
                              <Box display="flex" gap={1} flexWrap="wrap">
                                {result.tags.map((tag) => (
                                  <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Box>
                        </CardContent>
                        
                        <CardActions sx={{ px: 2, pb: 2 }}>
                          <Button size="small" startIcon={<ViewIcon />} onClick={() => handleViewResult(result)}>
                            View
                          </Button>
                          <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleDownloadResult(result)}>
                            Download
                          </Button>
                          <Button size="small" startIcon={<ShareIcon />} onClick={() => handleShareResult(result)}>
                            Share
                          </Button>
                          <IconButton size="small" sx={{ ml: 'auto' }}>
                            <FavoriteIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
            </Grid>

            {/* No Results */}
            {results.length === 0 && !loading && (
              <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
                <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No results found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Try adjusting your search terms or filters
                </Typography>
                <Button variant="outlined" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </Paper>
            )}
          </Box>
        )}

        {/* Empty State */}
        {!query && (
          <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Start searching
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter your search query to find documents, images, users, and more
            </Typography>
          </Paper>
        )}
      </motion.div>
    </Container>
  );
};

export default SearchPage;