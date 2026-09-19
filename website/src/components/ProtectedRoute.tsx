import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOrg?: boolean;
  requiredPermission?: string;
}

export function ProtectedRoute({ children, requireOrg = true, requiredPermission }: ProtectedRouteProps) {
  const { user, organization, loading, permissions } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireOrg && !organization) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredPermission) {
    const hasPermission = permissions.includes('*') || permissions.includes(requiredPermission);
    if (!hasPermission) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
