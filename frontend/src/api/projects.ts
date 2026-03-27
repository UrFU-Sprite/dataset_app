import {apiRequest} from './client'
import type {Id, Project} from './types'
import {isMockEnabled, mockCreateProject, mockListProjects} from './mock'

export async function createProject(payload: {name: string; description?: string}): Promise<Project> {
    if (isMockEnabled()) return mockCreateProject(payload)
    return apiRequest<Project>('/api/v1/projects', {method: 'POST', body: payload})
}

export async function listProjects(): Promise<Project[]> {
    if (isMockEnabled()) return mockListProjects()
    const payload = await apiRequest<unknown>('/api/v1/projects', {method: 'GET'})
    return normalizeProjectList(payload)
}

// Helper for cases when backend returns `{items: Project[]}` or similar.
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

export async function createProjectV2(payload: Record<string, unknown>): Promise<Project> {
    return apiRequest<Project>('/api/v1/projects', {method: 'POST', body: payload})
}

export async function getProjectById(projectId: Id): Promise<Project | null> {
    const projects = await listProjects()
    return projects.find((p) => String(p.id) === String(projectId)) ?? null
}

