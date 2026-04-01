import {apiRequest} from './client'
import type {Id, Task, TaskImage} from './types'
import {isMockEnabled, mockCreateTask, mockListTasks, mockSubmitTask, mockGetTaskById, mockGetTaskAnnotations, mockGetTaskConsensus} from './mock'

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

export async function getTaskById(taskId: Id): Promise<Task> {
    if (isMockEnabled()) {
        return mockGetTaskById(taskId)
    }
    return apiRequest<Task>(`/api/v1/tasks/${taskId}`, { method: 'GET' })
}

export async function getTaskAnnotations(taskId: Id): Promise<any[]> {
    if (isMockEnabled()) {
        return mockGetTaskAnnotations(taskId)
    }
    return apiRequest<any[]>(`/api/v1/tasks/${taskId}/annotations`, { method: 'GET' })
}

export async function getTaskConsensus(taskId: Id): Promise<any> {
    if (isMockEnabled()) {
        return mockGetTaskConsensus(taskId)
    }
    return apiRequest<any>(`/api/v1/tasks/${taskId}/consensus`, { method: 'GET' })
}
