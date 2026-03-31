import {apiRequest} from './client'
import type {Id, Task, TaskImage} from './types'
import {isMockEnabled, mockCreateTask, mockListTasks, mockSubmitTask} from './mock'

function normalizeTaskList(payload: unknown): Task[] {
    if (!payload) return []
    if (Array.isArray(payload)) return payload as Task[]
    if (typeof payload === 'object' && payload !== null) {
        const obj = payload as any
        if (Array.isArray(obj.items)) return obj.items as Task[]
        if (Array.isArray(obj.tasks)) return obj.tasks as Task[]
        if (Array.isArray(obj.data?.items)) return obj.data.items as Task[]
    }
    return []
}

export async function listTasks(): Promise<Task[]> {
    if (isMockEnabled()) return mockListTasks()
    const payload = await apiRequest<unknown>('/api/v1/tasks', {method: 'GET'})
    return normalizeTaskList(payload)
}

export type CreateTaskPayload = {
    projectId?: Id
    assignees?: Array<string>
    images?: Array<Pick<TaskImage, 'url'> & Partial<Pick<TaskImage, 'caption'>>>
    imageUrls?: string[]
    [key: string]: unknown
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
    if (isMockEnabled()) return mockCreateTask(payload)
    return apiRequest<Task>('/api/v1/tasks', {method: 'POST', body: payload})
}

export type SubmitTaskPayload = {
    id?: Id
    taskId?: Id
    projectId?: Id
    status?: string
    images?: Array<Pick<TaskImage, 'id' | 'url'> & {caption?: string}>
    [key: string]: unknown
}

export async function submitTask(payload: SubmitTaskPayload): Promise<Task> {
    if (isMockEnabled()) return mockSubmitTask(payload)
    return apiRequest<Task>('/api/v1/tasks/submit', {method: 'POST', body: payload})
}

// ИСПРАВЛЕНО: добавил /api/v1 префикс
export async function getTaskById(taskId: Id): Promise<Task> {
    if (isMockEnabled()) {
        return {
            id: taskId,
            status: 'in_progress',
            images: [
                { id: 1, url: '/storage/receipt_001.jpg', caption: '' },
                { id: 2, url: '/storage/receipt_002.jpg', caption: '' }
            ]
        };
    }
    return apiRequest<Task>(`/api/v1/tasks/${taskId}`, { method: 'GET' });
}

// ИСПРАВЛЕНО: добавил /api/v1 префикс
export async function getTaskAnnotations(taskId: Id): Promise<any[]> {
    if (isMockEnabled()) {
        return [
            {
                id: 1,
                task_id: taskId,
                worker_id: 1,
                label: 'finance',
                comment: 'Это финансовый документ, содержит суммы и даты',
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                task_id: taskId,
                worker_id: 2,
                label: 'finance',
                comment: 'Подтверждаю, чек на оплату',
                created_at: new Date(Date.now() - 3600000).toISOString()
            }
        ];
    }
    return apiRequest<any[]>(`/api/v1/tasks/${taskId}/annotations`, { method: 'GET' });
}

// ИСПРАВЛЕНО: добавил /api/v1 префикс
export async function getTaskConsensus(taskId: Id): Promise<any> {
    if (isMockEnabled()) {
        return {
            task_id: taskId,
            total_annotations: 3,
            label_counts: { finance: 3 },
            consensus_label: 'finance',
            agreement_score: 1.0,
            needs_review: false
        };
    }
    return apiRequest<any>(`/api/v1/tasks/${taskId}/consensus`, { method: 'GET' });
}
