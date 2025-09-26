import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Context Providers
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { ToastProvider, useToast } from './contexts/ToastContext';

// Layout Components
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/Common/LoadingSpinner';
import ErrorFallback from './components/Common/ErrorFallback';
import RequireAuth from './components/Auth/RequireAuth';
import ErrorBoundary from './components/ErrorBoundary';

// API Error Handling
import { setErrorHandler } from './services/api';

// Page Components
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import DocumentsPage from './pages/Documents/DocumentsPage';
import AutoCollectedDocsPage from './pages/Documents/AutoCollectedDocsPage';
import TasksPage from './pages/Tasks/TasksPage';
import SearchPage from './pages/Search/SearchPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import IntegrationsPage from './pages/Integrations/IntegrationsPage';
import UsersPage from './pages/Users/UsersPage';
import SettingsPage from './pages/Settings/SettingsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import UnauthorizedPage from './pages/Auth/UnauthorizedPage';
import { AIDashboardPage, AIInsightsPage, AIProcessingPage } from './pages/AI';
import AuditPage from './pages/Audit/AuditPage';
import BackupPage from './pages/Backup/BackupPage';
import SecurityPage from './pages/Security/SecurityPage';

// Types
import { Role } from './types/auth';

// Styles
import './App.css';

// Component to set up API error handler
const APIErrorHandlerSetup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();

  useEffect(() => {
    // Set up the API error handler to use our toast system
    setErrorHandler((message, type = 'error') => {
      switch (type) {
        case 'error':
          toast.showError(message);
          break;
        case 'success':
          toast.showSuccess(message);
          break;
        case 'warning':
          toast.showWarning(message);
          break;
        case 'info':
          toast.showInfo(message);
          break;
        default:
          toast.showError(message);
      }
    });
  }, [toast]);

  return <>{children}</>;
};

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          user ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          user ? <Navigate to="/dashboard" replace /> : <RegisterPage />
        }
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/documents/auto-collected" element={<AutoCollectedDocsPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="/reports" element={<AnalyticsPage />} />
                
                {/* AI Features */}
                <Route path="/ai" element={<AIDashboardPage />} />
                <Route path="/ai/insights" element={<AIInsightsPage />} />
                <Route path="/ai/processing" element={<AIProcessingPage />} />
                
                {/* Admin Routes */}
                <Route
                  path="/users"
                  element={
                    <RequireAuth allowedRoles={['admin' as Role]}>
                      <UsersPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/security"
                  element={
                    <RequireAuth allowedRoles={['admin' as Role]}>
                      <SecurityPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/backup"
                  element={
                    <RequireAuth allowedRoles={['admin' as Role]}>
                      <BackupPage />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/audit"
                  element={
                    <RequireAuth allowedRoles={['admin' as Role, 'auditor' as Role]}>
                      <AuditPage />
                    </RequireAuth>
                  }
                />
                
                {/* User Routes */}
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                
                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </RequireAuth>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Router>
              <ToastProvider>
                <AuthProvider>
                  <WebSocketProvider>
                    <NotificationProvider>
                      <APIErrorHandlerSetup>
                        <AppContent />
                      </APIErrorHandlerSetup>
                    </NotificationProvider>
                  </WebSocketProvider>
                </AuthProvider>
              </ToastProvider>
            </Router>
          </LocalizationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;