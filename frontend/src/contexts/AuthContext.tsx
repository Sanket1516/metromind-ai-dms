import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/api';
import { toast } from 'react-toastify';
import { UserUpdateData, UserSettings } from '../types/auth';

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user' | 'viewer';
  is_approved: boolean;
  created_at: string;
  last_login?: string;
  settings?: UserSettings;
  phoneNumber?: string;
  department?: string;
  isAdmin?: boolean;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: UserUpdateData) => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token is still valid
          try {
            await refreshUser();
          } catch (error) {
            // Token is invalid, clear auth state
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const { access_token, user: userData } = response.data;

      // Store token and user data
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);

      toast.success('Login successful!');
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setLoading(true);
      
      const response = await apiClient.post('/auth/register', userData);
      
      toast.success('Registration successful! Please wait for admin approval.');
      
      // Don't automatically log in after registration as approval is required
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Registration failed. Please try again.');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint to invalidate server-side session
      await apiClient.post('/auth/logout');
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear state
      setToken(null);
      setUser(null);
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if server call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiClient.get('/auth/profile');
      const userData = response.data;
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (data: UserUpdateData): Promise<void> => {
    try {
      const response = await apiClient.put('/auth/profile', data);
      const updatedUser = response.data;
      setUser(prevUser => ({ ...prevUser, ...updatedUser }));
      localStorage.setItem('user', JSON.stringify({ ...user, ...updatedUser }));
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
      throw error;
    }
  };

  // Update user settings (placeholder - backend doesn't support settings yet)
  const updateUserSettings = async (newSettings: Partial<UserSettings>): Promise<void> => {
    try {
      // For now, just store settings locally since backend doesn't have this endpoint
      if (user) {
        const currentSettings = user.settings || {
          notifications: { email: true, push: true, desktop: true },
          theme: 'system',
          language: 'en',
          timezone: 'UTC'
        };
        
        const updatedUser = {
          ...user,
          settings: { 
            ...currentSettings,
            ...newSettings,
            notifications: { 
              ...currentSettings.notifications, 
              ...(newSettings.notifications || {}) 
            }
          }
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        toast.success('Settings updated successfully (stored locally)');
      }
    } catch (error: any) {
      console.error('Settings update error:', error);
      toast.error(error.response?.data?.detail || 'Failed to update settings');
      throw error;
    }
  };
  
  // Change password function
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      setLoading(true);
      
      await apiClient.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      toast.success('Password changed successfully. Please log in again.');
      
      // Logout user after password change
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error: any) {
      console.error('Password change error:', error);
      
      if (error.response?.data?.detail) {
        // Don't show toast for validation errors - let the form handle those
        if (error.response.data.detail !== 'Current password is incorrect') {
          toast.error(error.response.data.detail);
        }
      } else {
        toast.error('Failed to change password');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
    updateUserSettings,
    changePassword
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
