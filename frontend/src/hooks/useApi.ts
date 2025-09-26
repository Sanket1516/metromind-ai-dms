import { useQuery } from 'react-query';
import {
  fetchDashboardStats,
  fetchDocumentStats,
  fetchDepartmentStats,
  fetchUserActivityStats,
  fetchSystemMetrics,
} from '../services/analytics';

export const useDashboardStats = () => {
  return useQuery('dashboardStats', fetchDashboardStats);
};

export const useDocumentStats = (startDate: Date, endDate: Date) => {
  return useQuery(['documentStats', startDate, endDate], () =>
    fetchDocumentStats(startDate, endDate)
  );
};

export const useDepartmentStats = () => {
  return useQuery('departmentStats', fetchDepartmentStats);
};

export const useUserActivityStats = (userId?: string) => {
  return useQuery(['userActivityStats', userId], () =>
    fetchUserActivityStats(userId)
  );
};

export const useSystemMetrics = (interval = 60000) => {
  return useQuery('systemMetrics', fetchSystemMetrics, {
    refetchInterval: interval,
  });
};
