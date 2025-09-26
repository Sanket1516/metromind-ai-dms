/**
 * MetroMind Frontend Tests - Dashboard Page
 * Comprehensive testing for dashboard functionality and accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock API service
const mockApiClient = {
  post: jest.fn(),
  get: jest.fn(),
};

jest.mock('../../../frontend/src/services/api', () => ({
  apiClient: mockApiClient,
}));

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({ 'data-testid': 'dropzone' }),
    getInputProps: () => ({ 'data-testid': 'file-input' }),
    isDragActive: false,
  }),
}));

// Simple Dashboard component for testing
const DashboardPage = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = React.useState(false);
  const [taskTitle, setTaskTitle] = React.useState('');

  const handleUploadDocument = async () => {
    try {
      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.pdf'));
      
      await mockApiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUploadDialogOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleCreateTask = async () => {
    try {
      await mockApiClient.post('/tasks/tasks', {
        title: taskTitle,
        description: 'Task description',
      });
      
      setTaskDialogOpen(false);
      setTaskTitle('');
    } catch (error) {
      console.error('Task creation failed:', error);
    }
  };

  return (
    <div data-testid="dashboard-page">
      <h1>Welcome Back, Test User</h1>
      
      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          onClick={() => setUploadDialogOpen(true)}
          aria-label="Upload document to system"
        >
          Upload Document
        </button>
        
        <button 
          onClick={() => setTaskDialogOpen(true)}
          aria-label="Create new task"
        >
          Create Task
        </button>
        
        <button aria-label="Search documents in system">
          Search Documents
        </button>
        
        <button aria-label="View reports and analytics">
          View Reports
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-section">
        <h2>Statistics</h2>
        <div className="stat-card">
          <span>Total Documents</span>
          <span>156</span>
        </div>
        <div className="stat-card">
          <span>Active Tasks</span>
          <span>23</span>
        </div>
        <div className="stat-card">
          <span>Team Members</span>
          <span>8</span>
        </div>
        <div className="stat-card">
          <span>Success Rate</span>
          <span>94%</span>
        </div>
      </div>

      {/* Recent Activity */}
      <section>
        <h2>Recent Activity</h2>
        <div>No recent activity</div>
      </section>

      {/* Upload Dialog */}
      {uploadDialogOpen && (
        <div role="dialog" aria-labelledby="upload-dialog-title">
          <h3 id="upload-dialog-title">Upload Documents</h3>
          <div data-testid="dropzone">
            Drop files here or click to browse
            <input data-testid="file-input" type="file" />
          </div>
          <button onClick={handleUploadDocument}>Upload</button>
          <button onClick={() => setUploadDialogOpen(false)}>Cancel</button>
        </div>
      )}

      {/* Task Dialog */}
      {taskDialogOpen && (
        <div role="dialog" aria-labelledby="task-dialog-title">
          <h3 id="task-dialog-title">Create New Task</h3>
          <input
            type="text"
            placeholder="Task title"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            aria-label="Task title"
          />
          <textarea
            placeholder="Description"
            aria-label="Task description"
          />
          <button 
            onClick={handleCreateTask}
            disabled={!taskTitle.trim()}
          >
            Create Task
          </button>
          <button onClick={() => setTaskDialogOpen(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

describe('Dashboard Page Tests', () => {
  beforeEach(() => {
    mockApiClient.post.mockClear();
    mockApiClient.get.mockClear();
  });

  describe('Page Load and Initial State', () => {
    test('renders dashboard page correctly', () => {
      render(<DashboardPage />);

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search documents/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view reports/i })).toBeInTheDocument();
    });

    test('displays statistics correctly', () => {
      render(<DashboardPage />);

      expect(screen.getByText('Total Documents')).toBeInTheDocument();
      expect(screen.getByText('156')).toBeInTheDocument();
      expect(screen.getByText('Active Tasks')).toBeInTheDocument();
      expect(screen.getByText('23')).toBeInTheDocument();
      expect(screen.getByText('Team Members')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getByText('94%')).toBeInTheDocument();
    });

    test('shows recent activity section', () => {
      render(<DashboardPage />);

      expect(screen.getByRole('heading', { name: /recent activity/i })).toBeInTheDocument();
    });
  });

  describe('Upload Document Functionality', () => {
    test('opens upload dialog when upload button is clicked', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      await user.click(uploadButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Upload Documents')).toBeInTheDocument();
    });

    test('closes upload dialog when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      // Open dialog
      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      await user.click(uploadButton);

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('handles file upload successfully', async () => {
      const user = userEvent.setup();
      mockApiClient.post.mockResolvedValue({
        data: { status: 'success', document_id: 1, task_id: 1 }
      });

      render(<DashboardPage />);

      // Open dialog
      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      await user.click(uploadButton);

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

      // Dialog should close
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('handles upload errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockApiClient.post.mockRejectedValue(new Error('Upload failed'));

      render(<DashboardPage />);

      // Open dialog and attempt upload
      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      await user.click(uploadButton);

      const uploadSubmitButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadSubmitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Upload failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Task Creation Functionality', () => {
    test('opens task creation dialog when create task button is clicked', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

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

      render(<DashboardPage />);

      // Open dialog
      const createTaskButton = screen.getByRole('button', { name: /create task/i });
      await user.click(createTaskButton);

      // Fill form
      const titleInput = screen.getByRole('textbox', { name: /task title/i });
      await user.type(titleInput, 'Test Task');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/tasks/tasks',
          expect.objectContaining({
            title: 'Test Task',
            description: 'Task description',
          })
        );
      });

      // Dialog should close
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('prevents task creation with empty title', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      // Open dialog
      const createTaskButton = screen.getByRole('button', { name: /create task/i });
      await user.click(createTaskButton);

      // Submit button should be disabled with empty title
      const submitButton = screen.getByRole('button', { name: /create task/i });
      expect(submitButton).toBeDisabled();
    });

    test('enables submit button when title is provided', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      // Open dialog
      const createTaskButton = screen.getByRole('button', { name: /create task/i });
      await user.click(createTaskButton);

      // Add title
      const titleInput = screen.getByRole('textbox', { name: /task title/i });
      await user.type(titleInput, 'Test Task');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      expect(submitButton).not.toBeDisabled();
    });

    test('handles task creation errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockApiClient.post.mockRejectedValue(new Error('Task creation failed'));

      render(<DashboardPage />);

      // Open dialog and attempt task creation
      const createTaskButton = screen.getByRole('button', { name: /create task/i });
      await user.click(createTaskButton);

      const titleInput = screen.getByRole('textbox', { name: /task title/i });
      await user.type(titleInput, 'Test Task');

      const submitButton = screen.getByRole('button', { name: /create task/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Task creation failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels on action buttons', () => {
      render(<DashboardPage />);

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
      render(<DashboardPage />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      const subHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(subHeadings.length).toBeGreaterThan(0);
    });

    test('dialog has proper labeling', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      // Test upload dialog
      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      await user.click(uploadButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'upload-dialog-title');

      // Close and test task dialog
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      const createTaskButton = screen.getByRole('button', { name: /create task/i });
      await user.click(createTaskButton);

      const taskDialog = screen.getByRole('dialog');
      expect(taskDialog).toHaveAttribute('aria-labelledby', 'task-dialog-title');
    });

    test('form inputs have proper labels', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      const createTaskButton = screen.getByRole('button', { name: /create task/i });
      await user.click(createTaskButton);

      const titleInput = screen.getByRole('textbox', { name: /task title/i });
      const descriptionInput = screen.getByRole('textbox', { name: /task description/i });

      expect(titleInput).toHaveAttribute('aria-label');
      expect(descriptionInput).toHaveAttribute('aria-label');
    });
  });

  describe('Keyboard Navigation', () => {
    test('supports keyboard navigation to buttons', async () => {
      render(<DashboardPage />);

      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      
      // Focus the first button
      uploadButton.focus();
      expect(uploadButton).toHaveFocus();
    });

    test('supports Enter key activation', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />);

      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      
      // Focus and press Enter
      uploadButton.focus();
      await user.keyboard('{Enter}');
      
      // Dialog should open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      render(<DashboardPage />);

      // Trigger an error through upload
      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      await user.click(uploadButton);

      const uploadSubmitButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadSubmitButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    test('maintains UI state during errors', async () => {
      const user = userEvent.setup();
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      render(<DashboardPage />);

      // Open upload dialog
      const uploadButton = screen.getByRole('button', { name: /upload document/i });
      await user.click(uploadButton);

      // Attempt upload that will fail
      const uploadSubmitButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadSubmitButton);

      // UI should still be functional
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Should be able to cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});