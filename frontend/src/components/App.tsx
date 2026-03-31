import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom'; // Убрали BrowserRouter
import { Layout, Menu, Typography, Avatar, Dropdown, Space, Badge, Button } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  BarsOutlined,
  WalletOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { ProjectsPage } from './projects/ProjectsPage';
import { TasksPage } from './tasks/TasksPage';
import { CreateTaskPage } from './tasks/CreateTaskPage';
import { DashboardPage } from './analytics/DashboardPage';
import { WalletPage } from './finance/WalletPage';
import './App.scss';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const AppContent: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">Дашборд</Link>,
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: <Link to="/projects">Проекты</Link>,
    },
    {
      key: '/tasks',
      icon: <BarsOutlined />,
      label: <Link to="/tasks">Задачи</Link>,
    },
    {
      key: '/finance/wallet',
      icon: <WalletOutlined />,
      label: <Link to="/finance/wallet">Кошелек</Link>,
    },
  ];

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Профиль' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Настройки' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Выйти', danger: true },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
        style={{ 
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100
        }}
      >
        <div style={{ 
          padding: '20px 16px', 
          textAlign: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          {!collapsed ? (
            <Title level={4} style={{ margin: 0, color: '#2E6B47' }}>
              Dataset Site
            </Title>
          ) : (
            <Title level={4} style={{ margin: 0, color: '#2E6B47' }}>
              DS
            </Title>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 'none', paddingTop: 8 }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{ 
          background: 'white', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 99
        }}>
          <Space size="large">
            <Badge count={3} size="small">
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#2E6B47' }} />
                <span>Пользователь</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 112px)' }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/new" element={<CreateTaskPage />} />
            <Route path="/finance/wallet" element={<WalletPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

// Убрали BrowserRouter отсюда - он уже есть в index.tsx
const App: React.FC = () => {
  return <AppContent />;
};

export default App;
