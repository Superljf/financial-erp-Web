import { LogoutOutlined } from '@ant-design/icons';
import { Button, Layout } from 'antd';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { ReactNode } from 'react';
import './CompanyLayout.css';

const { Header, Content } = Layout;

export default function CompanyLayout({ children }: { children: ReactNode }) {
  const { company, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Layout className="company-layout">
      <Header className="company-header">
        <div className="company-header__left">
          <span className="company-title">公司端</span>
          <nav className="company-menu">
            <NavLink to="/profile" className={({ isActive }) => `company-menu__item${isActive ? ' is-active' : ''}`}>
              学员档案
            </NavLink>
            <NavLink to="/performance" className={({ isActive }) => `company-menu__item${isActive ? ' is-active' : ''}`}>
              业绩报表
            </NavLink>
            <NavLink to="/consume" className={({ isActive }) => `company-menu__item${isActive ? ' is-active' : ''}`}>
              课耗报表
            </NavLink>
          </nav>
        </div>
        <div className="company-header__right">
          <span className="company-badge">{company?.name}</span>
          <span className="account-badge">{company?.account}</span>
          <Button type="text" className="company-logout" icon={<LogoutOutlined />} onClick={onLogout}>
            退出登录
          </Button>
        </div>
      </Header>
      <Content className="company-content">{children}</Content>
    </Layout>
  );
}
