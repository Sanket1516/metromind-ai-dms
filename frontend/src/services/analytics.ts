import axios from 'axios';
import { SERVICE_URLS } from './api';

export const fetchDashboardStats = async () => {
  const response = await axios.get(`${SERVICE_URLS.ANALYTICS}/dashboard`);
  return response.data;
};

export const fetchDocumentStats = async (startDate: Date, endDate: Date) => {
  const response = await axios.get(`${SERVICE_URLS.ANALYTICS}/documents`, {
    params: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
  });
  return response.data;
};

export const fetchDepartmentStats = async () => {
  const response = await axios.get(`${SERVICE_URLS.ANALYTICS}/departments`);
  return response.data;
};

export const fetchUserActivityStats = async (userId?: string) => {
  const response = await axios.get(`${SERVICE_URLS.ANALYTICS}/user-activity`, {
    params: { userId },
  });
  return response.data;
};

export const fetchSystemMetrics = async () => {
  const response = await axios.get(`${SERVICE_URLS.ANALYTICS}/system-metrics`);
  return response.data;
};
