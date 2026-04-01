// frontend/src/api/notifications.ts
import { apiRequest } from './client';
import type { Id } from './types';

export interface Notification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'task_review' | 'balance_change' | 'project_invite' | 'system';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
}

// Получить все уведомления
export async function getNotifications(): Promise<Notification[]> {
  try {
    // Пытаемся получить с бэкенда
    return await apiRequest<Notification[]>('/api/v1/notifications', { method: 'GET' });
  } catch (error) {
    // Если бэкенд не готов, возвращаем моковые данные
    console.warn('Using mock notifications (backend not available)');
    return getMockNotifications();
  }
}

// Отметить уведомление как прочитанное
export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    await apiRequest(`/api/v1/notifications/${id}/read`, { method: 'POST' });
  } catch (error) {
    console.warn('Failed to mark notification as read', error);
  }
}

// Отметить все уведомления как прочитанные
export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    await apiRequest('/api/v1/notifications/read-all', { method: 'POST' });
  } catch (error) {
    console.warn('Failed to mark all notifications as read', error);
  }
}

// Удалить уведомление
export async function deleteNotification(id: string): Promise<void> {
  try {
    await apiRequest(`/api/v1/notifications/${id}`, { method: 'DELETE' });
  } catch (error) {
    console.warn('Failed to delete notification', error);
  }
}

// Моковые данные для разработки
function getMockNotifications(): Notification[] {
  const now = new Date();
  return [
    {
      id: '1',
      type: 'task_assigned',
      title: 'Новая задача',
      description: 'Вам назначена задача "Разметка изображений для проекта Cats vs Dogs"',
      timestamp: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
      read: false,
      link: '/tasks/1',
      metadata: { taskId: 1 }
    },
    {
      id: '2',
      type: 'task_completed',
      title: 'Задача завершена',
      description: 'Задача "Проверка качества данных" выполнена и ожидает вашей проверки',
      timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      read: false,
      link: '/tasks/2',
      metadata: { taskId: 2 }
    },
    {
      id: '3',
      type: 'balance_change',
      title: 'Начисление на баланс',
      description: 'За выполнение задачи #789 начислено 250 ₽',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
      read: true,
      link: '/finance/wallet',
      metadata: { amount: 250 }
    },
    {
      id: '4',
      type: 'project_invite',
      title: 'Приглашение в проект',
      description: 'Вас пригласили в проект "Нейросетевая разметка медицинских изображений"',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
      read: true,
      link: '/projects/2',
      metadata: { projectId: 2 }
    },
    {
      id: '5',
      type: 'task_review',
      title: 'Требуется проверка',
      description: 'Задача #456 отправлена на проверку. Нужно подтвердить качество разметки',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString(),
      read: false,
      link: '/tasks/456',
      metadata: { taskId: 456 }
    },
    {
      id: '6',
      type: 'system',
      title: 'Обновление системы',
      description: 'Добавлена новая функция: автоматическая разметка изображений с помощью ИИ',
      timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
      read: true,
      link: undefined
    }
  ];
}
