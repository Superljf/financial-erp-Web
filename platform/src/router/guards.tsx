import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import AdminLayout from '../layouts/AdminLayout';

export function RequireAuth() {
  const { loggedIn } = useAuth();
  if (!loggedIn) return <Navigate to="/login" replace />;
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}

export function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { loggedIn } = useAuth();
  if (loggedIn) return <Navigate to="/companies" replace />;
  return <>{children}</>;
}
