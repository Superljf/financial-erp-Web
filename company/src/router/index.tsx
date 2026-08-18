import { Navigate, createBrowserRouter } from 'react-router-dom';
import { RedirectIfAuth, RequireAuth } from './guards';
import LoginPage from '../pages/login/LoginPage';
import ProfilePage from '../pages/profile/ProfilePage';
import ReportPage from '../pages/report/ReportPage';

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
      { index: true, element: <Navigate to="/profile" replace /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'performance', element: <ReportPage kind="perf" /> },
      { path: 'consume', element: <ReportPage kind="cons" /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
