// frontend/src/components/tasks/TasksPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Select,
  Badge,
  Statistic,
  Row,
  Col,
  Tabs,
  Tooltip,
  message,
  Avatar,
  Modal,
  Progress,
  Typography
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  ReloadOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { listTasks, submitTask } from '../../api/tasks';
import type { Task } from '../../api/types';
import './tasksPage.scss';

const { Option } = Select;
const { TabPane } = Tabs;
const { confirm } = Modal;
const { Text } = Typography;

interface TaskWithStats extends Task {
  completionRate?: number;
  assigneeName?: string;
}

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskWithStats[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<TaskWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchText, statusFilter, activeTab]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await listTasks();
      const tasksWithStats = data.map(task => ({
        ...task,
        completionRate: Math.floor(Math.random() * 100),
        assigneeName: ['Анна С.', 'Дмитрий К.', 'Елена М.', 'Игорь В.'][Math.floor(Math.random() * 4)]
      }));
      setTasks(tasksWithStats);
      setFilteredTasks(tasksWithStats);
    } catch (error) {
      message.error('Ошибка загрузки задач');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];
    if (activeTab !== 'all') {
      filtered = filtered.filter(task => task.status === activeTab);
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    if (searchText) {
      filtered = filtered.filter(task =>
        task.id.toString().includes(searchText) ||
        task.projectId?.toString().includes(searchText)
      );
    }
    setFilteredTasks(filtered);
  };

  const handleCompleteTask = (task: Task) => {
    confirm({
      title: 'Завершить задачу?',
      icon: <ExclamationCircleOutlined />,
      content: 'Вы уверены, что хотите отметить эту задачу как завершенную?',
      okText: 'Да',
      cancelText: 'Нет',
      onOk: async () => {
        try {
          await submitTask({
            taskId: task.id,
            status: 'completed',
            images: task.images || []
          });
          message.success('Задача завершена');
          loadTasks();
        } catch (error) {
          message.error('Ошибка при завершении задачи');
        }
      }
    });
  };

  const getStatusTag = (status?: string) => {
    const statusMap = {
      pending: { color: 'default', icon: <ClockCircleOutlined />, text: 'Ожидает' },
      in_progress: { color: 'processing', icon: <LoadingOutlined />, text: 'В работе' },
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: 'Завершена' },
      done: { color: 'success', icon: <CheckCircleOutlined />, text: 'Готово' }
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => (
        <Tag color="blue" className="task-id-tag">#{id}</Tag>
      ),
    },
    {
      title: 'Проект',
      dataIndex: 'projectId',
      key: 'projectId',
      width: 120,
      render: (projectId: number) => (
        <Button
          type="link"
          onClick={() => navigate(`/projects/${projectId}`)}
          className="project-link"
          style={{ padding: 0 }}
        >
          Проект #{projectId}
        </Button>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Прогресс',
      key: 'progress',
      width: 150,
      render: (_: any, record: TaskWithStats) => (
        <Tooltip title={`${record.completionRate}% завершено`}>
          <Progress
            percent={record.completionRate}
            size="small"
            strokeColor="#2E6B47"
            showInfo={false}
          />
        </Tooltip>
      ),
    },
    {
      title: 'Исполнитель',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      width: 130,
      render: (name: string) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <span>{name || 'Не назначен'}</span>
        </Space>
      ),
    },
    {
      title: 'Изображений',
      dataIndex: 'images',
      key: 'imagesCount',
      width: 100,
      render: (images: any[]) => (
        <Badge
          count={images?.length || 0}
          showZero
          style={{ backgroundColor: '#2E6B47' }}
        />
      ),
    },
    {
      title: 'Действия',
      key: 'action',
      width: 200,
      render: (_: any, record: Task) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/tasks/${record.id}`)}
          >
            Открыть
          </Button>
          {record.status !== 'completed' && record.status !== 'done' && (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCompleteTask(record)}
            >
              Завершить
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const getStatistics = () => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, pending, inProgress, completed, completionRate };
  };

  const stats = getStatistics();

  return (
    <div className="tasks-page">
      {/* Статистика */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Всего задач"
              value={stats.total}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#2E6B47' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="В работе"
              value={stats.inProgress}
              prefix={<LoadingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Ожидают"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="stat-card">
            <Statistic
              title="Завершено"
              value={stats.completed}
              suffix={`/ ${stats.total}`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={stats.completionRate}
              strokeColor="#52c41a"
              showInfo={false}
              className="stat-progress"
            />
          </Card>
        </Col>
      </Row>

      {/* Таблица задач */}
      <Card className="tasks-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/tasks/new')}
            style={{ background: '#2E6B47' }}
          >
            Создать задачу
          </Button>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="tasks-tabs"
          tabBarExtraContent={
            <Space>
              <Input
                placeholder="Поиск по ID или проекту"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ width: 250 }}
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">Все статусы</Option>
                <Option value="pending">Ожидают</Option>
                <Option value="in_progress">В работе</Option>
                <Option value="completed">Завершены</Option>
              </Select>
              <Tooltip title="Обновить">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadTasks}
                  loading={loading}
                />
              </Tooltip>
            </Space>
          }
        >
          <TabPane tab="Все задачи" key="all">
            <Table
              columns={columns}
              dataSource={filteredTasks}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} задач`,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
              className="tasks-table"
            />
          </TabPane>
          <TabPane
            tab={
              <Badge count={stats.pending} offset={[10, 0]}>
                Ожидают
              </Badge>
            }
            key="pending"
          >
            <Table
              columns={columns}
              dataSource={filteredTasks.filter(t => t.status === 'pending')}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane
            tab={
              <Badge count={stats.inProgress} offset={[10, 0]}>
                В работе
              </Badge>
            }
            key="in_progress"
          >
            <Table
              columns={columns}
              dataSource={filteredTasks.filter(t => t.status === 'in_progress')}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane
            tab={
              <Badge count={stats.completed} offset={[10, 0]}>
                Завершены
              </Badge>
            }
            key="completed"
          >
            <Table
              columns={columns}
              dataSource={filteredTasks.filter(t => t.status === 'completed' || t.status === 'done')}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default TasksPage;
