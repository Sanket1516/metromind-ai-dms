import React from 'react';
import {
  Box,
  Paper,
  IconButton,
  Input,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search as SearchIcon } from '@mui/icons-material';

export interface FilterOption {
  value: string;
  label: string;
}

interface DocumentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categories: FilterOption[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  statuses: FilterOption[];
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  priorities: FilterOption[];
  selectedPriority: string;
  onPriorityChange: (value: string) => void;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  gap: theme.spacing(2),
  alignItems: 'center',
  flexWrap: 'wrap',
}));

const SearchBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 1),
  flex: 1,
  minWidth: '200px',
}));

const FilterControl = styled(FormControl)(({ theme }) => ({
  minWidth: '150px',
}));

export const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  statuses,
  selectedStatus,
  onStatusChange,
  priorities,
  selectedPriority,
  onPriorityChange,
}) => {
  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    onCategoryChange(event.target.value);
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    onStatusChange(event.target.value);
  };

  const handlePriorityChange = (event: SelectChangeEvent<string>) => {
    onPriorityChange(event.target.value);
  };

  return (
    <StyledPaper elevation={0} variant="outlined">
      <SearchBox>
        <IconButton size="small">
          <SearchIcon />
        </IconButton>
        <Input
          fullWidth
          disableUnderline
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </SearchBox>

      <Stack direction="row" spacing={2} flexWrap="wrap">
        <FilterControl size="small">
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            onChange={handleCategoryChange}
            label="Category"
          >
            <MenuItem value="">All</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.value} value={category.value}>
                {category.label}
              </MenuItem>
            ))}
          </Select>
        </FilterControl>

        <FilterControl size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={selectedStatus}
            onChange={handleStatusChange}
            label="Status"
          >
            <MenuItem value="">All</MenuItem>
            {statuses.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </Select>
        </FilterControl>

        <FilterControl size="small">
          <InputLabel>Priority</InputLabel>
          <Select
            value={selectedPriority}
            onChange={handlePriorityChange}
            label="Priority"
          >
            <MenuItem value="">All</MenuItem>
            {priorities.map((priority) => (
              <MenuItem key={priority.value} value={priority.value}>
                {priority.label}
              </MenuItem>
            ))}
          </Select>
        </FilterControl>
      </Stack>
    </StyledPaper>
  );
};

export default DocumentFilters;
