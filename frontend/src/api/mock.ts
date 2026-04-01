import type {WalletResponse} from './finance'
import type {DashboardResponse} from './analytics'
import type {Task, TaskImage, Project, User} from './types'
import type {CreateTaskPayload, SubmitTaskPayload} from './tasks'

function safeGlobal(): any {
    try {
        return window as any
    } catch {
        return {}
    }
}

export function isMockEnabled(): boolean {
    const g = safeGlobal()
    const flag = g.__DATASET_APP_USE_MOCKS__
    if (typeof flag === 'boolean') return flag
    try {
        return localStorage.getItem('dataset_app_use_mocks') === 'true'
    } catch {
        return false
    }
}

function delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

let mockProjects: Project[] = [
    {id: 1, name: 'Cats vs Dogs', description: 'Binary classification dataset'},
    {id: 2, name: 'Vehicles', description: 'Object captions and labeling'},
]

let mockTaskSeq = 100

// Добавляем задачу с ID=1, чтобы она существовала
let mockTasks: Task[] = [
    {
        id: 1,
        projectId: 1,
        status: 'pending',
        images: [
            {
                id: 1,
                url: 'https://picsum.photos/seed/cat-1/512/512',
                caption: 'Кот на фото',
            },
            {
                id: 2,
                url: 'https://picsum.photos/seed/dog-1/512/512',
                caption: 'Собака на фото',
            },
        ],
    },
    {
        id: 2,
        projectId: 2,
        status: 'in_progress',
        images: [
            {
                id: 3,
                url: 'https://picsum.photos/seed/vehicle-1/512/512',
                caption: 'A vehicle on the road',
            },
        ],
    },
]

function getTaskImages(task: Task): TaskImage[] {
    if (Array.isArray(task.images)) return task.images
    if (task.data?.images) return task.data.images
    return []
}

function getTasksStats() {
    const total = mockTasks.length
    const completed = mockTasks.filter((t) => t.status === 'completed' || t.status === 'done').length
    const pending = mockTasks.filter((t) => t.status === 'pending' || t.status === 'open').length
    const inProgress = mockTasks.filter((t) => t.status === 'in_progress').length
    return {total, completed, pending, inProgress}
}

// -----------------------
// Auth mocks
// -----------------------

const TOKEN_PREFIX = 'mock-token:'

export async function mockLoginUser(payload: {email: string; password: string}): Promise<string> {
    await delay(250)
    const token = `${TOKEN_PREFIX}${payload.email}`
    try {
        localStorage.setItem('dataset_app_mock_email', payload.email)
        localStorage.setItem('dataset_app_token', token)
    } catch {
        // ignore
    }
    return token
}

export async function mockRegisterUser(_payload: {email: string; password: string}): Promise<void> {
    await delay(250)
}

export async function mockGetMe(): Promise<User> {
    await delay(200)
    let email = 'mock@example.com'
    try {
        email = localStorage.getItem('dataset_app_mock_email') ?? email
    } catch {
        // ignore
    }
    return {id: 'mock-user', email, username: email.split('@')[0], name: 'Mock User'}
}

// -----------------------
// Projects mocks
// -----------------------

export async function mockListProjects(): Promise<Project[]> {
    await delay(200)
    return mockProjects
}

export async function mockCreateProject(payload: {name: string; description?: string}): Promise<Project> {
    await delay(250)
    const next: Project = {
        id: mockProjects.length ? Math.max(...mockProjects.map((p) => Number(p.id) || 0)) + 1 : 1,
        name: payload.name,
        description: payload.description,
    }
    mockProjects = [next, ...mockProjects]
    return next
}

// -----------------------
// Tasks mocks
// -----------------------

export async function mockListTasks(): Promise<Task[]> {
    await delay(250)
    return mockTasks.map((t) => ({...t, images: getTaskImages(t).map((img) => ({...img}))}))
}

export async function mockCreateTask(payload: CreateTaskPayload): Promise<Task> {
    await delay(300)

    mockTaskSeq += 1
    const id = mockTaskSeq

    let images: TaskImage[] = []
    
    // Поддерживаем оба формата: images (массив объектов) и imageUrls (массив строк)
    if (payload.imageUrls && payload.imageUrls.length > 0) {
        images = payload.imageUrls.map((url, index) => ({
            id: index + 1,
            url: url,
            caption: '',
        }))
    } else if (payload.images && payload.images.length > 0) {
        images = payload.images.map((img, index) => ({
            id: index + 1,
            url: img.url,
            caption: img.caption || '',
        }))
    }

    const next: Task = {
        id,
        projectId: payload.projectId,
        status: 'pending',
        images: images,
    }

    mockTasks = [next, ...mockTasks]
    console.log('[Mock] Task created:', next)
    return next
}

export async function mockGetTaskById(taskId: number | string): Promise<Task> {
    await delay(200)
    const id = Number(taskId)
    const task = mockTasks.find(t => Number(t.id) === id)
    
    if (!task) {
        throw new Error(`Task with id ${id} not found`)
    }
    
    return {
        ...task,
        images: getTaskImages(task).map((img) => ({...img}))
    }
}

export async function mockGetTaskAnnotations(taskId: number | string): Promise<any[]> {
    await delay(150)
    const id = Number(taskId)
    return [
        {
            id: 1,
            task_id: id,
            worker_id: 1,
            label: 'image_classification',
            comment: 'Это изображение содержит объект для классификации',
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            task_id: id,
            worker_id: 2,
            label: 'image_classification',
            comment: 'Подтверждаю классификацию',
            created_at: new Date(Date.now() - 3600000).toISOString()
        }
    ]
}

export async function mockGetTaskConsensus(taskId: number | string): Promise<any> {
    await delay(150)
    const id = Number(taskId)
    return {
        task_id: id,
        total_annotations: 2,
        label_counts: { image_classification: 2 },
        consensus_label: 'image_classification',
        agreement_score: 1.0,
        needs_review: false
    }
}

export async function mockSubmitTask(payload: SubmitTaskPayload): Promise<Task> {
    await delay(300)

    const taskId = payload.taskId ?? payload.id
    if (taskId === undefined || taskId === null) throw new Error('Mock submit: taskId is required')

    const idx = mockTasks.findIndex((t) => String(t.id) === String(taskId))
    if (idx < 0) throw new Error('Mock submit: task not found')

    const nextImages = mockTasks[idx].images ? [...mockTasks[idx].images] : []
    const updateByKey = new Map<string, string | undefined>()
    for (const img of payload.images ?? []) {
        const key = img.id !== undefined && img.id !== null ? String(img.id) : img.url
        updateByKey.set(key, img.caption)
    }

    for (const img of nextImages) {
        const key = img.id !== undefined && img.id !== null ? String(img.id) : img.url
        if (updateByKey.has(key)) img.caption = updateByKey.get(key)
    }

    mockTasks[idx] = {
        ...mockTasks[idx],
        status: 'completed',
        images: nextImages,
    }

    return mockTasks[idx]
}

// -----------------------
// Finance + analytics mocks
// -----------------------

export async function mockGetWallet(): Promise<WalletResponse> {
    await delay(150)
    return {balance: 1250.5, currency: 'USD'}
}

export async function mockGetDashboard(): Promise<DashboardResponse> {
    await delay(200)
    const stats = getTasksStats()
    return {
        total_tasks: stats.total,
        completed: stats.completed,
        open: stats.pending + stats.inProgress,
        label: 'Mock analytics dashboard'
    }
}
