import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Space,
  message,
  Alert,
  Upload,
  Tabs,
  List,
  Image,
  Typography,
  Progress
} from 'antd';
import {
  PlusOutlined,
  ProjectOutlined,
  UserOutlined,
  PictureOutlined,
  UploadOutlined,
  LinkOutlined,
  DeleteOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import { createTask } from '../../api/tasks';
import { listProjects } from '../../api/projects';
import type { Project } from '../../api/types';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Dragger } = Upload;

interface UploadFile {
  url: string;
  file?: File;
  name: string;
  uploading?: boolean;
  progress?: number;
}

export const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [activeTab, setActiveTab] = useState<'urls' | 'files'>('urls');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setProjectsLoading(true);
    try {
      const data = await listProjects();
      setProjects(data);
    } catch (error) {
      message.error('Ошибка загрузки проектов');
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    return new Promise<string>((resolve) => {
      // Создаем локальный URL для предпросмотра
      const localUrl = URL.createObjectURL(file);
      
      const newFile: UploadFile = {
        url: localUrl,
        file: file,
        name: file.name,
        uploading: true,
        progress: 0
      };
      
      setUploadedFiles(prev => [...prev, newFile]);
      
      // Симулируем загрузку
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadedFiles(prev =>
          prev.map(f =>
            f.file === file ? { ...f, progress } : f
          )
        );
        
        if (progress >= 100) {
          clearInterval(interval);
          setUploadedFiles(prev =>
            prev.map(f =>
              f.file === file ? { ...f, uploading: false, progress: 100 } : f
            )
          );
          resolve(localUrl);
        }
      }, 100);
    });
  };

  const handleRemoveFile = (fileToRemove: UploadFile) => {
    setUploadedFiles(prev => prev.filter(f => f !== fileToRemove));
    if (fileToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(fileToRemove.url);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      let imageUrls: string[] = [];
      
      if (activeTab === 'urls') {
        // Получаем URL из текстового поля
        imageUrls = values.imageUrls
          ? values.imageUrls.split('\n').map((url: string) => url.trim()).filter(Boolean)
          : [];
          
        if (imageUrls.length === 0) {
          message.error('Добавьте хотя бы один URL изображения');
          setLoading(false);
          return;
        }
      } else {
        // Получаем URL из загруженных файлов
        if (uploadedFiles.length === 0) {
          message.error('Добавьте хотя бы одно изображение');
          setLoading(false);
          return;
        }
        
        // Проверяем, что все файлы загружены
        const uploadingFiles = uploadedFiles.filter(f => f.uploading);
        if (uploadingFiles.length > 0) {
          message.error('Дождитесь окончания загрузки всех файлов');
          setLoading(false);
          return;
        }
        
        // Используем blob URL
        imageUrls = uploadedFiles.map(f => f.url);
      }

      const assignees = values.assignees
        ? values.assignees.split(',').map((email: string) => email.trim()).filter(Boolean)
        : [];

      const payload = {
        projectId: values.projectId,
        assignees: assignees,
        imageUrls: imageUrls
      };

      console.log('[CreateTask] Sending payload:', payload);
      
      const result = await createTask(payload);
      console.log('[CreateTask] Result:', result);
      
      message.success('Задача успешно создана');
      navigate('/tasks');
    } catch (error) {
      console.error('[CreateTask] Error:', error);
      message.error('Ошибка при создании задачи. Проверьте данные и попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    showUploadList: false,
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Можно загружать только изображения');
        return false;
      }
      
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('Изображение должно быть меньше 10MB!');
        return false;
      }
      
      handleFileUpload(file);
      return false;
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 0' }}>
      <Card style={{ borderRadius: 20 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={<span><ProjectOutlined /> Проект</span>}
            name="projectId"
          >
            <Select
              placeholder="Выберите проект (опционально)"
              allowClear
              size="large"
              loading={projectsLoading}
            >
              {projects.map(project => (
                <Option key={project.id} value={project.id}>
                  {project.name} #{project.id}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={<span><UserOutlined /> Исполнители</span>}
            name="assignees"
            extra="Введите email через запятую"
          >
            <TextArea
              rows={2}
              placeholder="user1@example.com, user2@example.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label={<span><PictureOutlined /> Изображения</span>}
            required
          >
            <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as 'urls' | 'files')}>
              <TabPane
                tab={<span><LinkOutlined /> По ссылкам</span>}
                key="urls"
              >
                <Form.Item
                  name="imageUrls"
                  noStyle
                  rules={[{ required: activeTab === 'urls', message: 'Добавьте хотя бы один URL' }]}
                >
                  <TextArea
                    rows={5}
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.png&#10;https://example.com/image3.webp"
                    size="large"
                    style={{ fontFamily: 'monospace', fontSize: 13 }}
                  />
                </Form.Item>
                <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                  Каждый URL на новой строке. Поддерживаются: JPG, PNG, WebP, GIF
                </Text>
              </TabPane>

              <TabPane
                tab={<span><CloudUploadOutlined /> Загрузить файлы</span>}
                key="files"
              >
                <Dragger {...uploadProps}>
                  <p className="ant-upload-drag-icon">
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text">Нажмите или перетащите файлы для загрузки</p>
                  <p className="ant-upload-hint">
                    Поддерживаются JPG, PNG, WebP, GIF. Можно загрузить несколько файлов
                  </p>
                </Dragger>

                {uploadedFiles.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <Title level={5}>Загруженные файлы ({uploadedFiles.length})</Title>
                    <List
                      dataSource={uploadedFiles}
                      renderItem={(item) => (
                        <List.Item
                          actions={[
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveFile(item)}
                              disabled={item.uploading}
                            />
                          ]}
                        >
                          <List.Item.Meta
                            avatar={
                              <Image
                                src={item.url}
                                width={50}
                                height={50}
                                style={{ objectFit: 'cover', borderRadius: 8 }}
                                preview={false}
                              />
                            }
                            title={item.name}
                            description={
                              item.uploading ? (
                                <Progress percent={item.progress} size="small" status="active" />
                              ) : (
                                <Text type="success">Готово к загрузке</Text>
                              )
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                )}
              </TabPane>
            </Tabs>
          </Form.Item>

          <Alert
            message="Информация"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>После создания задачи она появится в списке</li>
                <li>Исполнители получат уведомления на email и в интерфейсе</li>
                <li>Максимальный размер одного файла: 10 МБ</li>
                <li>Поддерживаются форматы: JPG, PNG, WebP, GIF</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ margin: '24px 0' }}
          />

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => navigate('/tasks')}>
                Отмена
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<PlusOutlined />}
                style={{ background: '#2E6B47' }}
              >
                Создать задачу
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CreateTaskPage;
