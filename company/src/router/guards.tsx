import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import CompanyLayout from '../layouts/CompanyLayout';

export function RequireAuth() {
  const { company } = useAuth();
  if (!company) return <Navigate to="/login" replace />;
  return (
    <CompanyLayout>
      <Outlet />
    </CompanyLayout>
  );
}

export function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const { company } = useAuth();
  if (company) return <Navigate to="/profile" replace />;
  return <>{children}</>;
}
