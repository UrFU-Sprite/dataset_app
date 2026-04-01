import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Menu, 
  Typography, 
  Avatar, 
  Dropdown, 
  Space, 
  Badge, 
  Button, 
  List, 
  Popover, 
  Tabs, 
  Empty, 
  message, 
  Tag 
} from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  BarsOutlined,
  WalletOutlined,
  UserOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  PlusCircleOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  CheckOutlined
} from '@ant-design/icons';
import { ProjectsPage } from './projects/ProjectsPage';
import { TasksPage } from './tasks/TasksPage';
import { CreateTaskPage } from './tasks/CreateTaskPage';
import { DashboardPage } from './analytics/DashboardPage';
import { WalletPage } from './finance/WalletPage';
import { ProjectDetailPage } from './projects/ProjectDetailPage';
import { TaskDetailPage } from './tasks/TaskDetailPage';
import ProfilePage from './users/ProfilePage';
import { useAuth } from '../auth/AuthContext';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../api/notifications';
import './App.scss';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

// Типы для уведомлений
interface Notification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'task_review' | 'balance_change' | 'project_invite' | 'system';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
}

const NotificationsPopover: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <PlusCircleOutlined style={{ color: '#1890ff', fontSize: 20 }} />;
      case 'task_completed':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
      case 'task_review':
        return <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />;
      case 'balance_change':
        return <DollarOutlined style={{ color: '#2E6B47', fontSize: 20 }} />;
      case 'project_invite':
        return <ProjectOutlined style={{ color: '#722ed1', fontSize: 20 }} />;
      default:
        return <BellOutlined style={{ color: '#8c8c8c', fontSize: 20 }} />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    message.success('Все уведомления отмечены как прочитанные');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    message.success('Уведомление удалено');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} д назад`;
    return date.toLocaleDateString('ru-RU');
  };

  const getTypeText = (type: string) => {
    const types: Record<string, string> = {
      task_assigned: 'Назначена задача',
      task_completed: 'Задача выполнена',
      task_review: 'Требуется проверка',
      balance_change: 'Изменение баланса',
      project_invite: 'Приглашение в проект',
      system: 'Системное уведомление'
    };
    return types[type] || 'Уведомление';
  };

  const content = (
    <div className="notifications-popover">
      <div className="notifications-header">
        <Title level={5} style={{ margin: 0 }}>Уведомления</Title>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={handleMarkAllRead}>
            <CheckOutlined /> Отметить все прочитанными
          </Button>
        )}
      </div>
      {notifications.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Нет уведомлений"
          style={{ padding: '24px' }}
        />
      ) : (
        <List
          className="notifications-list"
          loading={loading}
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              className={`notification-item ${!item.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(item)}
              actions={[
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => handleDelete(item.id, e)}
                />
              ]}
            >
              <List.Item.Meta
                avatar={getIcon(item.type)}
                title={
                  <div className="notification-title">
                    <Text strong={!item.read}>{item.title || getTypeText(item.type)}</Text>
                    <Text type="secondary" className="notification-time">
                      {formatTime(item.timestamp)}
                    </Text>
                  </div>
                }
                description={
                  <div className="notification-description">
                    <Text type="secondary">{item.description}</Text>
                    {item.metadata?.amount && (
                      <Tag color="green" style={{ marginTop: 4 }}>
                        +{item.metadata.amount} ₽
                      </Tag>
                    )}
                    {item.metadata?.taskId && (
                      <Tag color="blue" style={{ marginTop: 4 }}>
                        Задача #{item.metadata.taskId}
                      </Tag>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      overlayClassName="notifications-popover-overlay"
    >
      <Badge count={unreadCount} size="small" offset={[-5, 5]}>
        <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} />
      </Badge>
    </Popover>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const { user, clearToken } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    clearToken();
    navigate('/auth/login');
  };

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Дашборд</Link> },
    { key: '/projects', icon: <ProjectOutlined />, label: <Link to="/projects">Проекты</Link> },
    { key: '/tasks', icon: <BarsOutlined />, label: <Link to="/tasks">Задачи</Link> },
    { key: '/finance/wallet', icon: <WalletOutlined />, label: <Link to="/finance/wallet">Кошелек</Link> },
  ];

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: 'Профиль', onClick: () => navigate('/profile') },
    { key: 'settings', icon: <SettingOutlined />, label: 'Настройки', onClick: () => navigate('/profile') },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Выйти', danger: true, onClick: handleLogout },
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
            <NotificationsPopover />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#2E6B47' }} />
                <span>{user?.name || user?.email?.split('@')[0] || 'Пользователь'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 112px)' }}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/new" element={<CreateTaskPage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/finance/wallet" element={<WalletPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;
