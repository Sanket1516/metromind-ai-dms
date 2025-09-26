import { useAuth } from '../contexts/AuthContext';

export type Role = 'admin' | 'user' | 'viewer';

interface UseRoleResult {
  isAdmin: boolean;
  isUser: boolean;
  isViewer: boolean;
  hasRole: (roles: Role[]) => boolean;
  currentRole: Role | null;
}

export const useRole = (): UseRoleResult => {
  const { user } = useAuth();

  const currentRole = user?.role || null;

  const isAdmin = user?.role === 'admin';
  const isUser = user?.role === 'user';
  const isViewer = user?.role === 'viewer';

  const hasRole = (roles: Role[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return {
    isAdmin,
    isUser,
    isViewer,
    hasRole,
    currentRole,
  };
};

export default useRole;
