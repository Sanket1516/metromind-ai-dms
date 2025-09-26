export type Role = 'admin' | 'user' | 'viewer';

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  firstName: string;
  lastName: string;
  role: Role;
  is_approved: boolean;
  isAdmin: boolean;
  created_at: string;
  last_login?: string;
  department?: string;
  phoneNumber?: string;
  status?: 'active' | 'inactive' | 'suspended';
  settings?: UserSettings;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: Role;
  department?: string;
}

export interface LoginData {
  username: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserUpdateData {
  email?: string;
  full_name?: string;
  password?: string;
  department?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
