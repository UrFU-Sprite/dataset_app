import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Badge } from 'antd';
import type {MenuProps} from 'antd';
import { 
  ProjectOutlined, 
  UnorderedListOutlined, 
  PlusCircleOutlined,
  BarChartOutlined,
  WalletOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined 
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'auth/AuthContext';
import './styles.scss';

const { Header: AntHeader } = Layout;

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearToken } = useAuth();

  const menuItems: MenuProps['items'] = [
    { key: '/projects', label: 'Проекты', icon: <ProjectOutlined /> },
    { key: '/tasks', label: 'Задачи', icon: <UnorderedListOutlined /> },
    { key: '/tasks/new', label: 'Создать задачу', icon: <PlusCircleOutlined /> },
    { key: '/analytics', label: 'Аналитика', icon: <BarChartOutlined /> },
    { key: '/finance/wallet', label: 'Кошелек', icon: <WalletOutlined /> },
  ];

  const handleLogout = () => {
    clearToken();
    navigate('/auth/login');
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: 'Профиль', icon: <UserOutlined /> },
    { key: 'settings', label: 'Настройки', icon: <SettingOutlined /> },
    { type: 'divider' },
    { key: 'logout', label: 'Выйти', icon: <LogoutOutlined />, danger: true },
  ]

  return (
    <AntHeader className="sber-header">
      <div className="header-container">
        <div className="logo" onClick={() => navigate('/projects')}>
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="url(#gradient)" />
              <path d="M10 16L14 20L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#2E6B47" />
                  <stop offset="1" stopColor="#1F4D33" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="logo-text">Dataset AI</span>
        </div>

        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="header-menu"
        />

        <Space className="header-actions">
          <Badge count={3} size="small">
            <BellOutlined className="action-icon" />
          </Badge>
          
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: ({key}) => {
                if (key === 'profile') navigate('/profile')
                if (key === 'settings') navigate('/profile')
                if (key === 'logout') handleLogout()
              },
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Space className="user-info">
              <Avatar 
                icon={<UserOutlined />} 
                style={{ backgroundColor: '#2E6B47' }}
                size="default"
              />
              <span className="user-name">{user?.name || user?.email?.split('@')[0] || 'Пользователь'}</span>
            </Space>
          </Dropdown>
        </Space>
      </div>
    </AntHeader>
  );
};
