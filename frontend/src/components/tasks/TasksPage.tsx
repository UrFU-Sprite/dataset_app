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
  SyncOutlined,
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
      console.log('Loaded tasks:', data); // Для отладки
      
      const tasksWithStats = data.map(task => ({
        ...task,
        completionRate: task.status === 'completed' || task.status === 'done' ? 100 : 
                        task.status === 'in_progress' ? 50 : 0,
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
    
    // Фильтр по активной вкладке (ВАЖНО: правильные статусы)
    if (activeTab !== 'all') {
      if (activeTab === 'pending') {
        // Статусы, которые считаются "Ожидают": pending, open
        filtered = filtered.filter(task => task.status === 'pending' || task.status === 'open');
      } else if (activeTab === 'in_progress') {
        filtered = filtered.filter(task => task.status === 'in_progress');
      } else if (activeTab === 'completed') {
        filtered = filtered.filter(task => task.status === 'completed' || task.status === 'done');
      } else {
        filtered = filtered.filter(task => task.status === activeTab);
      }
    }
    
    // Фильтр по статусу в селекте
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    // Поиск
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
    const statusMap: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
        pending: { color: 'default', icon: <ClockCircleOutlined />, text: 'Ожидает' },
        open: { color: 'default', icon: <ClockCircleOutlined />, text: 'Ожидает' },
        in_progress: { color: 'processing', icon: <SyncOutlined spin />, text: 'В работе' },  // ← используем SyncOutlined с spin
        completed: { color: 'success', icon: <CheckCircleOutlined />, text: 'Завершена' },
        done: { color: 'success', icon: <CheckCircleOutlined />, text: 'Готово' }
    };
    
    const config = statusMap[status || 'pending'] || statusMap.pending;
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
    // Важно: подсчитываем все статусы, которые считаются "Ожидают"
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'open').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, pending, inProgress, completed, completionRate };
  };

  const stats = getStatistics();

  // Для отладки - выводим список задач
  console.log('Tasks with statuses:', tasks.map(t => ({ id: t.id, status: t.status })));
  console.log('Pending tasks count:', stats.pending);

  return (
    <div className="tasks-page">
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
              dataSource={filteredTasks.filter(t => t.status === 'pending' || t.status === 'open')}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'Нет задач в статусе "Ожидают"' }}
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
              locale={{ emptyText: 'Нет задач в статусе "В работе"' }}
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
              locale={{ emptyText: 'Нет завершенных задач' }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default TasksPage;
