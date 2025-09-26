import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Button,
  ButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  LinearProgress,
  useTheme,
  alpha,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  DateRange as DateRangeIcon,
  Speed as SpeedIcon,
  Description as DocumentIcon,
  People as PeopleIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Warning as WarningIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const AnalyticsPage: React.FC = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState('overview');

  // Sample analytics data - will be replaced with API data
  const metrics = {
    totalDocuments: { value: 1247, change: 12.5, trend: 'up' as const },
    processedToday: { value: 89, change: -3.2, trend: 'down' as const },
    avgProcessingTime: { value: 2.3, change: 8.1, trend: 'up' as const, unit: 'minutes' },
    accuracyRate: { value: 97.8, change: 1.2, trend: 'up' as const, unit: '%' },
    activeUsers: { value: 156, change: 5.4, trend: 'up' as const },
    systemUptime: { value: 99.9, change: 0.0, trend: 'up' as const, unit: '%' }
  };

  const recentActivity = [
    { user: 'John Doe', action: 'Uploaded 15 documents', time: '2 mins ago', avatar: '/avatars/john.jpg' },
    { user: 'Jane Smith', action: 'Completed OCR processing', time: '5 mins ago', avatar: '/avatars/jane.jpg' },
    { user: 'Mike Johnson', action: 'Generated weekly report', time: '12 mins ago', avatar: '/avatars/mike.jpg' },
    { user: 'Sarah Wilson', action: 'Updated integration settings', time: '25 mins ago', avatar: '/avatars/sarah.jpg' },
    { user: 'Alex Brown', action: 'Reviewed 8 documents', time: '1 hour ago', avatar: '/avatars/alex.jpg' }
  ];

  const topPerformers = [
    { name: 'John Doe', documents: 342, accuracy: 98.5, avatar: '/avatars/john.jpg' },
    { name: 'Jane Smith', documents: 298, accuracy: 97.8, avatar: '/avatars/jane.jpg' },
    { name: 'Mike Johnson', documents: 276, accuracy: 96.9, avatar: '/avatars/mike.jpg' },
    { name: 'Sarah Wilson', documents: 245, accuracy: 98.1, avatar: '/avatars/sarah.jpg' }
  ];

  const documentTypes = [
    { type: 'Invoices', count: 456, percentage: 36.6, color: theme.palette.primary.main },
    { type: 'Contracts', count: 312, percentage: 25.0, color: theme.palette.secondary.main },
    { type: 'Reports', count: 234, percentage: 18.8, color: theme.palette.success.main },
    { type: 'Forms', count: 156, percentage: 12.5, color: theme.palette.warning.main },
    { type: 'Others', count: 89, percentage: 7.1, color: theme.palette.error.main }
  ];

  const MetricCard: React.FC<{
    title: string;
    value: number;
    change: number;
    trend: 'up' | 'down';
    unit?: string;
    icon: React.ReactNode;
  }> = ({ title, value, change, trend, unit = '', icon }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          '&:hover': {
            boxShadow: theme.shadows[8]
          }
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {value.toLocaleString()}{unit}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {title}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                {trend === 'up' ? (
                  <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16 }} />
                ) : (
                  <TrendingDownIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
                    fontWeight: 600
                  }}
                >
                  {Math.abs(change)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  vs last period
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main
              }}
            >
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  const ChartPlaceholder: React.FC<{ title: string; icon: React.ReactNode }> = ({ title, icon }) => (
    <Paper
      sx={{
        p: 4,
        textAlign: 'center',
        bgcolor: alpha(theme.palette.background.paper, 0.5),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Box
        sx={{
          p: 2,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.main,
          mb: 2
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Interactive charts will be implemented with Chart.js or D3.js
      </Typography>
    </Paper>
  );

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive insights into system performance and usage
          </Typography>
        </Box>
        
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="1d">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 3 Months</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh Data">
            <IconButton>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export Report">
            <IconButton>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Metrics Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="Total Documents"
            value={metrics.totalDocuments.value}
            change={metrics.totalDocuments.change}
            trend={metrics.totalDocuments.trend}
            icon={<DocumentIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="Processed Today"
            value={metrics.processedToday.value}
            change={metrics.processedToday.change}
            trend={metrics.processedToday.trend}
            icon={<CompletedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="Avg Processing Time"
            value={metrics.avgProcessingTime.value}
            change={metrics.avgProcessingTime.change}
            trend={metrics.avgProcessingTime.trend}
            unit=" min"
            icon={<SpeedIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="Accuracy Rate"
            value={metrics.accuracyRate.value}
            change={metrics.accuracyRate.change}
            trend={metrics.accuracyRate.trend}
            unit="%"
            icon={<AssessmentIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="Active Users"
            value={metrics.activeUsers.value}
            change={metrics.activeUsers.change}
            trend={metrics.activeUsers.trend}
            icon={<PeopleIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <MetricCard
            title="System Uptime"
            value={metrics.systemUptime.value}
            change={metrics.systemUptime.change}
            trend={metrics.systemUptime.trend}
            unit="%"
            icon={<ViewIcon />}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Performance Overview
              </Typography>
              <ButtonGroup size="small">
                <Button
                  variant={chartType === 'overview' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('overview')}
                  startIcon={<TimelineIcon />}
                >
                  Timeline
                </Button>
                <Button
                  variant={chartType === 'comparison' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('comparison')}
                  startIcon={<BarChartIcon />}
                >
                  Comparison
                </Button>
              </ButtonGroup>
            </Box>
            <ChartPlaceholder
              title="Performance Timeline Chart"
              icon={<TimelineIcon sx={{ fontSize: 40 }} />}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Document Types Distribution
            </Typography>
            <Box sx={{ mb: 3 }}>
              <ChartPlaceholder
                title="Document Types Pie Chart"
                icon={<PieChartIcon sx={{ fontSize: 40 }} />}
              />
            </Box>
            
            {/* Document Types Legend */}
            <Box>
              {documentTypes.map((type, index) => (
                <motion.div
                  key={type.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: type.color
                        }}
                      />
                      <Typography variant="body2">{type.type}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {type.count}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={type.percentage}
                    sx={{
                      mb: 2,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(type.color, 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: type.color
                      }
                    }}
                  />
                </motion.div>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Bottom Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Recent Activity
            </Typography>
            <List>
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ListItem
                    sx={{
                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: alpha(theme.palette.background.paper, 0.5)
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={activity.avatar}>
                        {activity.user.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.user}
                      secondary={activity.action}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {activity.time}
                    </Typography>
                  </ListItem>
                </motion.div>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Top Performers
            </Typography>
            <List>
              {topPerformers.map((performer, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ListItem
                    sx={{
                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: alpha(theme.palette.background.paper, 0.5)
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={performer.avatar}>
                        {performer.name.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={performer.name}
                      secondary={`${performer.documents} documents processed`}
                    />
                    <Box textAlign="right">
                      <Chip
                        label={`${performer.accuracy}%`}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          color: theme.palette.success.main,
                          fontWeight: 600
                        }}
                      />
                    </Box>
                  </ListItem>
                </motion.div>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;