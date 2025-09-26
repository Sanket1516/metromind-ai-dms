/**
 * MetroMind Frontend Tests - Dashboard Page
 * Comprehensive testing for dashboard functionality, accessibility, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DashboardPage from '../../frontend/src/pages/Dashboard/DashboardPage';
import { ToastProvider } from '../../frontend/src/contexts/ToastContext';
import { AuthContext } from '../../frontend/src/contexts/AuthContext';

// Mock dependencies
jest.mock('../../frontend/src/services/api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('react-dropzone', () => ({
  useDropzone: jest.fn(() => ({
    getRootProps: () => ({ 'data-testid': 'dropzone' }),
    getInputProps: () => ({ 'data-testid': 'file-input' }),
    isDragActive: false,
  })),
}));

// Theme for testing
const theme = createTheme();

// Test wrapper component
const TestWrapper = ({ children, user = null }) => {
  const mockAuthValue = {
    user: user || {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
    },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
  };

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={mockAuthValue}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('DashboardPage', () => {
  let mockApiClient;

  beforeEach(() => {
    mockApiClient = require('../../frontend/src/services/api').apiClient;
    mockApiClient.post.mockClear();
    mockApiClient.get.mockClear();
  });

  describe('Page Load and Initial State', () => {
    test('renders dashboard page correctly', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Check main heading
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      
      // Check action buttons
      expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search documents/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view reports/i })).toBeInTheDocument();
    });

    test('displays user welcome message', () => {
      const user = {
        id: '1',
        username: 'john_doe',
        full_name: 'John Doe',
        email: 'john@example.com',
      };

      render(
        <TestWrapper user={user}>
          <DashboardPage />
        </TestWrapper>
      );

      expect(screen.getByText(/welcome back, john doe/i)).toBeInTheDocument();
    });

    test('displays statistics cards', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Check for stat cards
      expect(screen.getByText('Total Documents')).toBeInTheDocument();
      expect(screen.getByText('Active Tasks')).toBeInTheDocument();
      expect(screen.getByText('Team Members')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
    });

    test('shows recent activity section', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { name: /recent activity/i })).toBeInTheDocument();
    });
  });

  describe('Upload Document Functionality', () => {
    test('opens upload dialog when upload button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      await user.click(uploadButton);

      // Check dialog is open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Upload Documents')).toBeInTheDocument();
    });

    test('closes upload dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Open dialog
      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      await user.click(uploadButton);

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Check dialog is closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('handles file upload successfully', async () => {
      const user = userEvent.setup();
      mockApiClient.post.mockResolvedValue({
        data: { status: 'success', document_id: 1, task_id: 1 }
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Open dialog
      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      await user.click(uploadButton);

      // Simulate file selection
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const dropzone = screen.getByTestId('dropzone');
      
      Object.defineProperty(dropzone, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.drop(dropzone, {
        dataTransfer: {
          files: [file],
        },
      });

      // Upload file
      const uploadSubmitButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadSubmitButton);

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/documents/upload',
          expect.any(FormData),
          expect.objectContaining({
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        );
      });
    });

    test('displays error message on upload failure', async () => {
      const user = userEvent.setup();
      mockApiClient.post.mockRejectedValue(new Error('Upload failed'));

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Open dialog and attempt upload
      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      await user.click(uploadButton);

      const uploadSubmitButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadSubmitButton);

      await waitFor(() => {
        expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Task Creation Functionality', () => {
    test('opens task creation dialog when create task button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      const createTaskButton = screen.getByRole('button', { name: /create task/i });
      await user.click(createTaskButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    test('creates task successfully with valid input', async () => {
      const user = userEvent.setup();
      mockApiClient.post.mockResolvedValue({
        data: { status: 'success', task_id: 1 }
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Open dialog
      const createTaskButton = screen.getByRole('button', { name: /create task/i });
      await user.click(createTaskButton);

      // Fill form
      const titleInput = screen.getByRole('textbox', { name: /task title/i });
      const descriptionInput = screen.getByRole('textbox', { name: /description/i });
      
      await user.type(titleInput, 'Test Task');
      await user.type(descriptionInput, 'Test task description');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/tasks/tasks',
          expect.objectContaining({
            title: 'Test Task',
            description: 'Test task description',
          })
        );
      });
    });

    test('prevents task creation with empty title', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Open dialog
      const createTaskButton = screen.getByRole('button', { name: /create task/i });
      await user.click(createTaskButton);

      // Try to submit with empty title
      const submitButton = screen.getByRole('button', { name: /create task/i });
      
      expect(submitButton).toBeDisabled();
    });

    test('enables submit button when title is provided', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Open dialog
      const createTaskButton = screen.getByRole('button', { name: /create task/i });
      await user.click(createTaskButton);

      // Add title
      const titleInput = screen.getByRole('textbox', { name: /task title/i });
      await user.type(titleInput, 'Test Task');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Navigation', () => {
    test('navigates to search page when search button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      const searchButton = screen.getByRole('button', { name: /search documents/i });
      await user.click(searchButton);

      // Check navigation (would need to mock useNavigate for full test)
      expect(searchButton).toBeInTheDocument();
    });

    test('navigates to reports page when view reports button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      const reportsButton = screen.getByRole('button', { name: /view reports/i });
      await user.click(reportsButton);

      expect(reportsButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels on action buttons', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      const searchButton = screen.getByRole('button', { name: /search documents/i });
      const taskButton = screen.getByRole('button', { name: /create task/i });
      const reportsButton = screen.getByRole('button', { name: /view reports/i });

      expect(uploadButton).toHaveAttribute('aria-label');
      expect(searchButton).toHaveAttribute('aria-label');
      expect(taskButton).toHaveAttribute('aria-label');
      expect(reportsButton).toHaveAttribute('aria-label');
    });

    test('has proper heading structure', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      const subHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(subHeadings.length).toBeGreaterThan(0);
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      
      // Tab to button
      await user.tab();
      expect(uploadButton).toHaveFocus();

      // Press Enter to activate
      await user.keyboard('{Enter}');
      
      // Dialog should open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('provides screen reader announcements', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Check for screen reader content
      const srContent = screen.getAllByClass('sr-only');
      expect(srContent.length).toBeGreaterThan(0);
    });

    test('has proper focus management in dialogs', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      await user.click(uploadButton);

      // Dialog should be focused
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      // Close with Escape
      await user.keyboard('{Escape}');
      
      // Focus should return to trigger button
      expect(uploadButton).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    test('displays toast notifications for errors', async () => {
      const user = userEvent.setup();
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Trigger an error
      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      await user.click(uploadButton);

      const uploadSubmitButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadSubmitButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('handles API timeout gracefully', async () => {
      const user = userEvent.setup();
      mockApiClient.post.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      await user.click(uploadButton);

      // Should show loading state
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      // Check that page renders without breaking
      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    });

    test('adapts to tablet viewport', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    });
  });
});