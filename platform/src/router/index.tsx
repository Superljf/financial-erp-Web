import { Navigate, createBrowserRouter } from 'react-router-dom';
import { RedirectIfAuth, RequireAuth } from './guards';
import LoginPage from '../pages/login/LoginPage';
import CompanyPage from '../pages/company/CompanyPage';
import DataPage from '../pages/data/DataPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <RedirectIfAuth>
        <LoginPage />
      </RedirectIfAuth>
    ),
  },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      { index: true, element: <Navigate to="/companies" replace /> },
      { path: 'companies', element: <CompanyPage /> },
      { path: 'data', element: <DataPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
