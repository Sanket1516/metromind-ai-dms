import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  TextField,
} from '@mui/material';
import {
  DashboardStats,
  DocumentStats,
  DepartmentStat,
  TimeRange,
} from '../../types/analytics';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import InfoIcon from '@mui/icons-material/Info';
import { useQuery } from 'react-query';
import {
  DocumentTypeChart,
  DocumentTrendChart,
  DepartmentActivityChart,
} from '../../components/Analytics/AnalyticsCharts';
import {
  fetchDashboardStats,
  fetchDocumentStats,
  fetchDepartmentStats,
} from '../../services/analytics';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { subDays, format } from 'date-fns';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  description?: string;
}> = ({ title, value, description }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography color="textSecondary" gutterBottom>
          {title}
        </Typography>
        {description && (
          <Tooltip title={description}>
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Typography variant="h4">{value}</Typography>
    </CardContent>
  </Card>
);

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>(
    'dashboardStats',
    fetchDashboardStats
  );

  const { data: documentStats, isLoading: docStatsLoading } = useQuery<DocumentStats>(
    ['documentStats', startDate.toISOString(), endDate.toISOString()],
    () => fetchDocumentStats(startDate, endDate)
  );

  const { data: departmentStats, isLoading: deptStatsLoading } = useQuery<DepartmentStat[]>(
    'departmentStats',
    fetchDepartmentStats
  );

  if (statsLoading || docStatsLoading || deptStatsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box p={3}>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Analytics Dashboard
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Statistics */}
        <Grid item xs={12} md={3}>
          <StatCard
            title="Total Documents"
            value={dashboardStats?.totalDocuments || 0}
            description="Total number of documents in the system"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Active Users"
            value={dashboardStats?.activeUsers || 0}
            description="Users active in the last 24 hours"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Processing Rate"
            value={`${dashboardStats?.processingRate || 0}%`}
            description="Percentage of documents successfully processed"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard
            title="Storage Used"
            value={`${(dashboardStats?.storageUsed || 0).toFixed(2)} GB`}
            description="Total storage space used by documents"
          />
        </Grid>

        {/* Time Range Selection */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" alignItems="center" gap={2}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  label="Time Range"
                >
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="90d">Last 90 Days</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
              {timeRange === 'custom' && (
                <>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(date) => date && setStartDate(date)}
                    renderInput={(params) => <TextField {...params} />}
                  />
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(date) => date && setEndDate(date)}
                    renderInput={(params) => <TextField {...params} />}
                  />
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Document Trend Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Document Processing Trend
            </Typography>
            <DocumentTrendChart
              data={
                documentStats?.dailyStats.map((stat) => ({
                  date: format(new Date(stat.date), 'MMM d'),
                  value: stat.count,
                })) || []
              }
            />
          </Paper>
        </Grid>

        {/* Document Types and Department Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Document Types Distribution
            </Typography>
            <DocumentTypeChart
              data={
                documentStats?.typeDistribution.map((type) => ({
                  name: type.type,
                  value: type.count,
                })) || []
              }
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Department Activity
            </Typography>
            <DepartmentActivityChart
              data={
                departmentStats?.map((dept) => ({
                  name: dept.department,
                  value: dept.documentCount,
                })) || []
              }
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;
