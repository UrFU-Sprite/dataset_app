import React, { useCallback, useState } from 'react';
import { 
  Alert, 
  Button, 
  Card, 
  Descriptions, 
  Spin, 
  Typography, 
  Tabs, 
  Avatar, 
  Space,
  Statistic,
  Row,
  Col,
  Form,
  Input,
  message,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  IdcardOutlined,
  EditOutlined,
  SaveOutlined,
  LockOutlined,
  HistoryOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAuth } from 'auth/AuthContext';
import './profilePage.scss';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function ProfilePage() {
  const { user, userLoading, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  // Статистика (моковые данные)
  const stats = {
    totalTasks: 12,
    completedTasks: 8,
    inProgressTasks: 3,
    pendingTasks: 1,
    rating: 4.8,
    balance: 1250.50
  };

  const onRefresh = useCallback(() => {
    void refreshUser();
    message.success('Данные обновлены');
  }, [refreshUser]);

  const handleEdit = () => {
    form.setFieldsValue({
      name: user?.name,
      username: user?.username,
      email: user?.email
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      // Здесь будет API вызов для обновления профиля
      message.success('Профиль обновлен');
      setIsEditing(false);
      await refreshUser();
    } catch (error) {
      message.error('Ошибка при сохранении');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (userLoading) {
    return (
      <div className="profilePage">
        <Card className="profilePage__card">
          <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
            <Spin size="large" tip="Загрузка профиля..." />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="profilePage">
      <Row gutter={[24, 24]}>
        {/* Левая колонка - Аватар и статистика */}
        <Col xs={24} md={8}>
          <Card className="profilePage__avatar-card">
            <div className="avatar-section">
              <Avatar 
                size={120} 
                icon={<UserOutlined />} 
                style={{ backgroundColor: '#2E6B47' }}
              />
              <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
                {user?.name || user?.username || 'Пользователь'}
              </Title>
              <Text type="secondary">{user?.email}</Text>
            </div>
            <Divider />
            <div className="stats-section">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic 
                    title="Всего задач" 
                    value={stats.totalTasks} 
                    prefix={<HistoryOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="Выполнено" 
                    value={stats.completedTasks} 
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="В работе" 
                    value={stats.inProgressTasks}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="Баланс" 
                    value={stats.balance} 
                    precision={2}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: '#2E6B47' }}
                  />
                </Col>
              </Row>
            </div>
          </Card>
        </Col>

        {/* Правая колонка - Информация и настройки */}
        <Col xs={24} md={16}>
          <Card className="profilePage__info-card">
            <Tabs defaultActiveKey="profile">
              <TabPane tab="Профиль" key="profile">
                {!user ? (
                  <Alert 
                    type="warning" 
                    showIcon 
                    message="Нет данных профиля" 
                    description="Пользователь не загружен. Попробуйте обновить страницу."
                  />
                ) : isEditing ? (
                  <Form form={form} layout="vertical">
                    <Form.Item
                      label="Имя"
                      name="name"
                      rules={[{ required: true, message: 'Введите имя' }]}
                    >
                      <Input placeholder="Ваше имя" />
                    </Form.Item>
                    <Form.Item
                      label="Username"
                      name="username"
                      rules={[{ required: true, message: 'Введите username' }]}
                    >
                      <Input placeholder="username" />
                    </Form.Item>
                    <Form.Item
                      label="Email"
                      name="email"
                      rules={[
                        { required: true, message: 'Введите email' },
                        { type: 'email', message: 'Введите корректный email' }
                      ]}
                    >
                      <Input placeholder="email@example.com" />
                    </Form.Item>
                    <Space>
                      <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
                        Сохранить
                      </Button>
                      <Button onClick={handleCancel}>Отмена</Button>
                    </Space>
                  </Form>
                ) : (
                  <>
                    <Descriptions bordered column={1} size="middle">
                      <Descriptions.Item label={<><UserOutlined /> Имя</>}>
                        {user?.name || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label={<><IdcardOutlined /> Username</>}>
                        {user?.username || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label={<><MailOutlined /> Email</>}>
                        {user?.email || '—'}
                      </Descriptions.Item>
                    </Descriptions>
                    <div style={{ marginTop: 24, textAlign: 'right' }}>
                      <Space>
                        <Button icon={<EditOutlined />} onClick={handleEdit}>
                          Редактировать
                        </Button>
                        <Button icon={<HistoryOutlined />} onClick={onRefresh}>
                          Обновить
                        </Button>
                      </Space>
                    </div>
                  </>
                )}
              </TabPane>

              <TabPane tab="Настройки" key="settings">
                <div className="settings-section">
                  <Title level={5}>Безопасность</Title>
                  <div className="setting-item">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>Смена пароля</Text>
                          <br />
                          <Text type="secondary">Изменить текущий пароль</Text>
                        </div>
                        <Button icon={<LockOutlined />}>Изменить</Button>
                      </div>
                      <Divider />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>Двухфакторная аутентификация</Text>
                          <br />
                          <Text type="secondary">Повысьте безопасность аккаунта</Text>
                        </div>
                        <Button>Включить</Button>
                      </div>
                    </Space>
                  </div>

                  <Divider />

                  <Title level={5}>Уведомления</Title>
                  <div className="setting-item">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>Email уведомления</Text>
                          <br />
                          <Text type="secondary">Получать уведомления на почту</Text>
                        </div>
                        <Button>Настроить</Button>
                      </div>
                      <Divider />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text strong>Push уведомления</Text>
                          <br />
                          <Text type="secondary">Уведомления о новых задачах</Text>
                        </div>
                        <Button>Настроить</Button>
                      </div>
                    </Space>
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
