import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Layout } from 'antd';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { ReactNode } from 'react';
import './AdminLayout.css';

const { Header, Content } = Layout;

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout className="admin-layout">
      <Header className="admin-header">
        <div className="admin-header__left">
          <span className="admin-title">管理端</span>
          <nav className="admin-menu">
            <NavLink to="/companies" className={({ isActive }) => `admin-menu__item${isActive ? ' is-active' : ''}`}>
              公司管理
            </NavLink>
            <NavLink to="/data" className={({ isActive }) => `admin-menu__item${isActive ? ' is-active' : ''}`}>
              数据管理
            </NavLink>
          </nav>
        </div>
        <div className="admin-header__right">
          <span className="admin-badge">
            <UserOutlined /> 管理员
          </span>
          <Button type="text" className="admin-logout" icon={<LogoutOutlined />} onClick={onLogout}>
            退出
          </Button>
        </div>
      </Header>
      <Content className="admin-content">{children}</Content>
    </Layout>
  );
}
