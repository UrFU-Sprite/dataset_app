// frontend/src/components/analytics/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Space,
  Table,
  Progress,
  Tag,
  Empty,
  Spin,
  message,
  Typography
} from 'antd';
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ArrowUpOutlined,
  UserOutlined,
  ProjectOutlined,
  DollarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { Bar, Line, Pie } from '@ant-design/plots';
import { getDashboardStats } from '../../api/analytics';
import './dashboardPage.scss';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  totalProjects: number;
  activeWorkers: number;
  avgQuality: number;
  totalEarnings: number;
  tasksByStatus: Record<string, number>;
  tasksByProject: Array<{ name: string; value: number }>;
  weeklyProgress: Array<{ date: string; completed: number; created: number }>;
  topWorkers: Array<{ name: string; tasks: number; quality: number }>;
}

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  useEffect(() => {
    loadStats();
  }, [timeRange, dateRange]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const mockStats: DashboardStats = {
        totalTasks: 1247,
        completedTasks: 892,
        completionRate: 71.5,
        totalProjects: 8,
        activeWorkers: 24,
        avgQuality: 94.2,
        totalEarnings: 12500,
        tasksByStatus: { pending: 245, in_progress: 110, completed: 892 },
        tasksByProject: [
          { name: 'OCR Финансовых документов', value: 450 },
          { name: 'Сегментация дорожной инфраструктуры', value: 380 },
          { name: 'Voice Assistant Dataset', value: 267 },
          { name: 'Медицинские изображения', value: 150 }
        ],
        weeklyProgress: [
          { date: 'Пн', completed: 45, created: 52 },
          { date: 'Вт', completed: 58, created: 48 },
          { date: 'Ср', completed: 62, created: 55 },
          { date: 'Чт', completed: 71, created: 68 },
          { date: 'Пт', completed: 84, created: 72 },
          { date: 'Сб', completed: 43, created: 35 },
          { date: 'Вс', completed: 28, created: 22 }
        ],
        topWorkers: [
          { name: 'Анна Смирнова', tasks: 156, quality: 98.5 },
          { name: 'Дмитрий Козлов', tasks: 142, quality: 96.2 },
          { name: 'Елена Морозова', tasks: 128, quality: 97.8 },
          { name: 'Игорь Васильев', tasks: 115, quality: 94.5 },
          { name: 'Мария Петрова', tasks: 98, quality: 95.2 }
        ]
      };
      setStats(mockStats);
    } catch (error) {
      message.error('Ошибка загрузки аналитики');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const barConfig = {
    data: stats?.tasksByProject || [],
    xField: 'name',
    yField: 'value',
    color: '#2E6B47',
    label: { position: 'top', style: { fill: '#FFFFFF', opacity: 0.6 } },
    xAxis: { label: { autoRotate: true, autoHide: true } },
    meta: { name: { alias: 'Проект' }, value: { alias: 'Количество задач' } },
  };

  const lineConfig = {
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    color: ['#2E6B47', '#FFB347'],
    smooth: true,
    point: { size: 5, shape: 'diamond' },
    legend: { position: 'top' },
    data: [
      ...(stats?.weeklyProgress.map(d => ({ ...d, type: 'Создано', value: d.created })) || []),
      ...(stats?.weeklyProgress.map(d => ({ ...d, type: 'Завершено', value: d.completed })) || [])
    ],
  };

  const pieConfig = {
    data: Object.entries(stats?.tasksByStatus || {}).map(([name, value]) => ({ name, value })),
    angleField: 'value',
    colorField: 'name',
    color: ['#faad14', '#1890ff', '#52c41a'],
    label: { text: 'name', style: { fontWeight: 'bold' } },
    legend: { position: 'top' },
    statistic: {
      title: false,
      content: {
        style: { whiteSpace: 'pre-wrap', overflow: 'hidden', textOverflow: 'ellipsis' },
        formatter: () => `Всего\n${stats?.totalTasks || 0}`,
      },
    },
  };

  const workerColumns = [
    {
      title: 'Исполнитель',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <UserOutlined />
          <span>{name}</span>
        </Space>
      ),
    },
    {
      title: 'Выполнено задач',
      dataIndex: 'tasks',
      key: 'tasks',
      sorter: (a: any, b: any) => a.tasks - b.tasks,
      render: (tasks: number) => <Tag color="blue">{tasks}</Tag>,
    },
    {
      title: 'Качество',
      dataIndex: 'quality',
      key: 'quality',
      sorter: (a: any, b: any) => a.quality - b.quality,
      render: (quality: number) => (
        <Progress percent={quality} size="small" strokeColor="#2E6B47" format={() => `${quality}%`} />
      ),
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" tip="Загрузка аналитики..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="dashboard-empty">
        <Empty description="Нет данных для отображения" />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* УДАЛЕН внутренний заголовок dashboard-header */}

      {/* KPI Cards */}
      <Row gutter={[16, 16]} className="kpi-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <Statistic
              title="Всего задач"
              value={stats.totalTasks}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#2E6B47' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <Statistic
              title="Завершено"
              value={stats.completedTasks}
              suffix={`/ ${stats.totalTasks}`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={stats.completionRate}
              strokeColor="#52c41a"
              className="kpi-progress"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <Statistic
              title="Активных исполнителей"
              value={stats.activeWorkers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="kpi-card">
            <Statistic
              title="Среднее качество"
              value={stats.avgQuality}
              precision={1}
              suffix="%"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <ArrowUpOutlined style={{ color: '#52c41a', fontSize: 12, marginLeft: 8 }} />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Задачи по проектам" className="chart-card">
            <Bar {...barConfig} height={300} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Динамика задач" className="chart-card">
            <Line {...lineConfig} height={300} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Статус задач" className="chart-card">
            <Pie {...pieConfig} innerRadius={0.6} height={280} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Топ исполнителей" className="chart-card">
            <Table
              columns={workerColumns}
              dataSource={stats.topWorkers}
              pagination={false}
              size="small"
              className="workers-table"
            />
          </Card>
        </Col>
      </Row>

      {/* Additional Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Детальная статистика" className="details-card">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <div className="detail-item">
                  <ProjectOutlined className="detail-icon" />
                  <div>
                    <div className="detail-label">Всего проектов</div>
                    <div className="detail-value">{stats.totalProjects}</div>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className="detail-item">
                  <DollarOutlined className="detail-icon" />
                  <div>
                    <div className="detail-label">Заработано исполнителями</div>
                    <div className="detail-value">${stats.totalEarnings.toLocaleString()}</div>
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div className="detail-item">
                  <CheckCircleOutlined className="detail-icon" />
                  <div>
                    <div className="detail-label">Среднее время выполнения</div>
                    <div className="detail-value">2.4 дня</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
