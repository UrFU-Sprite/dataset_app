export class ApiError extends Error {
    status: number
    data: unknown

    constructor(status: number, message: string, data: unknown) {
        super(message)
        this.status = status
        this.data = data
    }
}

export type Id = string | number

export interface User {
    id?: Id
    email?: string
    username?: string
    name?: string
}

export interface Project {
    id: Id
    name?: string
    description?: string
}

export interface TaskImage {
    id?: Id
    url: string
    caption?: string
}

export interface Task {
    id: Id
    projectId?: Id
    status?: string
    text?: string
    suggested_label?: string
    final_label?: string
    images?: TaskImage[]
    // Some backends may return images nested under `data` or other fields.
    data?: { images?: TaskImage[] }
}

export interface Annotation {
    id?: Id
    task_id?: Id
    worker_id?: Id
    label?: string
    comment?: string
    created_at?: string
}

