import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Tabs, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Statistic, 
  Row, 
  Col,
  message,
  Modal,
  Upload,
  Select,
  Input,
  Progress,
  Tooltip,
  Dropdown
} from 'antd';
import { 
  UploadOutlined, 
  RocketOutlined, 
  UserAddOutlined, 
  ExportOutlined,
  BarChartOutlined,
  ReloadOutlined,
  FileTextOutlined,
  TagOutlined
} from '@ant-design/icons';
import { getProjectById, getProjectStats, uploadDataset, autoLabelProject, autoAssignProject, exportProject } from 'api/projects';
import { getProjectTasks } from 'api/projects';
import type { Project, Task } from 'api/types';
import './ProjectDetailPage.scss';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    setLoading(true);
    try {
      const [projectData, tasksData, statsData] = await Promise.all([
        getProjectById(id!),
        getProjectTasks(id!),
        getProjectStats(id!)
      ]);
      setProject(projectData);
      setTasks(tasksData);
      setStats(statsData);
    } catch (error) {
      message.error('Ошибка загрузки данных проекта');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoLabel = async () => {
    try {
      await autoLabelProject(id!);
      message.success('Авторазметка запущена успешно');
      loadProjectData();
    } catch (error) {
      message.error('Ошибка при авторазметке');
    }
  };

  const handleAutoAssign = async () => {
    try {
      await autoAssignProject(id!);
      message.success('Автораспределение выполнено');
      loadProjectData();
    } catch (error) {
      message.error('Ошибка при распределении');
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const blob = await exportProject(id!, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_${id}_dataset.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success(`Экспорт в ${format.toUpperCase()} завершен`);
    } catch (error) {
      message.error('Ошибка при экспорте');
    }
  };

  const handleUpload = async (file: File, format: string, options: any) => {
    setUploading(true);
    try {
      await uploadDataset(id!, file, format, options);
      message.success('Датасет загружен успешно');
      setUploadModalVisible(false);
      loadProjectData();
    } catch (error) {
      message.error('Ошибка загрузки датасета');
    } finally {
      setUploading(false);
    }
  };

  const taskColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <Tag color="blue">#{id}</Tag>,
    },
    {
      title: 'Текст/Описание',
      dataIndex: 'text',
      key: 'text',
      ellipsis: true,
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'default', text: 'Ожидает' },
          in_progress: { color: 'processing', text: 'В работе' },
          completed: { color: 'success', text: 'Завершена' },
          done: { color: 'success', text: 'Готово' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Разметка',
      dataIndex: 'suggested_label',
      key: 'suggested_label',
      width: 120,
      render: (label: string) => label ? <Tag color="green">{label}</Tag> : '-',
    },
    {
      title: 'Действия',
      key: 'action',
      width: 100,
      render: (_: any, record: Task) => (
        <Button 
          type="link" 
          onClick={() => navigate(`/tasks/${record.id}`)}
        >
          Открыть
        </Button>
      ),
    },
  ];

  if (loading) {
    return <div className="loading-container">Загрузка...</div>;
  }

  return (
    <div className="project-detail-page fade-in-up">
      {/* Header с кнопками */}
      <div className="project-header">
        <div>
          <h1 className="project-title">{project?.name || 'Проект'}</h1>
          <p className="project-description">{project?.description}</p>
        </div>
        <Space size="middle">
          <Button 
            icon={<UploadOutlined />} 
            type="primary"
            onClick={() => setUploadModalVisible(true)}
          >
            Загрузить датасет
          </Button>
          <Button icon={<RocketOutlined />} onClick={handleAutoLabel}>
            Авторазметка
          </Button>
          <Button icon={<UserAddOutlined />} onClick={handleAutoAssign}>
            Автораспределение
          </Button>
          <Dropdown
            menu={{
              items: [
                { key: 'json', label: 'JSON', onClick: () => handleExport('json') },
                { key: 'csv', label: 'CSV', onClick: () => handleExport('csv') },
              ],
            }}
          >
            <Button icon={<ExportOutlined />}>Экспорт</Button>
          </Dropdown>
          <Button icon={<ReloadOutlined />} onClick={loadProjectData}>
            Обновить
          </Button>
        </Space>
      </div>

      {/* Статистика */}
      {stats && (
        <Row gutter={[16, 16]} className="stats-row">
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic 
                title="Всего задач" 
                value={stats.total_tasks || 0} 
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic 
                title="Выполнено" 
                value={stats.done_tasks || 0} 
                suffix={`/ ${stats.total_tasks || 0}`}
                valueStyle={{ color: '#2E6B47' }}
              />
              <Progress 
                percent={stats.total_tasks ? Math.round((stats.done_tasks / stats.total_tasks) * 100) : 0} 
                strokeColor="#2E6B47"
                showInfo={false}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic 
                title="Авторазмечено" 
                value={stats.auto_labeled_tasks || 0} 
                prefix={<TagOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic 
                title="В работе" 
                value={stats.pending_tasks || 0} 
                valueStyle={{ color: '#FFB347' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Табы с контентом */}
      <Card className="content-card">
        <Tabs defaultActiveKey="tasks">
          <TabPane tab="Задачи проекта" key="tasks">
            <Table
              columns={taskColumns}
              dataSource={tasks}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Распределение меток" key="labels">
            {stats?.label_distribution && Object.keys(stats.label_distribution).length > 0 ? (
              <div className="labels-distribution">
                {Object.entries(stats.label_distribution).map(([label, count]) => (
                  <div key={label} className="label-item">
                    <span className="label-name">{label}</span>
                    <Progress 
                      percent={Math.round((count as number) / stats.total_tasks * 100)} 
                      strokeColor="#2E6B47"
                      format={() => `${count}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Нет данных о распределении меток</div>
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* Модалка загрузки */}
      <Modal
        title="Загрузка датасета"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={700}
      >
        <UploadModalContent onUpload={handleUpload} uploading={uploading} />
      </Modal>
    </div>
  );
};

// Компонент модалки загрузки
const UploadModalContent: React.FC<{ onUpload: any; uploading: boolean }> = ({ onUpload, uploading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState('csv');
  const [splitMode, setSplitMode] = useState('line');
  const [textColumn, setTextColumn] = useState('');
  const [preview, setPreview] = useState<any>(null);

  const handlePreview = async () => {
    if (!file) return;
    // Preview logic here
    message.info('Предпросмотр будет доступен в следующей версии');
  };

  return (
    <div className="upload-modal">
      <Upload.Dragger
        beforeUpload={(f) => {
          setFile(f);
          return false;
        }}
        maxCount={1}
        fileList={file ? [{ uid: '1', name: file.name, status: 'done' }] : []}
      >
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">Нажмите или перетащите файл для загрузки</p>
        <p className="ant-upload-hint">Поддерживаются форматы: CSV, JSON, TXT</p>
      </Upload.Dragger>

      <div className="upload-options">
        <Select value={format} onChange={setFormat} style={{ width: '100%' }} placeholder="Формат файла">
          <Option value="csv">CSV</Option>
          <Option value="json">JSON</Option>
          <Option value="text">TXT</Option>
        </Select>
        
        {format === 'csv' && (
          <Input
            placeholder="Название колонки с текстом (например: text, description)"
            value={textColumn}
            onChange={(e) => setTextColumn(e.target.value)}
          />
        )}
        
        {format === 'text' && (
          <Select value={splitMode} onChange={setSplitMode} style={{ width: '100%' }}>
            <Option value="line">По строкам</Option>
            <Option value="sentence">По предложениям</Option>
            <Option value="paragraph">По параграфам</Option>
          </Select>
        )}
        
        <Button 
          type="primary" 
          onClick={handlePreview} 
          disabled={!file}
          block
        >
          Предпросмотр
        </Button>
        
        <Button 
          type="primary" 
          onClick={() => file && onUpload(file, format, { splitMode, textColumn })}
          loading={uploading}
          disabled={!file}
          block
        >
          Загрузить
        </Button>
      </div>
    </div>
  );
};
