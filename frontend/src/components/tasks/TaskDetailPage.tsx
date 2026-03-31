// frontend/src/components/tasks/TaskDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Image,
  Input,
  Button,
  Space,
  Tag,
  Typography,
  Divider,
  Timeline,
  Alert,
  Spin,
  Modal,
  Statistic,
  Progress,
  Tabs,
  List,
  Avatar,
  Badge,
  Tooltip,
  message
} from 'antd';
import {
  ArrowLeftOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CommentOutlined,
  BarChartOutlined,
  FileTextOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { getTaskById, submitTask, getTaskAnnotations, getTaskConsensus } from 'api/tasks';
import type { Task, TaskImage, Annotation } from 'api/types';
import './taskDetailPage.scss';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface ConsensusData {
  task_id: number;
  total_annotations: number;
  label_counts: Record<string, number>;
  consensus_label: string | null;
  agreement_score: number;
  needs_review: boolean;
}

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [consensus, setConsensus] = useState<ConsensusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [captions, setCaptions] = useState<Map<number, string>>(new Map());
  const [selectedImage, setSelectedImage] = useState<TaskImage | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  useEffect(() => {
    if (id) {
      loadTaskData();
    }
  }, [id]);

  const loadTaskData = async () => {
    setLoading(true);
    try {
      const [taskData, annotationsData, consensusData] = await Promise.all([
        getTaskById(id!),
        getTaskAnnotations(id!).catch(() => []),
        getTaskConsensus(id!).catch(() => null)
      ]);
      setTask(taskData);
      setAnnotations(annotationsData);
      setConsensus(consensusData);
      
      // Initialize captions from existing images
      if (taskData?.images) {
        const initialCaptions = new Map();
        taskData.images.forEach(img => {
          if (img.caption) {
            initialCaptions.set(img.id, img.caption);
          }
        });
        setCaptions(initialCaptions);
      }
    } catch (error) {
      message.error('Ошибка загрузки данных задачи');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptionChange = (imageId: number, value: string) => {
    setCaptions(prev => new Map(prev).set(imageId, value));
  };

  const handleSubmit = async () => {
    if (!task) return;
    
    setSubmitting(true);
    try {
      const imagesPayload = task.images?.map(img => ({
        id: img.id,
        url: img.url,
        caption: captions.get(img.id) || img.caption || ''
      })) || [];
      
      await submitTask({
        taskId: task.id,
        status: 'completed',
        images: imagesPayload
      });
      
      message.success('Задача успешно отправлена на проверку!');
      navigate('/tasks');
    } catch (error) {
      message.error('Ошибка при отправке задачи');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status?: string) => {
    const configs = {
      pending: { color: 'default', icon: <ClockCircleOutlined />, text: 'Ожидает' },
      in_progress: { color: 'processing', icon: <LoadingOutlined />, text: 'В работе' },
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: 'Завершена' },
      done: { color: 'success', icon: <CheckCircleOutlined />, text: 'Готово' }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getAgreementColor = (score: number) => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#faad14';
    return '#ff4d4f';
  };

  if (loading) {
    return (
      <div className="task-detail-loading">
        <Spin size="large" tip="Загрузка задачи..." />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-error">
        <Alert
          message="Задача не найдена"
          description="Проверьте правильность ID задачи или вернитесь к списку"
          type="error"
          showIcon
          action={
            <Button onClick={() => navigate('/tasks')} type="primary">
              К списку задач
            </Button>
          }
        />
      </div>
    );
  }

  const statusConfig = getStatusConfig(task.status);
  const isCompleted = task.status === 'completed' || task.status === 'done';

  return (
    <div className="task-detail-page">
      {/* Header */}
      <div className="task-header">
        <div className="task-header-left">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/tasks')}
            className="back-button"
          >
            Назад
          </Button>
          <div className="task-title-section">
            <Title level={3} className="task-title">
              Задача #{task.id}
            </Title>
            <Tag color={statusConfig.color} icon={statusConfig.icon}>
              {statusConfig.text}
            </Tag>
          </div>
        </div>
        {!isCompleted && (
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={submitting}
            size="large"
          >
            Отправить на проверку
          </Button>
        )}
      </div>

      <Row gutter={[24, 24]}>
        {/* Main content - Images and captions */}
        <Col xs={24} lg={16}>
          <Card className="content-card" title="Изображения для разметки">
            {task.images && task.images.length > 0 ? (
              <div className="images-grid">
                {task.images.map((image, index) => (
                  <Card
                    key={image.id}
                    className="image-card"
                    hoverable
                    cover={
                      <div className="image-cover">
                        <img
                          alt={`Image ${index + 1}`}
                          src={image.url}
                          onClick={() => {
                            setSelectedImage(image);
                            setPreviewVisible(true);
                          }}
                        />
                        {image.caption && (
                          <div className="image-badge">
                            <CheckCircleOutlined /> Размечено
                          </div>
                        )}
                      </div>
                    }
                  >
                    <div className="image-caption-section">
                      <Text strong>Подпись к изображению:</Text>
                      <TextArea
                        rows={3}
                        value={captions.get(image.id) || image.caption || ''}
                        onChange={(e) => handleCaptionChange(image.id, e.target.value)}
                        placeholder="Введите описание изображения..."
                        disabled={isCompleted}
                        className="caption-input"
                      />
                      {image.caption && !captions.get(image.id) && (
                        <div className="existing-caption">
                          <Text type="secondary">Предыдущая подпись: </Text>
                          <Text italic>{image.caption}</Text>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FileTextOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <Text type="secondary">Нет изображений для этой задачи</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Sidebar - Annotations and Consensus */}
        <Col xs={24} lg={8}>
          {/* Consensus Card */}
          {consensus && consensus.total_annotations > 0 && (
            <Card className="consensus-card" title={
              <Space>
                <BarChartOutlined />
                <span>Консенсус аннотаторов</span>
              </Space>
            }>
              <div className="consensus-stats">
                <Statistic
                  title="Всего аннотаций"
                  value={consensus.total_annotations}
                  prefix={<UserOutlined />}
                />
                <Divider />
                <div className="agreement-score">
                  <Text strong>Согласованность</Text>
                  <Progress
                    percent={Math.round(consensus.agreement_score * 100)}
                    strokeColor={getAgreementColor(consensus.agreement_score)}
                    format={(percent) => `${percent}%`}
                  />
                </div>
                {consensus.consensus_label && (
                  <div className="consensus-label">
                    <Text strong>Консенсус-метка:</Text>
                    <Tag color="green" style={{ marginLeft: 8 }}>
                      {consensus.consensus_label}
                    </Tag>
                  </div>
                )}
                {consensus.needs_review && (
                  <Alert
                    message="Требуется ручная проверка"
                    description="Низкий уровень согласованности между аннотаторами"
                    type="warning"
                    showIcon
                    icon={<EyeOutlined />}
                  />
                )}
              </div>

              <Divider>Распределение меток</Divider>
              <div className="label-distribution">
                {Object.entries(consensus.label_counts).map(([label, count]) => (
                  <div key={label} className="label-stat">
                    <span className="label-name">{label}</span>
                    <Progress
                      percent={Math.round((count / consensus.total_annotations) * 100)}
                      strokeColor="#2E6B47"
                      format={() => `${count}`}
                      size="small"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Annotations Timeline */}
          {annotations.length > 0 && (
            <Card className="annotations-card" title={
              <Space>
                <CommentOutlined />
                <span>История аннотаций</span>
                <Badge count={annotations.length} showZero />
              </Space>
            }>
              <Timeline className="annotations-timeline">
                {annotations.map((annotation, index) => (
                  <Timeline.Item
                    key={annotation.id || index}
                    dot={<Avatar icon={<UserOutlined />} size="small" style={{ backgroundColor: '#2E6B47' }} />}
                  >
                    <div className="annotation-item">
                      <div className="annotation-header">
                        <Text strong>Аннотатор #{annotation.worker_id || index + 1}</Text>
                        <Tag color="blue">{annotation.label}</Tag>
                      </div>
                      {annotation.comment && (
                        <div className="annotation-comment">
                          <Text type="secondary">Комментарий:</Text>
                          <Paragraph ellipsis={{ rows: 2 }} className="comment-text">
                            {annotation.comment}
                          </Paragraph>
                        </div>
                      )}
                      {annotation.created_at && (
                        <Text type="secondary" className="annotation-date">
                          {new Date(annotation.created_at).toLocaleString()}
                        </Text>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          )}

          {/* Task Info Card */}
          <Card className="info-card" title="Информация о задаче">
            <div className="info-item">
              <Text type="secondary">ID проекта:</Text>
              <Text strong>{task.projectId || '—'}</Text>
            </div>
            <div className="info-item">
              <Text type="secondary">Статус:</Text>
              <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
            </div>
            {task.suggested_label && (
              <div className="info-item">
                <Text type="secondary">Предложенная метка:</Text>
                <Tag color="orange">{task.suggested_label}</Tag>
              </div>
            )}
            {task.final_label && (
              <div className="info-item">
                <Text type="secondary">Финальная метка:</Text>
                <Tag color="green">{task.final_label}</Tag>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="auto"
        className="image-preview-modal"
      >
        {selectedImage && (
          <div className="preview-content">
            <img
              alt="Preview"
              src={selectedImage.url}
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
            />
            <div className="preview-caption">
              <Text strong>Текущая подпись:</Text>
              <Text>{captions.get(selectedImage.id) || selectedImage.caption || 'Нет подписи'}</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
