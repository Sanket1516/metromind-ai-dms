import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RoleBasedProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'user' | 'viewer')[];
  fallback?: React.ReactNode;
}

const RoleBased: React.FC<RoleBasedProps> = ({
  children,
  allowedRoles,
  fallback = null,
}) => {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleBased;
