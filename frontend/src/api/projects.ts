import {apiRequest} from './client'
import type {Id, Project} from './types'

export async function createProject(payload: {name: string; description?: string}): Promise<Project> {
    return apiRequest<Project>('/api/v1/projects', {method: 'POST', body: payload})
}

export async function listProjects(): Promise<Project[]> {
    const payload = await apiRequest<unknown>('/api/v1/projects', {method: 'GET'})
    return normalizeProjectList(payload)
}

export function normalizeProjectList(payload: unknown): Project[] {
    if (!payload) return []
    if (Array.isArray(payload)) return payload as Project[]
    if (typeof payload === 'object' && payload !== null) {
        const obj = payload as any
        if (Array.isArray(obj.items)) return obj.items as Project[]
        if (Array.isArray(obj.projects)) return obj.projects as Project[]
    }
    return []
}

// ИСПРАВЛЕНО: добавил /api/v1 префикс
export async function getProjectById(projectId: Id): Promise<Project | null> {
    return apiRequest<Project>(`/api/v1/projects/${projectId}`, {method: 'GET'})
}

// ИСПРАВЛЕНО: добавил /api/v1 префикс
export async function getProjectTasks(projectId: Id): Promise<any[]> {
    return apiRequest<any[]>(`/api/v1/projects/${projectId}/tasks`, {method: 'GET'})
}

// ИСПРАВЛЕНО: добавил /api/v1 префикс
export async function getProjectStats(projectId: Id): Promise<any> {
    return apiRequest<any>(`/api/v1/projects/${projectId}/stats`, {method: 'GET'})
}

export async function uploadDataset(
    projectId: Id,
    file: File,
    format: string,
    options: {splitMode?: string; textColumn?: string; textField?: string},
): Promise<any> {
    const token = localStorage.getItem('dataset_app_token')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('format', format)
    if (options.splitMode) formData.append('split_mode', options.splitMode)
    if (options.textColumn) formData.append('text_column', options.textColumn)
    if (options.textField) formData.append('text_field', options.textField)

    // ИСПРАВЛЕНО: добавил /api/v1 префикс
    const response = await fetch(`/api/v1/projects/${projectId}/upload-file`, {
        method: 'POST',
        headers: token ? {Authorization: `Bearer ${token}`} : undefined,
        body: formData,
    })
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`)
    return response.json()
}

// ИСПРАВЛЕНО: добавил /api/v1 префикс
export async function autoLabelProject(projectId: Id): Promise<any> {
    return apiRequest(`/api/v1/projects/${projectId}/auto-label`, {method: 'POST'})
}

// ИСПРАВЛЕНО: добавил /api/v1 префикс
export async function autoAssignProject(projectId: Id): Promise<any> {
    return apiRequest(`/api/v1/projects/${projectId}/auto-assign`, {method: 'POST'})
}

// ИСПРАВЛЕНО: добавил /api/v1 префикс
export async function exportProject(projectId: Id, format: 'json' | 'csv'): Promise<Blob> {
    const token = localStorage.getItem('dataset_app_token')
    const response = await fetch(`/api/v1/projects/${projectId}/export/${format}`, {
        headers: token ? {Authorization: `Bearer ${token}`} : undefined,
    })
    if (!response.ok) throw new Error(`Export failed: ${response.status}`)
    return response.blob()
}
