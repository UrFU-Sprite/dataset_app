// frontend/src/components/tasks/CreateTaskPage.tsx
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
  Spin,
} from 'antd';
import { 
  PlusOutlined, 
  ProjectOutlined,
  UserOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { createTask } from '../../api/tasks';
import { listProjects } from '../../api/projects';
import type { Project } from '../../api/types';

const { Option } = Select;
const { TextArea } = Input;

export const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

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

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const assignees = values.assignees
        ? values.assignees.split(',').map((email: string) => email.trim()).filter(Boolean)
        : [];

      const imageUrls = values.imageUrls
        ? values.imageUrls.split('\n').map((url: string) => url.trim()).filter(Boolean)
        : [];

      if (imageUrls.length === 0) {
        message.error('Добавьте хотя бы один URL изображения');
        setLoading(false);
        return;
      }

      const payload = {
        projectId: values.projectId,
        assignees: assignees,
        images: imageUrls.map((url: string) => ({ url, caption: '' }))
      };

      await createTask(payload);
      message.success('Задача успешно создана');
      navigate('/tasks');
    } catch (error) {
      message.error('Ошибка при создании задачи');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
      {/* УДАЛЕН внутренний заголовок */}
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
            label={<span><PictureOutlined /> URL изображений</span>}
            name="imageUrls"
            required
            rules={[{ required: true, message: 'Добавьте хотя бы один URL' }]}
            extra="Каждый URL на новой строке"
          >
            <TextArea
              rows={5}
              placeholder="https://example.com/image1.jpg"
              size="large"
            />
          </Form.Item>

          <Alert
            message="Информация"
            description="После создания задачи она появится в списке. Исполнители получат уведомления."
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
